# Análise de Jornadas: Gerenciamento, Cadastro e Descontos de Benefícios

> **Data da Análise:** 28/01/2026  
> **Objetivo:** Mapear as jornadas atuais de cada benefício e identificar gaps

---

## 📊 Resumo Executivo

| Benefício | Cadastro | Gestão | Desconto em Folha | Status |
|-----------|----------|--------|-------------------|--------|
| Odonto | ✅ Flag + Valor | ✅ Tab Saúde | ⚠️ Não integrado | Parcial |
| Seguro Vida | ✅ Flag + Valor | ✅ Tab Saúde | ⚠️ Não integrado | Parcial |
| Vale Transporte | ✅ Flag + Valor Diário | ✅ Tab VT | ✅ payrollCalculator | Completo |
| Vale Refeição | ✅ Flag | ✅ Tab Alimentação | ✅ payrollCalculator | Completo |
| Vale Alimentação (Alelo) | ✅ Flag + Valor | ✅ Tab Alimentação | ⚠️ Não integrado | Parcial |
| Cesta Básica | ✅ Flag | ✅ Tab Alimentação | ✅ payrollCalculator | Completo |
| Bem Mais (Sindicato) | ✅ Flag + Valor | ✅ Tab Saúde | ⚠️ Não integrado | Parcial |
| Vale Carne | ✅ Flag + Valor | ✅ Tab Alimentação | ⚠️ Não integrado | Parcial |
| Vale Dinheiro | ⚠️ Só em beneficios | ✅ Tab Alimentação | ⚠️ Não integrado | Parcial |
| Empréstimo CLT | ✅ Completo | ✅ GestaoEmprestimos | ✅ payrollCalculator | Completo |
| Empréstimo Loja | ✅ Completo | ✅ GestaoEmprestimos | ✅ payrollCalculator | Completo |

---

## 1. 🦷 ODONTOLÓGICO

### Estrutura de Dados
```
profissionais:
  - odonto: boolean (flag de elegibilidade)
  - valor_odonto: numeric (valor mensal do benefício)

beneficios (mensal):
  - valor_odonto: numeric (valor do mês)
```

### Jornada de CADASTRO
1. **Onde:** `CadastroProfissionais.tsx` > Aba "Benefícios"
2. **Campos:** Checkbox `recebe_odonto` + Input `valor_odonto`
3. **Status:** ✅ Implementado

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoBeneficios.tsx` > Tab "Saúde" > `BeneficiosSaudeTab.tsx`
2. **Funcionalidades:**
   - Card resumo com total de beneficiários e valor total
   - Tabela listando profissionais com badge de valor
   - Busca por nome/matrícula
3. **Status:** ✅ Implementado

### Jornada de DESCONTO
1. **Onde:** `payrollCalculator.ts`
2. **Status:** ⚠️ **NÃO INTEGRADO**
3. **Gap:** O valor de odonto não é descontado automaticamente na folha

### Ações Necessárias
- [ ] Adicionar `descontoOdonto` ao `payrollCalculator.ts`
- [ ] Exibir desconto no `SimuladorFolha.tsx`
- [ ] Incluir no holerite (Dia 5)

---

## 2. 💖 SEGURO DE VIDA

### Estrutura de Dados
```
profissionais:
  - seguro_vida: boolean
  - valor_seguro_vida: numeric

beneficios (mensal):
  - valor_seguro_vida: numeric
```

### Jornada de CADASTRO
1. **Onde:** `CadastroProfissionais.tsx` > Aba "Benefícios"
2. **Status:** ✅ Implementado

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoBeneficios.tsx` > Tab "Saúde"
2. **Status:** ✅ Implementado

### Jornada de DESCONTO
1. **Status:** ⚠️ **NÃO INTEGRADO**
2. **Gap:** Não há desconto automático em folha

### Ações Necessárias
- [ ] Adicionar ao motor de cálculo
- [ ] Incluir no holerite

