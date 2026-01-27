-- ============================================
-- CORREÇÃO DE ALERTAS DE SEGURANÇA
-- ============================================

-- Habilitar RLS nas tabelas faltantes
ALTER TABLE public.holerites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;

-- Adicionar tenant_id nas tabelas faltantes
ALTER TABLE public.holerites ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.holerites SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.holerites ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.holerites ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.folha_pagamento ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.folha_pagamento SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.folha_pagamento ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.folha_pagamento ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_holerites_tenant ON public.holerites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_folha_pagamento_tenant ON public.folha_pagamento(tenant_id);

-- RLS para holerites
CREATE POLICY "Tenant isolamento holerites"
ON public.holerites FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);

-- RLS para folha_pagamento
CREATE POLICY "Tenant isolamento folha_pagamento"
ON public.folha_pagamento FOR ALL
USING (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
)
WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR is_super_admin(auth.uid())
);