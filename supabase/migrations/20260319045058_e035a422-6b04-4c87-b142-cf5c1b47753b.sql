
CREATE OR REPLACE FUNCTION public.can_access_sensitive_hr_data(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_uuid
      AND ativo = true
      AND role IN ('super_admin', 'admin', 'gerente', 'executor')
  )
$$;
