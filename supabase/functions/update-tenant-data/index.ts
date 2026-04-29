import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ||
  'https://sistemarh.lovable.app,https://eazdev.com').split(',').map(o => o.trim());

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Autenticação necessária' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Sessão expirada' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Verify admin role
    const { data: roleData } = await supabase.from('user_roles').select('role, tenant_id').eq('user_id', user.id).single();
    if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'super_admin')) {
      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const tenantId = roleData.tenant_id;
    const { profissionais, ferias: feriasData } = await req.json();

    const results = {
      profissionaisAtualizados: 0,
      profissionaisNovos: 0,
      feriasInseridos: 0,
      feriasRemovidos: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // Get all lojas for this tenant
    const { data: lojas } = await supabase.from('lojas').select('id, nome').eq('tenant_id', tenantId);
    const lojaMap = new Map<string, string>();
    if (lojas) {
      for (const l of lojas) {
        lojaMap.set(l.nome.trim().toUpperCase(), l.id);
      }
    }

    // Get all existing profissionais for this tenant
    const { data: existingProfs } = await supabase.from('profissionais').select('id, nome, matricula, salario_nominal, cargo').eq('tenant_id', tenantId);
    const profByName = new Map<string, any>();
    const profByMatricula = new Map<string, any>();
    if (existingProfs) {
      for (const p of existingProfs) {
        profByName.set(p.nome.trim().toUpperCase(), p);
        if (p.matricula) profByMatricula.set(p.matricula.trim(), p);
      }
    }

    // 1. Update/create profissionais
    if (profissionais && Array.isArray(profissionais)) {
      for (const prof of profissionais) {
        const nomeUpper = prof.nome.trim().toUpperCase();
        const existing = profByName.get(nomeUpper);
        const lojaId = prof.loja ? lojaMap.get(prof.loja.trim().toUpperCase()) : null;

        if (existing) {
          // Update salary and cargo
          const updates: any = {};
          if (prof.salario && prof.salario !== existing.salario_nominal) {
            updates.salario_nominal = prof.salario;
          }
          if (prof.cargo && prof.cargo !== existing.cargo) {
            updates.cargo = prof.cargo;
          }

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase.from('profissionais').update(updates).eq('id', existing.id);
            if (error) {
              results.errors.push(`Erro atualizar ${prof.nome}: ${error.message}`);
            } else {
              results.profissionaisAtualizados++;
            }
          }
        } else {
          // New professional - insert
          const { error } = await supabase.from('profissionais').insert({
            nome: prof.nome,
            matricula: prof.matricula || `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            cargo: prof.cargo || null,
            salario_nominal: prof.salario || null,
            loja_id: lojaId || null,
            data_admissao: prof.dataAdmissao || null,
            status: 'ativo',
            tenant_id: tenantId,
          });
          if (error) {
            results.errors.push(`Erro inserir ${prof.nome}: ${error.message}`);
          } else {
            results.profissionaisNovos++;
          }
        }
      }
    }

    // 2. Update férias - delete existing and insert new
    if (feriasData && Array.isArray(feriasData) && feriasData.length > 0) {
      // Re-fetch profissionais after inserts
      const { data: allProfs } = await supabase.from('profissionais').select('id, nome').eq('tenant_id', tenantId);
      const profNameToId = new Map<string, string>();
      if (allProfs) {
        for (const p of allProfs) {
          profNameToId.set(p.nome.trim().toUpperCase(), p.id);
        }
      }

      // Delete existing férias for this tenant
      const { count } = await supabase.from('ferias').delete().eq('tenant_id', tenantId).select('id', { count: 'exact', head: true });
      results.feriasRemovidos = count || 0;

      // Insert new férias in batches
      const batchSize = 50;
      const feriasToInsert: any[] = [];

      for (const fer of feriasData) {
        const nomeUpper = fer.nome.trim().toUpperCase();
        const profId = profNameToId.get(nomeUpper);

        if (!profId) {
          results.warnings.push(`Férias: profissional não encontrado: ${fer.nome}`);
          continue;
        }

        // Each profissional can have multiple vacation periods
        if (fer.periodos && Array.isArray(fer.periodos)) {
          for (const periodo of fer.periodos) {
            feriasToInsert.push({
              profissional_id: profId,
              periodo_aquisitivo_inicio: periodo.inicio,
              periodo_aquisitivo_fim: periodo.fim,
              dias_direito: periodo.direito || 30,
              dias_gozados: periodo.quitados || 0,
              status: periodo.situacao === 'Vencido' ? 'vencida' : periodo.situacao === 'Perdido' ? 'perdida' : 'pendente',
              tenant_id: tenantId,
            });
          }
        }
      }

      // Insert in batches
      for (let i = 0; i < feriasToInsert.length; i += batchSize) {
        const batch = feriasToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from('ferias').insert(batch);
        if (error) {
          results.errors.push(`Erro inserir férias batch ${i}: ${error.message}`);
        } else {
          results.feriasInseridos += batch.length;
        }
      }
    }

    console.log('Atualização concluída:', results);

    return new Response(JSON.stringify({ success: true, results }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });

  } catch (error) {
    console.error('Erro na atualização:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
