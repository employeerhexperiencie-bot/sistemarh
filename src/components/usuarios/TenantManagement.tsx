import { useState, useEffect, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, Power, PowerOff, Loader2, AlertTriangle, Users, Plus, RefreshCw,
  Mail, UserPlus, DollarSign, TrendingUp, Calendar, BarChart3, Eye,
  CreditCard, Receipt, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formata limite (NULL ou 0 = ilimitado)
const formatLimite = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined || valor === 0) return 'Ilimitado';
  return valor.toLocaleString('pt-BR');
};

// Cor do uso vs limite: cinza=ilimitado, verde<70%, amarelo 70-90%, vermelho>=90%
const usoColorClass = (uso: number, limite: number | null | undefined): string => {
  if (!limite || limite === 0) return 'text-muted-foreground';
  const pct = (uso / limite) * 100;
  if (pct >= 90) return 'text-destructive font-semibold';
  if (pct >= 70) return 'text-warning font-medium';
  return 'text-success';
};

interface Tenant {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  plano: string | null;
  ativo: boolean | null;
  limite_usuarios: number | null;
  limite_profissionais: number | null;
  limite_storage_mb: number | null;
  valor_mensalidade: number | null;
  dia_vencimento: number | null;
  status_pagamento: string | null;
  data_ultimo_pagamento: string | null;
  data_proximo_vencimento: string | null;
  total_pago: number | null;
  observacoes_financeiras: string | null;
  data_bloqueio: string | null;
  motivo_bloqueio: string | null;
  created_at: string | null;
  lanup_habilitado?: boolean | null;
}

interface TenantMetrics {
  tenant_id: string;
  usuarios: number;
  profissionais: number;
  lojas: number;
  folhas: number;
  emprestimos: number;
  alertas_pendentes: number;
  ocorrencias_abertas: number;
}

interface Pagamento {
  id: string;
  tenant_id: string;
  valor: number;
  data_pagamento: string;
  data_referencia: string;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
}

