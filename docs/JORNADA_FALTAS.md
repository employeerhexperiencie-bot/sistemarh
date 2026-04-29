# Jornada da Falta no Sistema

> Documento vivo. Última auditoria: 29/04/2026.
> **Regra-mestre**: faltas só entram no sistema por **lançamento manual**, **importação de planilha** ou **atualização administrativa via planilha enviada à Lovable**. Enquanto a API de ponto não está conectada como fonte de verdade, **ausência de registro = presença completa**, nunca pendência inferida.

---

## 1. Pontos de ENTRADA (escrita em `public.faltas`)

Apenas 3 caminhos gravam na tabela. Qualquer outro fluxo que tente gravar é violação da regra.

| # | Caminho | Arquivo | Operação | Quem usa |
|---|---------|---------|----------|----------|
| 1 | **Lançamento manual** na tela `/faltas` | `src/pages/Faltas.tsx` (botão "Nova Falta") → grava via `supabase.from('faltas').insert(...)` indireto pelo formulário | INSERT/DELETE | RH operacional |
| 2 | **Lançamento dentro do fechamento** (drawer/modal de edição rápida) | `src/components/folha/EditarLancamentosDrawer.tsx` (linhas 121, 145) e `EditarLancamentosModal.tsx` (linhas 123, 147) | INSERT/DELETE | Quem está fechando a folha |
| 3 | **Importação de planilha Excel** | `src/components/faltas/ImportarFaltasModal.tsx` (linha 321) — abre dentro de `/faltas`, faz preview, deduplica por `profissional_id + data_falta`, e dá `INSERT` em batch | INSERT em lote | RH ou equipe Lovable |

**Atualização administrativa** (caso 3 do contrato): a equipe Lovable usa o mesmo modal de importação logada no tenant do cliente — não existe rota privilegiada separada. Isso é proposital: tudo passa pelo mesmo funil, deixando rastro em `historico_acoes`.

### O que NÃO grava em `faltas`

- ❌ `src/pages/GestaoPonto.tsx` — consome API Ezpoint (`ezpoint-proxy`) e apenas **exibe** o campo `falta` do espelho de ponto como Badge (linhas 292, 334-335). **Nenhum INSERT.** Comportamento correto enquanto a integração não é fonte oficial.
- ❌ Edge functions (`migrate-excel-data`, `partner-sync-profissionais`, etc.) — verificadas; nenhuma escreve em `faltas`.
- ❌ Triggers de banco — não existem triggers que criem faltas a partir de outras tabelas.

---

## 2. Pontos de LEITURA / consumo

| Arquivo | Para quê | Chave de leitura |
|---------|----------|-----------------|
| `src/lib/buildProfissionalInput.ts` (l. 27) | Monta input do profissional para o motor de cálculo de folha — separa em `injustificadas` vs `justificadas/atestado` | `profissional_id, tipo, data_falta` no intervalo da competência |
| `src/hooks/useHoleriteData.ts` (l. 84, 186) | Calcula descontos do holerite individual por mês | `profissional_id` + intervalo |
| `src/pages/DashboardAnalitico.tsx` (l. 88) | KPI de faltas (total, justificadas, injustificadas) e gráfico mensal | tudo do tenant |
| `src/pages/Dashboard.tsx` | Card de absenteísmo (fórmula em `mem://business-rules/absenteeism-calculation-formula`) | totais agregados |
| `src/pages/HistoricoProfissional.tsx` (l. 120) | Timeline individual, últimas 30 faltas | por `profissional_id` |
| `src/pages/Faltas.tsx` (l. 60) | Listagem operacional + filtros | tenant inteiro |
| `src/components/DadosFaltantesAlert.tsx` (l. 68) | Card "Faltas do mês" no dashboard de dados faltantes | contagem total + mês atual |
| `src/components/folha/EditarLancamentosDrawer/Modal.tsx` | Mostra faltas do profissional dentro do fechamento | por `profissional_id` + competência |
| `src/pages/MigrarDados.tsx` (l. 58, 154) | Contagem para painel de migração | `count: exact` |

Todas as leituras filtram por `tenant_id` via RLS (`get_user_tenant_id(auth.uid())`).

---

## 3. Impactos no CÁLCULO DE FOLHA

Definidos em `src/lib/payrollCalculator.ts`:

| Impacto | Regra | Linha |
|---------|-------|-------|
| **Bloqueio do Dia 20 (adiantamento)** | `faltas injustificadas >= 10` no mês → adiantamento **bloqueado** com motivo `"+10 faltas"` | l. 305-308 |
| **Perda da Cesta Básica** | Qualquer falta **injustificada** (não atestado) zera o benefício de cesta | l. 360-361 |
| **Desconto direto** | `faltas × valor_dia` deduzido do bruto | l. 381-383 |
| **DSR** | `(faltas / dias_uteis) × domingos_no_mes × valor_dia` | l. 388 |
| **Dias abatidos para pro-rata** | `faltas + atestados + diasFerias` reduzem dias trabalhados | l. 236, 239 |

**Atestados (justificadas)** entram só nos dias abatidos para pro-rata; não bloqueiam Dia 20, não tiram cesta, não geram desconto direto nem DSR.

---

## 4. Como o sistema "fala" sobre faltas (UX)

| Tela | Quando há registros | Quando não há (zero) |
|------|---------------------|----------------------|
| Dashboard → card "Faltas do mês" | "X faltas registradas este mês" | **"Nenhuma falta lançada — presume-se presença completa. Lance manualmente, importe planilha ou solicite atualização."** (informativo, sem badge crítico) ✅ |
| `/alertas` (`AlertasAutomaticos`) | — | **Não gera alerta de "falta faltando"**. Tipos cobertos: ASO, férias, documento, EPI, afastamento, empréstimo. ✅ |
| `/faltas` lista vazia | — | "Nenhuma falta registrada ainda" |
| `/dashboard-analitico` | KPI exibido | KPI = 0 |
| Holerite/folha | Descontos aplicados | Sem desconto, presença total |

---

## 5. Checklist de conformidade (para futuras alterações)

Ao tocar em qualquer código de faltas, validar:

- [ ] Não criar novo `INSERT` em `faltas` fora dos 3 caminhos oficiais
- [ ] Não criar trigger/função no banco que insira faltas a partir de outra tabela
- [ ] Não criar alerta automático que sinalize "falta esquecida" ou similar
- [ ] Mensagens de UI quando `total = 0` devem dizer "presença completa", nunca "pendência" / "atenção"
- [ ] Edge functions não devem gravar em `faltas` (apenas migrações já existentes)
- [ ] Quando a API de ponto for elevada a fonte oficial: criar fluxo de **importação assistida** (preview + confirmação humana), nunca escrita silenciosa

---

## 6. Roadmap (quando ativarmos a API de ponto como fonte)

1. Botão "Importar do Ezpoint" dentro de `/faltas` → reusa o mesmo modal de preview do `ImportarFaltasModal`
2. Mantém os 3 caminhos manuais como fallback permanente
3. Atualizar este documento + memória `mem://business-rules/faltas-fonte-dados`
