
-- Tabela central de fechamentos de folha
CREATE TABLE public.fechamentos_folha (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid REFERENCES public.tenants(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  competencia DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('dia_20', 'dia_5', 'vt', 'beneficios')),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado', 'reaberto')),
  versao INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB,
  total_profissionais INTEGER DEFAULT 0,
  total_valor NUMERIC DEFAULT 0,
  fechado_por TEXT,
  fechado_em TIMESTAMP WITH TIME ZONE,
  reaberto_por TEXT,
  reaberto_em TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, loja_id, competencia, tipo, versao)
);

-- RLS
ALTER TABLE public.fechamentos_folha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolamento fechamentos_folha" ON public.fechamentos_folha
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_fechamentos_folha_updated_at
  BEFORE UPDATE ON public.fechamentos_folha
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
