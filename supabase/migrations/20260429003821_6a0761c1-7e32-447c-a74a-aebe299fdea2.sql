ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS lanup_habilitado BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tenants.lanup_habilitado IS 'Controla se o tenant tem acesso liberado ao sistema Lanup via botão no sidebar.';