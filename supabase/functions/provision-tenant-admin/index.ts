import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://sistemarh.lovable.app,https://eazdev.com,https://id-preview--8e3c9ad4-f35f-427b-aac7-c76612c27c5b.lovable.app').split(',').map(o => o.trim());

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Verify caller is super_admin
    const token = authHeader.replace('Bearer ', '');
    const { data, error: claimsError } = await supabaseAdmin.auth.getUser(token);
    
    if (claimsError || !data?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    if (!callerRole || callerRole.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Only super_admin can provision tenants' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Parse request
    const { tenant_id, email, nome } = await req.json();

    if (!tenant_id || !email) {
      return new Response(JSON.stringify({ error: 'tenant_id and email are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Verify tenant exists
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, nome')
      .eq('id', tenant_id)
      .single();

    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Create or find user in auth
    const normalizedEmail = email.toLowerCase().trim();
    // Using RPC instead of listUsers() to avoid pagination limit of 1000 users
    const { data: existingUserId } = await supabaseAdmin.rpc('get_auth_user_id_by_email', { _email: normalizedEmail });
    const existingUser = existingUserId ? { id: existingUserId } : null;

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`User already exists: ${userId}`);

      // Check if already has a role
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        return new Response(JSON.stringify({ error: 'Este email já está associado a outro cliente' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Create user with random password
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: { name: nome || '' }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      userId = newUser.user.id;
      console.log(`User created: ${userId}`);
    }

    // 6. Create user_role as admin for the NEW tenant
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
        nome: nome || normalizedEmail.split('@')[0],
        tenant_id: tenant_id,
        ativo: true
      });

    if (roleError) {
      console.error('Error creating role:', roleError);
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 7. Send password recovery email so admin can set their own password
    // Use a non-admin client to trigger the actual email hook (generateLink only generates, doesn't send)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${req.headers.get('origin') || 'https://eazdev.com'}/redefinir-senha`
    });

    if (resetError) {
      console.warn('Could not send recovery email:', resetError);
    }

    console.log(`Tenant admin provisioned: ${normalizedEmail} → tenant ${tenant.nome}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Admin ${normalizedEmail} provisionado para ${tenant.nome}`,
      user_id: userId,
      tenant_id: tenant_id
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
