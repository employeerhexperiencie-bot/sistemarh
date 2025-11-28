import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calculator, DollarSign, Calendar, Bus, Utensils, 
  TrendingDown, TrendingUp, Users, CheckCircle, XCircle, Info,
  FileText, Store, Download, Filter, Building2
} from 'lucide-react';

// Função de arredondamento conforme regra do sistema
const arredondarValor = (valor: number): number => {
  const centavos = valor % 1;
  if (centavos >= 0.50) {
    return Math.ceil(valor);
  }
  return Math.floor(valor);
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface Loja {
  id: string;
  nome: string;
  codigo: string;
}

interface Profissional {
  id: string;
  nome: string;
  matricula: string;
  lojaId: string;
  salario: number;
  escala: '6x1' | '5x2';
  valorPassagem: number;
  dataAdmissao: string;
  status: 'ativo' | 'ferias' | 'afastado_acidente' | 'afastado_doenca' | 'licenca_maternidade';
  recebeCesta: boolean;
  recebeVT: boolean;
  recebeVR: boolean;
  // Descontos do mês
  faltas: number;
  atestados: number;
  diasFerias: number;
  vales: number;
  emprestimos: number;
  pensao: number;
}

// Mock de 20 lojas
const mockLojas: Loja[] = Array.from({ length: 20 }, (_, i) => ({
  id: `loja-${i + 1}`,
  nome: `Loja ${String(i + 1).padStart(2, '0')}`,
  codigo: String(i + 1).padStart(3, '0'),
}));

// Mock de profissionais (13 por loja = 260 total)
const gerarProfissionais = (): Profissional[] => {
  const nomes = ['João', 'Maria', 'Ana', 'Pedro', 'Carlos', 'Julia', 'Lucas', 'Fernanda', 'Ricardo', 'Mariana', 'Bruno', 'Camila', 'Gabriel'];
  const sobrenomes = ['Silva', 'Santos', 'Costa', 'Lima', 'Oliveira', 'Souza', 'Ferreira', 'Alves', 'Rodrigues', 'Pereira', 'Carvalho', 'Gomes', 'Martins'];
  const statusOptions: Profissional['status'][] = ['ativo', 'ativo', 'ativo', 'ativo', 'ativo', 'ativo', 'ativo', 'ativo', 'ferias', 'afastado_doenca', 'licenca_maternidade', 'ativo', 'ativo'];
  
  const profissionais: Profissional[] = [];
  let matriculaCounter = 1;
  
  mockLojas.forEach((loja) => {
    for (let i = 0; i < 13; i++) {
      const nome = nomes[i];
      const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
      const salario = 1800 + Math.floor(Math.random() * 700);
      const status = statusOptions[i];
      
      profissionais.push({
        id: `prof-${matriculaCounter}`,
        nome: `${nome} ${sobrenome}`,
        matricula: String(matriculaCounter).padStart(4, '0'),
        lojaId: loja.id,
        salario,
        escala: Math.random() > 0.3 ? '6x1' : '5x2',
        valorPassagem: 4.40,
        dataAdmissao: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        status,
        recebeCesta: true,
        recebeVT: status === 'ativo',
        recebeVR: status === 'ativo',
        faltas: Math.floor(Math.random() * 3),
        atestados: Math.floor(Math.random() * 2),
        diasFerias: status === 'ferias' ? 30 : 0,
        vales: Math.random() > 0.7 ? Math.floor(Math.random() * 200) : 0,
        emprestimos: Math.random() > 0.8 ? Math.floor(Math.random() * 300) : 0,
        pensao: Math.random() > 0.95 ? Math.floor(Math.random() * 400) : 0,
      });
      matriculaCounter++;
    }
  });
  
  return profissionais;
};

const mockProfissionais = gerarProfissionais();

// Função para calcular valores de um profissional
const calcularProfissional = (
  p: Profissional,
  diasUteis6x1: number,
  diasUteis5x2: number,
  valorVR: number,
  percentualDia20: number,
  competencia: string
) => {
  const diasUteis = p.escala === '6x1' ? diasUteis6x1 : diasUteis5x2;
  const diasAbatidos = p.faltas + p.atestados + p.diasFerias;
  const diasTrabalhados = Math.max(0, diasUteis - diasAbatidos);
  const valorDia = p.salario / 30;
  
  // === PAGAMENTO DIA 20 ===
  let valorDia20 = 0;
  let recebeDia20 = true;
  let motivoDia20 = '';
  
  const dataAdmissao = new Date(p.dataAdmissao);
  const mesCompetencia = new Date(competencia + '-01');
  const mesmaCompetencia = dataAdmissao.getMonth() === mesCompetencia.getMonth() && 
                          dataAdmissao.getFullYear() === mesCompetencia.getFullYear();
  
  if (mesmaCompetencia && dataAdmissao.getDate() > 10) {
    recebeDia20 = false;
    motivoDia20 = 'Admitido após dia 10';
  } else if (p.status === 'ferias') {
    recebeDia20 = false;
    motivoDia20 = 'Em férias';
  } else if (p.status === 'afastado_acidente') {
    recebeDia20 = false;
    motivoDia20 = 'Afastado acidente';
  } else if (p.faltas >= 10) {
    recebeDia20 = false;
    motivoDia20 = '+10 faltas';
  } else if (mesmaCompetencia && dataAdmissao.getDate() <= 10) {
    valorDia20 = arredondarValor(p.salario * 0.40);
    motivoDia20 = 'Admitido no mês';
  } else {
    valorDia20 = arredondarValor(p.salario * (percentualDia20 / 100));
    motivoDia20 = `${percentualDia20}%`;
  }
  
  // === VT ===
  let valorVT = 0;
  if (p.recebeVT && p.status === 'ativo') {
    valorVT = arredondarValor(diasTrabalhados * 2 * p.valorPassagem);
  }
  
  // === VR ===
  let valorVRTotal = 0;
  if (p.recebeVR && p.status === 'ativo') {
    valorVRTotal = arredondarValor(diasTrabalhados * valorVR);
  }
  
  // === CESTA ===
  let recebeCesta = p.recebeCesta;
  if (p.faltas > 0) recebeCesta = false;
  if (mesmaCompetencia && dataAdmissao.getDate() > 15) recebeCesta = false;
  
  // === DESCONTOS ===
  const descontoFaltas = arredondarValor(p.faltas * valorDia);
  const totalDescontos = p.vales + p.emprestimos + p.pensao + descontoFaltas;
  
  // === DIA 5 ===
  const salarioBruto = p.salario - descontoFaltas;
  const salarioLiquido = arredondarValor(salarioBruto - (recebeDia20 ? valorDia20 : 0) - totalDescontos + descontoFaltas);
  
  return {
    diasTrabalhados,
    recebeDia20,
    valorDia20: recebeDia20 ? valorDia20 : 0,
    motivoDia20,
    valorVT,
    valorVR: valorVRTotal,
    recebeCesta,
    descontoFaltas,
    totalDescontos,
    salarioLiquido: Math.max(0, salarioLiquido),
    totalMes: arredondarValor((recebeDia20 ? valorDia20 : 0) + Math.max(0, salarioLiquido) + valorVT + valorVRTotal),
  };
};

export default function SimuladorFolha() {
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [diasUteis6x1, setDiasUteis6x1] = useState(26);
  const [diasUteis5x2, setDiasUteis5x2] = useState(22);
  const [valorVR, setValorVR] = useState(25);
  const [percentualDia20, setPercentualDia20] = useState(40);
  const [lojaSelecionada, setLojaSelecionada] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Profissionais filtrados
  const profissionaisFiltrados = useMemo(() => {
    return mockProfissionais.filter(p => {
      if (lojaSelecionada !== 'todas' && p.lojaId !== lojaSelecionada) return false;
      if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false;
      return true;
    });
  }, [lojaSelecionada, filtroStatus]);

  // Cálculos em lote
  const calculosLote = useMemo(() => {
    return profissionaisFiltrados.map(p => ({
      profissional: p,
      loja: mockLojas.find(l => l.id === p.lojaId),
      ...calcularProfissional(p, diasUteis6x1, diasUteis5x2, valorVR, percentualDia20, competencia),
    }));
  }, [profissionaisFiltrados, diasUteis6x1, diasUteis5x2, valorVR, percentualDia20, competencia]);

  // Resumo por loja
  const resumoPorLoja = useMemo(() => {
    const resumo: Record<string, {
      loja: Loja;
      qtdFuncionarios: number;
      totalDia20: number;
      totalDia5: number;
      totalVT: number;
      totalVR: number;
      totalGeral: number;
      funcionariosAtivos: number;
      funcionariosFerias: number;
      funcionariosAfastados: number;
    }> = {};

    mockLojas.forEach(loja => {
      resumo[loja.id] = {
        loja,
        qtdFuncionarios: 0,
        totalDia20: 0,
        totalDia5: 0,
        totalVT: 0,
        totalVR: 0,
        totalGeral: 0,
        funcionariosAtivos: 0,
        funcionariosFerias: 0,
        funcionariosAfastados: 0,
      };
    });

    calculosLote.forEach(c => {
      const r = resumo[c.profissional.lojaId];
      if (r) {
        r.qtdFuncionarios++;
        r.totalDia20 += c.valorDia20;
        r.totalDia5 += c.salarioLiquido;
        r.totalVT += c.valorVT;
        r.totalVR += c.valorVR;
        r.totalGeral += c.totalMes;
        
        if (c.profissional.status === 'ativo') r.funcionariosAtivos++;
        else if (c.profissional.status === 'ferias') r.funcionariosFerias++;
        else r.funcionariosAfastados++;
      }
    });

    return Object.values(resumo);
  }, [calculosLote]);

  // Totais gerais
  const totaisGerais = useMemo(() => {
    return resumoPorLoja.reduce((acc, r) => ({
      totalDia20: acc.totalDia20 + r.totalDia20,
      totalDia5: acc.totalDia5 + r.totalDia5,
      totalVT: acc.totalVT + r.totalVT,
      totalVR: acc.totalVR + r.totalVR,
      totalGeral: acc.totalGeral + r.totalGeral,
      funcionarios: acc.funcionarios + r.qtdFuncionarios,
    }), { totalDia20: 0, totalDia5: 0, totalVT: 0, totalVR: 0, totalGeral: 0, funcionarios: 0 });
  }, [resumoPorLoja]);

  const getStatusBadge = (status: Profissional['status']) => {
    const config: Record<string, { label: string; className: string }> = {
      ativo: { label: 'Ativo', className: 'bg-success/10 text-success border-success/20' },
      ferias: { label: 'Férias', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      afastado_acidente: { label: 'Af. Acidente', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      afastado_doenca: { label: 'Af. Doença', className: 'bg-warning/10 text-warning border-warning/20' },
      licenca_maternidade: { label: 'Maternidade', className: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
    };
    const c = config[status] || config.ativo;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const exportarCSV = () => {
    const headers = ['Loja', 'Matrícula', 'Nome', 'Status', 'Salário', 'Dia 20', 'Dia 5', 'VT', 'VR', 'Total'];
    const rows = calculosLote.map(c => [
      c.loja?.nome || '',
      c.profissional.matricula,
      c.profissional.nome,
      c.profissional.status,
      c.profissional.salario,
      c.valorDia20,
      c.salarioLiquido,
      c.valorVT,
      c.valorVR,
      c.totalMes,
    ]);
    
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `folha_${competencia}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Simulador de Folha</h1>
          <p className="text-muted-foreground text-sm">20 lojas • {mockProfissionais.length} funcionários</p>
        </div>
        <Button onClick={exportarCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Cards de Resumo Geral */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-success mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Dia 20</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totaisGerais.totalDia20)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Dia 5</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totaisGerais.totalDia5)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Bus className="h-4 w-4" />
              <span className="text-xs font-medium">Total VT</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totaisGerais.totalVT)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-500 mb-1">
              <Utensils className="h-4 w-4" />
              <span className="text-xs font-medium">Total VR</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totaisGerais.totalVR)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-500 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Total Geral</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totaisGerais.totalGeral)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Funcionários</span>
            </div>
            <p className="text-xl font-bold">{totaisGerais.funcionarios}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lojas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lojas" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Por Loja
          </TabsTrigger>
          <TabsTrigger value="funcionarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Por Funcionário
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* VISÃO POR LOJA */}
        <TabsContent value="lojas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-5 w-5" />
                Resumo por Loja - {competencia}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Loja</TableHead>
                      <TableHead className="text-center">Func.</TableHead>
                      <TableHead className="text-center">Ativos</TableHead>
                      <TableHead className="text-center">Férias</TableHead>
                      <TableHead className="text-center">Afast.</TableHead>
                      <TableHead className="text-right">Dia 20</TableHead>
                      <TableHead className="text-right">Dia 5</TableHead>
                      <TableHead className="text-right">VT</TableHead>
                      <TableHead className="text-right">VR</TableHead>
                      <TableHead className="text-right font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumoPorLoja.map((r) => (
                      <TableRow key={r.loja.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{r.loja.nome}</TableCell>
                        <TableCell className="text-center">{r.qtdFuncionarios}</TableCell>
                        <TableCell className="text-center text-success">{r.funcionariosAtivos}</TableCell>
                        <TableCell className="text-center text-blue-500">{r.funcionariosFerias}</TableCell>
                        <TableCell className="text-center text-warning">{r.funcionariosAfastados}</TableCell>
                        <TableCell className="text-right text-success">{formatCurrency(r.totalDia20)}</TableCell>
                        <TableCell className="text-right text-primary">{formatCurrency(r.totalDia5)}</TableCell>
                        <TableCell className="text-right text-blue-500">{formatCurrency(r.totalVT)}</TableCell>
                        <TableCell className="text-right text-orange-500">{formatCurrency(r.totalVR)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(r.totalGeral)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Linha de Total */}
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell>TOTAL GERAL</TableCell>
                      <TableCell className="text-center">{totaisGerais.funcionarios}</TableCell>
                      <TableCell className="text-center">-</TableCell>
                      <TableCell className="text-center">-</TableCell>
                      <TableCell className="text-center">-</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(totaisGerais.totalDia20)}</TableCell>
                      <TableCell className="text-right text-primary">{formatCurrency(totaisGerais.totalDia5)}</TableCell>
                      <TableCell className="text-right text-blue-500">{formatCurrency(totaisGerais.totalVT)}</TableCell>
                      <TableCell className="text-right text-orange-500">{formatCurrency(totaisGerais.totalVR)}</TableCell>
                      <TableCell className="text-right text-primary text-lg">{formatCurrency(totaisGerais.totalGeral)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VISÃO POR FUNCIONÁRIO */}
        <TabsContent value="funcionarios" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Loja:</Label>
                  <Select value={lojaSelecionada} onValueChange={setLojaSelecionada}>
                    <SelectTrigger className="w-[150px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Lojas</SelectItem>
                      {mockLojas.map(loja => (
                        <SelectItem key={loja.id} value={loja.id}>{loja.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Status:</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativo">Ativos</SelectItem>
                      <SelectItem value="ferias">Férias</SelectItem>
                      <SelectItem value="afastado_doenca">Af. Doença</SelectItem>
                      <SelectItem value="afastado_acidente">Af. Acidente</SelectItem>
                      <SelectItem value="licenca_maternidade">Maternidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="secondary">{profissionaisFiltrados.length} funcionários</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="bg-muted/50">
                      <TableHead>Loja</TableHead>
                      <TableHead>Mat.</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Salário</TableHead>
                      <TableHead className="text-center">Faltas</TableHead>
                      <TableHead className="text-right">Dia 20</TableHead>
                      <TableHead className="text-right">Dia 5</TableHead>
                      <TableHead className="text-right">VT</TableHead>
                      <TableHead className="text-right">VR</TableHead>
                      <TableHead className="text-right font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculosLote.map((c) => (
                      <TableRow key={c.profissional.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs text-muted-foreground">{c.loja?.codigo}</TableCell>
                        <TableCell className="font-mono text-xs">{c.profissional.matricula}</TableCell>
                        <TableCell className="font-medium text-sm">{c.profissional.nome}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(c.profissional.status)}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(c.profissional.salario)}</TableCell>
                        <TableCell className="text-center">
                          {c.profissional.faltas > 0 ? (
                            <Badge variant="destructive" className="text-xs">{c.profissional.faltas}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={c.recebeDia20 ? 'text-success' : 'text-muted-foreground'}>
                            {formatCurrency(c.valorDia20)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-primary">{formatCurrency(c.salarioLiquido)}</TableCell>
                        <TableCell className="text-right text-blue-500">{formatCurrency(c.valorVT)}</TableCell>
                        <TableCell className="text-right text-orange-500">{formatCurrency(c.valorVR)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(c.totalMes)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONFIGURAÇÕES */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Configurações da Competência
              </CardTitle>
              <CardDescription>Parâmetros do mês para os cálculos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Competência</Label>
                  <Input
                    type="month"
                    value={competencia}
                    onChange={(e) => setCompetencia(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dias Úteis (6x1)</Label>
                  <Input
                    type="number"
                    value={diasUteis6x1}
                    onChange={(e) => setDiasUteis6x1(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dias Úteis (5x2)</Label>
                  <Input
                    type="number"
                    value={diasUteis5x2}
                    onChange={(e) => setDiasUteis5x2(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor VR/dia</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorVR}
                    onChange={(e) => setValorVR(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>% Dia 20</Label>
                  <Input
                    type="number"
                    value={percentualDia20}
                    onChange={(e) => setPercentualDia20(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regras */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Regras de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <h4 className="font-semibold text-primary mb-1">Arredondamento</h4>
                <p>• ≥ R$ 0,50 → CIMA | &lt; R$ 0,50 → BAIXO</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-warning mb-1">Dia 20</h4>
                <p>• Admitidos até dia 10: 40% | Férias: não recebe | +10 faltas: não recebe</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-destructive mb-1">Cesta Básica</h4>
                <p>• Falta injustificada: perde | Admissão após dia 15: não tem direito</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
