# Sistema RH Eaz — Documento Geral para Análise (Claude)

> **Propósito**: Documento mestre consolidando arquitetura, código, funcionalidades e jornada do usuário do Sistema RH multi-tenant da Eaz, para permitir análise técnica profunda por modelos de IA (Claude).
> **Última atualização**: Abril 2026
> **Stack**: React 18 + Vite + TypeScript + Tailwind + Supabase (Lovable Cloud)
> **Escopo**: 47 páginas · 111 componentes · 12 hooks · 9 edge functions · 35+ tabelas com RLS

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 O que é
Sistema SaaS multi-tenant de **Gestão de RH para varejo brasileiro** (CLT), com foco em redes com múltiplas lojas. Integra cadastro 360°, folha de pagamento (Dia 5 e Dia 20), benefícios, ponto, ASO, férias, EPIs, empréstimos, pensão alimentícia, fechamentos auditáveis e conformidade trabalhista.

### 1.2 Diferenciais técnicos
- **Multi-tenant com isolamento absoluto** via RLS PostgreSQL
- **Motor de cálculo CLT** validado por 138+ testes unitários (`payrollCalculator.ts`, `decimoTerceiroCalculator.ts`)
- **RBAC de 5 níveis** (super_admin, admin, gerente, executor, operador)
- **Auditoria multi-camada** (`historico_acoes`, `historico_emprestimos`, `historico_salarios`, `security_logs`, `dev_logs`)
- **Integrações server-side seguras** (EzPoint v1.5, N8N) via Edge Functions proxy
- **White-label ready** com tokens semânticos HSL

### 1.3 Métricas de escala
- Suporta 2.000+ profissionais por tenant
- 9 índices compostos em tabelas centrais
- Limites configuráveis por plano (`limite_profissionais`, `limite_usuarios`, `limite_storage_mb`)

---

## 2. ARQUITETURA

### 2.1 Camadas
```
┌──────────────────────────────────────────────────────┐
│  FRONTEND (React 18 + Vite + TS)                     │
│  ├─ Pages (47)         → src/pages/                  │
│  ├─ Components (111)   → src/components/             │
│  ├─ Hooks (12)         → src/hooks/                  │
│  ├─ Lib/Calc (15)      → src/lib/                    │
│  └─ Contexts (4)       → src/contexts/               │
├──────────────────────────────────────────────────────┤
│  AUTH & ROUTING                                      │
│  ├─ AuthContext        → JWT Supabase                │
│  ├─ ProtectedRoute     → Gate por sessão             │
│  └─ SuperAdminLayout   → Gate por role               │
├──────────────────────────────────────────────────────┤
│  EDGE FUNCTIONS (Deno)                               │
│  ├─ ezpoint-proxy        (integração ponto)          │
│  ├─ n8n-proxy            (automações)                │
│  ├─ invite-user          (provisionamento)           │
│  ├─ provision-tenant-admin                           │
│  ├─ admin-update-user-email                          │
│  ├─ update-user-password                             │
│  ├─ update-tenant-data                               │
│  ├─ create-super-admin                               │
│  └─ migrate-excel-data                               │
├──────────────────────────────────────────────────────┤
│  DATABASE (Supabase Postgres)                        │
│  ├─ 35+ tabelas com RLS por tenant_id                │
│  ├─ Functions: has_role, get_user_tenant_id,         │
│  │              is_super_admin, can_access_*         │
│  ├─ Storage: professional-documents, loja-documents  │
│  └─ Realtime: alertas_sistema, ocorrencias           │
└──────────────────────────────────────────────────────┘
```

### 2.2 Isolamento Multi-tenant
Todas as tabelas têm coluna `tenant_id uuid NOT NULL DEFAULT get_user_tenant_id(auth.uid())` com policy:
```sql
USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
```

### 2.3 RBAC (tabela `user_roles` separada)
| Role | Capacidades |
|------|-------------|
| `super_admin` | Acesso total a todos tenants, painéis técnicos, migração |
| `admin` | CRUD completo do próprio tenant, usuários, configurações |
| `gerente` | Gestão operacional, fechamentos, sem deleção sensível |
| `executor` | Executa pendências/ocorrências atribuídas |
| `operador` | Acesso restrito (visualização, lançamentos básicos) |

Função canônica: `has_role(_user_id uuid, _role app_role) RETURNS boolean SECURITY DEFINER`.

---

