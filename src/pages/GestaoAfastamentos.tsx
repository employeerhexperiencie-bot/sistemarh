import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploader } from '@/components/FileUploader';
import { UserX, Calendar, AlertTriangle, Plus, Edit, FileText, Clock, Loader2, Trash2, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/contexts/AuditLogContext';

interface Afastamento {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  motivo: 'ACIDENTE_TRABALHO' | 'ACIDENTE_TRAJETO' | 'DOENCA' | 'LICENCA_MATERNIDADE' | 'LICENCA_PATERNIDADE' | 'OUTROS';
  dataInicio: string;
  dataPericia?: string;
  dataFim?: string;
  status: 'ATIVO' | 'FINALIZADO' | 'AGUARDANDO_PERICIA';
  documentoId?: string;
  observacao?: string;
}

const motivosAfastamento = [
  { value: 'ACIDENTE_TRABALHO', label: 'Acidente de Trabalho' },
  { value: 'ACIDENTE_TRAJETO', label: 'Acidente de Trajeto' },
  { value: 'DOENCA', label: 'Doença' },
  { value: 'LICENCA_MATERNIDADE', label: 'Licença Maternidade' },
  { value: 'LICENCA_PATERNIDADE', label: 'Licença Paternidade' },
  { value: 'OUTROS', label: 'Outros' },
];

export default function GestaoAfastamentos() {
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAfastamento, setEditingAfastamento] = useState<Afastamento | null>(null);
  const [formData, setFormData] = useState<Partial<Afastamento>>({ status: 'ATIVO' });
  const [saving, setSaving] = useState(false);
  const [filterLoja, setFilterLoja] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  useDeepLinkProfissional(setSearchTerm);
  const { addLog } = useAuditLog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('afastamentos')
        .select(`
          *,
          profissionais:profissional_id (
            matricula,
            nome,
            lojas:lojas!profissionais_loja_id_fkey (nome)
          )
        `);

      if (error) throw error;

      const afastamentosData: Afastamento[] = (data || []).map((a: any) => ({
        id: a.id,
        matricula: a.profissionais?.matricula || '',
        nome: a.profissionais?.nome || 'Profissional não encontrado',
        loja: a.profissionais?.lojas?.nome || 'Loja não definida',
        motivo: (a.tipo?.toUpperCase() || 'OUTROS') as Afastamento['motivo'],
        dataInicio: a.data_inicio,
        dataPericia: a.data_prevista_retorno || undefined,
        dataFim: a.data_retorno_efetivo || undefined,
        status: (a.status?.toUpperCase() || 'ATIVO') as Afastamento['status'],
        observacao: a.motivo || undefined,
      }));

      setAfastamentos(afastamentosData);
    } catch (error) {
      console.error('Erro ao carregar afastamentos:', error);
      toast.error('Erro ao carregar dados de afastamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.matricula || !formData.dataInicio || !formData.motivo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const { data: prof } = await supabase
        .from('profissionais')
        .select('id')
        .eq('matricula', formData.matricula)
        .maybeSingle();

      if (!prof) {
        toast.error('Profissional não encontrado com essa matrícula');
        setSaving(false);
        return;
      }

      const afastamentoData = {
        profissional_id: prof.id,
        tipo: formData.motivo?.toLowerCase() || 'outros',
        data_inicio: formData.dataInicio,
        data_prevista_retorno: formData.dataPericia || null,
        data_retorno_efetivo: formData.dataFim || null,
        status: formData.status?.toLowerCase() || 'ativo',
        motivo: formData.observacao || null,
      };

      if (editingAfastamento) {
        const { error } = await supabase
          .from('afastamentos')
          .update(afastamentoData)
          .eq('id', editingAfastamento.id);
        
        if (error) throw error;
        
        // Registrar atividade de atualização
        addLog({
          usuario: 'Sistema',
          acao: 'EDITAR',
          modulo: 'AFASTAMENTOS',
          entidade: formData.nome || 'Profissional',
          detalhes: `Afastamento de "${formData.nome}" atualizado`,
          metadata: { id: editingAfastamento.id, dados_novos: afastamentoData }
        });
        
        toast.success('Afastamento atualizado com sucesso!');
      } else {
        const { data: insertedData, error } = await supabase
          .from('afastamentos')
          .insert(afastamentoData)
          .select()
          .single();
        
        if (error) throw error;
        
        // Registrar atividade de criação
        addLog({
          usuario: 'Sistema',
          acao: 'CRIAR',
          modulo: 'AFASTAMENTOS',
          entidade: formData.nome || 'Profissional',
          detalhes: `Afastamento registrado para "${formData.nome}" - ${formData.motivo}`,
          metadata: { id: insertedData?.id, dados_novos: afastamentoData }
        });
        
        toast.success('Afastamento registrado com sucesso!');
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar afastamento:', error);
      toast.error('Erro ao salvar afastamento');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (afastamento: Afastamento) => {
    setEditingAfastamento(afastamento);
    setFormData(afastamento);
    setIsDialogOpen(true);
  };

  const handleDelete = async (afastamento: Afastamento) => {
    const loadingToast = toast.loading(`Excluindo afastamento de ${afastamento.nome}...`);
    try {
      // Recupera tenant_id do usuário autenticado para garantir conformidade com RLS
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.dismiss(loadingToast);
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      // Delete com retorno para confirmar que a linha foi efetivamente removida
      const { data: deleted, error } = await supabase
        .from('afastamentos')
        .delete()
        .eq('id', afastamento.id)
        .select('id');

      toast.dismiss(loadingToast);

      if (error) {
        console.error('[Afastamentos] Erro Supabase ao excluir:', error);
        toast.error('Não foi possível excluir o afastamento', {
          description: error.message || error.hint || `Código: ${error.code || 'desconhecido'}`,
        });
        return;
      }

      // Se nenhuma linha foi retornada, RLS bloqueou silenciosamente
      if (!deleted || deleted.length === 0) {
        toast.error('Exclusão bloqueada', {
          description: 'Você não tem permissão para excluir este registro ou ele já foi removido.',
        });
        await loadData();
        return;
      }

      // Atualização otimista: remove da lista local sem recarregar
      setAfastamentos(prev => prev.filter(a => a.id !== afastamento.id));

      addLog({
        usuario: 'Sistema',
        acao: 'EXCLUIR',
        modulo: 'AFASTAMENTOS',
        entidade: afastamento.nome,
        detalhes: `Afastamento de "${afastamento.nome}" excluído`,
        metadata: { id: afastamento.id }
      });

      toast.success('Afastamento excluído', {
        description: `Registro de ${afastamento.nome} removido com sucesso.`,
      });
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('[Afastamentos] Erro inesperado ao excluir:', error);
      toast.error('Erro ao excluir afastamento', {
        description: error?.message || 'Erro inesperado. Tente novamente.',
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAfastamento(null);
    setFormData({ status: 'ATIVO' });
  };

  const getStatusBadge = (status: Afastamento['status']) => {
    switch (status) {
      case 'ATIVO':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Afastado</Badge>;
      case 'FINALIZADO':
        return <Badge className="bg-success/10 text-success border-success/20">Finalizado</Badge>;
      case 'AGUARDANDO_PERICIA':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Aguardando Perícia</Badge>;
    }
  };

  const getMotivoBadge = (motivo: Afastamento['motivo']) => {
    const labels: Record<string, { label: string; className: string }> = {
      ACIDENTE_TRABALHO: { label: 'Ac. Trabalho', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      ACIDENTE_TRAJETO: { label: 'Ac. Trajeto', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      DOENCA: { label: 'Doença', className: 'bg-warning/10 text-warning border-warning/20' },
      LICENCA_MATERNIDADE: { label: 'Maternidade', className: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
      LICENCA_PATERNIDADE: { label: 'Paternidade', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      OUTROS: { label: 'Outros', className: '' },
    };
    const config = labels[motivo] || labels.OUTROS;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Lojas únicas para o dropdown de filtro
  const lojasDisponiveis = Array.from(
    new Set(afastamentos.map(a => a.loja).filter(l => l && l !== 'Loja não definida'))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Aplica filtros (loja + busca por nome) a todos os contadores e à listagem
  const afastamentosFiltrados = afastamentos.filter(a => {
    const matchLoja = filterLoja === 'todas' || a.loja === filterLoja;
    const matchSearch = searchTerm.trim() === '' ||
      a.nome.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      a.matricula.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchLoja && matchSearch;
  });

  const ativos = afastamentosFiltrados.filter(a => a.status === 'ATIVO').length;
  const aguardandoPericia = afastamentosFiltrados.filter(a => a.status === 'AGUARDANDO_PERICIA').length;
  const finalizados = afastamentosFiltrados.filter(a => a.status === 'FINALIZADO').length;
  const maternidade = afastamentosFiltrados.filter(a => a.motivo === 'LICENCA_MATERNIDADE' && a.status === 'ATIVO').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Afastamentos</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Controle de afastamentos e perícias</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Afastamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAfastamento ? 'Editar Afastamento' : 'Registrar Afastamento'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do afastamento
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  placeholder="001"
                  value={formData.matricula || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                  disabled={!!editingAfastamento}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="João Silva"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loja">Loja</Label>
                <Input
                  id="loja"
                  placeholder="CENTRO"
                  value={formData.loja || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, loja: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Motivo do Afastamento</Label>
                <Select
                  value={formData.motivo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, motivo: value as Afastamento['motivo'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {motivosAfastamento.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPericia">Data Perícia</Label>
                <Input
                  id="dataPericia"
                  type="date"
                  value={formData.dataPericia || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataPericia: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim (se finalizado)</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={formData.dataFim || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Afastamento['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Afastado</SelectItem>
                    <SelectItem value="AGUARDANDO_PERICIA">Aguardando Perícia</SelectItem>
                    <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Documentos</Label>
                <FileUploader
                  onFileUploaded={(fileId) => setFormData(prev => ({ ...prev, documentoId: fileId }))}
                />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  placeholder="Informações adicionais..."
                  value={formData.observacao || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCloseDialog} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-warning">{ativos}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Afastados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{aguardandoPericia}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Aguardando Perícia</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-pink-500/5 border-pink-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-pink-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-pink-400">{maternidade}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Maternidade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-success">{finalizados}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Finalizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg text-primary flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            Regras de Pagamento - Afastamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm space-y-2">
          <p><span className="font-semibold text-destructive">• Acidente de Trabalho/Trajeto:</span> Não recebe no dia 20. Pagar valor no mês seguinte.</p>
          <p><span className="font-semibold text-pink-400">• Licença Maternidade:</span> Recebe a % do dia 20 normalmente.</p>
          <p><span className="font-semibold text-warning">• Afastados (geral):</span> Não recebem adiantamento de salário (exceto maternidade).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Controle de Afastamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          {/* Filtros: loja + busca por nome */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="filtroLoja" className="text-xs">Filtrar por loja</Label>
              <Select value={filterLoja} onValueChange={setFilterLoja}>
                <SelectTrigger id="filtroLoja">
                  <SelectValue placeholder="Todas as lojas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as lojas</SelectItem>
                  {lojasDisponiveis.map(loja => (
                    <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="buscaNome" className="text-xs">Buscar por nome ou matrícula</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="buscaNome"
                  placeholder="Digite para filtrar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Loja</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="hidden md:table-cell">Início</TableHead>
                <TableHead className="hidden lg:table-cell">Perícia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {afastamentosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {afastamentos.length === 0
                      ? 'Nenhum afastamento registrado'
                      : 'Nenhum colaborador encontrado para o filtro selecionado.'}
                  </TableCell>
                </TableRow>
              ) : (
                [...afastamentosFiltrados]
                  .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'))
                  .map((afastamento) => (
                  <TableRow key={afastamento.id}>
                    <TableCell className="font-mono">{afastamento.matricula}</TableCell>
                    <TableCell className="font-medium">{afastamento.nome}</TableCell>
                    <TableCell className="hidden sm:table-cell">{afastamento.loja}</TableCell>
                    <TableCell>{getMotivoBadge(afastamento.motivo)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(afastamento.dataInicio).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {afastamento.dataPericia 
                        ? new Date(afastamento.dataPericia).toLocaleDateString('pt-BR')
                        : <span className="text-muted-foreground">-</span>
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(afastamento.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(afastamento)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir afastamento?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O afastamento de <strong>{afastamento.nome}</strong> ({afastamento.matricula}) será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(afastamento)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
