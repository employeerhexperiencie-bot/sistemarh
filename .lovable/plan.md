

# Estado Real do Sistema Hoje -- O que Funciona de Verdade

## Dados em Producao (Banco de Dados Real)

| Recurso | Quantidade | Status |
|---------|-----------|--------|
| Tenant (cliente) | 1 (Tennessee Prime) | Ativo, plano avancado |
| Usuarios do sistema | 3 | Funcionando |
| Profissionais ativos | 278 de 280 | Dados carregados |
| Lojas/Unidades | 14 | Dados carregados |
| Exames ASO | 158 (121 em dia, 32 pendentes, 5 vencidos) | Dados carregados |
| Emprestimos | 69 (58 ativos, 11 quitados) | Dados carregados |
| Ferias | 278 registros (todos "pendente") | Dados carregados |
| Faltas | 11 registros | Dados carregados |
| Folha de pagamento | 591 registros (3 competencias) | Dados carregados |
| Holerites | 591 gerados | Dados carregados |
| Lancamentos financeiros | 0 | Vazio |
| Vales profissionais | 2 | Quase vazio |
| Afastamentos | 0 | Vazio |
| EPIs | 0 | Vazio |
| Pensoes alimenticias | 0 | Vazio |
| Historico de acoes (audit) | 3 | Quase vazio |

---

## Decisoes Arquiteturais Aprovadas (2026-02-24)

### 1. Tabela de Fechamentos
- **Decisao:** Criar nova tabela `fechamentos_folha` com snapshots JSON
- **Motivo:** Separar dados calculados em tempo real (folha_pagamento) dos dados congelados no fechamento

### 2. Tipo de Fechamento
- **Decisao:** Fechamentos INDEPENDENTES por tipo (Dia 20, Dia 5, VT, Beneficios)
- **Motivo:** Permite fechar parcialmente, ex: fechar Dia 20 antes de ter todos os dados do Dia 5

### 3. Emprestimos
- **Decisao:** Controle MANUAL pelo cliente
- **Motivo:** O RH decide quando cobrar a parcela, nao e automatico no fechamento
- **Implicacao:** Botao de "registrar pagamento de parcela" fica no modulo de emprestimos, nao no fechamento

### 4. Valores de Beneficios (VA, Dinheiro, Vale Carne, etc.)
- **Decisao:** Cadastro por profissional, controle total do usuario
- **Motivo:** Cada profissional pode ter valor diferente, RH tem autonomia para definir
- **Implicacao:** Campos `valor_vale_alimentacao`, `valor_vale_carne`, etc. ficam em `profissionais` ou `beneficios`

### 5. Recibo de Pagamento
- **Decisao:** Controle pelo usuario (campo recibo_assinado)
- **Implicacao:** Campo na folha/fechamento para marcar se recibo fisico foi assinado

---

## Proximos Passos (Priorizacao Pendente)

### Seguranca (URGENTE)
- [ ] Corrigir RLS: TO public → TO authenticated em 33 tabelas
- [ ] Ativar verify_jwt = true nas edge functions admin
- [ ] Enforcar limites do tenant no codigo
- [ ] Ativar auditoria real (historico_acoes gravando todas as acoes)

### Central de Fechamentos
- [ ] Criar tabela `fechamentos_folha` (tipo, loja_id, competencia, status, snapshot, versao)
- [ ] Criar tela /fechamentos com dashboard por loja
- [ ] Implementar fluxo: Aberto → Fechado → Reaberto (com versionamento)
- [ ] Integrar com geracao de relatorios PDF

### Relatorios PDF (6 layouts dos PDFs enviados)
- [ ] Relatorio Adiantamento Dia 20 (por loja)
- [ ] Relatorio Folha Pagamento Dia 5 (por loja)
- [ ] Relatorio Vale Transporte (por loja/periodo)
- [ ] Relatorio Cesta Basica (por loja)
- [ ] Relatorio Vale Alimentacao Alelo (por loja)
- [ ] Recibo de Pagamento (3 por pagina A4)

### Gaps de Dados para Relatorios
- [ ] Adicionar campo `nome_mae` em profissionais (necessario para Alelo)
- [ ] Garantir `valor_vale_alimentacao` variavel por profissional
- [ ] Confirmar campos Vale Carne e Dinheiro como lancamentos ou campos dedicados

---

## 33 Tabelas no Banco -- Classificacao por Uso Real

### COM dados reais e funcionando
| Tabela | Registros | Uso |
|--------|-----------|-----|
| `profissionais` | 280 | CRUD completo, filtros, busca |
| `lojas` | 14 | CRUD completo |
| `exames_aso` | 158 | Alertas de vencimento funcionam |
| `emprestimos` | 69 | Listagem CLT/empresa, parcelas |
| `ferias` | 278 | Periodo aquisitivo carregado |
| `faltas` | 11 | Registro basico |
| `folha_pagamento` | 591 | Calculo Dia 20/Dia 5 funciona |
| `holerites` | 591 | PDF gerado via jsPDF |
| `tenants` | 1 | Multi-tenant configurado |
| `user_roles` | 3 | RBAC 5 niveis funciona |

### Tabelas VAZIAS (estrutura existe, sem uso real)
| Tabela | Registros | Observacao |
|--------|-----------|------------|
| `lancamentos_financeiros` | 0 | Tela existe mas ninguem usa ainda |
| `afastamentos` | 0 | Tela existe, sem dados |
| `epis` | 0 | Tela existe, sem dados |
| `pensoes_alimenticias` | 0 | Tela existe, sem dados |
| `advertencias` | 0 | Tela existe, sem dados |
| `professional_vales` | 2 | Praticamente vazio |
| `historico_acoes` | 3 | Auditoria quase nao grava |

---

## Motor de Calculo (Core do Sistema)

| Componente | Status | Detalhes |
|------------|--------|----------|
| `payrollCalculator.ts` | Funciona e testado | 54+ testes automatizados |
| Calculo Dia 20 (40%) | Funciona | Adiantamento sobre salario bruto |
| Calculo Dia 5 (60%) | Funciona | Saldo + descontos de beneficios |
| Desconto VT (6%) | Funciona | Teto legal aplicado |
| Desconto VR | Funciona | Valor fixo (R$ 25/dia default) |
| Desconto Cesta Basica | Funciona | Configuravel |
| Desconto Emprestimo | Funciona | Parcela do emprestimo ativo |
| Desconto Pensao | Funciona | Percentual sobre liquido |
| Ferias (1/3 constitucional) | Funciona | Com abono pecuniario |
| 13o Salario (avos) | Funciona | Proporcional por mes trabalhado |
| Arredondamento | Funciona | >= 0.50 para cima |

---

## Seguranca

| Aspecto | Status | Risco |
|---------|--------|-------|
| Autenticacao | Funciona | Baixo |
| RLS (33 tabelas) | Existe mas `TO public` | **ALTO** |
| RBAC 5 niveis | Funciona na UI | Medio |
| Limites do tenant | Definidos mas nao enforced | **ALTO** |
| Edge functions JWT | Parcial | **MEDIO** |
| Audit trail | 3 registros apenas | **ALTO** |
