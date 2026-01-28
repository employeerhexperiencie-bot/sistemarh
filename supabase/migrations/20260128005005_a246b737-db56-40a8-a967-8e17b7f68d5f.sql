-- Limpar políticas conflitantes antigas
DROP POLICY IF EXISTS "Executor ve suas ocorrencias" ON public.pendencias;
DROP POLICY IF EXISTS "Tenant isolamento pendencias" ON public.pendencias;