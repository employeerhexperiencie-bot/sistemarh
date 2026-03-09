

# Plano: Atualização do Banco de Dados - Cliente Tennessee Prime

## Resumo dos Dados Recebidos

**Folha de Pagamento (FOPAG Fev/2026)** - 14 lojas com dados completos de salários, cargos, descontos, empréstimos e faltas para ~300 profissionais.

**Posição de Férias** - 13 PDFs com períodos aquisitivos, saldo de dias, situação (vencido/a vencer/perdido) para ~250 funcionários.

## Mapeamento Empresa → Loja no Sistema

| Empresa (PDF) | Loja no Sistema |
|---|---|
| 0450 Central de Carnes Tennessee | BROOKLIN |
| 0020 Mercantil Big Osasco | BIG OSASCO |
| 0022 Mercantil Max Carnes (0001-82) | REI DO GADO |
| 0041 Bosque da Saúde Center | BOSQUE DA SAUDE |
| 0069 Mercantil Max (0002-63) | RAGUEB |
| 0080 Tennessee Itapecerica | ITAPECERICA DA SERRA |
| 0242 Super Lapa Carnes | SUPER LAPA |
| 0450 Central Carnes Tennessee | BROOKLIN |
| 0703 Tennessee São Bernardo | SAO BERNARDO CAMPO |
| 0785 Mercantil Max (0003-44) | LAJEADO |
| 0920 Tennessee Comercial | COMERCIAL |
| 1092 Mercantil Max (0004-25) | MATEO BEI |
| 2160 Tennessee Osasco | MUTINGA |
| 2168 Tennessee Taboão II | BARCELONA |
| 3913 Tennessee Taboão I | TABOAO I |

## Estado Atual do Banco

- **14 lojas** cadastradas
- **302 profissionais** distribuídos nas lojas
- **278 registros de férias** existentes

## O Que Será Atualizado

### 1. Profissionais - Atualizar salários e cargos (FOPAG)
- Atualizar `salario_nominal` e `cargo` de cada profissional com dados da folha de Fev/2026
- Identificar e cadastrar profissionais novos que aparecem na folha mas não existem no sistema
- Registrar faltas injustificadas do mês na tabela `faltas`

### 2. Férias - Inserir posição atualizada
- Limpar registros antigos de férias e inserir a posição atualizada de cada profissional
- Campos: período aquisitivo (início/fim), dias de direito, dias quitados, faltas, saldo, status (vencido/a vencer/pendente)
- Vincular cada registro ao profissional correto via nome

### 3. Empréstimos e Pensões (FOPAG)
- Identificar descontos de empréstimo e pensão na folha para validar dados existentes

## Implementação Técnica

Será criada uma **edge function** dedicada (`update-tenant-data`) que:

1. Recebe os dados estruturados (profissionais com salários atualizados, férias parseadas)
2. Faz match por nome do profissional (normalizado) com os registros existentes no banco
3. Executa upserts em batch para profissionais e inserts para férias
4. Retorna relatório de registros atualizados/criados/erros

A lógica será executada com `service_role` para bypass de RLS, mas validando que o usuário autenticado é admin do tenant.

