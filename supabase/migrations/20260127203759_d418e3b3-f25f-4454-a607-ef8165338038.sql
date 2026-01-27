
-- Corrigir política de inserção de logs para exigir autenticação
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.security_logs;

CREATE POLICY "Autenticados podem inserir logs"
ON public.security_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Corrigir política de histórico para exigir autenticação completa
DROP POLICY IF EXISTS "Autenticados inserir historico" ON public.historico_acoes;

CREATE POLICY "Autenticados podem inserir historico"
ON public.historico_acoes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Habilitar leaked password protection (recomendação de segurança)
-- Nota: Isso é feito via Auth config, não SQL
