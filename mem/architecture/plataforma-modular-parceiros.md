---
name: Plataforma modular de parceiros
description: Infraestrutura para EAZ funcionar como host de módulos (Lanup BID/Admissão/Convocação, EzPoint Ponto) e como módulo embarcável em terceiros
type: feature
---
EAZ tem 5 tabelas de infraestrutura modular:
- `partners`: catálogo global (Lanup, EzPoint, EAZ). Apenas super_admin escreve, autenticados leem.
- `partner_modules`: catálogo global de módulos com slug, embed_url_template, eventos_emitidos/consumidos, scopes_requeridos, status (disponivel/beta/em_desenvolvimento/descontinuado).
- `tenant_modules`: ativação por tenant com configuracao jsonb. UNIQUE(tenant_id, partner_module_id). RLS multi-tenant.
- `partner_entity_map`: reconciliação UUID interno ↔ ID externo do parceiro, ancorado por CPF. Suporta entidade_tipo profissional/loja/tenant.
- `partner_webhook_logs`: auditoria inbound/outbound com retry, response_code, status (pendente/sucesso/falhou/retry).

Módulos cadastrados no seed: BID (Lanup, em dev), Admissão (Lanup, em dev), Convocação (Lanup, disponivel), Ponto (EzPoint, disponivel), Gestão de Pagamento (EAZ, beta).

Próximas frentes: SSO outbound, edge function partner-webhooks com HMAC, componente PartnerModuleFrame, refator AppSidebar dinâmico, página /marketplace.
