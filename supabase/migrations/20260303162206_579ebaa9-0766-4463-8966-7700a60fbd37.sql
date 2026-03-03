
CREATE TABLE public.historico_importacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid REFERENCES public.tenants(id),
  modulo TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  total_registros INTEGER NOT NULL DEFAULT 0,
  registros_sucesso INTEGER NOT NULL DEFAULT 0,
  registros_erro INTEGER NOT NULL DEFAULT 0,
  erros JSONB DEFAULT '[]'::jsonb,
  usuario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.historico_importacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolamento historico_importacoes" ON public.historico_importacoes
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));
