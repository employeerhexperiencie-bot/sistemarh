// Edge Function: partner-webhook
// Recebe webhooks INBOUND de parceiros (Lanup, EzPoint, etc.)
// Valida HMAC com webhook_secret cadastrado em `partners`
// Grava evento em partner_webhook_logs e dispara processamento

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-partner-signature, x-partner-slug, x-tenant-id',
};

async function verifyHmac(secret: string, payload: string, signature: string): Promise<boolean> {
  if (!signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // suporta "sha256=..." ou hex puro
  const provided = signature.replace(/^sha256=/, '').toLowerCase();
  return provided === expected;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const partnerSlug = req.headers.get('x-partner-slug');
    const signature = req.headers.get('x-partner-signature') || '';
    const tenantIdHeader = req.headers.get('x-tenant-id');
    const rawBody = await req.text();

    if (!partnerSlug) {
      return new Response(JSON.stringify({ error: 'Missing x-partner-slug header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar parceiro
    const { data: partner, error: partnerErr } = await supabase
      .from('partners')
      .select('id, webhook_secret, ativo')
      .eq('slug', partnerSlug)
      .maybeSingle();

    if (partnerErr || !partner || !partner.ativo) {
      return new Response(JSON.stringify({ error: 'Partner not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // webhook_secret é obrigatório
    if (!partner.webhook_secret) {
      return new Response(JSON.stringify({ error: 'Partner não configurado para webhooks' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar HMAC (sempre obrigatório)
    const ok = await verifyHmac(partner.webhook_secret, rawBody, signature);
    if (!ok) {
      await supabase.from('partner_webhook_logs').insert({
        partner_id: partner.id,
        tenant_id: tenantIdHeader,
        direcao: 'inbound',
        evento: 'invalid_signature',
        payload: { raw: rawBody.slice(0, 500) },
        status: 'falhou',
        error_message: 'HMAC inválido',
        response_code: 401,
      });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evento = body.event || body.evento || 'unknown';
    const tenantId = body.tenant_id || tenantIdHeader || null;

    // Registrar log
    const { data: log } = await supabase
      .from('partner_webhook_logs')
      .insert({
        partner_id: partner.id,
        tenant_id: tenantId,
        direcao: 'inbound',
        evento,
        payload: body,
        headers: Object.fromEntries(req.headers.entries()),
        status: 'sucesso',
        response_code: 200,
        processed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // Processamento básico por tipo de evento (extensível)
    // Ex: convocacao.created → cria alerta no sistema
    if (evento.startsWith('convocacao.') && tenantId) {
      try {
        await supabase.from('alertas_sistema').insert({
          tenant_id: tenantId,
          tipo: 'modulo_parceiro',
          prioridade: 'media',
          titulo: `Lanup Convocação: ${evento}`,
          mensagem: body.message || `Evento ${evento} recebido do parceiro Lanup.`,
          acao_url: '/modulos/convocacao',
        });
      } catch (e) {
        console.error('Falha ao criar alerta', e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, log_id: log?.id, evento }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('partner-webhook error', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});