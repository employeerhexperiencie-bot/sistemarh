## Objetivo

Quando o usuário clicar em um alerta ligado a um profissional (ex.: "sem CPF", "sem data de admissão", "sem salário", "sem cargo", "sem loja"), o sistema deve:

1. Abrir a página `Cadastro de Profissionais` já filtrada/posicionada no profissional certo;
2. Abrir automaticamente o **modal de edição** (não a "Pasta do Profissional"), que é onde os campos podem ser preenchidos;
3. Selecionar a **aba correta** dentro do modal (Dados, Salário, Documentação, etc.);
4. **Rolar até o campo** específico e destacá-lo visualmente (borda + foco) por alguns segundos.

Hoje o link de "Dados incompletos" leva apenas para `/cadastro-profissionais` sem filtrar nem abrir nada — o usuário precisa procurar o profissional na lista e clicar em Editar manualmente. Vamos eliminar esse atrito.

## Como será o novo fluxo (exemplo CPF)

```text
[Alerta]  "João Silva — sem CPF"
   │ click
   ▼
/cadastro-profissionais?matricula=12345&edit=1&campo=cpf
   │
   ▼
- Lista filtra/encontra "João Silva"
- Modal "Editar Profissional" abre automaticamente
- Aba "Dados Pessoais" ativa
- Campo CPF recebe foco, scroll até ele e fica com
  ring amarelo pulsante por ~3s
- Tooltip discreto: "Preencha o CPF aqui"
```

## Mudanças por arquivo

### 1. `src/pages/CadastroProfissionais.tsx`
- Ler novos query params: `edit` (1 = abrir modal de edição) e `campo` (nome do campo a destacar).
- Adicionar mapa `campo → aba` (ex.: `cpf → dados`, `data_admissao → dados`, `salario_nominal → salario`, `cargo → dados`, `loja_id → dados`, `pis → documentos`, `ctps → documentos`).
- Quando `matricula` + `edit=1` chegam: localizar o profissional, chamar `handleEdit(professional)` automaticamente (em vez de só abrir a Pasta).
- Após o modal abrir, mudar para a aba correspondente ao `campo` e:
  - dar `scrollIntoView({ block: 'center' })` no input;
  - chamar `.focus()`;
  - aplicar classe temporária (`ring-2 ring-warning animate-pulse`) por 3s via `setTimeout`.
- Adicionar `id`/`ref` nos campos relevantes (`cpf`, `data_admissao`, `salario_nominal`, `cargo`, `loja_id`, etc.). Usar IDs estáveis tipo `field-cpf`.

### 2. `src/components/DadosFaltantesAlert.tsx`
Hoje o card "Dados incompletos" só linka para `/cadastro-profissionais`. Vamos transformá-lo em uma **lista expansível** dos profissionais afetados, cada linha com um botão "Resolver" que leva direto ao campo:

- Para cada categoria com pendência (`semCpf`, `semDataAdmissao`, `semSalario`, `semCargo`, `semLoja`), buscar a lista de profissionais correspondentes (já temos no `profissionais` resultado).
- Renderizar até N (ex.: 10) profissionais por categoria, cada um com link:
  `/cadastro-profissionais?matricula=${matricula}&edit=1&campo=${campo}`.
- Manter o resumo agregado como hoje, mas adicionar o "ver lista" ao expandir.

### 3. `src/components/alertas/AlertasAutomaticos.tsx`
- Para alertas tipo `cadastro_incompleto` vindos de `alertas_sistema`, garantir que o `acao_url` seja construído com `?matricula=...&edit=1&campo=...`. Hoje o `acao_url` vem do banco, então:
  - Se já vier preenchido, respeitar.
  - Senão, construir a URL no front quando `a.entidade_relacionada_tipo === 'profissional'` e a mensagem indicar o campo (mapear título → campo via dicionário simples).
- Para os alertas gerados dinamicamente que estão ligados a um profissional (ex.: "Afastamento sem Registro"), continuar levando para `/gestao-afastamentos`, mas **adicionar `?profissional=ID`** para que essas páginas (em iteração futura) possam pré-selecionar.
- Garantir que clique no item da lista (não só o ícone do olho) navegue, mantendo o comportamento atual do `compact`.

## Detalhes técnicos

- O destaque visual usa Tailwind: aplicar `data-highlight="true"` no input e usar uma classe utilitária no globals (ou inline) `ring-2 ring-warning ring-offset-2 animate-pulse`.
- Para o foco funcionar, o modal precisa estar montado antes do `setTimeout` (~300ms após abrir).
- A troca de aba do modal de edição usa o `Tabs` interno (já existe `value`/`onValueChange`); precisamos expor um setter para o param `campo`.
- Não alterar regras de negócio nem o schema do banco.
- Não tocar em outras páginas de gestão (ASO, Férias etc.) nesta iteração — apenas o fluxo profissional+campo.

## Fora de escopo (proposta para próxima iteração)

- Replicar o mesmo padrão para alertas de ASO/Férias abrindo o modal correspondente já posicionado no profissional.
- Botão "Resolver agora" inline no próprio alerta (preencher o campo sem sair da Central de Alertas).
