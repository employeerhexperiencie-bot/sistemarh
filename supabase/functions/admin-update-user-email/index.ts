import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://sistemarh.lovable.app,https://eazdev.com,https://id-preview--8e3c9ad4-f35f-427b-aac7-c76612c27c5b.lovable.app').split(',').map(o => o.trim());

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

    // Verificar se caller é admin ou super_admin
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role, tenant_id')
      .eq('user_id', caller.id)
      .single();

    if (!callerRole || !['admin', 'super_admin'].includes(callerRole.role)) {
      // Log tentativa não autorizada
      await supabaseAdmin.from('security_logs').insert({
        user_id: caller.id,
        tenant_id: callerRole?.tenant_id || null,
        action: 'EMAIL_UPDATE_DENIED',
        resource: 'admin-update-user-email',
        success: false,
        error_message: `Acesso negado. Role: ${callerRole?.role || 'não definido'}`,
        metadata: { caller_email: caller.email }
      });

      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem alterar emails.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // PROCESSAMENTO
    // ============================================
    const { userId, newEmail } = await req.json();

    if (!userId || !newEmail) {
      return new Response(
        JSON.stringify({ error: 'userId e newEmail são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se não for super_admin, verificar se o user alvo pertence ao mesmo tenant
    if (callerRole.role !== 'super_admin') {
      const { data: targetRole } = await supabaseAdmin
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', userId)
        .single();

      if (!targetRole || targetRole.tenant_id !== callerRole.tenant_id) {
        return new Response(
          JSON.stringify({ error: 'Você só pode alterar emails de usuários do seu tenant.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Admin ${caller.email} atualizando email do user ${userId} para ${newEmail}`);

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail, email_confirm: true }
    );

    if (error) {
      console.error('Erro ao atualizar email:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar email. Tente novamente.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log da ação
    await supabaseAdmin.from('security_logs').insert({
      user_id: caller.id,
      tenant_id: callerRole.tenant_id,
      action: 'EMAIL_UPDATED',
      resource: 'admin-update-user-email',
      resource_id: userId,
      success: true,
      metadata: { new_email: newEmail, performed_by: caller.email }
    });

    console.log('Email atualizado com sucesso:', data.user?.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email atualizado para ${newEmail}`,
        user: { id: data.user?.id, email: data.user?.email }
      }),
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
