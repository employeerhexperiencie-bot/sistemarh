
-- Permitir NULL em valor_total e numero_parcelas para empréstimos CLT
ALTER TABLE emprestimos ALTER COLUMN valor_total DROP NOT NULL;
ALTER TABLE emprestimos ALTER COLUMN numero_parcelas DROP NOT NULL;
