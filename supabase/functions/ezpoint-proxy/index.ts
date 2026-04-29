import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://sistemarh.lovable.app,https://eazdev.com,https://id-preview--8e3c9ad4-f35f-427b-aac7-c76612c27c5b.lovable.app').split(',').map(o => o.trim());

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

const EZPOINT_BASE = "https://api.ezpointweb.com.br/ezweb-ws";

// Rate limiter simples: max 25 req/min (API limita 30)
const requestLog: number[] = [];
function checkRateLimit() {
  const now = Date.now();
  while (requestLog.length && requestLog[0] < now - 60000) requestLog.shift();
  if (requestLog.length >= 25) throw new Error("Rate limit: máximo 25 requisições por minuto à API EzPoint");
  requestLog.push(now);
}

async function ezpointLogin(): Promise<string> {
  const empresa = Deno.env.get("EZPOINT_EMPRESA");
  const usuario = Deno.env.get("EZPOINT_USUARIO");
  const senha = Deno.env.get("EZPOINT_SENHA");
  if (!empresa || !usuario || !senha) throw new Error("Credenciais EzPoint não configuradas");

  checkRateLimit();
  const res = await fetch(`${EZPOINT_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ empresa, usuario, senha }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login EzPoint falhou (${res.status}): ${text}`);
  }
  const data = await res.json();
  // O retorno é o bearer token
  return data.token || data.hash || data;
}

async function ezpointRequest(method: string, path: string, token: string, body?: any, queryParams?: Record<string, string>) {
  checkRateLimit();
  const empresa = Deno.env.get("EZPOINT_EMPRESA")!;
  
  let url = `${EZPOINT_BASE}/${path}`;
  const params = new URLSearchParams({ empresa, ...queryParams });
  
  if (method === "GET") {
    url += `?${params.toString()}`;
  }

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  };

  if (method !== "GET" && body) {
    options.body = JSON.stringify({ empresa, ...body });
  }

  const res = await fetch(url, options);
  const text = await res.text();
  
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar JWT do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar role admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .limit(1);

    if (!roles?.length) {
      return new Response(JSON.stringify({ error: "Permissão negada" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = req.method !== "GET" ? await req.json() : null;
    const url = new URL(req.url);
    const action = body?.action || url.searchParams.get("action");

    if (!action) {
      return new Response(JSON.stringify({ error: "Parâmetro 'action' obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Login na API EzPoint
    const ezToken = await ezpointLogin();

    let result;

    switch (action) {
      case "listar-funcionarios": {
        const params: Record<string, string> = {};
        if (body?.ocultarDemitidos) params.ocultarDemitidos = "true";
        if (body?.nome) params.nome = body.nome;
        if (body?.cpf) params.CPF = body.cpf;
        result = await ezpointRequest("GET", "funcionario", ezToken, null, params);
        break;
      }

      case "consultar-batidas": {
        if (!body?.dataInicio || !body?.dataFim) {
          return new Response(JSON.stringify({ error: "dataInicio e dataFim obrigatórios" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Buscar todas as páginas
        const allBatidas: any[] = [];
        let pagina = 1;
        let totalPaginas = 1;

        do {
          const res = await ezpointRequest("GET", "batida", ezToken, null, {
            pagina: String(pagina),
            dataInicio: body.dataInicio,
            dataFim: body.dataFim,
          });
          if (res.data?.listaDeBatidas) {
            allBatidas.push(...res.data.listaDeBatidas);
            totalPaginas = res.data.totalPaginas || 1;
          }
          pagina++;
        } while (pagina <= totalPaginas && pagina <= 50); // safety cap

        result = { status: 200, data: { listaDeBatidas: allBatidas, totalPaginas } };
        break;
      }

      case "espelho-ponto": {
        if (!body?.idFuncionario || !body?.dataInicio || !body?.dataFim) {
          return new Response(JSON.stringify({ error: "idFuncionario, dataInicio e dataFim obrigatórios" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        result = await ezpointRequest("GET", "espelhoDePontos", ezToken, null, {
          idFuncionario: String(body.idFuncionario),
          dataInicio: body.dataInicio,
          dataFim: body.dataFim,
        });
        break;
      }

      case "registrar-ferias": {
        if (!body?.idFuncionario || !body?.dataInicio || !body?.dataFim) {
          return new Response(JSON.stringify({ error: "idFuncionario, dataInicio e dataFim obrigatórios" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        result = await ezpointRequest("POST", "ferias", ezToken, {
          idFuncionario: body.idFuncionario,
          dataInicio: body.dataInicio,
          dataFim: body.dataFim,
        });
        break;
      }

      case "registrar-abono": {
        if (!body?.abonoDeFalta) {
          return new Response(JSON.stringify({ error: "abonoDeFalta obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        result = await ezpointRequest("POST", "abonoDeFalta", ezToken, {
          abonoDeFalta: body.abonoDeFalta,
        });
        break;
      }

      case "sincronizar-funcionario": {
        if (!body?.funcionario) {
          return new Response(JSON.stringify({ error: "funcionario obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const method = body.funcionario.id ? "PUT" : "POST";
        result = await ezpointRequest(method, "funcionario", ezToken, body.funcionario);
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Ação '${action}' não reconhecida` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result.data), {
      status: result.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
