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
import { FileUploader } from '@/components/FileUploader';
import { Heart, AlertTriangle, Calendar, Upload, FileText, Plus, Eye, Search, Filter, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuditLog } from '@/contexts/AuditLogContext';

interface ASOExam {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  cargo: string;
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
  lojas?: { nome: string } | null;
}

export default function GestaoASO() {
  const [exams, setExams] = useState<ASOExam[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
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
          profissionais(id, matricula, nome, cargo, lojas(nome))
        `)
        .order('data_proximo_exame', { ascending: true });

      if (examesError) throw examesError;

      // Carregar profissionais para o formulário
      const { data: profsData, error: profsError } = await supabase
        .from('profissionais')
        .select('id, matricula, nome, cargo, lojas(nome)')
        .eq('status', 'ativo')
        .order('nome');

      if (profsError) throw profsError;

      setProfissionais(profsData || []);

      // Formatar dados dos exames
      const examesFormatados: ASOExam[] = (examesData || []).map((e: any) => {
        const { status, diasRestantes } = calculateStatus(e.data_proximo_exame);
        return {
          id: e.id,
          matricula: e.profissionais?.matricula || '-',
          nome: e.profissionais?.nome || '-',
          loja: e.profissionais?.lojas?.nome || '-',
          cargo: e.profissionais?.cargo || '-',
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
    
    const proximoExame = new Date(dataProximoExame);
    proximoExame.setHours(0, 0, 0, 0);
    
    const diffTime = proximoExame.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

  // Filtrar exames
  const filteredExams = exams.filter(exam => {
    const matchesStatus = filterStatus === 'todos' || exam.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      exam.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.loja.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSave = async () => {
    if (!formData.profissional_id || !formData.data_ultimo_exame) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Encontrar nome do profissional selecionado
      const profSelecionado = profissionais.find(p => p.id === formData.profissional_id);
      const nomeProfissional = profSelecionado?.nome || 'Profissional';

      const { status } = calculateStatus(formData.data_proximo_exame);
      const { data: insertedData, error } = await supabase.from('exames_aso').insert({
        profissional_id: formData.profissional_id,
        tipo_exame: formData.tipo_exame,
        data_ultimo_exame: formData.data_ultimo_exame,
        data_proximo_exame: formData.data_proximo_exame || null,
        periodicidade: formData.periodicidade,
        status: status.toLowerCase(),
      }).select().single();

      if (error) throw error;

      // Registrar atividade
      addLog({
        usuario: 'Sistema',
        acao: 'CRIAR',
        modulo: 'ASO',
        entidade: nomeProfissional,
        detalhes: `Exame ASO "${formData.tipo_exame}" cadastrado para ${nomeProfissional}`,
        metadata: { 
          id: insertedData?.id,
          dados_novos: formData
        }
      });

      toast({
        title: "Sucesso",
        description: "Exame ASO cadastrado com sucesso"
      });

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar exame",
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
        return <Badge className="bg-success/10 text-success border-success/20">Válido</Badge>;
      case 'VENCE_30_DIAS':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            {diasRestantes !== null ? `Vence em ${diasRestantes} dias` : 'Vence em breve'}
          </Badge>
        );
      case 'VENCIDO':
        return (
          <Badge variant="destructive">
            {diasRestantes !== null ? `Vencido há ${Math.abs(diasRestantes)} dias` : 'Vencido'}
          </Badge>
        );
      case 'PENDENTE':
        return <Badge variant="secondary">Pendente</Badge>;
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'VALIDO' ? 'ring-2 ring-success' : 'bg-success/5 border-success/20'}`}
          onClick={() => setFilterStatus(filterStatus === 'VALIDO' ? 'todos' : 'VALIDO')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{validos}</p>
                <p className="text-xs text-muted-foreground">Válidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'VENCE_30_DIAS' ? 'ring-2 ring-warning' : 'bg-warning/5 border-warning/20'}`}
          onClick={() => setFilterStatus(filterStatus === 'VENCE_30_DIAS' ? 'todos' : 'VENCE_30_DIAS')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{vencendoEm30Dias}</p>
                <p className="text-xs text-muted-foreground">Vencem em 30d</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'VENCIDO' ? 'ring-2 ring-destructive' : 'bg-destructive/5 border-destructive/20'}`}
          onClick={() => setFilterStatus(filterStatus === 'VENCIDO' ? 'todos' : 'VENCIDO')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{vencidos}</p>
                <p className="text-xs text-muted-foreground">Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'PENDENTE' ? 'ring-2 ring-secondary' : 'bg-secondary/5 border-secondary/20'}`}
          onClick={() => setFilterStatus(filterStatus === 'PENDENTE' ? 'todos' : 'PENDENTE')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{pendentes}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-accent" />
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
          
          {/* Filtro de Busca */}
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
            
            {(filterStatus !== 'todos' || searchTerm) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('todos');
                }}
                className="text-muted-foreground"
              >
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
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Loja</TableHead>
                  <TableHead className="hidden lg:table-cell">Cargo</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Último Exame</TableHead>
                  <TableHead>Próximo Exame</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id} className={exam.status === 'VENCIDO' ? 'bg-destructive/5' : exam.status === 'VENCE_30_DIAS' ? 'bg-warning/5' : ''}>
                    <TableCell className="font-mono text-xs">{exam.matricula}</TableCell>
                    <TableCell className="font-medium">{capitalizeWords(exam.nome)}</TableCell>
                    <TableCell className="hidden md:table-cell">{exam.loja}</TableCell>
                    <TableCell className="hidden lg:table-cell">{exam.cargo || '-'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{exam.tipoExame}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {exam.dataUltimoExame 
                        ? new Date(exam.dataUltimoExame).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {exam.dataProximoExame 
                        ? new Date(exam.dataProximoExame).toLocaleDateString('pt-BR')
                        : <span className="text-muted-foreground">Não agendado</span>
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(exam.status, exam.diasRestantes)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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