---

## 3. 🚌 VALE TRANSPORTE

### Estrutura de Dados
```
profissionais:
  - vale_transporte: boolean
  - valor_diario_rota: numeric (valor diário da passagem)

beneficios (mensal):
  - valor_diario_vt: numeric
  - dias_trabalhados_vt: integer
  - descontos_vt: numeric
  - valor_total_vt: numeric
  - valor_liquido_vt: numeric
```

### Jornada de CADASTRO
1. **Onde:** `CadastroProfissionais.tsx` > Aba "Benefícios"
2. **Campos:** Checkbox `vale_transporte` + Input `valor_diario_rota`
3. **Status:** ✅ Completo

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoBeneficios.tsx` > Tab "Vale Transporte" > `BeneficiosVTTab.tsx`
2. **Também:** `GestaoBeneficiosDetalhado.tsx` (drill-down)
3. **Funcionalidades:**
   - Cards resumo por loja
   - Cálculo automático: dias × valor_diario_rota
   - Geração de comprovante PDF
4. **Status:** ✅ Completo

### Jornada de DESCONTO
1. **Onde:** `payrollCalculator.ts`
2. **Regras implementadas:**
   - VT = dias_trabalhados × valor_diario_rota
   - Desconto 6% do salário (limitado ao valor do VT)
   - Não paga se: afastado, férias
3. **Status:** ✅ **COMPLETO**

---

## 4. 🍽️ VALE REFEIÇÃO

### Estrutura de Dados
```
profissionais:
  - vale_refeicao: boolean

beneficios (mensal):
  - valor_diario_vr: numeric (padrão R$ 25,00)
  - dias_trabalhados_vr: integer
  - valor_total_vr: numeric
  - valor_liquido_vr: numeric
```

### Jornada de CADASTRO
1. **Onde:** `CadastroProfissionais.tsx` > Aba "Benefícios"
2. **Status:** ✅ Completo

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoBeneficios.tsx` > Tab "Alimentação" > `BeneficiosAlimentacaoTab.tsx`
2. **Regra de negócio:** Somente departamento COMERCIAL recebe VR
3. **Status:** ✅ Completo

### Jornada de DESCONTO
1. **Onde:** `payrollCalculator.ts`
2. **Regras:**
   - VR = dias_trabalhados × R$ 25,00
   - Desconta faltas, atestados, férias
3. **Status:** ✅ **COMPLETO**

---

## 5. 💳 VALE ALIMENTAÇÃO (ALELO)

### Estrutura de Dados
```
profissionais:
  - vale_alimentacao: boolean
  - valor_vale_alimentacao: numeric

beneficios (mensal):
  - valor_vale_alimentacao: numeric
```

### Jornada de CADASTRO
1. **Onde:** `CadastroProfissionais.tsx` > Aba "Benefícios"
2. **Status:** ✅ Implementado

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoBeneficios.tsx` > Tab "Alimentação"
2. **Status:** ✅ Implementado

### Jornada de DESCONTO
1. **Status:** ⚠️ **NÃO INTEGRADO**
2. **Observação:** Parece ser um benefício sem desconto (empresa paga 100%)

### Ações Necessárias
- [ ] Confirmar regra de negócio: desconta ou não?
- [ ] Se desconta, adicionar ao motor de cálculo

---

## 6. 🛒 CESTA BÁSICA

### Estrutura de Dados
```
profissionais:
  - cesta_basica: boolean

beneficios (mensal):
  - elegivel_cesta: boolean
  - valor_cesta: numeric (padrão R$ 180,00)
```

### Jornada de CADASTRO
1. **Onde:** `CadastroProfissionais.tsx` > Aba "Benefícios"
2. **Status:** ✅ Completo

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoBeneficios.tsx` > Tab "Alimentação"
2. **Status:** ✅ Completo

