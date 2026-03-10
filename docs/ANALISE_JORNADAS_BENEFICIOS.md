# Jornada de Benefícios - Regras de Desconto e Gerenciamento
> **Atualizado em:** 10/03/2026  
> **Regras validadas com:** Tennessee Prime

---

## 📊 Resumo Executivo

### Política de Descontos da Tennessee Prime

> **Regra principal:** A empresa NÃO desconta do profissional os encargos trabalhistas (INSS, IRRF),
> nem benefícios (VT, VR, Cesta). O profissional só tem descontado no Dia 5 aquilo que ele
> efetivamente **comprou ou tomou emprestado**.

---

### ✅ Descontos NO DIA 5 (O que SAI do salário do profissional)

| Desconto | Tipo | Regra | Automático? |
|----------|------|-------|-------------|
| Empréstimo CLT | Parcela fixa | Valor da parcela mensal até quitar | ✅ Automático |
| Empréstimo Loja | Parcela fixa | Valor da parcela mensal até quitar | ✅ Automático |
| Vale Carne | Compra na loja | Valor da compra feita pelo profissional | ⚠️ RH lança |
| Vale Dinheiro | Adiantamento avulso | Valor solicitado pelo profissional | ⚠️ RH lança |
| Faltas injustificadas | Desconto legal | (salário ÷ 30) × dias de falta | ✅ Automático |
| Pensão alimentícia | Judicial | Percentual sobre líquido ou valor fixo | ✅ Automático |

### ❌ O que NÃO desconta do profissional

| Item | Motivo | Tratamento no sistema |
|------|--------|-----------------------|
| INSS | Empresa calcula separadamente via contabilidade | Não entra no motor de cálculo |
| IRRF | Idem | Não entra no motor de cálculo |
| VT (6%) | Empresa paga 100% do transporte | `descontoVT6Porcento = 0` |
| VR | É pago AO profissional, não cobrado dele | Valor aparece como provento |
| Cesta Básica | É pago AO profissional | Valor aparece como provento |

---

## Detalhamento por Benefício

---

## 🚌 VALE TRANSPORTE (VT)

**Política:** Empresa paga 100% — SEM desconto de 6% do profissional

| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | Flag `vale_transporte` + campo `valor_diario_rota` em `profissionais` |
| **Cálculo** | `dias trabalhados × valor_diario_rota` |
| **Finalidade** | Controle de quanto a empresa PAGA ao profissional |
| **Desconto 6%** | ❌ **DESATIVADO** — empresa arca com 100% |
| **Não paga se** | Afastado, férias, sem dias trabalhados |

```typescript
// payrollCalculator.ts — Linhas 258-271
valorVT = arredondarValor(diasTrabalhados * profissional.valorPassagem);
descontoVT6Porcento = 0; // Empresa paga integral
```

**Gestão:** Tab VT em Gestão de Benefícios com drill-down por loja e profissional.

---

## 🍽️ VALE REFEIÇÃO (VR)

**Política:** Empresa paga — valor é CRÉDITO para o profissional

| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | Flag `vale_refeicao` em `profissionais` |
| **Cálculo** | `dias trabalhados × R$25,00 (configurável)` |
| **Finalidade** | Controle de quanto PAGAR ao profissional |
| **Desconta do salário?** | ❌ **NÃO** — é provento, não desconto |
| **Não paga se** | Afastado, férias, sem dias trabalhados |

```typescript
// payrollCalculator.ts — Linhas 274-280
valorVR = arredondarValor(diasTrabalhados * config.valorVR);
```

---

## 🧺 CESTA BÁSICA

**Política:** Empresa paga — benefício mensal com regras de elegibilidade

| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | Flag `cesta_basica` em `profissionais` |
| **Valor** | R$180,00 (configurável via `configuracoes_sistema`) |
| **Desconta do salário?** | ❌ **NÃO** — é provento pago ao profissional |
| **Perde se** | Qualquer falta INJUSTIFICADA no mês |
| **Perde se** | Admitido após dia 15 do mês |
| **Mantém se** | Atestado (falta justificada) |

```typescript
// payrollCalculator.ts — Linhas 283-302
if (profissional.faltas > 0) { recebeCesta = false; }
if (mesmaCompetencia && dataAdmissao.getDate() > 15) { recebeCesta = false; }
```

