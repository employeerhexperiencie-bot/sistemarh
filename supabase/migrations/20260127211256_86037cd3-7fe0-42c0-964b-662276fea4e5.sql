-- Adicionar coluna ativo na tabela user_roles para controle de acesso
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- Adicionar coluna role na tabela user_invites
ALTER TABLE public.user_invites ADD COLUMN IF NOT EXISTS role app_role NOT NULL DEFAULT 'operador';

-- Comentário explicativo
COMMENT ON COLUMN public.user_roles.ativo IS 'Controla se o usuário tem acesso ao sistema. False = acesso bloqueado';