export function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [metrics, setMetrics] = useState<Record<string, TenantMetrics>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);

  // Block dialog
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [motivoBloqueio, setMotivoBloqueio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New tenant dialog
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    nome: '', cnpj: '', email: '', telefone: '', plano: 'basico',
    limite_usuarios: 10, limite_profissionais: 100, limite_storage_mb: 1024,
    valor_mensalidade: 0, dia_vencimento: 10,
    admin_email: '', admin_nome: '',
  });

  // Payment dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentTenant, setPaymentTenant] = useState<Tenant | null>(null);
  const [newPayment, setNewPayment] = useState({
    valor: 0, data_pagamento: '', data_referencia: '', forma_pagamento: 'pix', observacoes: ''
  });

  // Edit tenant dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);

  const [recalculando, setRecalculando] = useState(false);

  useEffect(() => { loadTenants(); }, []);

  const recalcularMetricas = async () => {
    setRecalculando(true);
    try {
      const { error } = await supabase.rpc('atualizar_todas_tenant_metrics' as any);
      if (error) throw error;
      toast.success('Métricas mensais recalculadas e salvas');
      await loadTenants();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao recalcular métricas');
    } finally {
      setRecalculando(false);
    }
  };

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('tenants').select('*').order('nome');
      if (error) throw error;
      setTenants((data || []) as Tenant[]);

      // Load metrics for each tenant
      if (data && data.length > 0) {
        const tenantIds = data.map(t => t.id);
        const metricsMap: Record<string, TenantMetrics> = {};

        for (const tid of tenantIds) {
          const [uRes, pRes, lRes, fRes, eRes, aRes, oRes] = await Promise.all([
            supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('tenant_id', tid).neq('role', 'super_admin'),
            supabase.from('profissionais').select('id', { count: 'exact', head: true }).eq('tenant_id', tid).eq('status', 'ativo'),
            supabase.from('lojas').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
            supabase.from('folha_pagamento').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
            supabase.from('emprestimos').select('id', { count: 'exact', head: true }).eq('tenant_id', tid).eq('status', 'ativo'),
            supabase.from('alertas_sistema').select('id', { count: 'exact', head: true }).eq('tenant_id', tid).eq('lido', false),
            supabase.from('pendencias').select('id', { count: 'exact', head: true }).eq('tenant_id', tid).neq('status', 'concluida'),
          ]);
          metricsMap[tid] = {
            tenant_id: tid,
            usuarios: uRes.count || 0,
            profissionais: pRes.count || 0,
            lojas: lRes.count || 0,
            folhas: fRes.count || 0,
            emprestimos: eRes.count || 0,
            alertas_pendentes: aRes.count || 0,
            ocorrencias_abertas: oRes.count || 0,
          };
        }
        setMetrics(metricsMap);
      }
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPagamentos = async (tenantId: string) => {
    setLoadingPagamentos(true);
    try {
      const { data, error } = await supabase
        .from('pagamentos_tenant')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('data_pagamento', { ascending: false })
        .limit(20);
      if (error) throw error;
      setPagamentos((data || []) as Pagamento[]);
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
    } finally {
      setLoadingPagamentos(false);
    }
  };

  const toggleExpand = (tenantId: string) => {
    if (expandedTenant === tenantId) {
      setExpandedTenant(null);
    } else {
      setExpandedTenant(tenantId);
      loadPagamentos(tenantId);
    }
  };

  const handleToggleTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setMotivoBloqueio('');
    setIsBlockDialogOpen(true);
  };

  const handleToggleLanup = async (tenant: Tenant) => {
    const novoEstado = !tenant.lanup_habilitado;
    try {
      const { error } = await supabase.from('tenants').update({
        lanup_habilitado: novoEstado,
      } as any).eq('id', tenant.id);
      if (error) throw error;
      toast.success(
        novoEstado
          ? `Acesso Lanup liberado para "${tenant.nome}"`
          : `Acesso Lanup removido de "${tenant.nome}"`
      );
      loadTenants();
    } catch (e) {
      toast.error('Erro ao alterar acesso Lanup');
    }
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
      const { error } = await supabase.from('tenants').update({
        ativo: newStatus,
        data_bloqueio: newStatus ? null : new Date().toISOString(),
        motivo_bloqueio: newStatus ? null : motivoBloqueio.trim()
      } as any).eq('id', selectedTenant.id);
      if (error) throw error;
      toast.success(newStatus ? `"${selectedTenant.nome}" reativado!` : `"${selectedTenant.nome}" bloqueado.`);
      setIsBlockDialogOpen(false);
      loadTenants();
    } catch (error) {
      toast.error('Erro ao alterar status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!newTenant.admin_email.trim() || !newTenant.admin_email.includes('@')) {
      toast.error('Email do admin é obrigatório'); return;
    }
    setIsSubmitting(true);
    try {
      const { data: tenantData, error: tenantError } = await supabase.from('tenants').insert({
        nome: newTenant.nome.trim(),
        cnpj: newTenant.cnpj.trim() || null,
        email: newTenant.email.trim() || null,
        telefone: newTenant.telefone.trim() || null,
        plano: newTenant.plano,
        limite_usuarios: newTenant.limite_usuarios,
        limite_profissionais: newTenant.limite_profissionais,
        limite_storage_mb: newTenant.limite_storage_mb,
        valor_mensalidade: newTenant.valor_mensalidade,
        dia_vencimento: newTenant.dia_vencimento,
        ativo: true,
      } as any).select().single();
      if (tenantError) throw tenantError;

      const { error: inviteError } = await supabase.functions.invoke('provision-tenant-admin', {
        body: {
          tenant_id: tenantData.id,
          email: newTenant.admin_email.trim().toLowerCase(),
          nome: newTenant.admin_nome.trim() || newTenant.admin_email.split('@')[0],
        }
      });
      if (inviteError) {
        await supabase.from('tenants').delete().eq('id', tenantData.id);
        throw inviteError;
      }

      toast.success(`"${newTenant.nome}" criado! Admin: ${newTenant.admin_email}`);
      setIsNewDialogOpen(false);
      setNewTenant({ nome: '', cnpj: '', email: '', telefone: '', plano: 'basico',
        limite_usuarios: 10, limite_profissionais: 100, limite_storage_mb: 1024,
        valor_mensalidade: 0, dia_vencimento: 10, admin_email: '', admin_nome: '' });
      loadTenants();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!paymentTenant || !newPayment.valor || !newPayment.data_pagamento || !newPayment.data_referencia) {
      toast.error('Valor, data de pagamento e referência são obrigatórios');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('pagamentos_tenant').insert({
        tenant_id: paymentTenant.id,
        valor: newPayment.valor,
        data_pagamento: newPayment.data_pagamento,
        data_referencia: newPayment.data_referencia + '-01',
        forma_pagamento: newPayment.forma_pagamento,
        observacoes: newPayment.observacoes || null,
      } as any);
      if (error) throw error;

      // Atualizar dados do tenant
      const novoTotal = (paymentTenant.total_pago || 0) + newPayment.valor;
      await supabase.from('tenants').update({
        data_ultimo_pagamento: newPayment.data_pagamento,
        total_pago: novoTotal,
        status_pagamento: 'em_dia',
      } as any).eq('id', paymentTenant.id);

      toast.success(`Pagamento de R$ ${newPayment.valor.toFixed(2)} registrado!`);
      setIsPaymentDialogOpen(false);
      setNewPayment({ valor: 0, data_pagamento: '', data_referencia: '', forma_pagamento: 'pix', observacoes: '' });
      loadTenants();
      if (expandedTenant === paymentTenant.id) loadPagamentos(paymentTenant.id);
    } catch (error) {
      toast.error('Erro ao registrar pagamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTenant = async () => {
    if (!editTenant) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tenants').update({
        nome: editTenant.nome,
        cnpj: editTenant.cnpj,
        email: editTenant.email,
        telefone: editTenant.telefone,
        plano: editTenant.plano,
        limite_usuarios: editTenant.limite_usuarios,
        limite_profissionais: editTenant.limite_profissionais,
        valor_mensalidade: editTenant.valor_mensalidade,
        dia_vencimento: editTenant.dia_vencimento,
        status_pagamento: editTenant.status_pagamento,
        observacoes_financeiras: editTenant.observacoes_financeiras,
      } as any).eq('id', editTenant.id);
      if (error) throw error;
      toast.success('Cliente atualizado!');
      setIsEditDialogOpen(false);
      loadTenants();
    } catch (error) {
      toast.error('Erro ao atualizar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentDialog = (tenant: Tenant) => {
    setPaymentTenant(tenant);
    setNewPayment({
      valor: tenant.valor_mensalidade || 0,
      data_pagamento: new Date().toISOString().slice(0, 10),
      data_referencia: new Date().toISOString().slice(0, 7),
      forma_pagamento: 'pix',
      observacoes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const getPlanBadge = (plano: string | null) => {
    switch (plano) {
      case 'avancado': return <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">Avançado</Badge>;
      case 'intermediario': return <Badge className="bg-primary text-primary-foreground">Intermediário</Badge>;
      default: return <Badge variant="secondary">Básico</Badge>;
    }
  };

  const getPaymentBadge = (status: string | null) => {
    switch (status) {
      case 'em_dia': return <Badge className="bg-success text-success-foreground">Em dia</Badge>;
      case 'atrasado': return <Badge variant="destructive">Atrasado</Badge>;
      case 'pendente': return <Badge className="bg-warning text-warning-foreground">Pendente</Badge>;
      default: return <Badge variant="outline">—</Badge>;
    }
  };

  // Totais
  const totalMRR = tenants.reduce((sum, t) => sum + (t.ativo ? (t.valor_mensalidade || 0) : 0), 0);
  const totalPago = tenants.reduce((sum, t) => sum + (t.total_pago || 0), 0);
  const totalClientes = tenants.filter(t => t.ativo).length;
  const totalProfs = Object.values(metrics).reduce((sum, m) => sum + m.profissionais, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Building2 className="h-4 w-4" />Clientes Ativos</div>
            <p className="text-2xl font-bold mt-1">{totalClientes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><DollarSign className="h-4 w-4" />MRR</div>
            <p className="text-2xl font-bold mt-1">R$ {totalMRR.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUp className="h-4 w-4" />Total Recebido</div>
            <p className="text-2xl font-bold mt-1">R$ {totalPago.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="h-4 w-4" />Profissionais</div>
            <p className="text-2xl font-bold mt-1">{totalProfs}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tenants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Clientes</CardTitle>
              <CardDescription>Gerencie clientes, limites e pagamentos</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={recalcularMetricas} disabled={recalculando}>
                <BarChart3 className={`h-4 w-4 mr-2 ${recalculando ? 'animate-spin' : ''}`} />Recalcular Métricas
              </Button>
              <Button variant="outline" size="sm" onClick={loadTenants} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Atualizar
              </Button>
              <Button size="sm" onClick={() => setIsNewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Novo Cliente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2">
              {tenants.map((tenant) => {
                const m = metrics[tenant.id];
                const isExpanded = expandedTenant === tenant.id;
                return (
                  <div key={tenant.id} className={`border rounded-lg ${!tenant.ativo ? 'opacity-60 bg-destructive/5' : ''}`}>
                    {/* Row principal */}
                    <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => toggleExpand(tenant.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{tenant.nome}</p>
                          {getPlanBadge(tenant.plano)}
                          {tenant.ativo ? (
                            <Badge className="bg-success text-success-foreground" variant="outline"><Power className="h-3 w-3 mr-1" />Ativo</Badge>
                          ) : (
                            <Badge variant="destructive"><PowerOff className="h-3 w-3 mr-1" />Bloqueado</Badge>
                          )}
                          {(m?.alertas_pendentes || 0) > 0 && (
                            <Badge variant="outline" className="border-warning text-warning" title="Alertas não lidos">
                              <AlertTriangle className="h-3 w-3 mr-1" />{m.alertas_pendentes}
                            </Badge>
                          )}
                        </div>
                        {tenant.email && <p className="text-xs text-muted-foreground mt-0.5">{tenant.email}</p>}
                      </div>

                      {/* Métricas inline */}
                      <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                        <span title="Usuários"><Users className="h-3.5 w-3.5 inline mr-1" />{m?.usuarios || 0}</span>
                        <span title="Profissionais">{m?.profissionais || 0} profs</span>
                        <span title="Lojas"><Building2 className="h-3.5 w-3.5 inline mr-1" />{m?.lojas || 0}</span>
                      </div>

                      {/* Financeiro inline */}
                      <div className="hidden lg:flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Ganho total</p>
                          <p className="text-sm font-bold text-success">R$ {(tenant.total_pago || 0).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">R$ {(tenant.valor_mensalidade || 0).toFixed(2)}/mês</p>
                          {getPaymentBadge(tenant.status_pagamento)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditTenant(tenant); setIsEditDialogOpen(true); }} title="Editar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openPaymentDialog(tenant); }} title="Registrar pagamento">
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" 
                          onClick={(e) => { e.stopPropagation(); handleToggleTenant(tenant); }}
                          title={tenant.ativo ? 'Bloquear' : 'Reativar'}
                        >
                          {tenant.ativo ? <PowerOff className="h-4 w-4 text-destructive" /> : <Power className="h-4 w-4 text-success" />}
                        </Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t px-4 py-4 space-y-4 bg-muted/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">CNPJ</p>
                            <p className="font-medium">{tenant.cnpj || '—'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Mensalidade</p>
                            <p className="font-medium">R$ {(tenant.valor_mensalidade || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Pago</p>
                            <p className="font-medium text-success">R$ {(tenant.total_pago || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Último Pagamento</p>
                            <p className="font-medium">
                              {tenant.data_ultimo_pagamento 
                                ? format(new Date(tenant.data_ultimo_pagamento), "dd/MM/yyyy", { locale: ptBR })
                                : 'Nenhum'}
                            </p>
                          </div>
                        <div>
                            <p className="text-muted-foreground">Limites</p>
                            <p className="font-medium">{formatLimite(tenant.limite_usuarios)} users / {formatLimite(tenant.limite_profissionais)} profs</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Uso Atual</p>
                            <p className="font-medium">
                              <span className={usoColorClass(m?.usuarios || 0, tenant.limite_usuarios)}>{m?.usuarios || 0}</span>
                              {' users / '}
                              <span className={usoColorClass(m?.profissionais || 0, tenant.limite_profissionais)}>{m?.profissionais || 0}</span>
                              {' profs'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Folhas Geradas</p>
                            <p className="font-medium">{m?.folhas || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Alertas Pendentes</p>
                            <p className={`font-medium ${(m?.alertas_pendentes || 0) > 50 ? 'text-warning' : ''}`}>
                              {m?.alertas_pendentes || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ocorrências Abertas</p>
                            <p className="font-medium">{m?.ocorrencias_abertas || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Empréstimos Ativos</p>
                            <p className="font-medium">{m?.emprestimos || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cliente Desde</p>
                            <p className="font-medium">
                              {tenant.created_at ? format(new Date(tenant.created_at), "dd/MM/yyyy", { locale: ptBR }) : '—'}
                            </p>
                          </div>
                        </div>

                        {tenant.observacoes_financeiras && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">Observações</p>
                            <p className="font-medium">{tenant.observacoes_financeiras}</p>
                          </div>
                        )}

                        {/* Histórico de pagamentos */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Receipt className="h-4 w-4" /> Histórico de Pagamentos
                          </h4>
                          {loadingPagamentos ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : pagamentos.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Data</TableHead>
                                  <TableHead>Referência</TableHead>
                                  <TableHead>Valor</TableHead>
                                  <TableHead>Forma</TableHead>
                                  <TableHead>Obs</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pagamentos.map(p => (
                                  <TableRow key={p.id}>
                                    <TableCell>{format(new Date(p.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                    <TableCell>{format(new Date(p.data_referencia), "MMM/yyyy", { locale: ptBR })}</TableCell>
                                    <TableCell className="font-medium">R$ {p.valor.toFixed(2)}</TableCell>
                                    <TableCell><Badge variant="outline">{p.forma_pagamento || 'pix'}</Badge></TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{p.observacoes || '—'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== DIALOGS ==================== */}

      {/* Dialog Novo Cliente */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Provisionar Novo Cliente</DialogTitle>
            <DialogDescription>Crie um tenant e convide o administrador automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Dados da Empresa</h4>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Empresa XYZ Ltda" value={newTenant.nome} onChange={e => setNewTenant(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>CNPJ</Label><Input placeholder="00.000.000/0001-00" value={newTenant.cnpj} onChange={e => setNewTenant(p => ({ ...p, cnpj: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(00) 00000-0000" value={newTenant.telefone} onChange={e => setNewTenant(p => ({ ...p, telefone: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="contato@empresa.com" value={newTenant.email} onChange={e => setNewTenant(p => ({ ...p, email: e.target.value }))} /></div>

            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Plano e Limites</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={newTenant.plano} onValueChange={v => setNewTenant(p => ({ ...p, plano: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Mensalidade (R$)</Label><Input type="number" value={newTenant.valor_mensalidade} onChange={e => setNewTenant(p => ({ ...p, valor_mensalidade: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Lim. Usuários</Label><Input type="number" value={newTenant.limite_usuarios} onChange={e => setNewTenant(p => ({ ...p, limite_usuarios: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Lim. Profissionais</Label><Input type="number" value={newTenant.limite_profissionais} onChange={e => setNewTenant(p => ({ ...p, limite_profissionais: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Dia Vencimento</Label><Input type="number" min={1} max={31} value={newTenant.dia_vencimento} onChange={e => setNewTenant(p => ({ ...p, dia_vencimento: Number(e.target.value) }))} /></div>
            </div>

            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2"><UserPlus className="h-4 w-4" />Admin do Cliente</h4>
            <div className="space-y-2">
              <Label>Email do Admin *</Label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="admin@empresa.com" value={newTenant.admin_email} onChange={e => setNewTenant(p => ({ ...p, admin_email: e.target.value }))} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome completo" value={newTenant.admin_nome} onChange={e => setNewTenant(p => ({ ...p, admin_nome: e.target.value }))} /></div>
            <p className="text-xs text-muted-foreground">O admin usará "Esqueci a Senha" para definir sua credencial.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTenant} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</> : <><Plus className="h-4 w-4 mr-2" />Criar Cliente</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Pagamento */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Registrar Pagamento</DialogTitle>
            <DialogDescription>Registre um pagamento de "{paymentTenant?.nome}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={newPayment.valor} onChange={e => setNewPayment(p => ({ ...p, valor: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Data Pagamento *</Label><Input type="date" value={newPayment.data_pagamento} onChange={e => setNewPayment(p => ({ ...p, data_pagamento: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Mês Referência *</Label><Input type="month" value={newPayment.data_referencia} onChange={e => setNewPayment(p => ({ ...p, data_referencia: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Forma</Label>
                <Select value={newPayment.forma_pagamento} onValueChange={v => setNewPayment(p => ({ ...p, forma_pagamento: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Textarea placeholder="Opcional" value={newPayment.observacoes} onChange={e => setNewPayment(p => ({ ...p, observacoes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegisterPayment} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Tenant */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {editTenant && (
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2"><Label>Nome</Label><Input value={editTenant.nome} onChange={e => setEditTenant({ ...editTenant, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>CNPJ</Label><Input value={editTenant.cnpj || ''} onChange={e => setEditTenant({ ...editTenant, cnpj: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={editTenant.email || ''} onChange={e => setEditTenant({ ...editTenant, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={editTenant.plano || 'basico'} onValueChange={v => setEditTenant({ ...editTenant, plano: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Mensalidade (R$)</Label><Input type="number" value={editTenant.valor_mensalidade || 0} onChange={e => setEditTenant({ ...editTenant, valor_mensalidade: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Lim. Usuários</Label>
                  <Input type="number" placeholder="Vazio = ilimitado" value={editTenant.limite_usuarios ?? ''} onChange={e => setEditTenant({ ...editTenant, limite_usuarios: e.target.value === '' ? null : Number(e.target.value) })} />
                  <p className="text-xs text-muted-foreground">Deixe vazio para ilimitado</p>
                </div>
                <div className="space-y-2">
                  <Label>Lim. Profissionais</Label>
                  <Input type="number" placeholder="Vazio = ilimitado" value={editTenant.limite_profissionais ?? ''} onChange={e => setEditTenant({ ...editTenant, limite_profissionais: e.target.value === '' ? null : Number(e.target.value) })} />
                  <p className="text-xs text-muted-foreground">Deixe vazio para ilimitado</p>
                </div>
                <div className="space-y-2"><Label>Dia Vencimento</Label><Input type="number" min={1} max={31} value={editTenant.dia_vencimento || 10} onChange={e => setEditTenant({ ...editTenant, dia_vencimento: Number(e.target.value) })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Status Pagamento</Label>
                <Select value={editTenant.status_pagamento || 'em_dia'} onValueChange={v => setEditTenant({ ...editTenant, status_pagamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_dia">Em dia</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Observações Financeiras</Label><Textarea value={editTenant.observacoes_financeiras || ''} onChange={e => setEditTenant({ ...editTenant, observacoes_financeiras: e.target.value })} rows={3} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditTenant} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Bloqueio */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTenant?.ativo 
                ? <><AlertTriangle className="h-5 w-5 text-destructive" />Bloquear Cliente</>
                : <><Power className="h-5 w-5 text-success" />Reativar Cliente</>}
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.ativo 
                ? `Todos os usuários de "${selectedTenant?.nome}" perderão acesso imediatamente.`
                : `Deseja reativar "${selectedTenant?.nome}"?`}
            </DialogDescription>
          </DialogHeader>
          {selectedTenant?.ativo && (
            <div className="space-y-2 py-4"><Label>Motivo *</Label>
              <Textarea placeholder="Ex: Inadimplência" value={motivoBloqueio} onChange={e => setMotivoBloqueio(e.target.value)} rows={3} />
            </div>
          )}
          {!selectedTenant?.ativo && selectedTenant?.motivo_bloqueio && (
            <p className="text-sm text-muted-foreground py-4"><strong>Motivo anterior:</strong> {selectedTenant.motivo_bloqueio}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>Cancelar</Button>
            <Button variant={selectedTenant?.ativo ? "destructive" : "default"} onClick={confirmToggle} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {selectedTenant?.ativo ? 'Confirmar Bloqueio' : 'Confirmar Reativação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}