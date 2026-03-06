
-- Tabela de sessões de atividade (tempo online)
CREATE TABLE public.user_activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL DEFAULT get_user_tenant_id(auth.uid()),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  pages_visited INTEGER DEFAULT 0,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de eventos de atividade (ações executadas)
CREATE TABLE public.user_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL DEFAULT get_user_tenant_id(auth.uid()),
  session_id UUID REFERENCES public.user_activity_sessions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para sessões
ALTER TABLE public.user_activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados inserem sessoes" ON public.user_activity_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados atualizam propria sessao" ON public.user_activity_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin ve todas sessoes" ON public.user_activity_sessions
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin ve sessoes do tenant" ON public.user_activity_sessions
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- RLS para eventos
ALTER TABLE public.user_activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados inserem eventos" ON public.user_activity_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Super admin ve todos eventos" ON public.user_activity_events
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin ve eventos do tenant" ON public.user_activity_events
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Índices para performance
CREATE INDEX idx_activity_sessions_user ON public.user_activity_sessions(user_id);
CREATE INDEX idx_activity_sessions_tenant ON public.user_activity_sessions(tenant_id);
CREATE INDEX idx_activity_sessions_started ON public.user_activity_sessions(started_at DESC);
CREATE INDEX idx_activity_events_user ON public.user_activity_events(user_id);
CREATE INDEX idx_activity_events_tenant ON public.user_activity_events(tenant_id);
CREATE INDEX idx_activity_events_created ON public.user_activity_events(created_at DESC);
CREATE INDEX idx_activity_events_module ON public.user_activity_events(module);