## 3. MAPA DE ROTAS (47 páginas)

### 3.1 Públicas
| Rota | Componente | Função |
|------|-----------|--------|
| `/site` | LandingPage | Página comercial |
| `/login` | Login | Autenticação |
| `/setup` | SetupInicial | Onboarding inicial do tenant |
| `/recuperar-senha` | RecuperarSenha | Reset via email |
| `/redefinir-senha` | RedefinirSenha | Definir nova senha |

### 3.2 Operacionais (todos com `ProtectedLayout`)
| Categoria | Rota | Componente | Resumo |
|-----------|------|-----------|--------|
| **Visão Geral** | `/`, `/dashboard` | Dashboard | KPIs e atalhos |
| | `/dashboard-analitico` | DashboardAnalitico | Gráficos de absenteísmo, turnover, custos |
| | `/alertas` | Alertas | Central de conformidade |
| **Cadastros** | `/cadastro-lojas` | CadastroLojas | CRUD de lojas |
| | `/cadastro-profissionais` | CadastroProfissionais | Cadastro 360° (10 abas) |
| | `/upload-fotos-lote` | UploadFotosLote | Importação massiva de fotos |
| | `/central-importacao` | CentralImportacao | Hub de imports inteligentes |
| **Gestão de Pessoas** | `/gestao-ferias` | GestaoFerias | Períodos aquisitivos |
| | `/gestao-afastamentos` | GestaoAfastamentos | Atestados, licenças |
| | `/gestao-aso` | GestaoASO | Exames ocupacionais |
| | `/gestao-epi` | GestaoEPI | Equipamentos de proteção |
| | `/gestao-beneficios` | GestaoBeneficios | VR, VT, cesta, odonto |
| | `/gestao-beneficios-detalhado` | GestaoBeneficiosDetalhado | Edição granular por mês |
| | `/gestao-ponto` | GestaoPonto | Espelho/sync EzPoint |
| **Folha** | `/fechamentos` | Fechamentos | **Núcleo: Dia 5 e Dia 20** |
| | `/gestao-lancamentos` | GestaoLancamentos | Provisões, descontos, bônus |
| | `/lancamentos` | Lancamentos | Lançamentos rápidos |
| | `/faltas` | Faltas | Registro de faltas |
| | `/gestao-emprestimos` | GestaoEmprestimos | CTPS, CLT, Loja |
| | `/holerites` | Holerites | Geração e PDF |
| **Workflow** | `/pendencias` | Pendencias | Tarefas com SLA |
| | `/ocorrencias` | Ocorrencias | Kanban operacional |
| **Painéis 360°** | `/painel-loja` | PainelLoja | Comparativo entre lojas |
| | `/painel-profissional/:id` | PainelProfissional | Histórico individual |
| | `/historico-profissional` | HistoricoProfissional | Linha do tempo |
| **Análise** | `/relatorios` | Relatorios | PDFs e exports |
| **Config** | `/minha-equipe` | MinhaEquipe | Gestão de usuários do tenant |
| | `/configuracoes` | Configuracoes | Aparência, RH, integrações |
| **Ajuda** | `/como-usar` | ComoUsar | Tutorial |
| | `/ajuda` | Ajuda | Suporte |

### 3.3 Super Admin (rotas protegidas por `SuperAdminLayout`)
| Rota | Função |
|------|--------|
| `/painel-uso` | Métricas técnicas e logs de erro por tenant |
| `/gestao-usuarios` | Gerenciamento global de tenants e usuários |
| `/audit-log` | Histórico completo de ações |
| `/validacao-dados` | Auditoria de integridade |
| `/migrar-dados`, `/importar-dados-excel`, `/importacao-dados` | Migração e ETL |
| `/analisar-ativos`, `/atualizar-ativos`, `/carregar-dados-adicionais` | Manutenção em lote |
| `/referencia-sistema` | Referência técnica interna |

---

## 4. MOTOR DE CÁLCULO CLT (`src/lib/`)

### 4.1 `payrollCalculator.ts` (folha mensal)
**Funções principais**:
- `calcularDia20(profissional, beneficios, config)` — adiantamento (40% por padrão)
- `calcularDia5(profissional, lancamentos, beneficios, emprestimos, pensoes, config)` — folha definitiva
- `calcularINSS(base, faixas)` — tabela progressiva configurável
- `calcularIRRF(base, dependentes, faixas)` — com dedução por dependente
- `calcularPensao(profissional, base, pensoes)` — % ou valor fixo
- `normalizarData(data)` — anexa `T12:00:00` para evitar drift de fuso

