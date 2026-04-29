
-- 1. historico_acoes: tenant scope on insert
DROP POLICY IF EXISTS "Autenticados inserem historico" ON public.historico_acoes;
CREATE POLICY "Autenticados inserem historico"
ON public.historico_acoes FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND tenant_id = public.get_user_tenant_id(auth.uid())
);

-- 2. user_activity_sessions: tenant + user scope on insert
DROP POLICY IF EXISTS "Autenticados inserem sessoes" ON public.user_activity_sessions;
CREATE POLICY "Autenticados inserem sessoes"
ON public.user_activity_sessions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND tenant_id = public.get_user_tenant_id(auth.uid())
);

-- 3. user_activity_events: tenant + user scope on insert
DROP POLICY IF EXISTS "Autenticados inserem eventos" ON public.user_activity_events;
CREATE POLICY "Autenticados inserem eventos"
ON public.user_activity_events FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND tenant_id = public.get_user_tenant_id(auth.uid())
);

-- 4. security_logs: tenant + user scope on insert
DROP POLICY IF EXISTS "Autenticados inserem logs" ON public.security_logs;
CREATE POLICY "Autenticados inserem logs"
ON public.security_logs FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND tenant_id = public.get_user_tenant_id(auth.uid())
);

-- 5. Remove first-user RLS bootstrap (handled by trigger handle_first_user_signup)
DROP POLICY IF EXISTS "Primeiro usuario autenticado pode criar admin" ON public.user_roles;

-- 6. Storage uploads: enforce tenant scope on professional/loja documents
DROP POLICY IF EXISTS "HR users upload prof docs" ON storage.objects;
CREATE POLICY "HR users upload prof docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-documents'
  AND public.can_access_sensitive_hr_data(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profissionais p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "HR users upload loja docs" ON storage.objects;
CREATE POLICY "HR users upload loja docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'loja-documents'
  AND public.can_access_sensitive_hr_data(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.lojas l
    WHERE l.id::text = (storage.foldername(name))[2]
      AND l.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Gerente upload professional documents sua loja" ON storage.objects;
CREATE POLICY "Gerente upload professional documents sua loja"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-documents'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'gerente'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.profissionais p
    JOIN public.user_roles ur ON ur.user_id = auth.uid() AND ur.loja_id = p.loja_id
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Gerente upload loja documents sua loja" ON storage.objects;
CREATE POLICY "Gerente upload loja documents sua loja"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'loja-documents'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'gerente'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.lojas l
    JOIN public.user_roles ur ON ur.user_id = auth.uid() AND ur.loja_id = l.id
    WHERE l.id::text = (storage.foldername(name))[2]
      AND l.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- 7. partners: hide sensitive credential columns from regular authenticated users
REVOKE SELECT ON public.partners FROM authenticated;
GRANT SELECT (
  id, nome, slug, ativo, api_base_url, logo_url, website,
  created_at, updated_at
) ON public.partners TO authenticated;
-- super_admin operates via service_role / SECURITY DEFINER paths; keep full access for service_role
GRANT SELECT ON public.partners TO service_role;
