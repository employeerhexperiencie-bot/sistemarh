import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Autorização: somente super_admin pode invocar manualmente.
    // Aceita também chamada do cron interno via header X-Cron-Secret = SERVICE_ROLE_KEY.
    const authHeader = req.headers.get('Authorization') ?? '';
    const cronSecret = req.headers.get('X-Cron-Secret') ?? '';
    const isCron = cronSecret && cronSecret === serviceKey;

    if (!isCron) {
      if (!authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
      if (claimsErr || !claimsData?.claims?.sub) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: isSuper } = await userClient.rpc('is_super_admin', {
        _user_id: claimsData.claims.sub,
      });
      if (!isSuper) {
        return new Response(JSON.stringify({ error: 'Forbidden: super_admin only' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const agora = new Date().toISOString();

    const { data: pendentes, error } = await supabase
      .from('partner_webhook_logs')
      .select('*, partners(api_base_url, webhook_secret)')
      .eq('status', 'falhou')
      .lte('proxima_tentativa', agora)
      .lt('tentativas', 5)
      .limit(20);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!pendentes?.length) {
      return new Response(JSON.stringify({ processed: 0, checked: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processados = 0;

    for (const log of pendentes) {
      try {
        const partner = (log as any).partners;
        if (!partner?.api_base_url) continue;

        const resp = await fetch(`${partner.api_base_url}/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': partner.webhook_secret || '',
            'X-Event': log.evento,
          },
          body: JSON.stringify(log.payload),
        });

        const sucesso = resp.ok;
        const proximaTentativa = sucesso
          ? null
          : new Date(Date.now() + Math.pow(2, log.tentativas) * 60000).toISOString();

        await supabase
          .from('partner_webhook_logs')
          .update({
            status: sucesso ? 'sucesso' : 'falhou',
            tentativas: log.tentativas + 1,
            proxima_tentativa: proximaTentativa,
            response_code: resp.status,
            processed_at: sucesso ? agora : null,
          })
          .eq('id', log.id);

        if (sucesso) processados++;
      } catch (_e) {
        await supabase
          .from('partner_webhook_logs')
          .update({ tentativas: log.tentativas + 1, status: 'falhou' })
          .eq('id', log.id);
      }
    }

    return new Response(
      JSON.stringify({ processed: processados, checked: pendentes.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});