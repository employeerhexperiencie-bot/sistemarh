
-- Fix storage.objects policies from TO public → TO authenticated

DROP POLICY IF EXISTS "Admin acesso total loja documents" ON storage.objects;
CREATE POLICY "Admin acesso total loja documents" ON storage.objects FOR ALL TO authenticated
  USING ((bucket_id = 'loja-documents') AND (auth.uid() IS NOT NULL) AND (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))
  WITH CHECK ((bucket_id = 'loja-documents') AND (auth.uid() IS NOT NULL) AND (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admin acesso total professional documents" ON storage.objects;
CREATE POLICY "Admin acesso total professional documents" ON storage.objects FOR ALL TO authenticated
  USING ((bucket_id = 'professional-documents') AND (auth.uid() IS NOT NULL) AND (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))
  WITH CHECK ((bucket_id = 'professional-documents') AND (auth.uid() IS NOT NULL) AND (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Gerente acesso loja documents sua loja" ON storage.objects;
CREATE POLICY "Gerente acesso loja documents sua loja" ON storage.objects FOR SELECT TO authenticated
  USING ((bucket_id = 'loja-documents') AND (auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'gerente'::app_role) AND (EXISTS (
    SELECT 1 FROM loja_documents ld
    JOIN user_roles ur ON (ur.user_id = auth.uid() AND ur.loja_id = ld.loja_id)
    WHERE ld.file_path = objects.name
  )));

DROP POLICY IF EXISTS "Gerente acesso professional documents sua loja" ON storage.objects;
CREATE POLICY "Gerente acesso professional documents sua loja" ON storage.objects FOR SELECT TO authenticated
  USING ((bucket_id = 'professional-documents') AND (auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'gerente'::app_role) AND (EXISTS (
    SELECT 1 FROM professional_documents pd
    JOIN profissionais p ON (pd.profissional_id = p.id)
    JOIN user_roles ur ON (ur.user_id = auth.uid() AND ur.loja_id = p.loja_id)
    WHERE pd.file_path = objects.name
  )));

DROP POLICY IF EXISTS "Gerente upload loja documents sua loja" ON storage.objects;
CREATE POLICY "Gerente upload loja documents sua loja" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'loja-documents') AND (auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'gerente'::app_role));

DROP POLICY IF EXISTS "Gerente upload professional documents sua loja" ON storage.objects;
CREATE POLICY "Gerente upload professional documents sua loja" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'professional-documents') AND (auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'gerente'::app_role));
