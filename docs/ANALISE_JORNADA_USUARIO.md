# Jornada do Usuário - Sistema RH SaaS
> **Atualizado em:** 10/03/2026  
> **Tenant de referência:** Tennessee Prime (450+ profissionais, 34 lojas)

---

## 🗺️ Visão Geral das Jornadas

```
LOGIN → DASHBOARD → [Escolher módulo] → EXECUTAR → FECHAR/SALVAR → ALERTAS
```

O sistema possui **6 jornadas principais**, cada uma com sub-fluxos claros:

| # | Jornada | Frequência | Usuários |
|---|---------|------------|----------|
| 1 | Processamento de Folha | Mensal (Dia 20 + Dia 5) | Admin, Gerente |
| 2 | Gestão de Pessoas 360° | Diária | Admin, Gerente, Executor |
| 3 | Gestão de Benefícios | Mensal | Admin |
| 4 | Importação de Dados | Sob demanda | Admin |
| 5 | Controle de Conformidade | Contínua | Admin, Gerente |
| 6 | Administração do Tenant | Sob demanda | Super Admin, Admin |

---

## 📋 JORNADA 1: Processamento de Folha (Ciclo Dia 20/5)

### Fluxo Completo

```
Dashboard → Central de Fechamentos → Selecionar Loja(s) → Tipo (Dia 20 ou Dia 5)
    ↓
Revisar Tabela de Profissionais → Editar Variáveis (faltas, vales) → Simular
    ↓
Conferir Cards de Resumo → Fechar Folha → Gerar Holerites → Exportar PDF/CSV
```

### Passo a Passo

| Etapa | Ação do Usuário | Reação do Sistema |
|-------|-----------------|-------------------|
| 1. Acessar Fechamentos | Clica em "Central de Fechamentos" no menu | Carrega competência atual e lista de lojas do tenant |
| 2. Selecionar Loja | Escolhe loja específica ou "Todas as Lojas" | Busca profissionais ativos da(s) loja(s) no banco |
| 3. Escolher Tipo | Clica "Dia 20" ou "Dia 5" | Motor de cálculo (`payrollCalculator.ts`) processa automaticamente |
| 4. Revisar Tabela | Visualiza tabela com todos profissionais | Exibe: salário, dias trabalhados, faltas, descontos, líquido |
| 5. Editar Variáveis | Clica no ícone de edição em um profissional | Abre drawer com campos editáveis (faltas, vales, empréstimos) |
| 6. Simular | Altera um valor e confirma | Recalcula em tempo real e atualiza a linha na tabela |
| 7. Conferir Totais | Olha os cards no topo da página | Cards mostram: Total a Pagar, Bruto, Adiantamentos, Descontos |
| 8. Fechar Folha | Clica "Fechar Folha" | Modal de confirmação → Salva snapshot imutável (JSONB) no banco |
| 9. Gerar Holerites | Clica "Gerar Holerites" | Cria registros em lote na tabela `holerites` |
| 10. Exportar | Clica em PDF ou CSV | Gera relatório com jsPDF/autotable e faz download |

### Regras de Cálculo Aplicadas Automaticamente

**DIA 20 (Adiantamento - 40% do salário):**
- ✅ Calcula 40% do salário base automaticamente
- ❌ Bloqueia se: em férias, afastado por acidente/doença, +10 faltas
- ⚠️ Admitido após dia 10: recebe 40% normalmente

**DIA 5 (Quitação - Saldo):**
- Fórmula: `Salário Base - Dia 20 - Descontos Operacionais`
- **O que desconta do profissional:**
  - ✅ Empréstimos (CLT e Loja) — parcela mensal automática
  - ✅ Compras na loja (Vale Carne, Vale Dinheiro) — lançamento do RH
  - ✅ Faltas injustificadas — (salário/30) × dias
  - ✅ Pensão alimentícia — quando aplicável
- **O que NÃO desconta do profissional (empresa paga):**
  - ❌ INSS/IRRF — calculados separadamente pela contabilidade
  - ❌ VT 6% — empresa paga 100% do vale transporte
  - ❌ VR — valor pago AO profissional, não descontado
  - ❌ Cesta Básica — benefício pago AO profissional

### Snapshot de Fechamento
Ao fechar, o sistema grava um snapshot imutável com:
- Versão incremental (`versao`)
- Dados completos de cada profissional no momento do fechamento
- Totais consolidados
- Usuário e timestamp do fechamento
- Permite reabrir com registro de quem reabriu e quando

---

## 📋 JORNADA 2: Gestão de Pessoas 360°

### Fluxo Principal

```
Cadastro Profissionais → Painel do Profissional (10 abas) → Ações por Módulo
```

### Sub-fluxos por Módulo

#### 2.1 Cadastro de Profissional
| Ação | Reação |
|------|--------|
| Preenche formulário (nome, CPF, matrícula, loja, salário) | Valida campos obrigatórios e salva em `profissionais` |
| Define benefícios (flags VT, VR, Cesta, Odonto, etc.) | Ativa cálculos automáticos correspondentes |
| Define escala (6x1 ou 5x2) | Motor ajusta dias úteis do mês |

