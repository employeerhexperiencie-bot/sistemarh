-- =============================================================================
-- Validação de governança RLS / multi-tenant (executar no Postgres conectado ao projeto)
-- Não altera dados. Uso: psql / Supabase SQL editor — revisar saída manualmente.
-- CRITICAL: políticas permissivas históricas existiram no repositório; este script
-- ajuda a detectar estado ATUAL do banco, não substitui revisão de migrations.
-- =============================================================================

-- 1) Tabelas em public SEM RLS habilitado (superfície de vazamento se exposto ao PostgREST)
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY c.relname;

-- 2) Políticas cuja expressão USING é trivialmente "true" (alto risco de bypass)
--    pg_policies.qual / with_check vêm como texto legível no PG 15+.
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual AS using_expr,
  with_check AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    trim(both FROM coalesce(qual, '')) IN ('true', '(true)')
    OR trim(both FROM coalesce(with_check, '')) IN ('true', '(true)')
  )
ORDER BY tablename, policyname;

-- 3) Políticas com ALL / múltiplos comandos — revisar manualmente (FOR ALL aparece cmd = 'ALL')
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual AS using_expr,
  with_check AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'ALL'
ORDER BY tablename, policyname;

-- 4) Heurística: tabelas em public com RLS ON mas sem coluna tenant_id (pode ser OK p/ catálogo global)
SELECT
  t.table_schema,
  t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = t.table_name AND c.relkind = 'r' AND c.relrowsecurity
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = t.table_schema
      AND c.table_name = t.table_name
      AND c.column_name = 'tenant_id'
  )
ORDER BY t.table_name;

-- 5) Contagem de políticas por tabela (detectar tabelas críticas sem política alguma)
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  count(p.polname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY n.nspname, c.relname, c.relrowsecurity
HAVING c.relrowsecurity = true AND count(p.polname) = 0
ORDER BY c.relname;
