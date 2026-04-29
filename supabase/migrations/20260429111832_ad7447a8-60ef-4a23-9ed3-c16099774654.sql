-- Dropar políticas USING(true) residuais que anulam isolamento de tenant
DROP POLICY IF EXISTS "Allow all operations on lojas" ON public.lojas;
DROP POLICY IF EXISTS "Allow all operations on loja_documents" ON public.loja_documents;
DROP POLICY IF EXISTS "Allow all operations on profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Allow all operations on professional_documents" ON public.professional_documents;
DROP POLICY IF EXISTS "Allow all operations on professional_vales" ON public.professional_vales;

-- Dropar policies de "leitura pública" residuais (idempotente)
DROP POLICY IF EXISTS "Permitir leitura pública de lojas" ON public.lojas;
DROP POLICY IF EXISTS "Permitir leitura pública de profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Permitir atualização pública de lojas" ON public.lojas;
DROP POLICY IF EXISTS "Permitir atualização pública de profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Permitir inserção pública de lojas" ON public.lojas;
DROP POLICY IF EXISTS "Permitir inserção pública de profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Permitir leitura pública de exames" ON public.exames_aso;
DROP POLICY IF EXISTS "Permitir atualização pública de exames" ON public.exames_aso;

-- Storage: remover policies permissivas residuais
DROP POLICY IF EXISTS "Allow all operations on loja documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on professional documents" ON storage.objects;