#### 2.2 Painel do Profissional (10 Abas)
| Aba | O que faz | Reação |
|-----|-----------|--------|
| Dados Pessoais | Exibe/edita dados cadastrais | CRUD direto na tabela `profissionais` |
| Benefícios | Mostra benefícios ativos e valores | Leitura de `beneficios` + flags do cadastro |
| Empréstimos | Lista empréstimos ativos/quitados | CRUD em `emprestimos` + timeline visual |
| Faltas | Registra faltas injustificadas/atestados | CRUD em `faltas`, impacta cálculo de folha |
| Férias | Períodos aquisitivos e gozo | CRUD em `ferias` com alertas de vencimento |
| ASO | Exames ocupacionais (NR-7) | CRUD em `exames_aso` com alertas de validade |
| EPIs | Equipamentos entregues (NR-6) | CRUD em `epis` com controle de CA |
| Advertências | Ocorrências disciplinares | CRUD em `advertencias` |
| Documentos | Upload de documentos | Storage + `professional_documents` |
| Histórico | Timeline de ações no profissional | Leitura de `historico_acoes` |

#### 2.3 Gestão de Férias
| Ação | Reação |
|------|--------|
| Acessa Gestão de Férias | Lista profissionais com períodos aquisitivos calculados |
| Gera férias em lote | Calcula automaticamente baseado na data de admissão |
| Agenda período de gozo | Registra datas início/fim e calcula valor (salário + 1/3) |
| Vende dias (abono) | Calcula valor dos dias vendidos |

#### 2.4 Gestão de Afastamentos
| Ação | Reação |
|------|--------|
| Registra afastamento | Muda status do profissional (acidente, doença, maternidade) |
| Define dias | Motor calcula: 15 primeiros dias = empresa; após = INSS |
| Maternidade | Empresa paga 40% do salário (INSS reembolsa) |

---

## 📋 JORNADA 3: Gestão de Benefícios

### Fluxo

```
Gestão de Benefícios → Selecionar Aba → Visualizar/Editar → Gerar Relatório
```

### Abas e Funcionalidades

| Aba | Conteúdo | Ações |
|-----|----------|-------|
| VT | Lista profissionais com VT, rotas, valores diários | Editar rota, ver custo mensal por loja |
| Alimentação | VR, Cesta, Alelo, Vale Carne | Ver elegibilidade, valores a pagar |
| Saúde | Odonto, Seguro Vida, Bem Mais | Gerenciar adesão por profissional |
| Empréstimos | Resumo de empréstimos ativos | Ver saldo devedor, parcelas, status |
| Pensão | Pensões alimentícias ativas | Dados bancários, percentual, beneficiário |

### Regras de Benefícios por Tipo

| Benefício | Quem paga | Desconta do profissional? | Regra |
|-----------|-----------|---------------------------|-------|
| VT | Empresa (100%) | ❌ Não | dias trabalhados × valor diário da rota |
| VR | Empresa | ❌ Não (é pago AO profissional) | dias trabalhados × R$25 |
| Cesta Básica | Empresa | ❌ Não (é pago AO profissional) | R$180 fixo. Perde se falta injustificada ou admissão após dia 15 |
| Alelo | Empresa | ❌ Não | Valor fixo mensal |
| Odonto | Empresa | ❌ Não | Gerenciamento apenas |
| Seguro Vida | Empresa | ❌ Não | Gerenciamento apenas |
| Bem Mais | Empresa | ❌ Não | Gerenciamento apenas |
| Vale Carne | Profissional | ✅ Sim (compra) | RH lança quando profissional compra |
| Vale Dinheiro | Profissional | ✅ Sim (compra) | RH lança quando profissional solicita |
| Empréstimo CLT | Parcela mensal | ✅ Sim | Desconto automático da parcela no Dia 5 |
| Empréstimo Loja | Parcela mensal | ✅ Sim | Desconto automático da parcela no Dia 5 |

---

## 📋 JORNADA 4: Importação de Dados

### Fluxo

```
Central de Importação → Selecionar Módulo → Upload Excel → Validar → Confirmar → Salvar
```

### Módulos de Importação

| Módulo | Arquivo esperado | O que importa |
|--------|-----------------|---------------|
| Profissionais (Ativos) | ATIVOS.xlsx | Dados cadastrais, salários, benefícios |
| Benefícios | BASE_Beneficios.xlsx | Valores mensais VT, VR, Cesta por profissional |
| ASO | BASE_ASO.xlsx | Datas de exames e próximos vencimentos |
| Empréstimos CTPS | EMPRESTIMO_CTPS.xlsx | Empréstimos CLT com parcelas |
| Empréstimos Folha | EMPRESTIMO_DESCONTO.xlsx | Empréstimos da empresa |

### Reações do Sistema

