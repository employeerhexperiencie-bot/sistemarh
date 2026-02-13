
-- Enable RLS on vale_transporte_detalhado
ALTER TABLE public.vale_transporte_detalhado ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy (consistent with other tables)
CREATE POLICY "Tenant isolamento vale_transporte_detalhado"
ON public.vale_transporte_detalhado
FOR ALL
USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()));
