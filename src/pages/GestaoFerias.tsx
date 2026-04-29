import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plane, Calendar, AlertTriangle, Plus, Edit, Clock, Loader2, Filter, Search, UserX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/contexts/AuditLogContext';
import { ProfissionalAutocomplete } from '@/components/ProfissionalAutocomplete';
import { useDeepLinkProfissional } from '@/hooks/useDeepLinkProfissional';

interface Vacation {
  id: string;
  profissionalId?: string;
  matricula: string;
  nome: string;
  loja: string;
  desligado?: boolean;
  periodoAquisitivo: {
    inicio: string;
    fim: string;
  };
  dataInicioFerias?: string;
  dataFimFerias?: string;
  diasUsados: number;
  diasDisponiveis: number;
  status: 'PENDENTE' | 'AGENDADO' | 'EM_FERIAS' | 'FINALIZADO' | 'VENCENDO';
  observacao?: string;
}

export default function GestaoFerias() {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [todasLojas, setTodasLojas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  const [formData, setFormData] = useState<Partial<Vacation>>({
    diasDisponiveis: 30,
    diasUsados: 0,
    status: 'PENDENTE'
  });
  const [saving, setSaving] = useState(false);
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string | undefined>(undefined);
  const [filterLoja, setFilterLoja] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  useDeepLinkProfissional(setSearchTerm);
  const [incluirDesligados, setIncluirDesligados] = useState(false);
  const { addLog } = useAuditLog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar todas as lojas do tenant em paralelo (para popular o filtro
      // mesmo quando uma loja ainda não tem registros de férias)
      const [feriasRes, lojasRes] = await Promise.all([
        supabase
        .from('ferias')
        .select(`
          *,
          profissionais:profissional_id (
            matricula,
            nome,
            status,
            lojas:lojas!profissionais_loja_id_fkey (nome)
          )
        `),
        supabase.from('lojas').select('nome').order('nome', { ascending: true }),
      ]);

      const { data: ferias, error: feriasError } = feriasRes;
      if (feriasError) throw feriasError;

      const lojasNomes = (lojasRes.data || [])
        .map((l: any) => l?.nome)
        .filter((n: string | null | undefined): n is string => !!n);
      setTodasLojas(lojasNomes);

      const vacationsData: Vacation[] = (ferias || []).map((f: any) => {
        const hoje = new Date();
        const dataFim = new Date(f.periodo_aquisitivo_fim);
        const diasRestantes = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: Vacation['status'] = 'PENDENTE';
        if (f.status === 'em_gozo') status = 'EM_FERIAS';
        else if (f.status === 'agendada') status = 'AGENDADO';
        else if (f.status === 'finalizada') status = 'FINALIZADO';
        else if (diasRestantes <= 30 && diasRestantes > 0) status = 'VENCENDO';
        else if (diasRestantes <= 0) status = 'VENCENDO';
        
        return {
          id: f.id,
          profissionalId: f.profissional_id || undefined,
          matricula: f.profissionais?.matricula || '',
          nome: f.profissionais?.nome || 'Profissional não encontrado',
          loja: f.profissionais?.lojas?.nome || 'Loja não definida',
          desligado: f.profissionais?.status && f.profissionais.status !== 'ativo',
          periodoAquisitivo: {
            inicio: f.periodo_aquisitivo_inicio,
            fim: f.periodo_aquisitivo_fim,
          },
          dataInicioFerias: f.periodo_gozo_inicio || undefined,
          dataFimFerias: f.periodo_gozo_fim || undefined,
          diasUsados: f.dias_gozados || 0,
          diasDisponiveis: f.dias_direito || 30,
          status,
        };
      });

      // Ordenar alfabeticamente por nome
      vacationsData.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

      setVacations(vacationsData);
    } catch (error) {
      console.error('Erro ao carregar férias:', error);
      toast.error('Erro ao carregar dados de férias');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProfissionalId || !formData.periodoAquisitivo?.inicio || !formData.periodoAquisitivo?.fim) {
      toast.error('Selecione um profissional e preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const profId = selectedProfissionalId;

      const statusMap: Record<string, string> = {
        'PENDENTE': 'pendente',
        'AGENDADO': 'agendada',
        'EM_FERIAS': 'em_gozo',
        'FINALIZADO': 'finalizada',
        'VENCENDO': 'pendente',
      };

      const feriasData = {
        profissional_id: profId,
        periodo_aquisitivo_inicio: formData.periodoAquisitivo.inicio,
        periodo_aquisitivo_fim: formData.periodoAquisitivo.fim,
        periodo_gozo_inicio: formData.dataInicioFerias || null,
        periodo_gozo_fim: formData.dataFimFerias || null,
        dias_direito: formData.diasDisponiveis || 30,
        dias_gozados: formData.diasUsados || 0,
        status: statusMap[formData.status || 'PENDENTE'] || 'pendente',
      };

      if (editingVacation) {
        const { error } = await supabase
          .from('ferias')
          .update(feriasData)
          .eq('id', editingVacation.id);
        
        if (error) throw error;
        
        // Registrar atividade de atualização
        addLog({
          usuario: 'Sistema',
          acao: 'EDITAR',
          modulo: 'FERIAS',
          entidade: formData.nome || 'Profissional',
          detalhes: `Férias de "${formData.nome}" atualizadas`,
          metadata: { id: editingVacation.id, dados_novos: feriasData }
        });
        
        toast.success('Férias atualizadas com sucesso!');
      } else {
        const { data: insertedData, error } = await supabase
          .from('ferias')
          .insert(feriasData)
          .select()
          .single();
        
        if (error) throw error;
        
        // Registrar atividade de criação
        addLog({
          usuario: 'Sistema',
          acao: 'CRIAR',
          modulo: 'FERIAS',
          entidade: formData.nome || 'Profissional',
          detalhes: `Férias cadastradas para "${formData.nome}"`,
          metadata: { id: insertedData?.id, dados_novos: feriasData }
        });
        
        toast.success('Férias cadastradas com sucesso!');
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar férias:', error);
      toast.error('Erro ao salvar férias');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (vacation: Vacation) => {
    setEditingVacation(vacation);
    setFormData(vacation);
    if (vacation.profissionalId) setSelectedProfissionalId(vacation.profissionalId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVacation(null);
    setSelectedProfissionalId(undefined);
    setFormData({ diasDisponiveis: 30, diasUsados: 0, status: 'PENDENTE' });
  };

  const getStatusBadge = (status: Vacation['status']) => {
    switch (status) {
      case 'PENDENTE':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'AGENDADO':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Agendado</Badge>;
      case 'EM_FERIAS':
        return <Badge className="bg-success/10 text-success border-success/20">Em Férias</Badge>;
      case 'FINALIZADO':
        return <Badge variant="outline">Finalizado</Badge>;
      case 'VENCENDO':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Vencendo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateDaysRemaining = (vacation: Vacation) => {
    const endDate = new Date(vacation.periodoAquisitivo.fim);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Lista de lojas no filtro: união entre TODAS as lojas do tenant e
  // lojas que aparecem nos registros de férias. Isto garante que lojas
  // sem nenhum registro de férias ainda apareçam no filtro (ex.:
  // COMERCIAL, LAJEADO, SAO BERNARDO).
  const lojasDisponiveis = Array.from(
    new Set([
      ...todasLojas,
      ...vacations.map(v => v.loja).filter(l => l && l !== 'Loja não definida'),
    ])
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Aplicar filtros (loja + busca por nome + desligados) na listagem e nos contadores
  const filteredVacations = vacations.filter(v => {
    const matchesLoja = filterLoja === 'todas' || v.loja === filterLoja;
    const matchesSearch = searchTerm.trim() === '' ||
      v.nome.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchesAtivo = incluirDesligados || !v.desligado;
    return matchesLoja && matchesSearch && matchesAtivo;
  });

  const pendentes = filteredVacations.filter(v => v.status === 'PENDENTE').length;
  const agendados = filteredVacations.filter(v => v.status === 'AGENDADO').length;
  const emFerias = filteredVacations.filter(v => v.status === 'EM_FERIAS').length;
  const vencendo = filteredVacations.filter(v => v.status === 'VENCENDO').length;

  // Lista detalhada de vencimentos (para o card de alertas com nomes)
  const listaVencendo = filteredVacations
    .filter(v => v.status === 'VENCENDO')
    .map(v => ({ ...v, diasRestantes: calculateDaysRemaining(v) }))
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Férias</h1>
          <p className="text-muted-foreground">Controle de períodos aquisitivos e agendamento de férias</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Férias
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVacation ? 'Editar Férias' : 'Cadastrar Férias'}
              </DialogTitle>
              <DialogDescription>
                {editingVacation ? 'Atualize o período de férias' : 'Cadastre um novo período de férias para o profissional'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <ProfissionalAutocomplete
                  value={formData.matricula || ''}
                  onChange={(matricula, profissionalId) => {
                    setFormData(prev => ({ ...prev, matricula }));
                    if (profissionalId) setSelectedProfissionalId(profissionalId);
                  }}
                  label="Profissional"
                  placeholder="Digite nome ou matrícula"
                  disabled={!!editingVacation}
                  incluirInativos={incluirDesligados}
                />
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    id="incluirDesligadosForm"
                    checked={incluirDesligados}
                    onCheckedChange={setIncluirDesligados}
                  />
                  <Label htmlFor="incluirDesligadosForm" className="text-xs cursor-pointer">
                    Incluir desligados (rescisão com férias proporcionais)
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Vacation['status'] }))}
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="AGENDADO">Agendado</option>
                  <option value="EM_FERIAS">Em Férias</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Período Aquisitivo</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="periodoInicio" className="text-xs">Início</Label>
                    <Input
                      id="periodoInicio"
                      type="date"
                      value={formData.periodoAquisitivo?.inicio || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        periodoAquisitivo: { ...prev.periodoAquisitivo, inicio: e.target.value, fim: prev.periodoAquisitivo?.fim || '' }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodoFim" className="text-xs">Fim</Label>
                    <Input
                      id="periodoFim"
                      type="date"
                      value={formData.periodoAquisitivo?.fim || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        periodoAquisitivo: { ...prev.periodoAquisitivo, inicio: prev.periodoAquisitivo?.inicio || '', fim: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Agendamento de Férias (opcional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="dataInicio" className="text-xs">Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={formData.dataInicioFerias || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataInicioFerias: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataFim" className="text-xs">Fim</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={formData.dataFimFerias || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataFimFerias: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasDisponiveis">Dias Disponíveis</Label>
                <Input
                  id="diasDisponiveis"
                  type="number"
                  value={formData.diasDisponiveis || 30}
                  onChange={(e) => setFormData(prev => ({ ...prev, diasDisponiveis: parseInt(e.target.value) || 30 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasUsados">Dias Já Usados</Label>
                <Input
                  id="diasUsados"
                  type="number"
                  value={formData.diasUsados || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, diasUsados: parseInt(e.target.value) || 0 }))}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-secondary/5 border-secondary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-secondary" />
              <div>
                <p className="text-2xl font-bold text-secondary">{pendentes}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">{agendados}</p>
                <p className="text-sm text-muted-foreground">Agendados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Plane className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{emFerias}</p>
                <p className="text-sm text-muted-foreground">Em férias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{vencendo}</p>
                <p className="text-sm text-muted-foreground">Vencendo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Controle de Férias</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterLoja} onValueChange={setFilterLoja}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Filtrar por loja" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as lojas</SelectItem>
                    {lojasDisponiveis.map(loja => (
                      <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="incluirDesligadosLista"
                  checked={incluirDesligados}
                  onCheckedChange={setIncluirDesligados}
                />
                <Label htmlFor="incluirDesligadosLista" className="text-xs cursor-pointer flex items-center gap-1">
                  <UserX className="h-3 w-3" />
                  Incluir desligados
                </Label>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {filteredVacations.length} de {vacations.length}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Período Aquisitivo</TableHead>
                <TableHead>Férias Agendadas</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVacations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {vacations.length === 0
                      ? 'Nenhum registro de férias encontrado'
                      : 'Nenhum colaborador encontrado'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredVacations.map((vacation) => (
                  <TableRow key={vacation.id} className={vacation.desligado ? 'opacity-70' : ''}>
                    <TableCell className="font-mono">{vacation.matricula}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {vacation.nome}
                        {vacation.desligado && (
                          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                            Desligado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{vacation.loja}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(vacation.periodoAquisitivo.inicio).toLocaleDateString('pt-BR')} até{' '}
                      {new Date(vacation.periodoAquisitivo.fim).toLocaleDateString('pt-BR')}
                      {vacation.status === 'VENCENDO' && (
                        <div className="text-warning text-xs">
                          Vence em {calculateDaysRemaining(vacation)} dias
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {vacation.dataInicioFerias && vacation.dataFimFerias ? (
                        <div className="text-sm">
                          {new Date(vacation.dataInicioFerias).toLocaleDateString('pt-BR')} até{' '}
                          {new Date(vacation.dataFimFerias).toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não agendado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="text-success">{vacation.diasDisponiveis - vacation.diasUsados}</span>/
                        <span className="text-muted-foreground">{vacation.diasDisponiveis}</span>
                        {vacation.diasUsados > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {vacation.diasUsados} já usados
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(vacation.status)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(vacation)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {vencendo > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Vencimento de Férias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {vencendo} funcionário(s) com período aquisitivo vencido ou prestes a vencer (≤30 dias).
              Agende as férias antes do vencimento para evitar perda de direitos.
            </p>
            <div className="rounded-lg border border-warning/20 bg-background divide-y max-h-[280px] overflow-y-auto">
              {listaVencendo.map((v) => {
                const vencido = v.diasRestantes <= 0;
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{v.nome}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          #{v.matricula}
                        </span>
                        {v.desligado && (
                          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                            Desligado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {v.loja} • Aquisitivo até {new Date(v.periodoAquisitivo.fim).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          vencido
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-warning/10 text-warning border-warning/20'
                        }
                      >
                        {vencido ? `Vencido há ${Math.abs(v.diasRestantes)}d` : `Vence em ${v.diasRestantes}d`}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(v)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
