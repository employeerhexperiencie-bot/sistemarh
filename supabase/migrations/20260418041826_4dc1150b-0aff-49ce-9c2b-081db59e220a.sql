-- Índices compostos para paginação e filtros frequentes
CREATE INDEX IF NOT EXISTS idx_historico_acoes_tenant_created 
  ON public.historico_acoes (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alertas_tenant_lido_prioridade 
  ON public.alertas_sistema (tenant_id, lido, prioridade);

CREATE INDEX IF NOT EXISTS idx_dev_logs_tenant_created 
  ON public.dev_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profissionais_tenant_status 
  ON public.profissionais (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_holerites_tenant_mes 
  ON public.holerites (tenant_id, mes_referencia DESC);

CREATE INDEX IF NOT EXISTS idx_folha_tenant_competencia 
  ON public.folha_pagamento (tenant_id, competencia DESC);

CREATE INDEX IF NOT EXISTS idx_faltas_tenant_data 
  ON public.faltas (tenant_id, data_falta DESC);

CREATE INDEX IF NOT EXISTS idx_lancamentos_tenant_mes 
  ON public.lancamentos_financeiros (tenant_id, mes_referencia DESC);