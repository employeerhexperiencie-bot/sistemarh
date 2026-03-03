-- Adicionar campos financeiros na tabela tenants para controle de pagamentos
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS valor_mensalidade numeric DEFAULT 0;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS dia_vencimento integer DEFAULT 10;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS status_pagamento text DEFAULT 'em_dia';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS data_ultimo_pagamento date;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS data_proximo_vencimento date;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS total_pago numeric DEFAULT 0;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS observacoes_financeiras text;

-- Tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS public.pagamentos_tenant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  valor numeric NOT NULL,
  data_pagamento date NOT NULL,
  data_referencia date NOT NULL, -- mês de referência
  forma_pagamento text DEFAULT 'pix',
  comprovante_url text,
  observacoes text,
  registrado_por uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pagamentos_tenant ENABLE ROW LEVEL SECURITY;

-- Apenas super_admin pode gerenciar pagamentos
CREATE POLICY "Super admin acesso total pagamentos"
  ON public.pagamentos_tenant FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));