### Jornada de DESCONTO
1. **Onde:** `payrollCalculator.ts`
2. **Regras:**
   - Valor fixo R$ 180,00
   - **PERDE se:** qualquer falta INJUSTIFICADA no mês
   - **PERDE se:** admitido após dia 15 do mês
   - **MANTÉM se:** apenas atestados (faltas justificadas)
3. **Status:** ✅ **COMPLETO**

---

## 7. 🧠 BEM MAIS (SAÚDE MENTAL SINDICATO)

### Estrutura de Dados
```
profissionais:
  - bem_mais: boolean
  - valor_bem_mais: numeric

beneficios (mensal):
  - valor_bem_mais: numeric
```

### Jornada de CADASTRO
1. **Onde:** `CadastroProfissionais.tsx` > Aba "Benefícios"
2. **Status:** ✅ Implementado

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoBeneficios.tsx` > Tab "Saúde"
2. **Funcionalidades:**
   - Card com total de beneficiários
   - Tabela com valores individuais
3. **Status:** ✅ Implementado

### Jornada de DESCONTO
1. **Status:** ⚠️ **NÃO INTEGRADO**
2. **Gap:** Não desconta automaticamente em folha

### Ações Necessárias
- [ ] Confirmar: desconto é 100% do funcionário?
- [ ] Adicionar ao payrollCalculator se for desconto

---

## 8. 🥩 VALE CARNE

### Estrutura de Dados
```
profissionais:
  - vale_carne: boolean
  - valor_vale_carne: numeric

beneficios (mensal):
  - valor_vale_carne: numeric
```

### Jornada de CADASTRO
1. **Onde:** `CadastroProfissionais.tsx` > Aba "Benefícios"
2. **Status:** ✅ Implementado

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoBeneficios.tsx` > Tab "Alimentação"
2. **Status:** ✅ Implementado

### Jornada de DESCONTO
1. **Status:** ⚠️ **NÃO INTEGRADO**
2. **Observação:** Parece ser benefício sem desconto

### Ações Necessárias
- [ ] Confirmar regra de negócio

---

## 9. 💵 VALE DINHEIRO

### Estrutura de Dados
```
beneficios (mensal):
  - valor_vale_dinheiro: numeric

⚠️ NÃO EXISTE flag no cadastro de profissionais
```

### Jornada de CADASTRO
1. **Status:** ⚠️ **INCOMPLETO**
2. **Gap:** Não há flag no cadastro do profissional
3. **Comportamento atual:** Lançado manualmente na tabela `beneficios`

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoBeneficios.tsx` > Tab "Alimentação"
2. **Status:** ✅ Exibe valores cadastrados

### Jornada de DESCONTO
1. **Status:** ⚠️ **NÃO INTEGRADO**

### Ações Necessárias
- [ ] Adicionar flag `vale_dinheiro` na tabela profissionais?
- [ ] Ou manter como lançamento mensal avulso?
- [ ] Definir se é benefício ou adiantamento

---

## 10. 💼 EMPRÉSTIMO CLT (CONSIGNADO)

### Estrutura de Dados
```
emprestimos:
  - tipo: 'clt'
  - valor_parcela: numeric (valor fixo mensal)
  - data_inicio: date
  - status: 'ativo' | 'pausado' | 'quitado'
  - saldo_devedor: numeric (não aplicável - empresa não sabe)
  - observacoes: text
```

### Jornada de CADASTRO
1. **Onde:** `GestaoEmprestimos.tsx` > "Novo Empréstimo"
2. **Campos:** Funcionário, Tipo CLT, Valor Parcela, Data Início
3. **Status:** ✅ Completo

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoEmprestimos.tsx` > Tab "Consignados"
2. **Funcionalidades:**
   - Lista de empréstimos ativos/pausados/quitados
   - Pausar/Reativar desconto
   - Marcar como quitado
   - Histórico de alterações
3. **Status:** ✅ Completo

