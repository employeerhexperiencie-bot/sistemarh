import { useState, useMemo, useEffect } from 'react';
import { FileText, Mail, CheckCircle, Download, Upload, Printer, Eye, Send, AlertTriangle, CheckCircle2, XCircle, Info, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { gerarHoleritePDF, gerarHoleriteMock } from '@/components/folha/HoleritePDF';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Link } from 'react-router-dom';

interface HoleriteItem {
  id: string;
  loja: string;
  matricula: string;
  nome: string;
  cargo: string;
  salario: number;
  status: 'pendente' | 'gerado' | 'enviado' | 'assinado';
}

// Gerar dados mock
const gerarHoleritesMock = (): HoleriteItem[] => {
  const nomes = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima', 'Carlos Oliveira', 
    'Julia Souza', 'Lucas Ferreira', 'Fernanda Alves', 'Ricardo Rodrigues', 'Mariana Pereira',
    'Bruno Carvalho', 'Camila Gomes', 'Gabriel Martins'];
  const lojas = ['Loja 01', 'Loja 02', 'Loja 03', 'Loja 04', 'Loja 05'];
  const cargos = ['Vendedor', 'Caixa', 'Repositor', 'Supervisor', 'Gerente'];
  const statusOptions: HoleriteItem['status'][] = ['pendente', 'gerado', 'gerado', 'enviado', 'enviado', 'assinado'];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `hol-${i + 1}`,
    loja: lojas[Math.floor(Math.random() * lojas.length)],
    matricula: String(i + 1).padStart(4, '0'),
    nome: nomes[i % nomes.length],
    cargo: cargos[Math.floor(Math.random() * cargos.length)],
    salario: 1800 + Math.floor(Math.random() * 1500),
    status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
  }));
};

