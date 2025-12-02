-- Adicionar índices para melhorar performance nas consultas principais

-- Índices para profissionais (busca por matrícula, loja, status)
CREATE INDEX IF NOT EXISTS idx_profissionais_matricula ON public.profissionais(matricula);
CREATE INDEX IF NOT EXISTS idx_profissionais_loja_id ON public.profissionais(loja_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_status ON public.profissionais(status);
CREATE INDEX IF NOT EXISTS idx_profissionais_cpf ON public.profissionais(cpf);

-- Índices para holerites (busca por profissional e mês)
CREATE INDEX IF NOT EXISTS idx_holerites_profissional_id ON public.holerites(profissional_id);
CREATE INDEX IF NOT EXISTS idx_holerites_mes_referencia ON public.holerites(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_holerites_status ON public.holerites(status);

-- Índices para benefícios
CREATE INDEX IF NOT EXISTS idx_beneficios_profissional_id ON public.beneficios(profissional_id);
CREATE INDEX IF NOT EXISTS idx_beneficios_mes_referencia ON public.beneficios(mes_referencia);

-- Índices para vale_transporte_detalhado
CREATE INDEX IF NOT EXISTS idx_vale_transporte_profissional_id ON public.vale_transporte_detalhado(profissional_id);
CREATE INDEX IF NOT EXISTS idx_vale_transporte_mes_referencia ON public.vale_transporte_detalhado(mes_referencia);

-- Índices para exames ASO
CREATE INDEX IF NOT EXISTS idx_exames_aso_profissional_id ON public.exames_aso(profissional_id);
CREATE INDEX IF NOT EXISTS idx_exames_aso_status ON public.exames_aso(status);
CREATE INDEX IF NOT EXISTS idx_exames_aso_data_proximo_exame ON public.exames_aso(data_proximo_exame);

-- Índices para férias
CREATE INDEX IF NOT EXISTS idx_ferias_profissional_id ON public.ferias(profissional_id);
CREATE INDEX IF NOT EXISTS idx_ferias_status ON public.ferias(status);

-- Índices para faltas
CREATE INDEX IF NOT EXISTS idx_faltas_profissional_id ON public.faltas(profissional_id);
CREATE INDEX IF NOT EXISTS idx_faltas_data_falta ON public.faltas(data_falta);

-- Índices para afastamentos
CREATE INDEX IF NOT EXISTS idx_afastamentos_profissional_id ON public.afastamentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_afastamentos_status ON public.afastamentos(status);

-- Índices para lançamentos financeiros
CREATE INDEX IF NOT EXISTS idx_lancamentos_profissional_id ON public.lancamentos_financeiros(profissional_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_mes_referencia ON public.lancamentos_financeiros(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON public.lancamentos_financeiros(tipo);

-- Índices para empréstimos
CREATE INDEX IF NOT EXISTS idx_emprestimos_profissional_id ON public.emprestimos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_status ON public.emprestimos(status);

-- Índices para adiantamentos
CREATE INDEX IF NOT EXISTS idx_adiantamentos_profissional_id ON public.adiantamentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_adiantamentos_mes_referencia ON public.adiantamentos(mes_referencia);

-- Índices para décimo terceiro
CREATE INDEX IF NOT EXISTS idx_decimo_terceiro_profissional_id ON public.decimo_terceiro(profissional_id);
CREATE INDEX IF NOT EXISTS idx_decimo_terceiro_ano ON public.decimo_terceiro(ano);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_alertas_profissional_id ON public.alertas_sistema(profissional_id);
CREATE INDEX IF NOT EXISTS idx_alertas_loja_id ON public.alertas_sistema(loja_id);
CREATE INDEX IF NOT EXISTS idx_alertas_lido ON public.alertas_sistema(lido);
CREATE INDEX IF NOT EXISTS idx_alertas_data_vencimento ON public.alertas_sistema(data_vencimento);

-- Índices para documentos
CREATE INDEX IF NOT EXISTS idx_professional_documents_profissional_id ON public.professional_documents(profissional_id);
CREATE INDEX IF NOT EXISTS idx_loja_documents_loja_id ON public.loja_documents(loja_id);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_historico_acoes_entidade_tipo ON public.historico_acoes(entidade_tipo);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_entidade_id ON public.historico_acoes(entidade_id);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_created_at ON public.historico_acoes(created_at);

-- Índices para advertências
CREATE INDEX IF NOT EXISTS idx_advertencias_profissional_id ON public.advertencias(profissional_id);
CREATE INDEX IF NOT EXISTS idx_advertencias_status ON public.advertencias(status);

-- Índices para EPIs
CREATE INDEX IF NOT EXISTS idx_epis_profissional_id ON public.epis(profissional_id);
CREATE INDEX IF NOT EXISTS idx_epis_status ON public.epis(status);

-- Índices para vales profissionais
CREATE INDEX IF NOT EXISTS idx_professional_vales_profissional_id ON public.professional_vales(profissional_id);
CREATE INDEX IF NOT EXISTS idx_professional_vales_tipo ON public.professional_vales(tipo);

-- Índices para histórico de salários
CREATE INDEX IF NOT EXISTS idx_historico_salarios_profissional_id ON public.historico_salarios(profissional_id);
CREATE INDEX IF NOT EXISTS idx_historico_salarios_data_alteracao ON public.historico_salarios(data_alteracao);

-- Índices para pendências
CREATE INDEX IF NOT EXISTS idx_pendencias_profissional_id ON public.pendencias(profissional_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_status ON public.pendencias(status);