| Etapa | Reação |
|-------|--------|
| Upload do arquivo | Valida formato (xlsx), lê headers, conta registros |
| Validação | Compara com dados existentes, identifica novos/atualizados |
| Prévia | Mostra tabela com dados a serem importados e erros encontrados |
| Confirmação | Insere/atualiza em lote via Supabase |
| Resultado | Exibe resumo: X sucesso, Y erros, com detalhes dos erros |
| Histórico | Grava em `historico_importacoes` para auditoria |

---

## 📋 JORNADA 5: Controle de Conformidade

### 5.1 ASO (NR-7)
| Ação | Reação |
|------|--------|
| Acessa Gestão ASO | Lista todos profissionais com status de exames |
| Filtro por status | Verde (em dia), Amarelo (vencendo), Vermelho (vencido) |
| Registra exame | Salva data, clínica, valor, calcula próximo vencimento |
| Alerta automático | Sistema cria alerta em `alertas_sistema` quando vence em 30 dias |

### 5.2 EPIs (NR-6)
| Ação | Reação |
|------|--------|
| Registra entrega | Salva EPI, CA, data entrega, validade |
| Controle de estoque | Entrada de EPIs com categorias |
| Alerta de validade | Sistema alerta quando EPI está próximo do vencimento |

### 5.3 Advertências
| Ação | Reação |
|------|--------|
| Registra ocorrência | Salva tipo (verbal, escrita, suspensão), motivo, data |
| Anexa documento | Upload do documento assinado |
| Histórico | Timeline completa no painel do profissional |

---

## 📋 JORNADA 6: Administração do Tenant

### 6.1 Gestão de Usuários
| Ação | Reação |
|------|--------|
| Convida usuário | Envia email via edge function `invite-user` |
| Define role | Super Admin, Admin, Gerente, Executor, Operador |
| Define permissões por módulo | Granular: visualizar, editar, deletar, aprovar, exportar |
| Vincula a loja | Gerente/Executor vê apenas dados da loja vinculada |

### 6.2 Configurações do Sistema
| Ação | Reação |
|------|--------|
| Altera valor VR | Atualiza `configuracoes_sistema`, reflete no próximo cálculo |
| Altera valor Cesta | Idem |
| Altera % Dia 20 | Idem (padrão 40%) |
| Personaliza aparência | Tema claro/escuro, cores, sidebar |

### 6.3 Painel de Uso (Super Admin)
| Ação | Reação |
|------|--------|
| Acessa Painel de Uso | Métricas do tenant: profissionais, lojas, storage |
| Registra pagamento | Controle financeiro do tenant (SaaS billing) |
| Gerencia tenants | Criar, ativar, desativar tenants |

---

## 📋 JORNADA TRANSVERSAL: Alertas e Notificações

### Fluxo

```
Sistema detecta condição → Cria alerta em alertas_sistema → Dashboard exibe badge
    ↓
Usuário clica → Navega para módulo correspondente → Resolve → Marca como lido
```

### Tipos de Alertas Automáticos

| Tipo | Prioridade | Condição | Ação sugerida |
|------|-----------|----------|---------------|
| ASO vencendo | 🔴 Crítica | Exame vence em < 30 dias | Agendar exame |
| ASO vencido | 🔴 Crítica | Exame já venceu | Agendar urgente |
| Férias vencendo | 🟠 Alta | Período concessivo próximo do limite | Programar férias |
| CPF faltante | 🟠 Alta | Profissional sem CPF | Completar cadastro |
| Dados desatualizados | 🟡 Média | Benefícios não recalculados | Atualizar dados |
| Folha não iniciada | 🟡 Média | Competência sem fechamento | Iniciar processamento |

---

## 📋 RELATÓRIOS E EXPORTAÇÕES

### Relatórios Disponíveis

| Relatório | Formato | Conteúdo |
|-----------|---------|----------|
| Folha Dia 20 | PDF | Lista de adiantamentos por profissional |
| Folha Dia 5 | PDF | Quitação com descontos detalhados |
| Relatório VT | PDF/CSV | Valores de VT a pagar por profissional/loja |
| Relatório Cesta | PDF | Elegibilidade e valores de cesta básica |
| Relatório Alelo | PDF | Valores de vale alimentação |
| Holerite Individual | PDF | Demonstrativo de pagamento do profissional |
| Recibos para Assinatura | PDF | Lista para coleta de assinaturas físicas |

---

## 🔐 Segurança em Cada Jornada

| Camada | Implementação |
|--------|---------------|
| Autenticação | JWT via Supabase Auth |
| Isolamento de dados | RLS em todas as tabelas com `tenant_id` |
| Controle de acesso | 5 níveis de role (Super Admin → Operador) |
| Permissões granulares | Por módulo × ação (visualizar, editar, deletar, aprovar, exportar) |
| Auditoria | Toda ação registrada em `historico_acoes` |
| Dados sensíveis | Função `can_access_sensitive_hr_data()` para dados de profissionais |

---

*Documento atualizado em: 10/03/2026*
