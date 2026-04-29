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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // SECURITY: Require one-time setup token for super admin creation
    const setupToken = Deno.env.get('SUPER_ADMIN_SETUP_TOKEN');
    
    if (!setupToken) {
      console.log('SUPER_ADMIN_SETUP_TOKEN not configured - function disabled');
      return new Response(
        JSON.stringify({ error: 'Function disabled. Configure SUPER_ADMIN_SETUP_TOKEN to enable.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, name, token } = await req.json();

    // SECURITY: Validate setup token
    if (!token || token !== setupToken) {
      console.warn('Invalid setup token attempt for super admin creation');
      return new Response(
        JSON.stringify({ error: 'Invalid or missing setup token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating super_admin user: ${email}`);

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // SECURITY: Check if super_admin already exists to prevent multiple creations
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing admins:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify existing admins' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingAdmins && existingAdmins.length > 0) {
      console.warn('Attempt to create additional super_admin blocked');
      return new Response(
        JSON.stringify({ error: 'Super admin already exists. Contact system administrator.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user using admin API
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user. Please try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', userData.user.id);

    // Create super_admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: 'super_admin',
        nome: name || 'Desenvolvedor',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        ativo: true
      });

    if (roleError) {
      console.error('Error creating role:', roleError);
      // Try to delete the user if role creation failed
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return new Response(
        JSON.stringify({ error: 'Role setup failed. Please try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Super admin created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Super admin criado: ${email}`,
        user: { id: userData.user.id, email: userData.user.email }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
