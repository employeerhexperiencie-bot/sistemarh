import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('N8N Proxy: Received request')

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('N8N Proxy: Supabase configuration missing')
      return new Response(
        JSON.stringify({ ok: false, message: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? supabaseAnonKey)

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('N8N Proxy: No authorization header')
      return new Response(
        JSON.stringify({ ok: false, message: 'Unauthorized - No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('N8N Proxy: Authentication failed:', authError?.message)
      return new Response(
        JSON.stringify({ ok: false, message: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('N8N Proxy: User authenticated:', user.id)

    // Get N8N configuration from secrets
    const n8nToken = Deno.env.get('N8N_API_TOKEN')
    const n8nWebhookBase = Deno.env.get('N8N_WEBHOOK_BASE')

    // If N8N is not configured, return demo mode response
    if (!n8nToken || !n8nWebhookBase) {
      console.log('N8N Proxy: N8N not configured, returning demo response')
      return new Response(
        JSON.stringify({ 
          ok: true, 
          message: 'N8N integration not configured - demo mode',
          demo: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    let body
    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file uploads
      const formData = await req.formData()
      
      const response = await fetch(`${n8nWebhookBase}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${n8nToken}`,
        },
        body: formData,
      })

      const result = await response.json()
      console.log('N8N Proxy: Upload response status:', response.status)

      return new Response(
        JSON.stringify(result),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      // Handle JSON requests
      body = await req.json()
    }

    const { action, ...payload } = body
    console.log('N8N Proxy: Executing action:', action)

    // Forward request to N8N
    const response = await fetch(`${n8nWebhookBase}/action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${n8nToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    })

    const result = await response.json()
    console.log('N8N Proxy: N8N response status:', response.status)

    return new Response(
      JSON.stringify(result),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('N8N Proxy Error:', error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
