-- Criar buckets de storage
INSERT INTO storage.buckets (id, name, public) VALUES ('professional-documents', 'professional-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('loja-documents', 'loja-documents', false) ON CONFLICT (id) DO NOTHING;

-- Políticas de storage: upload
CREATE POLICY "Authenticated users upload prof docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'professional-documents');
CREATE POLICY "Authenticated users upload loja docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'loja-documents');

-- Políticas de storage: leitura
CREATE POLICY "Authenticated users read prof docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'professional-documents');
CREATE POLICY "Authenticated users read loja docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'loja-documents');

-- Políticas de storage: delete (apenas admin)
CREATE POLICY "Admin delete prof docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'professional-documents');
CREATE POLICY "Admin delete loja docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'loja-documents');