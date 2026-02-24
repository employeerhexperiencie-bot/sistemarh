

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
| `security_logs` | ? | Provavelmente vazio |
| `adiantamentos` | ? | Provavelmente vazio |
| `decimo_terceiro` | ? | Provavelmente vazio |
| `beneficios` | ? | Provavelmente vazio |

---

## 40 Paginas -- O que Realmente Funciona vs O que e Tela Bonita

### FUNCIONANDO com dados reais
| Pagina | O que faz de verdade |
|--------|---------------------|
| `/login` | Autenticacao real com Supabase Auth |
| `/setup` | Primeiro usuario cria conta + tenant |
| `/recuperar-senha` | Envio de email de recuperacao |
| `/` (Dashboard) | KPIs reais: 278 ativos, 14 lojas, alertas ASO |
| `/cadastro-profissionais` | CRUD completo, busca, filtros por loja |
| `/cadastro-lojas` | CRUD completo das 14 lojas |
| `/gestao-aso` | 158 exames, alertas de vencimento (5 vencidos) |
| `/gestao-emprestimos` | 69 emprestimos, separacao CLT/empresa |
| `/gestao-ferias` | 278 registros de periodo aquisitivo |
| `/simulador-folha` | Calculo real Dia 20 (40%) e Dia 5 (60%) |
| `/holerites` | 591 holerites, geracao PDF funciona |
| `/faltas` | 11 registros de faltas |
| `/painel-loja` | Drill-down por loja com dados reais |
| `/painel-profissional` | Visao 360 do profissional |
| `/configuracoes` | White-label (logo, cores, nome) |
| `/gestao-usuarios` | Gerenciar usuarios e permissoes (super_admin) |

### TELA EXISTE mas com dados vazios ou mock
| Pagina | Situacao |
|--------|---------|
| `/gestao-lancamentos` | Tela pronta, tabela `lancamentos_financeiros` vazia |
| `/gestao-epi` | Tela pronta, tabela `epis` vazia |
| `/gestao-afastamentos` | Tela pronta, tabela `afastamentos` vazia |
| `/gestao-beneficios` | Tela pronta, leitura parcial dos dados |
| `/gestao-beneficios-detalhado` | Tela pronta, depende de dados completos |
| `/ocorrencias` | Tabela `ocorrencias` **nao existe** no banco |
| `/pendencias` | Tela pronta, tabela `pendencias` pode estar vazia |
| `/alertas` | Tela pronta, alertas parciais |
| `/relatorios` | 6 cards de relatorio mas **exportacao nao funciona** (console.log) |
| `/dashboard-analitico` | Graficos podem usar dados parciais |
| `/historico-profissional` | Timeline, depende de historico gravado |
| `/minha-equipe` | Depende de vinculo usuario-loja |

### Ferramentas administrativas (super_admin)
| Pagina | Situacao |
|--------|---------|
| `/importacao-dados` | Funciona - dados ja foram carregados por aqui |
| `/importar-dados-excel` | Funciona via edge function |
| `/migrar-dados` | Funciona via edge function |
| `/validacao-dados` | Tela de conferencia |
| `/analisar-ativos` | Analise da base ATIVOS.xlsx |
| `/atualizar-ativos` | Atualizacao em massa |
| `/audit-log` | Apenas 3 registros gravados |

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
| RLS (33 tabelas) | Existe mas `TO public` | **ALTO** - deveria ser `TO authenticated` |
| RBAC 5 niveis | Funciona na UI | Medio - enforcement parcial |
| Limites do tenant | Definidos (100 prof, 10 users) | **ALTO** - nao sao verificados no codigo |
| Edge functions JWT | Parcial | **MEDIO** - `invite-user` sem JWT |
| Audit trail | 3 registros apenas | **ALTO** - praticamente desligado |

---

## Resumo Executivo

**O que funciona de verdade e o cliente usa:**
- Login, cadastro de profissionais (280), lojas (14), ASO (158), emprestimos (69), ferias (278), faltas (11), simulador de folha com calculo real, geracao de holerites PDF

**O que existe como estrutura mas esta vazio:**
- Lancamentos financeiros, EPIs, afastamentos, pensoes, advertencias, auditoria

**O que tem tela mas nao funciona:**
- Exportacao de relatorios (so faz console.log), tabela de ocorrencias nao existe no banco

**O que precisa urgente para escalar:**
- Corrigir RLS (`TO authenticated`), ativar auditoria real, enforcar limites do tenant, implementar exportacao real dos relatorios