**Regras críticas**:
- Vale Transporte: **integralmente custeado pela empresa** (decisão do cliente — desconto legal de 6% NÃO aplicado).
- Tennessee Prime: Dia 5 exclui INSS, IRRF, VT, VR e Cesta (pagos no Dia 20).
- Empréstimos `tipo='ctps'|'clt'` descontados em folha; `tipo='loja'` apenas registrados.

### 4.2 `decimoTerceiroCalculator.ts`
- Avos de 1/12 ganhos apenas se ≥ 15 dias trabalhados no mês
- Faltas injustificadas reduzem avos proporcionalmente
- Primeira parcela (até 30/nov): 50% sem descontos
- Segunda parcela (até 20/dez): saldo com INSS, IRRF e Pensão

### 4.3 `buildProfissionalInput.ts`
Camada de mapeamento centralizada que transforma dados brutos do banco em input padronizado para o motor. **Toda mudança de schema deve atualizar esta camada**.

### 4.4 Suíte de testes
- `payrollCalculator.test.ts` — 90+ casos
- `decimoTerceiroCalculator.test.ts` — 30+ casos
- `systemValidation.test.ts` — validações de integridade

---

## 5. CADASTRO 360° DO PROFISSIONAL (10 abas)

Tabela `profissionais` (95+ colunas) suporta conformidade total com eSocial:

| Aba | Campos principais |
|-----|-------------------|
| **Pessoais** | nome, cpf, rg, data_nascimento, sexo, estado_civil, cor_etnia, escolaridade, nome_mae, nome_pai |
| **Contato** | endereco, bairro, cidade, estado, cep, telefone, celular |
| **Trabalhista** | matricula, cargo, cbo, departamento, setor, data_admissao, ctps, pis, sindicato, insalubridade |
| **Lojas** | loja_id (atuação), loja_registro_id (registro jurídico) |
| **Salário** | primeiro_salario, ultimo_salario, salario_nominal + histórico em `historico_salarios` |
| **Bancário** | banco, agencia, conta, tipo_conta, operacao, chave_pix |
| **Benefícios** | flags + valores (vale_alimentacao, vale_carne, cesta_basica, odonto, seguro_vida, bem_mais) |
| **Jornada** | escala_trabalho, horario_entrada/intervalo/saida, dia_folga, gestor |
| **Documentos** | CNH, foto_url, foto_ezpoint_url + uploads via `professional_documents` |
| **Demissão** | data_demissao, motivo_demissao, aviso_trabalhado, data_homologacao, local_homologacao |

**Regras**:
- CPF é âncora de identidade em conflitos.
- Status muda automaticamente para `demitido` ao preencher `data_demissao` (reversível).
- "Loja de Registro" ≠ "Loja de Atuação" — alocação dupla.

---

## 6. HOOKS CUSTOMIZADOS (`src/hooks/`)

| Hook | Função |
|------|--------|
| `useSupabaseData` | CRUD genérico com cache e tenant scoping |
| `useHoleriteData` | Agregação para PDF de holerite |
| `useTenantLimits` | Bloqueio quando excede limites de plano |
| `useTenantMetrics` | Cálculo de métricas de uso (storage, queries) |
| `useUsuariosTenant` | Gestão de usuários do tenant atual |
| `useOcorrencias` | Kanban com realtime |
| `useDataValidation` | Detecção de dados faltantes (CPF, admissão) |
| `useErrorLogger` | Captura global de erros runtime → `dev_logs` |
| `useActivityTracker` | Sessões e telas visitadas (super admin) |
| `useN8NAction` | Disparo de workflows via proxy |
| `use-mobile`, `use-toast` | Utilitários UI |

---

## 7. CONTEXTOS GLOBAIS (`src/contexts/`)

| Context | Estado |
|---------|--------|
| `AuthContext` | session, user, role, tenantId, signIn/signOut |
| `AppearanceContext` | tema (cores, logo) carregado de `configuracoes_sistema` |
| `OnboardingContext` | tour guiado, wizard de setup |
| `AuditLogContext` | helper para inserir em `historico_acoes` |

---

## 8. EDGE FUNCTIONS (Deno — `supabase/functions/`)