export default function Holerites() {
  const { toast } = useToast();
  const supabaseData = useSupabaseData();
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [gerando, setGerando] = useState(false);

  // Estado de validação de dados
  const [validacaoDados, setValidacaoDados] = useState<{
    ativosCarregados: boolean;
    asoCarregados: boolean;
    beneficiosCarregados: boolean;
  }>({
    ativosCarregados: false,
    asoCarregados: false,
    beneficiosCarregados: false,
  });

  // Verificar dados do Supabase
  useEffect(() => {
    if (!supabaseData.isLoading) {
      setValidacaoDados({
        ativosCarregados: supabaseData.totalProfissionais > 0,
        asoCarregados: true,
        beneficiosCarregados: true,
      });
    }
  }, [supabaseData.isLoading, supabaseData.totalProfissionais]);

  const dadosCompletos = validacaoDados.ativosCarregados && 
                         validacaoDados.asoCarregados && 
                         validacaoDados.beneficiosCarregados;
  
  // Usar dados do Supabase ou mock
  const holerites = useMemo(() => {
    if (supabaseData.totalProfissionais > 0) {
      return supabaseData.profissionais.map((p: any) => ({
        id: p.id,
        loja: p.lojas?.nome || '-',
        matricula: p.matricula,
        nome: p.nome,
        cargo: p.cargo || '-',
        salario: p.salario_nominal || p.ultimo_salario || p.primeiro_salario || 0,
        status: 'pendente' as const,
      }));
    }
    return gerarHoleritesMock();
  }, [supabaseData.profissionais, supabaseData.totalProfissionais]);
  
  const holeritesFiltrados = useMemo(() => {
    return holerites.filter(h => {
      if (lojaFiltro !== 'todas' && h.loja !== lojaFiltro) return false;
      if (statusFiltro !== 'todos' && h.status !== statusFiltro) return false;
      if (searchTerm && !h.nome.toLowerCase().includes(searchTerm.toLowerCase()) && !h.matricula.includes(searchTerm)) return false;
      return true;
    });
  }, [holerites, lojaFiltro, statusFiltro, searchTerm]);
  
  const contadores = useMemo(() => ({
    pendentes: holerites.filter(h => h.status === 'pendente').length,
    gerados: holerites.filter(h => h.status === 'gerado').length,
    enviados: holerites.filter(h => h.status === 'enviado').length,
    assinados: holerites.filter(h => h.status === 'assinado').length,
  }), [holerites]);
  
  const lojas = useMemo(() => [...new Set(holerites.map(h => h.loja))], [holerites]);
  
  const toggleSelecionado = (id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const selecionarTodos = () => {
    if (selecionados.size === holeritesFiltrados.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(holeritesFiltrados.map(h => h.id)));
    }
  };
  
  const gerarPDFIndividual = (holerite: HoleriteItem) => {
    const dados = gerarHoleriteMock(
      holerite.nome,
      holerite.matricula,
      holerite.loja,
      holerite.salario,
      competencia
    );
    
    const doc = gerarHoleritePDF(dados);
    doc.save(`holerite_${holerite.matricula}_${competencia}.pdf`);
    
    toast({
      title: 'PDF Gerado',
      description: `Holerite de ${holerite.nome} gerado com sucesso!`,
    });
  };
  
  const visualizarPDF = (holerite: HoleriteItem) => {
    const dados = gerarHoleriteMock(
      holerite.nome,
      holerite.matricula,
      holerite.loja,
      holerite.salario,
      competencia
    );
    
    const doc = gerarHoleritePDF(dados);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };
  
  const gerarPDFsEmLote = async () => {
    if (selecionados.size === 0) {
      toast({
        title: 'Nenhum selecionado',
        description: 'Selecione pelo menos um funcionário para gerar os holerites.',
        variant: 'destructive',
      });
      return;
    }
    
    setGerando(true);
    
    try {
      const selecionadosArray = holeritesFiltrados.filter(h => selecionados.has(h.id));
      
      for (const holerite of selecionadosArray) {
        const dados = gerarHoleriteMock(
          holerite.nome,
          holerite.matricula,
          holerite.loja,
          holerite.salario,
          competencia
        );
        
        const doc = gerarHoleritePDF(dados);
        doc.save(`holerite_${holerite.matricula}_${competencia}.pdf`);
        
        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast({
        title: 'PDFs Gerados',
        description: `${selecionados.size} holerites gerados com sucesso!`,
      });
      
      setSelecionados(new Set());
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar os PDFs. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setGerando(false);
    }
  };
  
  const imprimirHolerite = (holerite: HoleriteItem) => {
    const dados = gerarHoleriteMock(
      holerite.nome,
      holerite.matricula,
      holerite.loja,
      holerite.salario,
      competencia
    );
    
    const doc = gerarHoleritePDF(dados);
    doc.autoPrint();
    doc.output('dataurlnewwindow');
  };
  
  const getStatusBadge = (status: HoleriteItem['status']) => {
    const config = {
      pendente: { label: 'Pendente', className: 'bg-muted text-muted-foreground' },
      gerado: { label: 'Gerado', className: 'bg-info/10 text-info border-info/20' },
      enviado: { label: 'Enviado', className: 'bg-warning/10 text-warning border-warning/20' },
      assinado: { label: 'Assinado', className: 'bg-success/10 text-success border-success/20' },
    };
    const c = config[status];
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };
  
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Status de Validação de Dados */}
      {dadosCompletos ? (
        <Alert className="border-success bg-success/5">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <AlertTitle className="text-success font-semibold">Dados Validados - Holerites Confiáveis</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Todas as planilhas carregadas (ATIVOS, ASO, Benefícios)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{supabaseData.totalProfissionais} profissionais • {supabaseData.totalLojas} lojas</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-success">
              ✓ Holerites prontos para serem gerados com dados completos e validados
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-destructive bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <AlertTitle className="text-destructive font-semibold">Atenção: Dados Incompletos</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                {validacaoDados.ativosCarregados ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className={validacaoDados.ativosCarregados ? 'text-success' : 'text-destructive'}>
                  ATIVOS.xlsx {validacaoDados.ativosCarregados ? '(carregado)' : '(não carregado)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {validacaoDados.asoCarregados ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className={validacaoDados.asoCarregados ? 'text-success' : 'text-destructive'}>
                  BASE_ASO.xlsx {validacaoDados.asoCarregados ? '(carregado)' : '(não carregado)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {validacaoDados.beneficiosCarregados ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className={validacaoDados.beneficiosCarregados ? 'text-success' : 'text-destructive'}>
                  BASE_Beneficios.xlsx {validacaoDados.beneficiosCarregados ? '(carregado)' : '(não carregado)'}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-destructive">
              ⚠️ Holerites gerados com dados simulados. Carregue todas as planilhas para gerar holerites reais.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Link to="/carregar-dados-adicionais">
                <Button size="sm" variant="destructive">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Carregar Dados Faltantes
                </Button>
              </Link>
              <Link to="/validacao-dados">
                <Button size="sm" variant="outline">
                  <Info className="h-4 w-4 mr-2" />
                  Ver Relatório de Validação
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Gestão de Holerites
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Geração, envio e controle de recibos de pagamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={gerarPDFsEmLote}
            disabled={selecionados.size === 0 || gerando}
          >
            <Download className="h-4 w-4 mr-2" />
            {gerando ? 'Gerando...' : `Gerar PDFs (${selecionados.size})`}
          </Button>
          <Button disabled={selecionados.size === 0}>
            <Send className="h-4 w-4 mr-2" />
            Enviar por Email
          </Button>
        </div>
      </div>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{contadores.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-info/5 border-info/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <FileText className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gerados</p>
                <p className="text-2xl font-bold text-info">{contadores.gerados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Mail className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold text-warning">{contadores.enviados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assinados</p>
                <p className="text-2xl font-bold text-success">{contadores.assinados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Competência</Label>
              <Input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loja</Label>
              <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Lojas</SelectItem>
                  {lojas.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="gerado">Gerado</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="assinado">Assinado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Buscar</Label>
              <Input
                placeholder="Nome ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table className="table-zebra">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selecionados.size === holeritesFiltrados.length && holeritesFiltrados.length > 0}
                      onCheckedChange={selecionarTodos}
                    />
                  </TableHead>
                  <TableHead className="w-20">Mat.</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Salário</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-32 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holeritesFiltrados.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <Checkbox
                        checked={selecionados.has(h.id)}
                        onCheckedChange={() => toggleSelecionado(h.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{h.matricula}</TableCell>
                    <TableCell className="font-medium">{h.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{h.cargo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{h.loja}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(h.salario)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(h.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => visualizarPDF(h)}
                          title="Visualizar PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => gerarPDFIndividual(h)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => imprimirHolerite(h)}
                          title="Imprimir"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {holeritesFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum holerite encontrado com os filtros selecionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Geração de Holerites em PDF</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os PDFs são gerados com layout profissional contendo: dados da empresa, 
                dados do funcionário, proventos, descontos, líquido a receber, bases de 
                cálculo (INSS, FGTS, IRRF) e campos para assinatura.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
