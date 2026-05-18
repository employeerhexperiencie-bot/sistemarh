UPDATE public.profissionais
SET loja_id = '54bebfe9-8ff8-4912-b255-ef5f9e8f2e5a', updated_at = now()
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND status = 'ativo'
  AND loja_id IS NULL
  AND matricula IN (
    'BA0143','BA0121','BA0144','BA 01/38','BA0126','BA0133','BA0000-4889',
    'BA0140','RG10/0509','LP06/0907','BA0132','BA0128','BA0129','BA0136',
    'TB27/0441','BA0137','BA0134','BA0131','BA0127','TB27/0419','BA0105',
    'RG10/0546','BA0130','BA0111','BA0112','BA0141','BA0142'
  );