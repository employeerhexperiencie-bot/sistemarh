-- Função para atualizar métricas de um tenant para o mês atual
CREATE OR REPLACE FUNCTION public.atualizar_tenant_metrics(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _mes date := date_trunc('month', current_date)::date;
  _usuarios int;
  _profissionais int;
  _lojas int;
  _ocorrencias int;
  _documentos int;
BEGIN
  SELECT COUNT(*) INTO _usuarios FROM public.user_roles WHERE tenant_id = _tenant_id AND ativo = true;
  SELECT COUNT(*) INTO _profissionais FROM public.profissionais WHERE tenant_id = _tenant_id AND status = 'ativo';
  SELECT COUNT(*) INTO _lojas FROM public.lojas WHERE tenant_id = _tenant_id;
  SELECT COUNT(*) INTO _ocorrencias FROM public.pendencias WHERE tenant_id = _tenant_id;
  SELECT COUNT(*) INTO _documentos FROM public.professional_documents WHERE tenant_id = _tenant_id;

  INSERT INTO public.tenant_metrics (
    tenant_id, mes_referencia, total_usuarios, total_profissionais,
    total_lojas, total_ocorrencias, total_documentos
  ) VALUES (
    _tenant_id, _mes, _usuarios, _profissionais, _lojas, _ocorrencias, _documentos
  )
  ON CONFLICT (tenant_id, mes_referencia) DO UPDATE
  SET total_usuarios = EXCLUDED.total_usuarios,
      total_profissionais = EXCLUDED.total_profissionais,
      total_lojas = EXCLUDED.total_lojas,
      total_ocorrencias = EXCLUDED.total_ocorrencias,
      total_documentos = EXCLUDED.total_documentos,
      updated_at = now();
END;
$$;

-- Garantir índice único para o ON CONFLICT funcionar
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tenant_metrics_mes
  ON public.tenant_metrics (tenant_id, mes_referencia);

-- Função para atualizar TODOS os tenants (chamada por cron ou manualmente pelo super_admin)
CREATE OR REPLACE FUNCTION public.atualizar_todas_tenant_metrics()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t record;
  _count int := 0;
BEGIN
  FOR _t IN SELECT id FROM public.tenants WHERE ativo = true LOOP
    PERFORM public.atualizar_tenant_metrics(_t.id);
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END;
$$;

-- Popular dados atuais para todos os tenants ativos
SELECT public.atualizar_todas_tenant_metrics();