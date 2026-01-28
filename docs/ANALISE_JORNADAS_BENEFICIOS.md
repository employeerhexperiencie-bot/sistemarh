# Análise de Jornadas: Gerenciamento, Cadastro e Descontos de Benefícios

> **Data da Análise:** 28/01/2026  
> **Atualizado em:** 28/01/2026  
> **Objetivo:** Mapear as jornadas atuais de cada benefício

---

## 📊 Resumo Executivo

### ✅ Benefícios COM Desconto Automático em Folha

| Benefício | Cadastro | Gestão | Regra de Desconto | Status |
|-----------|----------|--------|-------------------|--------|
| Vale Transporte | Flag + valor diário | Tab VT | 6% do salário (limitado ao VT) | ✅ Completo |
| Vale Refeição | Flag | Tab Alimentação | dias × R$25 | ✅ Completo |
| Cesta Básica | Flag | Tab Alimentação | Perde se falta injustificada | ✅ Completo |
| Empréstimo CLT | Completo | GestaoEmprestimos | Parcela mensal | ✅ Completo |
| Empréstimo Loja | Completo | GestaoEmprestimos | Parcela mensal | ✅ Completo |

### ✅ Benefícios SEM Desconto (100% Empresa - Apenas Gerenciamento)

| Benefício | Cadastro | Gestão | Desconto | Status |
|-----------|----------|--------|----------|--------|
| Odonto | Flag | Tab Saúde | ❌ Não desconta | ✅ Correto |
| Seguro Vida | Flag | Tab Saúde | ❌ Não desconta | ✅ Correto |
| Bem Mais | Flag | Tab Saúde | ❌ Não desconta | ✅ Correto |
| Vale Alimentação (Alelo) | Flag | Tab Alimentação | ❌ Não desconta | ✅ Correto |

### ⚠️ Benefícios Pendentes de Confirmação

| Benefício | Status Atual | Pendência |
|-----------|--------------|-----------|
| Vale Carne | Flag existe | Confirmar regra (desconta ou não?) |
| Vale Dinheiro | Sem flag | Confirmar se precisa flag ou só lançamento manual |

---

## Detalhamento por Categoria

---

## 🏥 BENEFÍCIOS DE SAÚDE (Não Descontam)

### 1. Odonto ✅
**Tipo:** Gerenciamento apenas (empresa paga 100%)

| Aspecto | Status | Localização |
|---------|--------|-------------|
| Flag no cadastro | ✅ | `CadastroProfissionais.tsx` |
| Visualização | ✅ | `BeneficiosSaudeTab.tsx` |
| Contagem resumo | ✅ | `GestaoBeneficios.tsx` |
| Desconto folha | ❌ N/A | **Confirmado: não desconta** |

---

### 2. Seguro Vida ✅
**Tipo:** Gerenciamento apenas (empresa paga 100%)

| Aspecto | Status | Localização |
|---------|--------|-------------|
| Flag no cadastro | ✅ | `CadastroProfissionais.tsx` |
| Visualização | ✅ | `BeneficiosSaudeTab.tsx` |
| Contagem resumo | ✅ | `GestaoBeneficios.tsx` |
| Desconto folha | ❌ N/A | **Confirmado: não desconta** |

---

### 3. Bem Mais (Saúde Mental Sindicato) ✅
**Tipo:** Gerenciamento apenas (empresa paga 100%)

| Aspecto | Status | Localização |
|---------|--------|-------------|
| Flag no cadastro | ✅ | `CadastroProfissionais.tsx` |
| Visualização | ✅ | `BeneficiosSaudeTab.tsx` |
| Contagem resumo | ✅ | `GestaoBeneficios.tsx` |
| Desconto folha | ❌ N/A | **Confirmado: não desconta** |

---

## 🍽️ BENEFÍCIOS DE ALIMENTAÇÃO

### 4. Vale Alimentação (Alelo) ✅
**Tipo:** Gerenciamento apenas (empresa paga 100%)

| Aspecto | Status | Localização |
|---------|--------|-------------|
| Flag no cadastro | ✅ | `CadastroProfissionais.tsx` |
| Visualização | ✅ | `BeneficiosAlimentacaoTab.tsx` |
| Contagem resumo | ✅ | `GestaoBeneficios.tsx` |
| Desconto folha | ❌ N/A | **Confirmado: não desconta** |

---

### 5. Vale Refeição ✅
**Tipo:** Gerenciamento + Cálculo automático

| Aspecto | Status | Localização |
|---------|--------|-------------|
| Flag no cadastro | ✅ | `CadastroProfissionais.tsx` |
| Visualização | ✅ | `BeneficiosAlimentacaoTab.tsx` |
| Cálculo valor | ✅ | `payrollCalculator.ts` |
| Regra | ✅ | dias trabalhados × R$25,00 |

