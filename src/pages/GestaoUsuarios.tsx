import { useState, useEffect } from 'react';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function GestaoUsuarios() {
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

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, invitesRes, lojasRes] = await Promise.all([
        supabase.from('user_roles').select('*').order('created_at', { ascending: false }),
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

      toast.success('Convite enviado com sucesso!');
      setIsDialogOpen(false);
      setInviteEmail('');
      setInviteRole('operador');
      setInviteLoja('');
      loadData();
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast.error('Erro ao enviar convite');
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

  const handleDeleteUser = async (userRoleId: string, userId: string) => {
    if (userId === user?.id) {
      toast.error('Você não pode remover sua própria conta');
      return;
    }

    try {
      const { error } = await supabase.from('user_roles').delete().eq('id', userRoleId);
      if (error) throw error;
      toast.success('Usuário removido');
      loadData();
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Erro ao remover usuário');
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
      case 'operador':
        return <Badge variant="outline"><UserIcon className="h-3 w-3 mr-1" />Operador</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários e convites do sistema
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
                Convidar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Envie um convite para um novo usuário acessar o sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Papel</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administrador
                        </div>
                      </SelectItem>
                      <SelectItem value="gerente">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Gerente
                        </div>
                      </SelectItem>
                      <SelectItem value="operador">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          Operador
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
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Usuários Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários Ativos ({users.length})
          </CardTitle>
          <CardDescription>
            Usuários com acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="w-[140px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userRole) => (
                  <TableRow key={userRole.id} className={!userRole.ativo ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">
                      {userRole.nome || 'Sem nome'}
                      {userRole.user_id === user?.id && (
                        <Badge variant="outline" className="ml-2 text-xs">Você</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(userRole.role)}</TableCell>
                    <TableCell>{getLojaName(userRole.loja_id)}</TableCell>
                    <TableCell>
                      {userRole.ativo ? (
                        <Badge className="bg-success">
                          <Check className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />
                          Bloqueado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(userRole.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={userRole.ativo ? 'Bloquear acesso' : 'Liberar acesso'}
                          className={userRole.ativo ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}
                          onClick={() => handleToggleUserActive(userRole.id, userRole.user_id, userRole.ativo)}
                          disabled={userRole.user_id === user?.id}
                        >
                          {userRole.ativo ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Remover usuário"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(userRole.id, userRole.user_id)}
                          disabled={userRole.user_id === user?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            <Mail className="h-5 w-5" />
            Convites Pendentes ({invites.filter(i => !i.accepted_at).length})
          </CardTitle>
          <CardDescription>
            Convites aguardando aceite
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum convite pendente
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => {
                  const isExpired = new Date(invite.expires_at) < new Date();
                  const isAccepted = !!invite.accepted_at;
                  
                  return (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>{getRoleBadge(invite.role)}</TableCell>
                      <TableCell>{getLojaName(invite.loja_id)}</TableCell>
                      <TableCell>
                        {isAccepted ? (
                          <Badge className="bg-success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aceito
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive">
                            <Clock className="h-3 w-3 mr-1" />
                            Expirado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(invite.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {!isAccepted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteInvite(invite.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Legenda de Papéis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Níveis de Acesso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Administrador</p>
                <p className="text-sm text-muted-foreground">
                  Acesso total ao sistema, pode gerenciar usuários e configurações
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <Building2 className="h-5 w-5 text-secondary-foreground mt-0.5" />
              <div>
                <p className="font-medium">Gerente</p>
                <p className="text-sm text-muted-foreground">
                  Visualiza todas as lojas, edita apenas sua loja designada
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Operador</p>
                <p className="text-sm text-muted-foreground">
                  Acesso limitado para consulta e operações básicas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
