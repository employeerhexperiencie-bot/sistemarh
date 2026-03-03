import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Power, 
  PowerOff, 
  Loader2,
  AlertTriangle,
  Users,
  Plus,
  RefreshCw,
  Mail,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Tenant {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  plano: string | null;
  ativo: boolean | null;
  limite_usuarios: number | null;
  limite_profissionais: number | null;
  limite_storage_mb: number | null;
  data_bloqueio: string | null;
  motivo_bloqueio: string | null;
  created_at: string | null;
}

export function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Block/unblock dialog
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [motivoBloqueio, setMotivoBloqueio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New tenant dialog
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    plano: 'basico',
    limite_usuarios: 10,
    limite_profissionais: 100,
    limite_storage_mb: 1024,
    admin_email: '',
    admin_nome: '',
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('nome');

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
      toast.error('Erro ao carregar lista de clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setMotivoBloqueio('');
    setIsBlockDialogOpen(true);
  };

  const confirmToggle = async () => {
    if (!selectedTenant) return;
    const newStatus = !selectedTenant.ativo;
    if (!newStatus && !motivoBloqueio.trim()) {
      toast.error('Informe o motivo do bloqueio');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        ativo: newStatus,
        data_bloqueio: newStatus ? null : new Date().toISOString(),
        motivo_bloqueio: newStatus ? null : motivoBloqueio.trim()
      };

      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', selectedTenant.id);

      if (error) throw error;

      toast.success(
        newStatus 
          ? `Acesso de "${selectedTenant.nome}" reativado!` 
          : `Acesso de "${selectedTenant.nome}" bloqueado.`
      );
      
      setIsBlockDialogOpen(false);
      loadTenants();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.nome.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }
    if (!newTenant.admin_email.trim() || !newTenant.admin_email.includes('@')) {
      toast.error('Email do administrador é obrigatório e válido');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Criar o tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          nome: newTenant.nome.trim(),
          cnpj: newTenant.cnpj.trim() || null,
          email: newTenant.email.trim() || null,
          telefone: newTenant.telefone.trim() || null,
          plano: newTenant.plano,
          limite_usuarios: newTenant.limite_usuarios,
          limite_profissionais: newTenant.limite_profissionais,
          limite_storage_mb: newTenant.limite_storage_mb,
          ativo: true,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 2. Convidar o admin do tenant via edge function
      // Precisamos criar o user e associar ao novo tenant_id
      const { data: inviteResult, error: inviteError } = await supabase.functions.invoke('provision-tenant-admin', {
        body: {
          tenant_id: tenantData.id,
          email: newTenant.admin_email.trim().toLowerCase(),
          nome: newTenant.admin_nome.trim() || newTenant.admin_email.split('@')[0],
        }
      });

      if (inviteError) {
        // Rollback: deletar tenant criado
        await supabase.from('tenants').delete().eq('id', tenantData.id);
        throw inviteError;
      }

      toast.success(`Cliente "${newTenant.nome}" criado com sucesso! Admin convidado: ${newTenant.admin_email}`);
      setIsNewDialogOpen(false);
      setNewTenant({
        nome: '', cnpj: '', email: '', telefone: '', plano: 'basico',
        limite_usuarios: 10, limite_profissionais: 100, limite_storage_mb: 1024,
        admin_email: '', admin_nome: '',
      });
      loadTenants();
    } catch (error: any) {
      console.error('Erro ao criar tenant:', error);
      toast.error(error?.message || 'Erro ao criar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlanBadge = (plano: string | null) => {
    switch (plano) {
      case 'avancado':
        return <Badge className="bg-gradient-to-r from-primary to-accent">Avançado</Badge>;
      case 'intermediario':
        return <Badge className="bg-primary">Intermediário</Badge>;
      default:
        return <Badge variant="secondary">Básico</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gestão de Clientes (Tenants)
            </CardTitle>
            <CardDescription>
              Provisione novos clientes e gerencie acessos
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadTenants} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => setIsNewDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cliente cadastrado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} className={!tenant.ativo ? 'opacity-60 bg-destructive/5' : ''}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{tenant.nome}</p>
                      {tenant.email && (
                        <p className="text-xs text-muted-foreground">{tenant.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tenant.cnpj || '—'}
                  </TableCell>
                  <TableCell>{getPlanBadge(tenant.plano)}</TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <p><Users className="h-3 w-3 inline mr-1" />{tenant.limite_usuarios || '∞'} usuários</p>
                      <p>{tenant.limite_profissionais || '∞'} profissionais</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.ativo ? (
                      <Badge className="bg-success text-success-foreground">
                        <Power className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <div className="space-y-1">
                        <Badge variant="destructive">
                          <PowerOff className="h-3 w-3 mr-1" />
                          Bloqueado
                        </Badge>
                        {tenant.data_bloqueio && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tenant.data_bloqueio), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tenant.created_at && format(new Date(tenant.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={tenant.ativo ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleTenant(tenant)}
                    >
                      {tenant.ativo ? (
                        <><PowerOff className="h-4 w-4 mr-1" />Bloquear</>
                      ) : (
                        <><Power className="h-4 w-4 mr-1" />Reativar</>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Dialog Novo Cliente */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Provisionar Novo Cliente
            </DialogTitle>
            <DialogDescription>
              Crie um novo tenant e convide o administrador automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {/* Dados da Empresa */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Dados da Empresa</h4>
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input
                  placeholder="Ex: Empresa XYZ Ltda"
                  value={newTenant.nome}
                  onChange={(e) => setNewTenant(p => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={newTenant.cnpj}
                    onChange={(e) => setNewTenant(p => ({ ...p, cnpj: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={newTenant.telefone}
                    onChange={(e) => setNewTenant(p => ({ ...p, telefone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email da Empresa</Label>
                <Input
                  type="email"
                  placeholder="contato@empresa.com"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant(p => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Plano e Limites */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Plano e Limites</h4>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={newTenant.plano} onValueChange={(v) => setNewTenant(p => ({ ...p, plano: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Limite Usuários</Label>
                  <Input
                    type="number"
                    value={newTenant.limite_usuarios}
                    onChange={(e) => setNewTenant(p => ({ ...p, limite_usuarios: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite Profissionais</Label>
                  <Input
                    type="number"
                    value={newTenant.limite_profissionais}
                    onChange={(e) => setNewTenant(p => ({ ...p, limite_profissionais: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storage (MB)</Label>
                  <Input
                    type="number"
                    value={newTenant.limite_storage_mb}
                    onChange={(e) => setNewTenant(p => ({ ...p, limite_storage_mb: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Admin do Cliente */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Administrador do Cliente
              </h4>
              <div className="space-y-2">
                <Label>Email do Admin *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="admin@empresa.com"
                    value={newTenant.admin_email}
                    onChange={(e) => setNewTenant(p => ({ ...p, admin_email: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome do Admin</Label>
                <Input
                  placeholder="Nome completo"
                  value={newTenant.admin_nome}
                  onChange={(e) => setNewTenant(p => ({ ...p, admin_nome: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O administrador receberá acesso ao sistema e deverá usar "Esqueci a Senha" para definir sua credencial.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTenant} disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" />Criar Cliente</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Bloqueio/Desbloqueio */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTenant?.ativo ? (
                <><AlertTriangle className="h-5 w-5 text-destructive" />Bloquear Acesso do Cliente</>
              ) : (
                <><Power className="h-5 w-5 text-success" />Reativar Acesso do Cliente</>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.ativo 
                ? `Tem certeza que deseja bloquear "${selectedTenant?.nome}"? Todos os usuários perderão acesso.`
                : `Deseja reativar o acesso de "${selectedTenant?.nome}"?`
              }
            </DialogDescription>
          </DialogHeader>

          {selectedTenant?.ativo && (
            <div className="space-y-2 py-4">
              <Label>Motivo do Bloqueio *</Label>
              <Textarea
                placeholder="Ex: Inadimplência, Cancelamento de contrato, etc."
                value={motivoBloqueio}
                onChange={(e) => setMotivoBloqueio(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {!selectedTenant?.ativo && selectedTenant?.motivo_bloqueio && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                <strong>Motivo do bloqueio anterior:</strong> {selectedTenant.motivo_bloqueio}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>Cancelar</Button>
            <Button
              variant={selectedTenant?.ativo ? "destructive" : "default"}
              onClick={confirmToggle}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {selectedTenant?.ativo ? 'Confirmar Bloqueio' : 'Confirmar Reativação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}