---

## 🥩 VALE CARNE

**Política:** Profissional compra na loja — RH lança o desconto

| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | Flag `vale_carne` em `profissionais` |
| **Lançamento** | RH registra valor em `lancamentos_financeiros` |
| **Desconta do salário?** | ✅ **SIM** — é compra do profissional |
| **Quando desconta** | No Dia 5, junto com outros descontos operacionais |
| **Automático?** | ⚠️ Não — RH precisa lançar manualmente |

---

## 💵 VALE DINHEIRO

**Política:** Adiantamento avulso solicitado pelo profissional

| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | Não precisa de flag — lançamento avulso |
| **Lançamento** | RH registra em `lancamentos_financeiros` |
| **Desconta do salário?** | ✅ **SIM** — é adiantamento ao profissional |
| **Quando desconta** | No Dia 5 |

---

## 🏪 VALE ALIMENTAÇÃO (ALELO)

**Política:** Empresa paga 100% — apenas gerenciamento

| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | Flag `vale_alimentacao` + `valor_vale_alimentacao` |
| **Desconta do salário?** | ❌ **NÃO** |
| **Gestão** | Tab Alimentação em Gestão de Benefícios |

---

## 🏥 BENEFÍCIOS DE SAÚDE (Todos 100% Empresa)

### Odonto
| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | Flag `odonto` + `valor_odonto` |
| **Desconta?** | ❌ Não |

### Seguro Vida
| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | Flag `seguro_vida` + `valor_seguro_vida` |
| **Desconta?** | ❌ Não |

### Bem Mais (Saúde Mental - Sindicato)
| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | Flag `bem_mais` + `valor_bem_mais` |
| **Desconta?** | ❌ Não |

---

## 💰 EMPRÉSTIMOS

### Empréstimo CLT (Consignado)

| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | `GestaoEmprestimos.tsx` — valor total, parcelas, taxa |
| **Desconta?** | ✅ **SIM** — parcela mensal fixa |
| **Automático?** | ✅ Sim — motor inclui no Dia 5 |
| **Controles** | Parcelas pagas, saldo devedor, histórico de alterações |
| **Visualização** | Timeline visual + tab Empréstimos no painel do profissional |

### Empréstimo Loja/Empresa

| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | Mesmo módulo, tipo = "empresa" |
| **Desconta?** | ✅ **SIM** — parcela mensal fixa |
| **Automático?** | ✅ Sim |

---

## 👶 PENSÃO ALIMENTÍCIA

| Aspecto | Detalhe |
|---------|---------|
| **Cadastro** | `pensoes_alimenticias` — beneficiário, dados bancários, percentual |
| **Tipo cálculo** | Percentual sobre líquido OU valor fixo |
| **Desconta?** | ✅ **SIM** — obrigação judicial |
| **Automático?** | ✅ Sim — motor inclui no Dia 5 |
| **Dados bancários** | Banco, agência, conta, Pix do beneficiário |

---

## 📊 Resumo Final: Composição do Dia 5

```
SALÁRIO LÍQUIDO (Dia 5) = Salário Base
                          - Adiantamento (Dia 20 = 40%)
                          - Empréstimos (CLT + Loja)
                          - Compras (Vale Carne + Vale Dinheiro)
                          - Faltas injustificadas
                          - Pensão alimentícia
                          - Outros descontos manuais
```

**NÃO ENTRA na fórmula:** INSS, IRRF, VT, VR, Cesta, Alelo, Odonto, Seguro, Bem Mais.

Esses valores são **pagos separadamente ao profissional** ou **calculados pela contabilidade externa**.

---

## 🔧 Arquivos de Referência no Código

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/payrollCalculator.ts` | Motor de cálculo (Dia 20/5) |
| `src/lib/buildProfissionalInput.ts` | Mapeamento dados Supabase → motor |
| `src/hooks/useHoleriteData.ts` | Busca descontos para holerite |
| `src/components/folha/RelatorioFolha.tsx` | Geração de relatórios PDF |
| `src/pages/Fechamentos.tsx` | Central de fechamentos |
| `src/pages/GestaoBeneficios.tsx` | Gestão de benefícios |

---

*Documento atualizado em: 10/03/2026*