**Regra implementada:**
```typescript
valorVR = arredondarValor(diasTrabalhados * config.valorVR); // R$25/dia
```

---

### 6. Cesta Básica ✅
**Tipo:** Gerenciamento + Elegibilidade automática

| Aspecto | Status | Localização |
|---------|--------|-------------|
| Flag no cadastro | ✅ | `CadastroProfissionais.tsx` |
| Visualização | ✅ | `BeneficiosAlimentacaoTab.tsx` |
| Valor fixo | ✅ | R$180,00 |
| Regra perda | ✅ | Falta injustificada OU admissão após dia 15 |

**Regra implementada:**
```typescript
// Perde se falta INJUSTIFICADA (atestado mantém)
if (profissional.faltas > 0) {
  recebeCesta = false;
}
// Perde se admitido após dia 15
if (mesmaCompetencia && dataAdmissao.getDate() > 15) {
  recebeCesta = false;
}
```

---

### 7. Vale Carne ⚠️
**Tipo:** A confirmar

| Aspecto | Status | Pendência |
|---------|--------|-----------|
| Flag no cadastro | ✅ | `vale_carne` existe |
| Visualização | ✅ | `BeneficiosAlimentacaoTab.tsx` |
| Regra desconto | ❓ | **Confirmar: desconta ou 100% empresa?** |

---

### 8. Vale Dinheiro ⚠️
**Tipo:** A confirmar

| Aspecto | Status | Pendência |
|---------|--------|-----------|
| Flag no cadastro | ❌ | Não existe flag |
| Lançamento manual | ✅ | Via `lancamentos_financeiros` |
| Regra | ❓ | **Confirmar: precisa flag ou só manual?** |

---

## 🚌 TRANSPORTE

### 9. Vale Transporte ✅
**Tipo:** Gerenciamento + Desconto automático

| Aspecto | Status | Localização |
|---------|--------|-------------|
| Flag no cadastro | ✅ | `CadastroProfissionais.tsx` |
| Valor diário rota | ✅ | Campo `valor_diario_rota` |
| Visualização | ✅ | `BeneficiosVTTab.tsx` com drill-down |
| Cálculo valor | ✅ | dias trabalhados × valor_diário |
| Desconto 6% | ✅ | 6% do salário (máximo = valor VT) |

**Regra implementada:**
```typescript
// VT = dias × valor diário da rota
valorVT = arredondarValor(diasTrabalhados * profissional.valorPassagem);

// Desconto VT 6% (limitado ao valor do VT)
descontoVT6Porcento = Math.min(
  arredondarValor(profissional.salario * 0.06),
  valorVT
);
```

---

## 💰 EMPRÉSTIMOS

### 10. Empréstimo CLT (Consignado) ✅
**Tipo:** Gerenciamento completo + Desconto automático

| Aspecto | Status | Localização |
|---------|--------|-------------|
| Cadastro | ✅ | `GestaoEmprestimos.tsx` |
| Histórico | ✅ | `HistoricoEmprestimos.tsx` |
| Visualização | ✅ | `EmprestimosResumoTab.tsx` |
| Desconto folha | ✅ | Valor da parcela no Dia 5 |
| Timeline | ✅ | `EmprestimosTimeline.tsx` |

---

### 11. Empréstimo Loja/Empresa ✅
**Tipo:** Gerenciamento completo + Desconto automático

| Aspecto | Status | Localização |
|---------|--------|-------------|
| Cadastro | ✅ | `GestaoEmprestimos.tsx` |
| Controle parcelas | ✅ | Pagas vs pendentes |
| Saldo devedor | ✅ | Atualização automática |
| Histórico | ✅ | Auditoria de alterações |
| Desconto folha | ✅ | Valor da parcela no Dia 5 |

---

## ✅ Conclusão

### Implementação Completa (11/11 benefícios mapeados)

**COM desconto automático (5):**
- ✅ Vale Transporte (6% limitado)
- ✅ Vale Refeição (dias × R$25)
- ✅ Cesta Básica (perde por falta)
- ✅ Empréstimo CLT
- ✅ Empréstimo Loja

**SEM desconto - só gerenciamento (4):**
- ✅ Odonto
- ✅ Seguro Vida
- ✅ Bem Mais
- ✅ Vale Alimentação (Alelo)

**Pendentes confirmação (2):**
- ⚠️ Vale Carne
- ⚠️ Vale Dinheiro

---
*Documento atualizado em: 28/01/2026*