| Função | Verify JWT | Propósito |
|--------|-----------|-----------|
| `ezpoint-proxy` | true | Proxy seguro para API EzPoint v1.5 (sync ponto, fotos) |
| `n8n-proxy` | true | Disparo de webhooks N8N protegendo URLs |
| `invite-user` | true | Convite com role e validação de limite de tenant |
| `provision-tenant-admin` | true | Cria admin inicial ao criar tenant |
| `admin-update-user-email` | true | Super admin altera email |
| `update-user-password` | true | Reset de senha por admin |
| `update-tenant-data` | true | Atualizações sensíveis de tenant |
| `create-super-admin` | true | Bootstrap inicial |
| `migrate-excel-data` | true | ETL de planilhas legadas |

**Padrão**: integrações externas SEMPRE via edge function (nunca expor API keys no client).

---

## 9. TABELAS PRINCIPAIS (35+)

### 9.1 Núcleo
- `tenants` — empresas clientes (plano, limites, mensalidade)
- `profissionais` — colaboradores (95+ colunas, eSocial-ready)
- `lojas` — unidades operacionais
- `user_roles` — RBAC (separada de profiles!)

### 9.2 Folha
- `folha_pagamento` — competência mensal por profissional
- `holerites` — recibos gerados (PDF em storage)
- `fechamentos_folha` — snapshots auditáveis com versionamento
- `decimo_terceiro` — 13º com 2 parcelas
- `adiantamentos` — Dia 20 com elegibilidade

### 9.3 Benefícios e Descontos
- `beneficios` — VR, VT, Alelo, cesta, odonto, seguro (mensal)
- `pensoes_alimenticias` — % ou valor fixo, beneficiário, base de cálculo
- `emprestimos` — CTPS, CLT, Loja com saldo devedor
- `lancamentos_financeiros` — provisões e descontos manuais

### 9.4 Gestão de Pessoas
- `ferias` — períodos aquisitivos
- `afastamentos` — atestados, licenças
- `exames_aso` — saúde ocupacional com periodicidade
- `epis` — equipamentos com CA e validade
- `faltas` — justificadas/injustificadas
- `advertencias` — disciplinares

### 9.5 Workflow e Auditoria
- `pendencias` — tarefas com SLA, executor, alertas
- `alertas_sistema` — notificações automáticas (ASO, férias vencendo)
- `historico_acoes` — auditoria genérica
- `historico_salarios` — alterações salariais
- `historico_emprestimos` — mudanças em empréstimos
- `historico_importacoes` — log de imports
- `security_logs` — eventos de segurança
- `dev_logs` — erros runtime (super admin)

### 9.6 Documentos e Configuração
- `professional_documents` — anexos do profissional
- `loja_documents` — alvarás, contratos
- `professional_vales` — adiantamentos avulsos
- `configuracoes_sistema` — chave/valor por tenant (faixas INSS, % adiantamento, cores)
- `tenant_metrics` — uso mensal
- `pagamentos_tenant` — histórico financeiro do SaaS

---

## 10. JORNADAS DO USUÁRIO

### 10.1 Onboarding de novo tenant
```
Super Admin
  └─→ /gestao-usuarios → "Novo Tenant"
       └─→ provision-tenant-admin (edge fn)
             ├─ INSERT em tenants
             ├─ INSERT em user_roles (admin)
             └─ Envia email de convite

Admin recebe email
  └─→ /redefinir-senha → /setup
       └─→ InitialSetupWizard (4 passos):
             1. Dados da empresa
             2. Cadastrar primeira loja
             3. Configurar faixas INSS/IRRF
             4. Importar profissionais (Excel/EzPoint)
```

### 10.2 Ciclo mensal de folha
```
DIA 18-19 — Preparação Dia 20
  Admin → /fechamentos → seleciona competência
    ├─ ChecklistDados (verifica dados faltantes)
    ├─ Sistema calcula adiantamentos (40% salário)
    │   └─ AdiantamentoSalario (exclui inativos, < 30 dias, com pendências)
    └─ "Fechar Dia 20" → snapshot em fechamentos_folha

DIA 20 — Pagamento adiantamento
  Sistema marca pagos em adiantamentos.pago = true
  Holerites parciais disponíveis em /holerites

DIA 1-3 (mês seguinte) — Lançamentos
  Operador → /faltas → registra faltas do mês anterior
  Operador → /gestao-lancamentos → bônus, descontos, h.extras
  Sistema sincroniza ponto (ezpoint-proxy)

DIA 4 — Conferência
  Gerente → /fechamentos → valida totais
    ├─ FluxoGuiadoChecklist (alertas críticos)
    ├─ DescontoDetalhePopover (revisa por profissional)
    └─ EditarLancamentosDrawer (ajustes finais)

DIA 5 — Fechamento Dia 5
  Admin → /fechamentos → "Fechar Folha"
    ├─ FecharFolhaModal (gate consultivo)
    ├─ payrollCalculator.calcularDia5 (motor CLT)
    ├─ Gera holerites (PDF via HoleritePDF)
    └─ Snapshot final em fechamentos_folha (status='fechado')
```

