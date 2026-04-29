# Alinhar alertas à regra de origem de faltas

## Contexto

A regra recém-confirmada diz que faltas só entram no sistema por **lançamento manual**, **planilha de importação** ou **planilha enviada à Lovable**. Enquanto a API de ponto não está conectada, **ausência de registro = presença completa**, não pendência.

Após varredura nos componentes de alerta:

- `AlertasAutomaticos.tsx` (página `/alertas`) cobre apenas `aso | ferias | documento | epi | afastamento | emprestimo`. **Não infere nem alerta sobre faltas** → já está correto, nenhuma mudança necessária.
- `DadosFaltantesAlert.tsx` (card no dashboard) tem um item "Faltas do mês" com texto ambíguo que pode passar a impressão de que ausência de registros é uma pendência.

Apenas um arquivo precisa de ajuste.

## O que vai mudar

### `src/components/DadosFaltantesAlert.tsx`

**Card "Faltas do mês" (linhas ~149-161)** — reescrever o texto e a sinalização para deixar claro que o sistema é tolerante:

- Quando `total === 0` (nenhum registro):
  - Título: continua "Faltas do mês"
  - Descrição: trocar `"Nenhuma falta registrada no sistema"` por `"Nenhuma falta lançada — presume-se presença completa. Lance manualmente, importe planilha ou solicite atualização."`
  - `info: true`, `critico: false` → mantém como informativo, sem urgência
  - `quantidade: 0` → não exibir badge de pendência
- Quando há registros:
  - Descrição atual mantida (`"X faltas registradas este mês"`)
- Ação do botão: trocar `"Ver Faltas"` por `"Lançar / Importar Faltas"` para reforçar os caminhos válidos
- Rota: continua `/faltas` (a tela já oferece lançamento manual e link para importação)

Nenhuma mudança em lógica de cálculo, contagem ou consulta SQL — apenas textos e flags visuais do card.

## Detalhes técnicos

- Arquivo único: `src/components/DadosFaltantesAlert.tsx`
- Mudanças isoladas no objeto `tipo: 'faltas'` dentro do array de alertas (linhas ~149-161)
- Sem migração, sem mudança de schema, sem impacto em outras telas
- `AlertasAutomaticos.tsx`, `useDataValidation.ts`, `Alertas.tsx` e os cálculos de absenteísmo do dashboard já respeitam a regra (usam apenas registros reais da tabela `faltas`) — não tocar

## Fora do escopo

- Não alterar lógica de cálculo de absenteísmo (já correta — usa só registros reais)
- Não criar novos tipos de alerta automático
- Não tocar em `AlertasAutomaticos.tsx` (já está em conformidade)
