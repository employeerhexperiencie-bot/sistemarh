-- Adicionar campos de foto na tabela profissionais
ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS foto_url TEXT,
  ADD COLUMN IF NOT EXISTS foto_ezpoint_url TEXT,
  ADD COLUMN IF NOT EXISTS foto_atualizada_em TIMESTAMPTZ;

-- Criar bucket público para fotos de profissionais
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'professional-photos',
  'professional-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp'];

-- Políticas RLS para bucket professional-photos
-- Leitura pública (necessário para exibir foto em qualquer tela e exportar para ponto)
DROP POLICY IF EXISTS "Fotos profissionais publicamente legiveis" ON storage.objects;
CREATE POLICY "Fotos profissionais publicamente legiveis"
ON storage.objects
FOR SELECT
USING (bucket_id = 'professional-photos');

-- Upload restrito a usuários autenticados do tenant (path: tenant_id/profissional_id/...)
DROP POLICY IF EXISTS "Tenant pode fazer upload fotos" ON storage.objects;
CREATE POLICY "Tenant pode fazer upload fotos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-photos'
  AND (
    public.is_super_admin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  )
);

DROP POLICY IF EXISTS "Tenant pode atualizar fotos" ON storage.objects;
CREATE POLICY "Tenant pode atualizar fotos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'professional-photos'
  AND (
    public.is_super_admin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  )
);

DROP POLICY IF EXISTS "Tenant pode deletar fotos" ON storage.objects;
CREATE POLICY "Tenant pode deletar fotos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'professional-photos'
  AND (
    public.is_super_admin(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  )
);