import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Power, 
  PowerOff, 
  Loader2,
  AlertTriangle,
  Users,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Tenant {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  plano: string | null;
  ativo: boolean | null;
  data_bloqueio: string | null;
  motivo_bloqueio: string | null;
  created_at: string | null;
}

export function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [motivoBloqueio, setMotivoBloqueio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsDialogOpen(true);
  };

  const confirmToggle = async () => {
    if (!selectedTenant) return;

    const newStatus = !selectedTenant.ativo;
    
    // Se está bloqueando, exigir motivo
    if (!newStatus && !motivoBloqueio.trim()) {
      toast.error('Informe o motivo do bloqueio');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: {
        ativo: boolean;
        data_bloqueio: string | null;
        motivo_bloqueio: string | null;
      } = {
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
          ? `Acesso de "${selectedTenant.nome}" reativado com sucesso!` 
          : `Acesso de "${selectedTenant.nome}" bloqueado.`
      );
      
      setIsDialogOpen(false);
      loadTenants();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlanBadge = (plano: string | null) => {
    switch (plano) {
      case 'enterprise':
        return <Badge className="bg-gradient-to-r from-primary to-accent">Enterprise</Badge>;
      case 'pro':
        return <Badge className="bg-primary">Pro</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
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
              Gerencie o acesso dos clientes ao sistema
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadTenants} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
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
                    {tenant.ativo ? (
                      <Badge className="bg-success">
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
                        <>
                          <PowerOff className="h-4 w-4 mr-1" />
                          Bloquear
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-1" />
                          Reativar
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Dialog de Confirmação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTenant?.ativo ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Bloquear Acesso do Cliente
                </>
              ) : (
                <>
                  <Power className="h-5 w-5 text-success" />
                  Reativar Acesso do Cliente
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.ativo 
                ? `Tem certeza que deseja bloquear o acesso de "${selectedTenant?.nome}"? Todos os usuários deste cliente perderão acesso imediatamente.`
                : `Deseja reativar o acesso de "${selectedTenant?.nome}"?`
              }
            </DialogDescription>
          </DialogHeader>

          {selectedTenant?.ativo && (
            <div className="space-y-2 py-4">
              <Label htmlFor="motivo">Motivo do Bloqueio *</Label>
              <Textarea
                id="motivo"
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={selectedTenant?.ativo ? "destructive" : "default"}
              onClick={confirmToggle}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {selectedTenant?.ativo ? 'Confirmar Bloqueio' : 'Confirmar Reativação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
