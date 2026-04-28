// Edge Function: partner-sync-profissionais
// Sincroniza profissionais ATIVOS do tenant com um parceiro,
// gravando o ID externo retornado em partner_entity_map (ancorado em CPF).
//
// Body: { partner_slug: string, dry_run?: boolean }
// Headers: Authorization: Bearer <jwt>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validar JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verifica role admin
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role, tenant_id')
    .eq('user_id', userData.user.id)
    .eq('ativo', true);

  const isAdmin = roles?.some((r) =>
    ['super_admin', 'admin'].includes(r.role)
  );
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const tenantId = roles?.[0]?.tenant_id;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const partnerSlug = body.partner_slug;
  const dryRun = body.dry_run === true;

  if (!partnerSlug) {
    return new Response(JSON.stringify({ error: 'Missing partner_slug' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Buscar partner
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: partner } = await admin
    .from('partners')
    .select('id, nome, api_base_url, ativo')
    .eq('slug', partnerSlug)
    .maybeSingle();

  if (!partner || !partner.ativo) {
    return new Response(JSON.stringify({ error: 'Partner not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Buscar profissionais ativos
  const { data: profissionais } = await admin
    .from('profissionais')
    .select('id, nome, cpf, email, telefone, status, data_admissao')
    .eq('tenant_id', tenantId)
    .eq('status', 'ativo');

  const total = profissionais?.length ?? 0;

  if (dryRun) {
    return new Response(
      JSON.stringify({ ok: true, dry_run: true, total }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let synced = 0;
  let skipped = 0;

  for (const p of profissionais ?? []) {
    if (!p.cpf) {
      skipped++;
      continue;
    }

    // Aqui, em produção, faria POST para partner.api_base_url
    // com o profissional. Por ora, registramos o mapping com um
    // ID externo simulado (cpf normalizado) para validar fluxo.
    const externalId = p.cpf.replace(/\D/g, '');

    const { error } = await admin
      .from('partner_entity_map')
      .upsert(
        {
          tenant_id: tenantId,
          partner_id: partner.id,
          entidade_tipo: 'profissional',
          entidade_id_local: p.id,
          entidade_id_externo: externalId,
          cpf_anchor: externalId,
          metadata: { nome: p.nome, email: p.email },
        },
        { onConflict: 'tenant_id,partner_id,entidade_tipo,entidade_id_local' }
      );

    if (error) {
      console.error('upsert mapping error', error);
      skipped++;
    } else {
      synced++;
    }
  }

  // Log do evento outbound
  await admin.from('partner_webhook_logs').insert({
    partner_id: partner.id,
    tenant_id: tenantId,
    direcao: 'outbound',
    evento: 'profissionais.sync',
    payload: { total, synced, skipped },
    status: 'sucesso',
    processed_at: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({ ok: true, total, synced, skipped }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});