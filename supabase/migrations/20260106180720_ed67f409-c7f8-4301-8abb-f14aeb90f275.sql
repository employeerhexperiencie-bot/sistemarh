-- Migrar dados de benefícios da tabela profissionais para a tabela beneficios
-- Criando registros para a competência atual (Janeiro/2025)

INSERT INTO public.beneficios (
  profissional_id,
  mes_referencia,
  dias_trabalhados_vt,
  valor_diario_vt,
  valor_total_vt,
  descontos_vt,
  valor_liquido_vt,
  dias_trabalhados_vr,
  valor_diario_vr,
  valor_total_vr,
  descontos_vr,
  valor_liquido_vr,
  elegivel_cesta,
  valor_cesta
)
SELECT 
  p.id as profissional_id,
  '2025-01-01'::date as mes_referencia,
  22 as dias_trabalhados_vt, -- Dias úteis padrão
  COALESCE(p.valor_diario_rota, 0) as valor_diario_vt,
  22 * COALESCE(p.valor_diario_rota, 0) as valor_total_vt,
  0 as descontos_vt,
  22 * COALESCE(p.valor_diario_rota, 0) as valor_liquido_vt,
  22 as dias_trabalhados_vr,
  25.00 as valor_diario_vr, -- Valor padrão VR
  CASE WHEN p.vale_refeicao = true THEN 22 * 25.00 ELSE 0 END as valor_total_vr,
  0 as descontos_vr,
  CASE WHEN p.vale_refeicao = true THEN 22 * 25.00 ELSE 0 END as valor_liquido_vr,
  COALESCE(p.cesta_basica, false) as elegivel_cesta,
  CASE WHEN p.cesta_basica = true THEN 200.00 ELSE 0 END as valor_cesta
FROM public.profissionais p
WHERE p.status = 'ativo'
  AND p.vale_transporte = true
ON CONFLICT DO NOTHING;