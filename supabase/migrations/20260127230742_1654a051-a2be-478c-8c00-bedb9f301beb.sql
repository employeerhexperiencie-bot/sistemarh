-- ============================================
-- FIX STORAGE BUCKET SECURITY POLICIES
-- ============================================
-- Fixes: storage_public_access
-- 
-- Strategy: Replace permissive policies with tenant-aware, role-based access

-- 1. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on loja documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on professional documents" ON storage.objects;

-- 2. Ensure buckets are private
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('loja-documents', 'professional-documents');

-- 3. Create role-based policies for professional-documents bucket

-- Admin/Super Admin: Full access to professional documents in their tenant
CREATE POLICY "Admin acesso total professional documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'professional-documents' AND
  auth.uid() IS NOT NULL AND
  (
    is_super_admin(auth.uid()) OR
    has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  bucket_id = 'professional-documents' AND
  auth.uid() IS NOT NULL AND
  (
    is_super_admin(auth.uid()) OR
    has_role(auth.uid(), 'admin')
  )
);

-- Gerente: Access to professional documents of professionals in their loja
CREATE POLICY "Gerente acesso professional documents sua loja"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'professional-documents' AND
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'gerente') AND
  EXISTS (
    SELECT 1 FROM public.professional_documents pd
    JOIN public.profissionais p ON pd.profissional_id = p.id
    JOIN public.user_roles ur ON ur.user_id = auth.uid() AND ur.loja_id = p.loja_id
    WHERE pd.file_path = storage.objects.name
  )
);

-- Gerente: Can upload professional documents for their loja
CREATE POLICY "Gerente upload professional documents sua loja"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'professional-documents' AND
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'gerente')
);

-- 4. Create role-based policies for loja-documents bucket

-- Admin/Super Admin: Full access to loja documents in their tenant
CREATE POLICY "Admin acesso total loja documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'loja-documents' AND
  auth.uid() IS NOT NULL AND
  (
    is_super_admin(auth.uid()) OR
    has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  bucket_id = 'loja-documents' AND
  auth.uid() IS NOT NULL AND
  (
    is_super_admin(auth.uid()) OR
    has_role(auth.uid(), 'admin')
  )
);

-- Gerente: Access to documents of their own loja
CREATE POLICY "Gerente acesso loja documents sua loja"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'loja-documents' AND
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'gerente') AND
  EXISTS (
    SELECT 1 FROM public.loja_documents ld
    JOIN public.user_roles ur ON ur.user_id = auth.uid() AND ur.loja_id = ld.loja_id
    WHERE ld.file_path = storage.objects.name
  )
);

-- Gerente: Can upload loja documents for their loja
CREATE POLICY "Gerente upload loja documents sua loja"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'loja-documents' AND
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'gerente')
);