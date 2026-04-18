
-- =====================================================
-- 1. Fix has_role() to respect ativo flag
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND ativo = true
  )
$function$;

-- Also fix has_min_role() and is_super_admin() for consistency
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'super_admin' AND ativo = true
  )
$function$;

CREATE OR REPLACE FUNCTION public.has_min_role(_user_id uuid, _min_role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND ativo = true
      AND (
        role = 'super_admin'
        OR role = 'admin'
        OR (role = 'gerente' AND _min_role IN ('gerente', 'operador', 'executor'))
        OR (role = 'executor' AND _min_role IN ('operador', 'executor'))
        OR (role = 'operador' AND _min_role = 'operador')
      )
  )
$function$;

-- =====================================================
-- 2. Make get_user_tenant_id deterministic
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT tenant_id FROM public.user_roles 
  WHERE user_id = _user_id AND ativo = true
  ORDER BY created_at ASC NULLS LAST, id ASC
  LIMIT 1
$function$;

-- =====================================================
-- 3. Fix storage policies: tenant isolation for document buckets
-- =====================================================
DROP POLICY IF EXISTS "Admin acesso total professional documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin acesso total loja documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete prof docs tenant" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete loja docs tenant" ON storage.objects;

-- Admin/super_admin SELECT: only files in their own tenant
CREATE POLICY "Admin tenant read prof docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND (
    public.is_super_admin(auth.uid())
    OR (
      public.has_role(auth.uid(), 'admin')
      AND EXISTS (
        SELECT 1 FROM public.professional_documents pd
        WHERE pd.file_path = storage.objects.name
          AND pd.tenant_id = public.get_user_tenant_id(auth.uid())
      )
    )
  )
);

CREATE POLICY "Admin tenant read loja docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'loja-documents'
  AND (
    public.is_super_admin(auth.uid())
    OR (
      public.has_role(auth.uid(), 'admin')
      AND EXISTS (
        SELECT 1 FROM public.loja_documents ld
        WHERE ld.file_path = storage.objects.name
          AND ld.tenant_id = public.get_user_tenant_id(auth.uid())
      )
    )
  )
);

-- Admin INSERT: tenant-scoped (uploads validated against caller's tenant)
CREATE POLICY "Admin tenant insert prof docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-documents'
  AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admin tenant insert loja docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'loja-documents'
  AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
);

-- Admin UPDATE: tenant-scoped
CREATE POLICY "Admin tenant update prof docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND (
    public.is_super_admin(auth.uid())
    OR (
      public.has_role(auth.uid(), 'admin')
      AND EXISTS (
        SELECT 1 FROM public.professional_documents pd
        WHERE pd.file_path = storage.objects.name
          AND pd.tenant_id = public.get_user_tenant_id(auth.uid())
      )
    )
  )
);

CREATE POLICY "Admin tenant update loja docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'loja-documents'
  AND (
    public.is_super_admin(auth.uid())
    OR (
      public.has_role(auth.uid(), 'admin')
      AND EXISTS (
        SELECT 1 FROM public.loja_documents ld
        WHERE ld.file_path = storage.objects.name
          AND ld.tenant_id = public.get_user_tenant_id(auth.uid())
      )
    )
  )
);

-- Admin DELETE: tenant-scoped
CREATE POLICY "Admin tenant delete prof docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND (
    public.is_super_admin(auth.uid())
    OR (
      public.has_role(auth.uid(), 'admin')
      AND EXISTS (
        SELECT 1 FROM public.professional_documents pd
        WHERE pd.file_path = storage.objects.name
          AND pd.tenant_id = public.get_user_tenant_id(auth.uid())
      )
    )
  )
);

CREATE POLICY "Admin tenant delete loja docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'loja-documents'
  AND (
    public.is_super_admin(auth.uid())
    OR (
      public.has_role(auth.uid(), 'admin')
      AND EXISTS (
        SELECT 1 FROM public.loja_documents ld
        WHERE ld.file_path = storage.objects.name
          AND ld.tenant_id = public.get_user_tenant_id(auth.uid())
      )
    )
  )
);

-- =====================================================
-- 4. Make professional-photos bucket private with tenant-scoped read
-- =====================================================
UPDATE storage.buckets SET public = false WHERE id = 'professional-photos';

DROP POLICY IF EXISTS "Fotos profissionais publicamente legiveis" ON storage.objects;

CREATE POLICY "Tenant pode ler fotos profissionais"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-photos'
  AND (
    public.is_super_admin(auth.uid())
    OR (storage.foldername(name))[1] = (public.get_user_tenant_id(auth.uid()))::text
  )
);