### 10.3 Cadastro de profissional
```
HR → /cadastro-profissionais → "Novo"
  └─ 10 abas (Pessoais → Demissão)
     ├─ ProfissionalAvatar (upload foto)
     ├─ ProfissionalAutocomplete (busca CPF existente)
     ├─ DocumentUploader (CTPS, RG, comprovantes)
     └─ Validação CPF + duplicatas

Save → INSERT profissionais + INSERT historico_acoes
  └─ Trigger: alertas automáticos
     ├─ ASO inicial (agendar em 30 dias)
     ├─ Período aquisitivo de férias (12 meses)
     └─ Entrega de EPIs pendentes
```

### 10.4 Demissão e reversão
```
HR → /cadastro-profissionais → editar → aba Demissão
  ├─ data_demissao, motivo, aviso_trabalhado
  └─ Save → status='demitido' automaticamente

Reversão:
  HR → menu de ações → "Reverter Demissão"
  └─ Limpa data_demissao + motivo, status='ativo'
  └─ Registra em historico_acoes
```

### 10.5 Gestão de pendências
```
Sistema cria pendência automática (ex: ASO vencendo)
  └─ INSERT pendencias com sla_horas=48, executor_id

Executor → /pendencias → vê tarefas atribuídas
  ├─ Inicia → data_inicio_execucao
  ├─ Resolve → status='concluida', data_conclusao
  └─ Histórico em pendencias.historico (jsonb)

Alertas escalados:
  ├─ 24h antes do prazo → alerta_enviado=true
  └─ Vencido → alerta_critico_enviado=true + notifica admin
```

### 10.6 Conformidade e auditoria
```
Qualquer ação CRUD sensível
  └─ AuditLogContext.log() → INSERT historico_acoes
       (modulo, acao, entidade_tipo, entidade_id, dados_anteriores, dados_novos, usuario)

Super Admin → /audit-log → filtros por módulo/usuário/data
Super Admin → /painel-uso → dev_logs + métricas de erro
```

---

## 11. SEGURANÇA

### 11.1 Camadas
1. **JWT Supabase** com refresh automático
2. **RLS PostgreSQL** em 100% das tabelas
3. **Function `SECURITY DEFINER`** para checks de role (evita recursão)
4. **Edge Functions** para operações privilegiadas (service_role nunca no client)
5. **Storage buckets** (`professional-documents`, `loja-documents`) com RLS por tenant
6. **Rate limiting** implícito via Supabase
7. **DOM hardening** contra extensões (Google Translate)
8. **Error Boundary global** (`src/components/ErrorBoundary.tsx`)
9. **Limpeza de localStorage** no logout (PII)
10. **Senhas via Supabase Auth** (nunca armazenadas no app)

### 11.2 Funções DB críticas
```sql
get_user_tenant_id(uid uuid) RETURNS uuid          -- usado em RLS
has_role(uid uuid, role app_role) RETURNS bool     -- RBAC
is_super_admin(uid uuid) RETURNS bool              -- bypass tenant
can_access_sensitive_hr_data(uid uuid) RETURNS bool -- HR gate
```

---

## 12. INTEGRAÇÕES EXTERNAS

### 12.1 EzPoint (relógio de ponto)
- API v1.5 via `ezpoint-proxy`
- Credenciais por tenant em `configuracoes_sistema`
- Sync de fotos: `foto_ezpoint_url` → bucket próprio
- Sync de marcações: gera registros em ponto/faltas

### 12.2 N8N (automações)
- Proxy via `n8n-proxy` (URLs nunca expostas)
- Disparado por `useN8NAction` em eventos chave (admissão, demissão, fechamento)

