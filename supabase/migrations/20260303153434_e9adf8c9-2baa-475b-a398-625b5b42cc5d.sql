
-- FASE 5: Add missing fields to profissionais and holerites

-- Add nome_mae (required for Alelo report) and id_ezpoint (for EzPointWeb integration)
ALTER TABLE public.profissionais 
  ADD COLUMN IF NOT EXISTS nome_mae text,
  ADD COLUMN IF NOT EXISTS id_ezpoint text;

-- Add recibo_assinado to holerites (for payment receipt tracking)
ALTER TABLE public.holerites
  ADD COLUMN IF NOT EXISTS recibo_assinado boolean DEFAULT false;

-- Add recibo_assinado to folha_pagamento as well
ALTER TABLE public.folha_pagamento
  ADD COLUMN IF NOT EXISTS recibo_assinado boolean DEFAULT false;
