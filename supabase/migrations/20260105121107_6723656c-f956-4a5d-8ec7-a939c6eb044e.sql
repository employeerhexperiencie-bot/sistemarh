
-- Adicionar política para permitir exclusão de profissionais (necessário para limpeza de duplicados)
CREATE POLICY "Permitir exclusão pública de profissionais" 
ON public.profissionais 
FOR DELETE 
USING (true);
