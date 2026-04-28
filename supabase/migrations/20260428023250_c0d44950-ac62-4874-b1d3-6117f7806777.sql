-- Garante unicidade do mapeamento profissional ↔ parceiro por tenant
CREATE UNIQUE INDEX IF NOT EXISTS partner_entity_map_unique
  ON public.partner_entity_map (tenant_id, partner_id, entidade_tipo, entidade_id_local);

-- Índice auxiliar para busca por CPF (usado em reconciliação)
CREATE INDEX IF NOT EXISTS partner_entity_map_cpf_idx
  ON public.partner_entity_map (tenant_id, partner_id, cpf_anchor);