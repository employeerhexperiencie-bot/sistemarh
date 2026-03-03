import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ============================================
    // VERIFICAÇÃO DE AUTENTICAÇÃO E AUTORIZAÇÃO
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verificar token do caller
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Sessão expirada. Faça login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se caller é super_admin (apenas super_admin pode resetar senhas)
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role, tenant_id')
      .eq('user_id', caller.id)
      .single();

    if (!callerRole || callerRole.role !== 'super_admin') {
      await supabaseAdmin.from('security_logs').insert({
        user_id: caller.id,
        tenant_id: callerRole?.tenant_id || null,
        action: 'PASSWORD_RESET_DENIED',
        resource: 'update-user-password',
        success: false,
        error_message: `Acesso negado. Role: ${callerRole?.role || 'não definido'}`,
      });

      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas super administradores podem resetar senhas.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // PROCESSAMENTO
    // ============================================
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newPassword = Deno.env.get('SUPER_ADMIN_PASSWORD');
    if (!newPassword) {
      return new Response(
        JSON.stringify({ error: 'Configuração de senha não encontrada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Super admin ${caller.email} resetando senha do user ${userId}`);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar senha. Tente novamente.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabaseAdmin.from('security_logs').insert({
      user_id: caller.id,
      tenant_id: callerRole.tenant_id,
      action: 'PASSWORD_RESET',
      resource: 'update-user-password',
      resource_id: userId,
      success: true,
      metadata: { performed_by: caller.email }
    });

    console.log('Senha atualizada com sucesso');

    return new Response(
      JSON.stringify({ success: true, message: 'Senha atualizada com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
