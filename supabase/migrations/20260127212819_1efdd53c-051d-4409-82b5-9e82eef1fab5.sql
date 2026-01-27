-- ==============================================
-- MIGRAÇÃO CRÍTICA: Habilitar RLS em user_roles
-- ==============================================
-- Problema identificado: user_roles estava com RLS desabilitado,
-- expondo dados sensíveis de todos os usuários do sistema.

-- 1. Habilitar RLS na tabela user_roles (CRÍTICO!)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Garantir que as políticas existentes estejam ativas
-- As políticas já existem, mas só funcionam com RLS habilitado:
-- - "Super admin acesso total user_roles"
-- - "Admin pode gerenciar roles do tenant"
-- - "Admin pode ver roles do tenant"
-- - "Primeiro usuario pode criar admin"

-- 3. Adicionar política para usuário ver seu próprio registro
-- (garante que mesmo operadores possam ver suas próprias permissões)
DROP POLICY IF EXISTS "Usuario ve proprio role" ON public.user_roles;
CREATE POLICY "Usuario ve proprio role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 4. Verificar e criar trigger para novos usuários (primeiro usuário)
-- Quando um usuário se registra e é o primeiro, ele deve ser promovido a admin
CREATE OR REPLACE FUNCTION public.handle_first_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first boolean;
BEGIN
  -- Verificar se é o primeiro usuário
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) INTO is_first;
  
  -- Se for o primeiro, criar como admin
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role, nome, tenant_id, ativo)
    VALUES (
      NEW.id,
      'admin',
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      '00000000-0000-0000-0000-000000000001',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_first_user_signup();