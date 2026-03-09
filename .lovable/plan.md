# Analise: Dados Enviados vs. Dados no Sistema

## 1. FOPAG Fev/2026 — Comparação com o Banco de Dados

### Salários e Cargos: Maioria Corretos

Comparei profissional por profissional em cada loja. Os salários e cargos no banco **coincidem** com a FOPAG para a grande maioria dos profissionais. Exemplos verificados:


| Loja       | Profissional             | FOPAG                             | Banco                             | Status |
| ---------- | ------------------------ | --------------------------------- | --------------------------------- | ------ |
| BARCELONA  | EDNALDO PIRES BENTENCURT | R$ 3.800 / AÇOUGUEIRO ENCARREGADO | R$ 3.800 / AÇOUGUEIRO ENCARREGADO | OK     |
| BARCELONA  | LAYLSON GONCALVES SILVA  | R$ 2.650 / BALCONISTA             | R$ 2.650 / BALCONISTA             | OK     |
| BIG OSASCO | LAUDO PEREIRA SANTOS     | R$ 5.000 / GERENTE                | R$ 5.000 / GERENTE                | OK     |
| BROOKLIN   | VALDINEI DE JESUS SANTOS | R$ 5.410 / GERENTE                | R$ 5.410 / GERENTE                | OK     |
| BROOKLIN   | ERIK GONCALVES ZOLIM     | R$ 4.726 / ENCARREGADO            | R$ 4.726 / ENCARREGADO            | OK     |


### Profissionais na FOPAG que NÃO estão no Banco (Novos)

Identifiquei profissionais que aparecem na FOPAG mas **não existem** no sistema — são admissões recentes (Jan-Fev 2026):


| Loja         | Profissional                          | Salário     | Admissão   |
| ------------ | ------------------------------------- | ----------- | ---------- |
| BARCELONA    | ANGEL FELIX MARQUES BORROME           | R$ 2.800    | 01/08/2025 |
| BARCELONA    | DAYAMY PEREZ HERNANDES                | R$ 2.080    | 11/02/2026 |
| BARCELONA    | DEBORA REGINA DE OLIVEIRA SUZART      | R$ 2.080    | 01/08/2025 |
| BARCELONA    | ELDA ALVES SILVA                      | R$ 2.080    | 01/08/2025 |
| BARCELONA    | ITAMARA SANTOS CARVALHO               | R$ 2.080    | 21/01/2026 |
| BARCELONA    | JESUS ALEXANDER MARQUEZ BORROME       | R$ 2.700    | 05/02/2026 |
| BARCELONA    | JOANA CLECIA DE JESUS SOUZA           | R$ 2.300    | 01/08/2025 |
| BARCELONA    | JOSE FERNANDO DE SOUZA FARIAS         | R$ 5.000    | 01/08/2025 |
| BARCELONA    | LEIDIANE SILVA SANTOS                 | R$ 2.400    | 06/02/2026 |
| BARCELONA    | LUIS GERALDO GARCIA GUILLENT          | R$ 2.800    | 01/08/2025 |
| BARCELONA    | LUIS LEODAN GARCIA TABATA             | R$ 2.200    | 01/08/2025 |
| BARCELONA    | MARIANA MARCELA FACUNDES DE SOUZA     | R$ 2.080    | 05/02/2026 |
| BARCELONA    | RODRIGO SANTANA SANTOS                | R$ 2.700    | 05/02/2026 |
| BARCELONA    | RONIVON TEIXEIRA SANTOS               | R$ 2.800    | 01/08/2025 |
| BARCELONA    | TATIANA COSTA OLIVEIRA VIANA          | R$ 2.800    | 15/11/2025 |
| BIG OSASCO   | ANTONIO NETO PEREIRA DA SILVA         | R$ 3.200    | 10/04/2024 |
| BIG OSASCO   | MARCELO DOS SANTOS BORGES             | R$ 2.300    | 25/02/2026 |
| BIG OSASCO   | VAGNER RAMOS FERREIRA                 | R$ 3.000    | 28/01/2026 |
| BROOKLIN     | LUIS VINICIUS SANTOS SILVA            | R$ 2.180    | 20/02/2026 |
| COMERCIAL    | HELLOISA DO NASCIMENTO AMARAL TANDLER | R$ 1.731,99 | 02/02/2026 |
| ITAPECERICA  | DANILO PEREIRA BARBOSA                | R$ 3.000    | 19/02/2026 |
| LAJEADO      | CARLOS AUGUSTO MENDES JUNIOR          | R$ 2.200    | 19/02/2026 |
| LAJEADO      | JEFFERSON DA SILVA COSTA              | R$ 2.200    | 02/02/2026 |
| LAJEADO      | KAWANNY CRISTINA DOS SANTOS OLIMPIO   | R$ 2.080    | 09/02/2026 |
| LAJEADO      | PAULA ANDREA BOSCO                    | R$ 2.100    | 19/02/2026 |
| LAJEADO      | ROSILENE SOARES DO NASCIMENTO         | R$ 2.080    | 24/02/2026 |
| LAJEADO      | RYCHARD GABRIEL BARRETO SILVA         | R$ 2.080    | 06/02/2026 |
| SUPER LAPA   | ARLETE PEREIRA DE ARAUJO              | R$ 2.080    | 04/02/2026 |
| SUPER LAPA   | DIONE MEDEIROS LIMA                   | R$ 3.100    | 12/11/2025 |
| SUPER LAPA   | EVERSON JOSÉ DE LIMA                  | R$ 3.200    | 06/02/2026 |
| SUPER LAPA   | JOILSON JORGE TAVARES                 | R$ 2.800    | 12/02/2026 |
| MUTINGA      | LUZINETE DOS SANTOS                   | R$ 2.500    | 04/02/2026 |
| MUTINGA      | MARCOS VENTURA BARBOSA                | R$ 2.400    | 12/02/2026 |
| MUTINGA      | RITA DE FATIMA DIAS DA SILVA          | R$ 2.600    | 26/02/2026 |
| REI DO GADO  | JOSE SERRANEGRA FILHO                 | R$ 2.900    | 29/01/2026 |
| BOSQUE       | CAUA SILVA DE LIMA                    | R$ 2.500    | 20/01/2026 |
| BOSQUE       | RODRIGO ALMEIDA DA CRUZ               | R$ 3.300    | 29/01/2026 |
| SÃO BERNARDO | ADILSON LINS DE AGUIAR                | R$ 3.100    | 18/11/2025 |
| SÃO BERNARDO | GABRIELLY ZAGOTO MOREIRA              | R$ 2.000    | 10/11/2025 |
| SÃO BERNARDO | MOHAMMED DEBBAB                       | R$ 2.200    | 11/12/2025 |