### 12.3 Lovable AI Gateway (futuro)
- Modelos disponíveis: Gemini 2.5 Pro/Flash, GPT-5
- Casos de uso planejados: análise de holerites, sumarização de ocorrências

---

## 13. CONVENÇÕES DE CÓDIGO

### 13.1 Design System
- Tokens semânticos HSL em `src/index.css` e `tailwind.config.ts`
- **Nunca** usar `text-white`, `bg-black` em componentes — sempre `text-foreground`, `bg-background`
- Variants via `cva` em `src/components/ui/*`

### 13.2 Padrões React
- Componentes pequenos e focados (≤ 250 linhas)
- Hooks customizados para lógica reutilizável
- React Query (via `useSupabaseData`) para cache
- Formulários com `react-hook-form` + `zod`

### 13.3 Tipagem
- `src/integrations/supabase/types.ts` é **auto-gerado** — nunca editar
- Importar `Database['public']['Tables']['<tabela>']['Row']` para tipos seguros

---

## 14. PONTOS DE ATENÇÃO PARA ANÁLISE

Áreas onde Claude pode adicionar mais valor:

1. **Performance**: Revisar queries com `select('*')` em listas grandes; sugerir paginação ou seleção de colunas.
2. **Refatoração**: Páginas > 500 linhas (ex.: `Fechamentos.tsx`, `CadastroProfissionais.tsx`) podem ser quebradas.
3. **Cobertura de testes**: Apenas `payrollCalculator`, `decimoTerceiroCalculator`, `systemValidation` têm testes — expandir para hooks críticos.
4. **A11y**: Auditar contraste, foco visível, ARIA em modais.
5. **i18n**: Sistema atualmente PT-BR hardcoded; preparar para multi-idioma.
6. **Observabilidade**: Adicionar tracing distribuído entre client → edge → DB.
7. **Conformidade LGPD**: Revisar `piiStorage.ts`, política de retenção, direito ao esquecimento.

---

## 15. ÍNDICE DE ARQUIVOS-CHAVE

```
src/
├── App.tsx                              # Roteamento principal
├── main.tsx                             # Entry point
├── index.css                            # Design tokens HSL
├── contexts/
│   ├── AuthContext.tsx                  # Sessão + role + tenant
│   ├── AppearanceContext.tsx            # White-label
│   ├── OnboardingContext.tsx            # Tour guiado
│   └── AuditLogContext.tsx              # Helper de auditoria
├── hooks/
│   ├── useSupabaseData.ts               # CRUD genérico
│   ├── useHoleriteData.ts               # Agregação para PDF
│   ├── useTenantLimits.ts               # Bloqueio por plano
│   ├── useErrorLogger.ts                # Captura global
│   └── useActivityTracker.ts            # Sessões super admin
├── lib/
│   ├── payrollCalculator.ts             # 🧮 Motor folha
│   ├── decimoTerceiroCalculator.ts      # 🧮 Motor 13º
│   ├── buildProfissionalInput.ts        # Mapper centralizado
│   ├── competencia.ts                   # Helpers de mês
│   ├── relatoriosPDF.ts                 # Geração jsPDF
│   ├── piiStorage.ts                    # Limpeza LGPD
│   └── supabasePagination.ts            # Paginação > 1000
├── components/
│   ├── Layout.tsx                       # Shell autenticado
│   ├── AppSidebar.tsx                   # Menu lateral
│   ├── ProtectedRoute.tsx               # Gate de auth
│   ├── ErrorBoundary.tsx                # Recuperação global
│   ├── folha/                           # Componentes de folha (15)
│   ├── beneficios/                      # Tabs de benefícios (5)
│   ├── ocorrencias/                     # Kanban (2)
│   ├── alertas/                         # Alertas auto (2)
│   ├── onboarding/                      # Wizard + tour (4)
│   └── ui/                              # shadcn (50+)
└── integrations/supabase/
    ├── client.ts                        # ⚠️ NÃO EDITAR
    └── types.ts                         # ⚠️ AUTO-GERADO
```

---

## 16. COMANDOS ÚTEIS

```bash
# Testes
npm run test                    # Roda Vitest
npm run test:ui                 # Vitest UI

# Build
npm run build                   # Produção
npm run preview                 # Preview local

# Lint
npm run lint
```

---

**FIM DO DOCUMENTO MESTRE**

*Este arquivo deve ser atualizado a cada milestone significativo (nova rota, refatoração de motor de cálculo, nova edge function, mudança de RBAC).*
