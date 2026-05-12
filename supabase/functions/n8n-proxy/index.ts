/**
 * RISCO (config.toml: verify_jwt = false): o gateway não valida JWT; esta função valida Bearer
 * com o cliente **anon** (sem service_role) — reduz blast radius. Ainda assim, encaminha para N8N
 * com N8N_API_TOKEN: manter allowlist de `action` no N8N + limites de taxa aqui.
 *
 * CRITICAL (2026): removido fallback SUPABASE_SERVICE_ROLE_KEY — auth.getUser funciona com anon key.
 * Logs estruturados + correlation id para rastrear abuso. Allowlist opcional: N8N_ALLOWED_ACTIONS.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ||
  'https://sistemarh.lovable.app,https://eazdev.com,https://id-preview--8e3c9ad4-f35f-427b-aac7-c76612c27c5b.lovable.app')
  .split(',')
  .map((o) => o.trim());

function slog(
  level: 'info' | 'warn' | 'error',
  msg: string,
  fields: Record<string, unknown>
) {
  console.log(
    JSON.stringify({
      severity: level,
      msg,
      service: 'n8n-proxy',
      ts: new Date().toISOString(),
      ...fields,
    })
  );
}

const getCorsHeaders = (req: Request, correlationId: string) => {
  const origin = req.headers.get('origin') || '';
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-correlation-id, x-request-id, x-tenant-id',
    'Access-Control-Expose-Headers': 'x-correlation-id',
    'x-correlation-id': correlationId,
  };
};

/** Rate limit best-effort por instância (Deno edge); não substitui WAF/API gateway. */
const rlBucket = new Map<string, { count: number; windowStart: number }>();

function rateLimitHit(key: string, maxPerWindow: number, windowMs: number): boolean {
  const now = Date.now();
  const b = rlBucket.get(key);
  if (!b || now - b.windowStart > windowMs) {
    rlBucket.set(key, { count: 1, windowStart: now });
    return false;
  }
  if (b.count >= maxPerWindow) return true;
  b.count += 1;
  return false;
}

function parseAllowedActions(): string[] | null {
  const raw = Deno.env.get('N8N_ALLOWED_ACTIONS')?.trim();
  if (!raw) return null;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

Deno.serve(async (req) => {
  const correlationId =
    req.headers.get('x-correlation-id')?.trim() ||
    req.headers.get('x-request-id')?.trim() ||
    crypto.randomUUID();

  const corsHeaders = getCorsHeaders(req, correlationId);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const started = Date.now();

  try {
    slog('info', 'request_in', { correlationId, method: req.method });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      slog('error', 'config_missing', { correlationId });
      return new Response(JSON.stringify({ ok: false, message: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CRITICAL: apenas anon — validação JWT; nunca elevar para service_role nesta função.
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      slog('warn', 'no_auth_header', { correlationId });
      return new Response(JSON.stringify({ ok: false, message: 'Unauthorized - No token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      slog('warn', 'auth_failed', { correlationId, detail: authError?.message });
      return new Response(JSON.stringify({ ok: false, message: 'Unauthorized - Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantHint = req.headers.get('x-tenant-id')?.trim() || null;
    const maxPerMin = Number(Deno.env.get('N8N_PROXY_MAX_REQ_PER_MIN') || '120');
    const rlKey = `${user.id}`;
    if (rateLimitHit(rlKey, Math.max(1, maxPerMin), 60_000)) {
      slog('warn', 'rate_limited', { correlationId, userId: user.id });
      return new Response(JSON.stringify({ ok: false, message: 'Too many requests' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const n8nToken = Deno.env.get('N8N_API_TOKEN');
    const n8nWebhookBase = Deno.env.get('N8N_WEBHOOK_BASE');

    if (!n8nToken || !n8nWebhookBase) {
      slog('info', 'n8n_demo_mode', { correlationId, userId: user.id });
      return new Response(
        JSON.stringify({
          ok: true,
          message: 'N8N integration not configured - demo mode',
          demo: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allowedActions = parseAllowedActions();
    const contentType = req.headers.get('content-type') || '';
    const forwardHeaders: Record<string, string> = {
      Authorization: `Bearer ${n8nToken}`,
      'x-correlation-id': correlationId,
    };
    if (tenantHint) forwardHeaders['x-tenant-id'] = tenantHint;

    if (contentType.includes('multipart/form-data')) {
      if (allowedActions && !allowedActions.includes('upload')) {
        slog('warn', 'action_blocked', { correlationId, userId: user.id, action: 'upload' });
        return new Response(JSON.stringify({ ok: false, message: 'Action not allowed' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const formData = await req.formData();
      const response = await fetch(`${n8nWebhookBase}/upload`, {
        method: 'POST',
        headers: forwardHeaders,
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      slog('info', 'upload_done', {
        correlationId,
        userId: user.id,
        status: response.status,
        ms: Date.now() - started,
      });
      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...payload } = body as { action?: string; [k: string]: unknown };
    if (!action || typeof action !== 'string') {
      return new Response(JSON.stringify({ ok: false, message: 'Missing action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (allowedActions && !allowedActions.includes(action)) {
      slog('warn', 'action_blocked', { correlationId, userId: user.id, action });
      return new Response(JSON.stringify({ ok: false, message: 'Action not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(`${n8nWebhookBase}/action`, {
      method: 'POST',
      headers: {
        ...forwardHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const result = await response.json().catch(() => ({}));
    slog('info', 'action_done', {
      correlationId,
      userId: user.id,
      action,
      status: response.status,
      ms: Date.now() - started,
    });

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    slog('error', 'unhandled', {
      correlationId,
      err: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
