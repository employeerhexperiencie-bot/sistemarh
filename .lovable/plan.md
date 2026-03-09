

# Estado Real do Sistema — Atualizado 2026-03-03

## Dados em Producao (Banco de Dados Real)

| Recurso | Quantidade | Status |
|---------|-----------|--------|
| Tenant (cliente) | 1 (Tennessee Prime) | Ativo, plano avancado |
| Usuarios do sistema | 3 | Funcionando |
| Profissionais ativos | ~450 | Dados carregados |
| Lojas/Unidades | 34 | Dados carregados |
| Exames ASO | 2.712 | Dados carregados |
| Emprestimos | 69 (58 ativos, 11 quitados) | Dados carregados |
| Ferias | 278+ registros | Dados carregados |
| Faltas | 11 registros | Dados carregados |
| Folha de pagamento | 591 registros (3 competencias) | Dados carregados |
| Holerites | 591 gerados | Dados carregados |

---

## Decisoes Arquiteturais Aprovadas (2026-02-24)

### 1. Tabela de Fechamentos
- **Decisao:** Criar nova tabela `fechamentos_folha` com snapshots JSON
- **Motivo:** Separar dados calculados em tempo real (folha_pagamento) dos dados congelados no fechamento

### 2. Tipo de Fechamento
- **Decisao:** Fechamentos INDEPENDENTES por tipo (Dia 20, Dia 5, VT, Beneficios)
- **Motivo:** Permite fechar parcialmente

### 3. Emprestimos
- **Decisao:** Controle MANUAL pelo cliente
- **Motivo:** O RH decide quando cobrar a parcela

### 4. Valores de Beneficios (VA, Dinheiro, Vale Carne, etc.)
- **Decisao:** Cadastro por profissional, controle total do usuario

### 5. Recibo de Pagamento
- **Decisao:** Controle pelo usuario (campo recibo_assinado)

---

## Cronograma de Execucao

### FASE 1 — Fechamento Funcional ✅ CONCLUÍDA
- [x] Criar tabela `fechamentos_folha`
- [x] Criar tela /fechamentos com dashboard por loja
- [x] Implementar fluxo: Aberto → Fechado → Reaberto (com versionamento)
- [x] Integrar payrollCalculator nos snapshots (valores reais Dia 20/Dia 5)
- [x] Adicionar campo `recibo_assinado` nos holerites (migration executada)
- [ ] Gerar relatorios PDF a partir dos snapshots fechados (movido para FASE 2)

### FASE 2 — Relatorios PDF ✅ CONCLUÍDA
- [x] Relatorio Adiantamento Dia 20 (por loja) — gerarRelatorioDia20
- [x] Relatorio Folha Pagamento Dia 5 (por loja) — gerarRelatorioDia5
- [x] Relatorio Vale Transporte (por loja/periodo) — gerarRelatorioVT
- [x] Relatorio Cesta Basica (por loja) — gerarRelatorioCesta
- [x] Relatorio Vale Alimentacao Alelo (por loja) — gerarRelatorioAlelo
- [x] Recibo de Pagamento (3 por pagina A4) — gerarRecibos3PorPagina
- [x] Exportacao CSV para todos os tipos
- [x] Pagina /relatorios integrada com filtros e auditoria

### FASE 3 — Integracao EzPointWeb (Semana 3-4)
- [ ] Configurar secrets (EZPOINT_EMPRESA, EZPOINT_USUARIO, EZPOINT_SENHA)
- [ ] Edge Function `ezpoint-login` — autenticacao e cache do Bearer token
- [ ] Edge Function `ezpoint-sync` — consultar /batida por periodo e paginar
- [ ] Vincular profissionais locais via CPF → id_ezpoint (campo adicionado ✅)
- [ ] Calcular dias trabalhados reais a partir das batidas
- [ ] Consultar /espelhoDePontos para detalhamento
- [ ] Alimentar payrollCalculator automaticamente
- [ ] Tela de configuracao EzPoint
- [ ] Sincronizacao bidirecional: ferias e abonos
- [ ] Cron job para sincronizacao diaria automatica

### FASE 4 — Seguranca e Hardening ✅ CONCLUÍDA
- [x] Corrigir RLS: TO public → TO authenticated em 50+ tabelas e storage
- [x] Ativar verify_jwt = true nas edge functions admin
- [x] Enforcar limites do tenant no codigo (backend + frontend)
- [x] Desativar cadastros anonimos
- [x] Auditoria grava no banco via historico_acoes (6 modulos conectados)

### FASE 5 — Gaps de Dados ✅ CONCLUÍDA
- [x] Adicionar campo `nome_mae` em profissionais (migration + formulario)
- [x] Adicionar campo `id_ezpoint` em profissionais (migration)
- [x] Campo `recibo_assinado` em holerites e folha_pagamento
- [ ] Confirmar campos Vale Carne e Dinheiro como lancamentos ou campos dedicados

---

## Motor de Calculo (Core do Sistema)

| Componente | Status |
|------------|--------|
| `payrollCalculator.ts` | Funciona e testado (54+ testes) |
| Calculo Dia 20 (40%) | ✅ |
| Calculo Dia 5 (60%) | ✅ |
| Desconto VT (6%) | ✅ |
| Desconto VR | ✅ |
| Desconto Cesta Basica | ✅ |
| Desconto Emprestimo | ✅ |
| Desconto Pensao | ✅ |
| Ferias (1/3 constitucional) | ✅ |
| 13o Salario (avos) | ✅ |

---

## Seguranca ✅ HARDENED

| Aspecto | Status |
|---------|--------|
| Autenticacao | ✅ Funciona |
| RLS (50+ policies) | ✅ TO authenticated |
| RBAC 5 niveis | ✅ Funciona DB + UI |
| Limites do tenant | ✅ Enforced backend + frontend |
| Edge functions JWT | ✅ Todas protegidas |
| Audit trail | ✅ 6 modulos gravando no banco |
| Storage policies | ✅ TO authenticated com role check |
| Cadastro anonimo | ✅ Desativado |