### Profissionais no Banco mas NÃO na FOPAG (Possíveis Desligamentos)

Também existem profissionais no banco que **não aparecem** na FOPAG, indicando possíveis desligamentos ou transferências.

## 2. Férias — Dados dos PDFs vs. Banco

Os 278 registros de férias no banco estão **todos com status "pendente"**, sem detalhes reais dos PDFs. Os PDFs contêm informações ricas:

- **Status variados**: Vencido, À Vencer, Perdido (por afastamento)
- **Períodos aquisitivos** com datas exatas de início/fim
- **Dias de direito** variando (30, 25, 20, 17.5, etc. conforme faltas)
- **Faltas** e **dias perdidos** por profissional
- **Múltiplos períodos** por profissional (ex: EDIVAN FERREIRA com 6 períodos, 4 perdidos por afastamento)

Os dados de férias no banco **NÃO correspondem** aos PDFs reais.

## 3. Folha de Pagamento e Holerites

Existem 284 registros de `folha_pagamento` e `holerites` para competência 2026-02, **mas foram gerados por fórmula CLT padrão**, não com os dados exatos da FOPAG (faltas específicas, vales carne, empréstimos individuais, complementos).

## 4. Dados que Faltam Sincronizar


| Dado                              | Fonte | Status no Banco               |
| --------------------------------- | ----- | ----------------------------- |
| ~40 profissionais novos           | FOPAG | Não cadastrados               |
| Faltas injustificadas Fev/26      | FOPAG | Não registradas               |
| Vales carne individuais           | FOPAG | Não registrados               |
| Empréstimos específicos           | FOPAG | Parcialmente                  |
| Pensões alimentícias              | FOPAG | Parcialmente                  |
| Férias reais (13 lojas)           | PDFs  | Dados genéricos, não reais    |
| Folha/holerites com valores reais | FOPAG | Valores calculados, não reais |


## Plano de Correção

### Etapa 1: Cadastrar profissionais novos

- Inserir ~40 profissionais que estão na FOPAG mas não no banco
- Associar à loja correta usando o mapeamento de empresas

### Etapa 2: Registrar descontos e faltas reais da FOPAG

- Inserir faltas injustificadas na tabela `faltas`
- Inserir/atualizar vales carne na tabela `professional_vales`
- Validar empréstimos e pensões existentes

### Etapa 3: Substituir férias por dados reais dos PDFs

- Limpar os 278 registros genéricos
- Inserir dados reais com status correto (vencido/à vencer/perdido), períodos aquisitivos exatos e saldos

### Etapa 4: Recalcular folha e holerites com dados reais

- Usar os dados exatos da FOPAG (faltas, vales, empréstimos, complementos)
- Regenerar holerites com valores que batem com a planilha do cliente

### Implementação técnica

- Criar/atualizar a edge function `update-tenant-data` para processar todos os dados em batch
- Usar SQL direto via ferramenta de insert para dados que precisam de tenant_id fixo (bypass RLS)  
  
  
Quero atualize o historico de cada profissional com as informações pertinentes a cda um