import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart, AlertTriangle, Calendar, FileText, Plus, Search, Clock, CalendarPlus, MoreHorizontal, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { matchesSearch } from '@/lib/searchUtils';
import { useToast } from '@/components/ui/use-toast';
import { useAuditLog } from '@/contexts/AuditLogContext';
import { useDeepLinkProfissional } from '@/hooks/useDeepLinkProfissional';
interface ASOExam {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  cargo: string;
  cpf?: string | null;
  telefone?: string | null;
  celular?: string | null;
  dataUltimoExame: string | null;
  dataProximoExame: string | null;
  tipoExame: string;
  status: 'VALIDO' | 'VENCIDO' | 'VENCE_30_DIAS' | 'PENDENTE';
  periodicidade: string | null;
  diasRestantes: number | null;
}

interface Profissional {
  id: string;
  matricula: string;
  nome: string;
  cargo: string | null;
  cpf?: string | null;
  telefone?: string | null;
  celular?: string | null;
  lojas?: { nome: string } | null;
}

interface ProfissionalSemASO {
  id: string;
  matricula: string;
  nome: string;
  cargo: string | null;
  loja: string;
  dataAdmissao: string | null;
  cpf?: string | null;
  telefone?: string | null;
  celular?: string | null;
}

export default function GestaoASO() {
  const [exams, setExams] = useState<ASOExam[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [profissionaisSemASO, setProfissionaisSemASO] = useState<ProfissionalSemASO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterTipoExame, setFilterTipoExame] = useState<string>('todos');
  const [filterLoja, setFilterLoja] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  useDeepLinkProfissional(setSearchTerm);
  const [showSemASO, setShowSemASO] = useState(false);
  const [formData, setFormData] = useState({
    profissional_id: '',
    tipo_exame: 'Periódico',
    data_ultimo_exame: '',
    data_proximo_exame: '',
    periodicidade: '1 ano',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { addLog } = useAuditLog();

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar exames ASO com dados do profissional
      const { data: examesData, error: examesError } = await supabase
        .from('exames_aso')
        .select(`
          *,
          profissionais(id, matricula, nome, cargo, cpf, telefone, celular, lojas:lojas!profissionais_loja_id_fkey(nome))
        `)
        .order('data_proximo_exame', { ascending: true });

      if (examesError) throw examesError;

      // Carregar profissionais para o formulário
      const { data: profsData, error: profsError } = await supabase
        .from('profissionais')
        .select('id, matricula, nome, cargo, cpf, telefone, celular, data_admissao, lojas:lojas!profissionais_loja_id_fkey(nome)')
        .eq('status', 'ativo')
        .order('nome');

      if (profsError) throw profsError;

      setProfissionais(profsData || []);

      // Identificar profissionais SEM exame ASO cadastrado
      const profissionaisComASO = new Set((examesData || []).map((e: any) => e.profissional_id));
      const semASO: ProfissionalSemASO[] = (profsData || [])
        .filter((p: any) => !profissionaisComASO.has(p.id))
        .map((p: any) => ({
          id: p.id,
          matricula: p.matricula,
          nome: p.nome,
          cargo: p.cargo,
          cpf: p.cpf,
          telefone: p.telefone,
          celular: p.celular,
          loja: p.lojas?.nome || 'Sem loja',
          dataAdmissao: p.data_admissao
        }));
      
      setProfissionaisSemASO(semASO);

      // Formatar dados dos exames
      const examesFormatados: ASOExam[] = (examesData || []).map((e: any) => {
        const { status, diasRestantes } = calculateStatus(e.data_proximo_exame);
        return {
          id: e.id,
          matricula: e.profissionais?.matricula || '-',
          nome: e.profissionais?.nome || '-',
          loja: e.profissionais?.lojas?.nome || '-',
          cargo: e.profissionais?.cargo || '-',
          cpf: e.profissionais?.cpf,
          telefone: e.profissionais?.telefone,
          celular: e.profissionais?.celular,
          dataUltimoExame: e.data_ultimo_exame,
          dataProximoExame: e.data_proximo_exame,
          tipoExame: e.tipo_exame || 'Periódico',
          status,
          periodicidade: e.periodicidade,
          diasRestantes,
        };
      });

      setExams(examesFormatados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de exames",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateStatus = (dataProximoExame: string | null): { status: ASOExam['status']; diasRestantes: number | null } => {
    // Se não tem data de próximo exame, é PENDENTE (precisa agendar)
    if (!dataProximoExame) {
      return { status: 'PENDENTE', diasRestantes: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa

    // Normalizar data do banco (YYYY-MM-DD) sem efeito de timezone:
    // new Date('2026-04-18') é interpretado como UTC e pode virar dia anterior em fusos negativos.
    // Construir como data local explicitamente.
    const isoMatch = String(dataProximoExame).match(/^(\d{4})-(\d{2})-(\d{2})/);
    const proximoExame = isoMatch
      ? new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
      : new Date(dataProximoExame);
    proximoExame.setHours(0, 0, 0, 0);

    const diffTime = proximoExame.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'VENCIDO', diasRestantes: diffDays };
    if (diffDays <= 30) return { status: 'VENCE_30_DIAS', diasRestantes: diffDays };
    return { status: 'VALIDO', diasRestantes: diffDays };
  };


  // Capitalizar nomes
  const capitalizeWords = (str: string) => {
    if (!str || str === '-') return str;
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Lista única de lojas presentes nos exames carregados (para o filtro)
  const lojasDisponiveis = Array.from(
    new Set(exams.map(e => e.loja).filter(l => l && l !== '-'))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Filtrar exames
  const filteredExams = exams.filter(exam => {
    const matchesStatus = filterStatus === 'todos' || exam.status === filterStatus;
    const matchesTipo = filterTipoExame === 'todos' || exam.tipoExame === filterTipoExame;
    const matchesLoja = filterLoja === 'todas' || exam.loja === filterLoja;
    const matchesBuscaTexto = matchesSearch(searchTerm, [
      exam.nome,
      exam.matricula,
      exam.loja,
      exam.cargo,
      exam.cpf,
      exam.telefone,
      exam.celular,
    ]);
    return matchesStatus && matchesTipo && matchesLoja && matchesBuscaTexto;
  });

  // Função para obter a cor de risco baseada nos dias de atraso
  const getRiskGradient = (diasRestantes: number | null, status: ASOExam['status']) => {
    if (status !== 'VENCIDO' || diasRestantes === null) return '';
    const diasAtraso = Math.abs(diasRestantes);
    if (diasAtraso > 90) return 'bg-red-900/20 border-l-4 border-l-red-700';
    if (diasAtraso > 30) return 'bg-red-700/15 border-l-4 border-l-red-500';
    return 'bg-red-500/10 border-l-4 border-l-red-400';
  };

  // Ação rápida para agendar novo exame
  const handleAgendarExame = (exam: ASOExam) => {
    const prof = profissionais.find(p => p.matricula === exam.matricula);
    if (prof) {
      setFormData({
        profissional_id: prof.id,
        tipo_exame: exam.tipoExame,
        data_ultimo_exame: new Date().toISOString().split('T')[0],
        data_proximo_exame: '',
        periodicidade: exam.periodicidade || '1 ano',
      });
      setIsDialogOpen(true);
    }
  };

  const handleSave = async () => {
    if (!formData.profissional_id || !formData.data_ultimo_exame) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const profSelecionado = profissionais.find(p => p.id === formData.profissional_id);
      const nomeProfissional = profSelecionado?.nome || 'Profissional';

      const { status } = calculateStatus(formData.data_proximo_exame);

      const asoData = {
        profissional_id: formData.profissional_id,
        tipo_exame: formData.tipo_exame,
        data_ultimo_exame: formData.data_ultimo_exame,
        data_proximo_exame: formData.data_proximo_exame || null,
        periodicidade: formData.periodicidade,
        status: status.toLowerCase(),
      };

      // Verificar se já existe ASO desse tipo para o profissional
      const { data: existing } = await supabase
        .from('exames_aso')
        .select('id')
        .eq('profissional_id', formData.profissional_id)
        .eq('tipo_exame', formData.tipo_exame)
        .maybeSingle();

      let resultId: string | undefined;

      if (existing?.id) {
        const { data: updated, error } = await supabase
          .from('exames_aso')
          .update(asoData)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        resultId = updated?.id;
      } else {
        const { data: inserted, error } = await supabase
          .from('exames_aso')
          .insert(asoData)
          .select()
          .single();
        if (error) throw error;
        resultId = inserted?.id;
      }

      addLog({
        usuario: 'Sistema',
        acao: existing?.id ? 'EDITAR' : 'CRIAR',
        modulo: 'ASO',
        entidade: nomeProfissional,
        detalhes: `Exame ASO "${formData.tipo_exame}" ${existing?.id ? 'atualizado' : 'cadastrado'} para ${nomeProfissional}`,
        metadata: { id: resultId, dados_novos: formData }
      });

      toast({
        title: "Sucesso",
        description: existing?.id ? "Exame ASO atualizado com sucesso" : "Exame ASO cadastrado com sucesso"
      });

      handleCloseDialog();
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar ASO",
        description: String(error?.message || "Erro desconhecido. Tente novamente."),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      profissional_id: '',
      tipo_exame: 'Periódico',
      data_ultimo_exame: '',
      data_proximo_exame: '',
      periodicidade: '1 ano',
    });
  };

  const getStatusBadge = (status: ASOExam['status'], diasRestantes?: number | null) => {
    switch (status) {
      case 'VALIDO':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <Heart className="h-3 w-3 mr-1" />
            Válido
          </Badge>
        );
      case 'VENCE_30_DIAS':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 animate-pulse">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {diasRestantes !== null ? `Vence em ${diasRestantes}d` : 'Vence em breve'}
          </Badge>
        );
      case 'VENCIDO': {
        const diasAtraso = diasRestantes !== null ? Math.abs(diasRestantes) : 0;
        // Gradação de cor por gravidade
        const badgeClass = diasAtraso > 90 
          ? 'bg-red-900 text-white border-red-900' 
          : diasAtraso > 30 
            ? 'bg-red-700 text-white border-red-700'
            : 'bg-destructive text-destructive-foreground';
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={badgeClass}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {diasRestantes !== null ? `Vencido há ${Math.abs(diasRestantes)}d` : 'Vencido'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">
                  {diasAtraso > 90 ? '🔴 Risco Crítico - Mais de 90 dias de atraso' : 
                   diasAtraso > 30 ? '🟠 Risco Alto - Mais de 30 dias de atraso' : 
                   '🟡 Atraso Recente'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      case 'PENDENTE':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const vencendoEm30Dias = exams.filter(e => e.status === 'VENCE_30_DIAS').length;
  const vencidos = exams.filter(e => e.status === 'VENCIDO').length;
  const validos = exams.filter(e => e.status === 'VALIDO').length;
  const pendentes = exams.filter(e => e.status === 'PENDENTE').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Gestão de Exames ASO</h1>
            <Badge className="bg-success/10 text-success border-success/20">
              Dados do Sistema
            </Badge>
          </div>
          <p className="text-muted-foreground">Controle de exames ocupacionais e periódicos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar ASO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo ASO</DialogTitle>
              <DialogDescription>
                Cadastre um novo exame de saúde ocupacional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select
                  value={formData.profissional_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, profissional_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map(prof => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.matricula} - {prof.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Exame</Label>
                <Select
                  value={formData.tipo_exame}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_exame: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admissional">Admissional</SelectItem>
                    <SelectItem value="Periódico">Periódico</SelectItem>
                    <SelectItem value="Demissional">Demissional</SelectItem>
                    <SelectItem value="Mudança de Função">Mudança de Função</SelectItem>
                    <SelectItem value="Retorno ao Trabalho">Retorno ao Trabalho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data do Exame</Label>
                  <Input
                    type="date"
                    value={formData.data_ultimo_exame}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_ultimo_exame: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Próximo Exame</Label>
                  <Input
                    type="date"
                    value={formData.data_proximo_exame}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_proximo_exame: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Periodicidade</Label>
                <Select
                  value={formData.periodicidade}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, periodicidade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6 meses">6 meses</SelectItem>
                    <SelectItem value="1 ano">1 ano</SelectItem>
                    <SelectItem value="2 anos">2 anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCloseDialog} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Interativos com Destaque Visual para Críticos */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${filterStatus === 'VALIDO' ? 'ring-2 ring-success shadow-lg' : 'bg-success/5 border-success/20 hover:bg-success/10'}`}
          onClick={() => setFilterStatus(filterStatus === 'VALIDO' ? 'todos' : 'VALIDO')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <Heart className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{validos}</p>
                <p className="text-xs text-muted-foreground">Válidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${filterStatus === 'VENCE_30_DIAS' ? 'ring-2 ring-warning shadow-lg' : 'bg-warning/5 border-warning/20 hover:bg-warning/10'} ${vencendoEm30Dias > 0 ? 'shadow-warning/20 shadow-md' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'VENCE_30_DIAS' ? 'todos' : 'VENCE_30_DIAS')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full bg-warning/10 ${vencendoEm30Dias > 0 ? 'animate-pulse' : ''}`}>
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{vencendoEm30Dias}</p>
                <p className="text-xs text-muted-foreground">Vencem em 30d</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Vencidos - Destaque Visual Forte */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${filterStatus === 'VENCIDO' ? 'ring-2 ring-destructive shadow-lg' : ''} ${vencidos > 0 ? 'bg-destructive/10 border-destructive shadow-destructive/30 shadow-lg border-2' : 'bg-destructive/5 border-destructive/20'}`}
          onClick={() => setFilterStatus(filterStatus === 'VENCIDO' ? 'todos' : 'VENCIDO')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${vencidos > 0 ? 'bg-destructive/20 animate-pulse' : 'bg-destructive/10'}`}>
                <Calendar className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{vencidos}</p>
                <p className="text-xs text-muted-foreground font-medium">
                  {vencidos > 0 ? '⚠️ Vencidos' : 'Vencidos'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Pendentes - Destaque Visual */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${filterStatus === 'PENDENTE' ? 'ring-2 ring-orange-500 shadow-lg' : ''} ${pendentes > 0 ? 'bg-orange-500/10 border-orange-500/50 shadow-orange-500/20 shadow-md border-2' : 'bg-secondary/5 border-secondary/20'}`}
          onClick={() => setFilterStatus(filterStatus === 'PENDENTE' ? 'todos' : 'PENDENTE')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${pendentes > 0 ? 'bg-orange-500/20' : 'bg-secondary/10'}`}>
                <Clock className={`h-5 w-5 ${pendentes > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${pendentes > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>{pendentes}</p>
                <p className="text-xs text-muted-foreground">
                  {pendentes > 0 ? '📋 Pendentes' : 'Pendentes'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-accent/10">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{exams.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Controle de Exames ASO</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filteredExams.length} de {exams.length} exames
            </div>
          </div>
          
          {/* Filtros Avançados */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, matrícula ou loja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro por Tipo de Exame */}
            <Select value={filterTipoExame} onValueChange={setFilterTipoExame}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo de Exame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="Admissional">Admissional</SelectItem>
                <SelectItem value="Periódico">Periódico</SelectItem>
                <SelectItem value="Demissional">Demissional</SelectItem>
                <SelectItem value="Mudança de Função">Mudança de Função</SelectItem>
                <SelectItem value="Retorno ao Trabalho">Retorno ao Trabalho</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por Loja */}
            <Select value={filterLoja} onValueChange={setFilterLoja}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as lojas</SelectItem>
                {lojasDisponiveis.map(loja => (
                  <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(filterStatus !== 'todos' || filterTipoExame !== 'todos' || filterLoja !== 'todas' || searchTerm) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('todos');
                  setFilterTipoExame('todos');
                  setFilterLoja('todas');
                }}
                className="text-muted-foreground"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredExams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{exams.length === 0 ? 'Nenhum exame cadastrado' : 'Nenhum exame encontrado com os filtros aplicados'}</p>
              <p className="text-sm">{exams.length === 0 ? 'Clique em "Cadastrar ASO" para adicionar' : 'Tente ajustar os filtros'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Loja</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow 
                    key={exam.id} 
                    className={`transition-colors ${getRiskGradient(exam.diasRestantes, exam.status)} ${
                      exam.status === 'VENCE_30_DIAS' ? 'bg-warning/5 border-l-4 border-l-warning' : ''
                    }`}
                  >
                    <TableCell className="font-mono text-xs">{exam.matricula}</TableCell>
                    <TableCell className="font-medium">{capitalizeWords(exam.nome)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{exam.loja}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">{exam.tipoExame}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={exam.status === 'VENCIDO' ? 'font-medium text-destructive' : ''}>
                          {exam.dataProximoExame 
                            ? new Date(exam.dataProximoExame).toLocaleDateString('pt-BR')
                            : <span className="text-muted-foreground italic">Não agendado</span>
                          }
                        </span>
                        {exam.dataUltimoExame && (
                          <span className="text-[10px] text-muted-foreground">
                            Último: {new Date(exam.dataUltimoExame).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(exam.status, exam.diasRestantes)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAgendarExame(exam)}>
                            <CalendarPlus className="h-4 w-4 mr-2" />
                            Agendar Novo Exame
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setFormData({
                              profissional_id: profissionais.find(p => p.matricula === exam.matricula)?.id || '',
                              tipo_exame: exam.tipoExame,
                              data_ultimo_exame: new Date().toISOString().split('T')[0],
                              data_proximo_exame: '',
                              periodicidade: exam.periodicidade || '1 ano',
                            });
                            setIsDialogOpen(true);
                          }}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Registrar Renovação
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Seção: Profissionais SEM ASO cadastrado */}
      {profissionaisSemASO.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Profissionais sem ASO Cadastrado ({profissionaisSemASO.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSemASO(!showSemASO)}
              >
                {showSemASO ? 'Ocultar Lista' : 'Ver Lista Completa'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ Não conformidade trabalhista - Estes profissionais precisam de exame ocupacional
            </p>
          </CardHeader>
          
          {showSemASO && (
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Data Admissão</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profissionaisSemASO.slice(0, 50).map((prof) => (
                    <TableRow key={prof.id} className="bg-destructive/5">
                      <TableCell className="font-mono text-xs">{prof.matricula}</TableCell>
                      <TableCell className="font-medium">{prof.nome}</TableCell>
                      <TableCell>{prof.loja}</TableCell>
                      <TableCell>{prof.cargo || '-'}</TableCell>
                      <TableCell>
                        {prof.dataAdmissao 
                          ? new Date(prof.dataAdmissao).toLocaleDateString('pt-BR')
                          : <span className="text-muted-foreground">Não informada</span>
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFormData({
                              profissional_id: prof.id,
                              tipo_exame: 'Admissional',
                              data_ultimo_exame: new Date().toISOString().split('T')[0],
                              data_proximo_exame: '',
                              periodicidade: '1 ano',
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Cadastrar ASO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {profissionaisSemASO.length > 50 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Mostrando 50 de {profissionaisSemASO.length} profissionais
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {(vencendoEm30Dias > 0 || vencidos > 0) && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Vencimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vencidos > 0 && (
                <p className="text-destructive">⚠️ {vencidos} exame(s) vencido(s) - Renovação urgente necessária</p>
              )}
              {vencendoEm30Dias > 0 && (
                <p className="text-warning">🔔 {vencendoEm30Dias} exame(s) vencem nos próximos 30 dias</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}