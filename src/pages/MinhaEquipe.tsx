import { useState, useEffect } from 'react';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Building2, 
  User as UserIcon,
  Loader2,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Check,
  Settings2,
  Info,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserPermissionsConfig } from '@/components/usuarios/UserPermissionsConfig';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  loja_id: string | null;
  nome: string | null;
  created_at: string;
  ativo: boolean;
}

interface UserInvite {
  id: string;
  email: string;
  role?: AppRole;
  loja_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

interface Loja {
  id: string;
  nome: string;
}

export default function MinhaEquipe() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('operador');
  const [inviteLoja, setInviteLoja] = useState<string>('');
  const [inviteNome, setInviteNome] = useState('');

  // Permissions config state
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserRole | null>(null);

  // Apenas admin pode gerenciar equipe
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, invitesRes, lojasRes] = await Promise.all([
        supabase.from('user_roles').select('*')
          .neq('role', 'super_admin') // Não mostrar super_admin para clientes
          .order('created_at', { ascending: false }),
        supabase.from('user_invites').select('*').order('created_at', { ascending: false }),
        supabase.from('lojas').select('id, nome').order('nome')
      ]);

      if (usersRes.data) setUsers(usersRes.data as UserRole[]);
      if (invitesRes.data) setInvites(invitesRes.data as UserInvite[]);
      if (lojasRes.data) setLojas(lojasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('user_invites').insert({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        loja_id: inviteLoja || null,
        invited_by: user?.id
      });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('Este email já foi convidado');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Colaborador cadastrado com sucesso!');
      setIsDialogOpen(false);
      setInviteEmail('');
      setInviteNome('');
      setInviteRole('operador');
      setInviteLoja('');
      loadData();
    } catch (error) {
      console.error('Erro ao cadastrar colaborador:', error);
      toast.error('Erro ao cadastrar colaborador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase.from('user_invites').delete().eq('id', inviteId);
      if (error) throw error;
      toast.success('Convite cancelado');
      loadData();
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      toast.error('Erro ao cancelar convite');
    }
  };

  const handleToggleUserActive = async (userRoleId: string, userId: string, currentStatus: boolean) => {
    if (userId === user?.id) {
      toast.error('Você não pode desativar sua própria conta');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ ativo: !currentStatus })
        .eq('id', userRoleId);
      
      if (error) throw error;
      toast.success(currentStatus ? 'Acesso bloqueado' : 'Acesso liberado');
      loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'gerente':
        return <Badge variant="secondary"><Building2 className="h-3 w-3 mr-1" />Gerente</Badge>;
      case 'executor':
        return <Badge variant="outline" className="border-primary/50"><UserIcon className="h-3 w-3 mr-1" />Executor</Badge>;
      case 'operador':
        return <Badge variant="outline"><UserIcon className="h-3 w-3 mr-1" />Operador</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getLojaName = (lojaId: string | null) => {
    if (!lojaId) return 'Todas';
    const loja = lojas.find(l => l.id === lojaId);
    return loja?.nome || 'Desconhecida';
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filtrar usuários que não são super_admin (white-label)
  const visibleUsers = users.filter(u => u.role !== 'super_admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Minha Equipe
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre e gerencie os colaboradores que terão acesso ao sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Colaborador</DialogTitle>
                <DialogDescription>
                  Cadastre o email do colaborador. No primeiro acesso, ele deve usar "Esqueci minha senha" para criar sua senha.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Colaborador</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Nome completo"
                      value={inviteNome}
                      onChange={(e) => setInviteNome(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="colaborador@empresa.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Nível de Acesso</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gerente">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Gerente - Gerencia uma loja
                        </div>
                      </SelectItem>
                      <SelectItem value="executor">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          Executor - Resolve ocorrências
                        </div>
                      </SelectItem>
                      <SelectItem value="operador">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          Operador - Apenas visualização
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {inviteRole !== 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="loja">Loja (opcional)</Label>
                    <Select value={inviteLoja} onValueChange={setInviteLoja}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as lojas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as lojas</SelectItem>
                        {lojas.map((loja) => (
                          <SelectItem key={loja.id} value={loja.id}>
                            {loja.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleInvite} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Instruções de primeiro acesso */}
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Como funciona o primeiro acesso?</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Cadastre o email do colaborador aqui</li>
            <li>O colaborador acessa a tela de login do sistema</li>
            <li>Clica em <strong>"Esqueci minha senha"</strong></li>
            <li>Recebe um link no email para criar a senha</li>
            <li>Após criar a senha, pode fazer login normalmente</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{visibleUsers.length}</p>
                <p className="text-sm text-muted-foreground">Colaboradores Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invites.filter(i => !i.accepted_at).length}</p>
                <p className="text-sm text-muted-foreground">Aguardando Primeiro Acesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invites.filter(i => i.accepted_at).length}</p>
                <p className="text-sm text-muted-foreground">Convites Aceitos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colaboradores Cadastrados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Colaboradores Ativos
          </CardTitle>
          <CardDescription>
            Colaboradores que já acessaram o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum colaborador cadastrado ainda</p>
              <p className="text-sm">Clique em "Novo Colaborador" para adicionar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell className="font-medium">
                      {userRole.nome || 'Sem nome'}
                    </TableCell>
                    <TableCell>{getRoleBadge(userRole.role)}</TableCell>
                    <TableCell>{getLojaName(userRole.loja_id)}</TableCell>
                    <TableCell>
                      {userRole.ativo ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                          <Ban className="h-3 w-3 mr-1" />
                          Bloqueado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(userRole.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedUserForPermissions(userRole)}
                          title="Configurar permissões"
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        {userRole.user_id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserActive(userRole.id, userRole.user_id, userRole.ativo)}
                            title={userRole.ativo ? 'Bloquear acesso' : 'Liberar acesso'}
                          >
                            {userRole.ativo ? (
                              <Ban className="h-4 w-4 text-red-500" />
                            ) : (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Convites Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Aguardando Primeiro Acesso
          </CardTitle>
          <CardDescription>
            Colaboradores cadastrados que ainda não criaram a senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.filter(i => !i.accepted_at).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum convite pendente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.filter(i => !i.accepted_at).map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {invite.email}
                      </div>
                    </TableCell>
                    <TableCell>{invite.role ? getRoleBadge(invite.role) : '-'}</TableCell>
                    <TableCell>{getLojaName(invite.loja_id)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(invite.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInvite(invite.id)}
                        title="Cancelar convite"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Legenda de Níveis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Níveis de Acesso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <Building2 className="h-5 w-5 text-secondary-foreground mt-0.5" />
              <div>
                <p className="font-medium">Gerente</p>
                <p className="text-sm text-muted-foreground">
                  Gerencia sua loja designada, aprova ocorrências
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <UserIcon className="h-5 w-5 text-primary/70 mt-0.5" />
              <div>
                <p className="font-medium">Executor</p>
                <p className="text-sm text-muted-foreground">
                  Resolve ocorrências atribuídas a ele
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Operador</p>
                <p className="text-sm text-muted-foreground">
                  Acesso apenas para consultas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de configuração de permissões */}
      {selectedUserForPermissions && (
        <UserPermissionsConfig
          userId={selectedUserForPermissions.user_id}
          userName={selectedUserForPermissions.nome || 'Usuário'}
          isOpen={!!selectedUserForPermissions}
          onClose={() => setSelectedUserForPermissions(null)}
        />
      )}
    </div>
  );
}
