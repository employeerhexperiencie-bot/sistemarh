
# Plano de Finalização do Sistema RH

## Resumo Executivo

O sistema está **85% funcional** com todos os módulos operacionais implementados. As pendências principais são:
1. **Sistema de autenticação real** com Supabase Auth
2. **Gestão de usuários/convites** pelo admin
3. **Completar dados incompletos** de profissionais

---

## Fase 1: Autenticação e Gestão de Usuários

### 1.1 Criar Tabelas de Controle de Acesso
Executar migração para criar:
- `user_roles` - Papéis (admin, gerente, operador)
- `user_invites` - Convites por email
- `user_permissions` - Permissões granulares por módulo

### 1.2 Implementar Supabase Auth
- Configurar auto-confirm de email
- Criar função de verificação do primeiro usuário (vira admin automaticamente)
- Implementar login real substituindo o mock atual

### 1.3 Criar Página de Gestão de Usuários
Nova rota `/configuracoes/usuarios` com:
- Lista de usuários ativos com seus papéis
- Botão "Convidar Usuário" que envia email
- Formulário de convite (email + papel + permissões)
- Ações: editar papel, revogar acesso, reenviar convite

### 1.4 Implementar Controle de Permissões
- Cada papel define quais módulos pode ver/editar
- Admin: acesso total
- Gerente: visualiza todas as lojas, edita sua loja
- Operador: apenas visualização limitada

---

## Fase 2: Refinamentos de Dados

### 2.1 Tela de Correção de Dados
- Listar profissionais com CPF faltando (13)
- Listar profissionais sem data admissão (2)
- Permitir edição rápida em lote

### 2.2 Importação de ASO
- 120 profissionais sem exame registrado
- Verificar planilha original BASE_ASO.xlsx
- Re-importar dados faltantes

### 2.3 Cadastro de EPIs
- Tabela existe mas está vazia
- Definir se é necessário para operação

---

## Fase 3: Ajustes Finais

### 3.1 Página de Configurações
- Atualizar para mostrar lojas reais do banco (não mock)
- Adicionar seção de "Usuários do Sistema"

### 3.2 Limpeza de Código
- Remover rotas obsoletas (MigrarDados, AnalisarAtivos, etc.)
- Remover imports não utilizados
- Atualizar copyright para 2025/2026

---

## Detalhes Técnicos

### Estrutura do Banco de Dados - Novas Tabelas

```text
+-------------------+     +------------------+     +----------------------+
|   user_roles      |     |   user_invites   |     |   user_permissions   |
+-------------------+     +------------------+     +----------------------+
| id (PK)           |     | id (PK)          |     | id (PK)              |
| user_id (FK auth) |     | email            |     | user_id (FK auth)    |
| role (enum)       |     | role             |     | modulo               |
| loja_id (opcional)|     | invited_by       |     | pode_visualizar      |
| created_at        |     | expires_at       |     | pode_editar          |
+-------------------+     | accepted_at      |     | pode_deletar         |
                          +------------------+     +----------------------+
```

### Fluxo de Primeiro Acesso

```text
1. Primeiro usuário acessa /login
2. Sistema detecta banco vazio de user_roles
3. Redireciona para /setup (criar admin)
4. Admin define email/senha
5. Admin é criado com role = 'admin'
6. Pode então convidar outros usuários
```

### Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx.sql` | Criar | Tabelas de autenticação |
| `src/pages/GestaoUsuarios.tsx` | Criar | Tela de convites/usuários |
| `src/pages/SetupInicial.tsx` | Criar | Wizard primeiro admin |
| `src/contexts/AuthContext.tsx` | Modificar | Usar Supabase Auth |
| `src/pages/Login.tsx` | Modificar | Conectar ao Supabase |
| `src/pages/Configuracoes.tsx` | Modificar | Mostrar dados reais |
| `src/components/AppSidebar.tsx` | Modificar | Adicionar "Usuários" |

---

## Cronograma Estimado

| Fase | Itens | Prioridade |
|------|-------|------------|
| Fase 1.1-1.2 | Autenticação real | Alta |
| Fase 1.3-1.4 | Gestão de usuários | Alta |
| Fase 2.1 | Correção de dados | Média |
| Fase 2.2-2.3 | ASO e EPIs | Baixa |
| Fase 3 | Limpeza e ajustes | Baixa |

---

## Próximos Passos Imediatos

Ao aprovar este plano, implementarei na seguinte ordem:

1. Criar migração do banco com tabelas de autenticação
2. Atualizar AuthContext para usar Supabase Auth
3. Criar página de Setup Inicial (primeiro admin)
4. Criar página de Gestão de Usuários com convites
5. Atualizar menu e rotas