### Jornada de DESCONTO
1. **Onde:** `payrollCalculator.ts`
2. **Regras:**
   - Desconta valor_parcela fixo no Dia 5
   - Se status = 'pausado', não desconta
   - Total descontado = parcelas × valor_parcela
3. **Status:** ✅ **COMPLETO**

---

## 11. 🏪 EMPRÉSTIMO LOJA/EMPRESA

### Estrutura de Dados
```
emprestimos:
  - tipo: 'empresa'
  - valor_total: numeric
  - numero_parcelas: integer
  - valor_parcela: numeric
  - parcelas_pagas: integer
  - saldo_devedor: numeric
  - data_inicio: date
  - status: 'ativo' | 'quitado'
```

### Jornada de CADASTRO
1. **Onde:** `GestaoEmprestimos.tsx` > "Novo Empréstimo"
2. **Campos:** Funcionário, Tipo Empresa, Valor Total, Nº Parcelas, Data Início
3. **Cálculo automático:** valor_parcela = valor_total / numero_parcelas
4. **Status:** ✅ Completo

### Jornada de GERENCIAMENTO
1. **Onde:** `GestaoEmprestimos.tsx` > Tab "Empresa"
2. **Funcionalidades:**
   - Visualização de parcelas (pagas/pendentes)
   - Registrar pagamento de parcela
   - Atualizar saldo devedor
   - Histórico de alterações (auditoria)
   - Progress bar de quitação
3. **Status:** ✅ Completo

### Jornada de DESCONTO
1. **Onde:** `payrollCalculator.ts`
2. **Regras:**
   - Desconta valor_parcela no Dia 5
   - Atualiza parcelas_pagas automaticamente no fechamento
   - Quando parcelas_pagas = numero_parcelas → status = 'quitado'
3. **Status:** ✅ **COMPLETO**

---

## 🎯 Prioridades de Implementação

### Alta Prioridade (Afetam Folha)
1. **Odonto** - Integrar desconto no payrollCalculator
2. **Seguro Vida** - Integrar desconto no payrollCalculator
3. **Bem Mais** - Integrar desconto no payrollCalculator

### Média Prioridade (Benefícios sem Desconto)
4. **Vale Alimentação (Alelo)** - Confirmar regra
5. **Vale Carne** - Confirmar regra
6. **Vale Dinheiro** - Definir modelo de gestão

### Baixa Prioridade (Já Funcionais)
- Vale Transporte ✅
- Vale Refeição ✅
- Cesta Básica ✅
- Empréstimo CLT ✅
- Empréstimo Empresa ✅

---

## 📐 Proposta de Arquitetura Unificada

### Centralizar Configurações
```typescript
// configuracoes_sistema ou novo arquivo de constantes
const BENEFICIOS_CONFIG = {
  VR: { valorDiario: 25.00, desconta: false },
  VT: { percentualDesconto: 6, desconta: true },
  CESTA: { valorFixo: 180.00, desconta: false },
  ODONTO: { desconta: true },
  SEGURO_VIDA: { desconta: true },
  BEM_MAIS: { desconta: true },
  VA_ALELO: { desconta: false },
  VALE_CARNE: { desconta: false },
  VALE_DINHEIRO: { desconta: false },
};
```

### Atualizar payrollCalculator
```typescript
// Adicionar novos campos no resultado
export interface ResultadoCalculo {
  // ... campos existentes
  descontoOdonto: number;
  descontoSeguroVida: number;
  descontoBemMais: number;
  // Para exibição (não desconta)
  valorValeAlimentacao: number;
  valorValeCarne: number;
  valorValeDinheiro: number;
}
```

---

## 📝 Conclusão

O sistema possui **estrutura de dados completa** para todos os benefícios, mas apenas **VT, VR, Cesta e Empréstimos** estão integrados ao motor de cálculo de folha.

Os benefícios de **Saúde (Odonto, Seguro Vida, Bem Mais)** precisam ser integrados ao `payrollCalculator.ts` para que os descontos apareçam automaticamente no Simulador e nos Holerites.
