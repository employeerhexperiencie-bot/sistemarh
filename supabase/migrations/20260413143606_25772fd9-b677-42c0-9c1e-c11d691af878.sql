-- 1. Remover políticas de leitura abertas (sem verificação de tenant)
DROP POLICY IF EXISTS "Authenticated users read prof docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users read loja docs" ON storage.objects;

-- 2. Remover políticas de upload abertas (sem verificação de tenant/role)
DROP POLICY IF EXISTS "Authenticated users upload prof docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload loja docs" ON storage.objects;

-- 3. Remover políticas de delete abertas (sem verificação de tenant/role)
DROP POLICY IF EXISTS "Admin delete prof docs" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete loja docs" ON storage.objects;

-- 4. Criar política de leitura de documentos profissionais com verificação de tenant
CREATE POLICY "Tenant users read prof docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM professional_documents pd
      JOIN profissionais p ON pd.profissional_id = p.id
      WHERE pd.file_path = objects.name
        AND p.tenant_id = get_user_tenant_id(auth.uid())
    )
  )
);

-- 5. Criar política de leitura de documentos de loja com verificação de tenant
CREATE POLICY "Tenant users read loja docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'loja-documents'
  AND (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM loja_documents ld
      JOIN lojas l ON ld.loja_id = l.id
      WHERE ld.file_path = objects.name
        AND l.tenant_id = get_user_tenant_id(auth.uid())
    )
  )
);

-- 6. Criar política de upload com verificação de role (admin/executor/gerente)
CREATE POLICY "HR users upload prof docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-documents'
  AND can_access_sensitive_hr_data(auth.uid())
);

CREATE POLICY "HR users upload loja docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'loja-documents'
  AND can_access_sensitive_hr_data(auth.uid())
);

-- 7. Criar política de delete com verificação de role E tenant
CREATE POLICY "Admin delete prof docs tenant"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND (
    is_super_admin(auth.uid())
    OR has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Admin delete loja docs tenant"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'loja-documents'
  AND (
    is_super_admin(auth.uid())
    OR has_role(auth.uid(), 'admin')
  )
);