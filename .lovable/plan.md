# Plano de Execução — Frente 1: Infraestrutura Modular

## Objetivo
Criar a fundação de banco de dados que permite o EAZ:
1. **Receber módulos** de parceiros (Lanup BID, Admissão, Convocação, Pagamento)
2. **Ser embarcado** como módulo em outros sistemas (Lanup, etc.)

Sem essa fundação, nenhuma das frentes seguintes (SSO, Iframe, Webhooks, Marketplace) funciona.

---

## O que será criado

### 5 novas tabelas

**1. `partners`** — Cadastro de parceiros (Lanup, EzPoint, etc.)
- `id`, `nome`, `slug`, `tipo` (provider/consumer/both)
- `webhook_secret` (HMAC para validar webhooks recebidos)
- `api_base_url`, `sso_public_key`, `logo_url`
- `ativo`, `created_at`

**2. `partner_modules`** — Catálogo de módulos disponíveis
- `id`, `partner_id`, `nome`, `slug` (ex: `bid`, `admissao`, `convocacao`)
- `descricao`, `categoria`, `icone`
- `embed_url_template` (URL base do iframe)
- `eventos_emitidos` (jsonb — ex: `["admission.completed"]`)
- `scopes_requeridos` (jsonb)
- `status` (disponivel/beta/em_desenvolvimento)

**3. `tenant_modules`** — Módulos ativados por cada tenant
- `id`, `tenant_id`, `partner_module_id`
- `ativado_em`, `ativado_por`
- `configuracao` (jsonb — credenciais/parâmetros específicos)
- `ativo`

**4. `partner_entity_map`** — Mapeamento de IDs entre EAZ e parceiros (ancorado em CPF)
- `id`, `tenant_id`, `partner_id`
- `entidade_tipo` (profissional/loja)
- `entidade_id_local` (UUID interno EAZ)
- `entidade_id_externo` (ID do parceiro)
- `cpf_anchor` (chave de reconciliação)

**5. `partner_webhook_logs`** — Auditoria de eventos
- `id`, `tenant_id`, `partner_id`
- `direcao` (inbound/outbound)
- `evento`, `payload` (jsonb)
- `status` (sucesso/falhou/retry)
- `tentativas`, `proxima_tentativa`
- `response_code`, `response_body`

### RLS Multi-tenant
Todas as tabelas terão policy padrão:
```sql
USING ((tenant_id = get_user_tenant_id(auth.uid())) OR is_super_admin(auth.uid()))
```

Exceção: `partners` e `partner_modules` são **globais** (catálogo compartilhado) — apenas super_admin pode escrever, todos autenticados podem ler.

### Seed inicial
Cadastrar Lanup e EzPoint na tabela `partners` + 5 módulos no catálogo:
- BID (Lanup) — em desenvolvimento
- Admissão (Lanup) — em desenvolvimento
- Convocação (Lanup) — disponível
- Ponto (EzPoint) — disponível
- Gestão de Pagamento (EAZ-nativo) — em breve

---

## Detalhes técnicos

- Usar `gen_random_uuid()` como PK
- Indexar `tenant_id`, `partner_id`, `cpf_anchor`
- Constraint UNIQUE em `(tenant_id, partner_module_id)` em `tenant_modules`
- Trigger `update_updated_at_column` em todas
- Sem foreign keys diretas para `auth.users` (padrão do projeto)

## O que NÃO entra nesta Frente
- UI do Marketplace (Frente 2)
- Edge functions de SSO/Webhook (Frente 2/3)
- Refatoração do AppSidebar (Frente 2)
- API pública (Frente 3)

## Próximos passos após aprovação
1. Executar migration com as 5 tabelas + RLS + índices
2. Inserir seed (Lanup, EzPoint, 5 módulos)
3. Atualizar memória do projeto registrando a nova arquitetura
4. Reportar conclusão e propor Frente 2

**Tempo estimado:** ~30 min de execução real.
