import { useState, useMemo, useEffect } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calculator, DollarSign, Calendar, Bus, Utensils, 
  TrendingUp, Users, Building2, Download, Settings2, FileSpreadsheet,
  FileText, Gift, Banknote, AlertTriangle, CheckCircle2, XCircle, Info
} from 'lucide-react';
import { RelatorioFolha } from '@/components/folha/RelatorioFolha';
import { DecimoTerceiro } from '@/components/folha/DecimoTerceiro';
import { GestaoEmprestimos } from '@/components/folha/GestaoEmprestimos';
import { AdiantamentoSalario } from '@/components/folha/AdiantamentoSalario';
import { useMockData } from '@/hooks/useMockData';
import { Link } from 'react-router-dom';

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
  
  let valorVT = 0;
  if (p.recebeVT && p.status === 'ativo') {
    valorVT = arredondarValor(diasTrabalhados * 2 * p.valorPassagem);
  }
  
  let valorVRTotal = 0;
  if (p.recebeVR && p.status === 'ativo') {
    valorVRTotal = arredondarValor(diasTrabalhados * valorVR);
  }
  
  let recebeCesta = p.recebeCesta;
  if (p.faltas > 0) recebeCesta = false;
  if (mesmaCompetencia && dataAdmissao.getDate() > 15) recebeCesta = false;
  
  const descontoFaltas = arredondarValor(p.faltas * valorDia);
  const totalDescontos = p.vales + p.emprestimos + p.pensao + descontoFaltas;
  
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

// Summary Card Component
function SummaryCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-lg font-bold tracking-tight">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SimuladorFolha() {
  const mockData = useMockData();
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

  // Estado de validação de dados
  const [validacaoDados, setValidacaoDados] = useState<{
    ativosCarregados: boolean;
    asoCarregados: boolean;
    beneficiosCarregados: boolean;
    timestampAtivos: string | null;
    timestampASO: string | null;
    timestampBeneficios: string | null;
  }>({
    ativosCarregados: false,
    asoCarregados: false,
    beneficiosCarregados: false,
    timestampAtivos: null,
    timestampASO: null,
    timestampBeneficios: null,
  });

  // Verificar dados carregados
  useEffect(() => {
    const profissionaisStr = localStorage.getItem('profissionaisImportados');
    const dadosASOStr = localStorage.getItem('dadosASO');
    const dadosBeneficiosStr = localStorage.getItem('dadosBeneficios');
    
    const timestampAtivos = localStorage.getItem('profissionaisImportados_timestamp');
    const timestampASO = localStorage.getItem('dadosASO_timestamp');
    const timestampBeneficios = localStorage.getItem('dadosBeneficios_timestamp');

    setValidacaoDados({
      ativosCarregados: !!profissionaisStr,
      asoCarregados: !!dadosASOStr,
      beneficiosCarregados: !!dadosBeneficiosStr,
      timestampAtivos,
      timestampASO,
      timestampBeneficios,
    });
  }, []);

  const dadosCompletos = validacaoDados.ativosCarregados && 
                         validacaoDados.asoCarregados && 
                         validacaoDados.beneficiosCarregados;

  // Se tiver dados da planilha, usa eles, senão usa mock
  const profissionais = mockData.hasMockData 
    ? mockData.profissionais.map((p, index) => {
        const salario = mockData.parseSalario(p.salarioReceber || p.salarioCTPS);
        const lojaIndex = mockData.lojas.indexOf(p.localTrabalho);
        return {
          id: p.matricula,
          nome: p.nome,
          matricula: p.matricula,
          lojaId: lojaIndex >= 0 ? `loja-${lojaIndex + 1}` : p.localTrabalho,
          salario,
          escala: (p.escala?.includes('6') ? '6x1' : '5x2') as '6x1' | '5x2',
          valorPassagem: 4.40,
          dataAdmissao: p.admissaoCTPS || '2020-01-01',
          status: 'ativo' as const,
          recebeCesta: true,
          recebeVT: true,
          recebeVR: true,
          faltas: 0,
          atestados: 0,
          diasFerias: 0,
          vales: 0,
          emprestimos: 0,
          pensao: p.pensao === 'SIM' ? salario * 0.30 : 0,
        };
      })
    : mockProfissionais;

  const lojas = mockData.hasMockData
    ? mockData.lojas.map((nome, index) => ({
        id: `loja-${index + 1}`,
        nome: nome,
        codigo: String(index + 1).padStart(3, '0'),
      }))
    : mockLojas;

  const profissionaisFiltrados = useMemo(() => {
    return profissionais.filter(p => {
      if (lojaSelecionada !== 'todas' && p.lojaId !== lojaSelecionada) return false;
      if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false;
      return true;
    });
  }, [lojaSelecionada, filtroStatus, profissionais]);

  const calculosLote = useMemo(() => {
    return profissionaisFiltrados.map(p => ({
      profissional: p,
      loja: lojas.find(l => l.id === p.lojaId),
      ...calcularProfissional(p, diasUteis6x1, diasUteis5x2, valorVR, percentualDia20, competencia),
    }));
  }, [profissionaisFiltrados, diasUteis6x1, diasUteis5x2, valorVR, percentualDia20, competencia, lojas]);

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

    lojas.forEach(loja => {
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
      ferias: { label: 'Férias', className: 'bg-info/10 text-info border-info/20' },
      afastado_acidente: { label: 'Af. Acidente', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      afastado_doenca: { label: 'Af. Doença', className: 'bg-warning/10 text-warning border-warning/20' },
      licenca_maternidade: { label: 'Maternidade', className: 'bg-accent/10 text-accent border-accent/20' },
    };
    const c = config[status] || config.ativo;
    return <Badge variant="outline" className={`${c.className} text-xs`}>{c.label}</Badge>;
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
      {/* Status de Validação de Dados */}
      {dadosCompletos ? (
        <Alert className="border-success bg-success/5">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <AlertTitle className="text-success font-semibold">Dados Validados e Completos</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>ATIVOS.xlsx: {mockData.totalProfissionais} profissionais • {mockData.totalLojas} lojas</span>
                {validacaoDados.timestampAtivos && (
                  <span className="text-xs text-muted-foreground">
                    (Carregado: {new Date(validacaoDados.timestampAtivos).toLocaleString('pt-BR')})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>BASE_ASO.xlsx carregado</span>
                {validacaoDados.timestampASO && (
                  <span className="text-xs text-muted-foreground">
                    (Carregado: {new Date(validacaoDados.timestampASO).toLocaleString('pt-BR')})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>BASE_Beneficios.xlsx carregado</span>
                {validacaoDados.timestampBeneficios && (
                  <span className="text-xs text-muted-foreground">
                    (Carregado: {new Date(validacaoDados.timestampBeneficios).toLocaleString('pt-BR')})
                  </span>
                )}
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-success">
              ✓ Sistema pronto para gerar folha de pagamento e holerites confiáveis
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-destructive bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <AlertTitle className="text-destructive font-semibold">Dados Incompletos - Ação Necessária</AlertTitle>
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Simulador de Folha</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lojas.length} lojas • {profissionais.length} funcionários
          </p>
        </div>
        <Button onClick={exportarCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
        <SummaryCard
          icon={Calendar}
          label="Dia 20"
          value={formatCurrency(totaisGerais.totalDia20)}
          color="bg-success/10 text-success"
        />
        <SummaryCard
          icon={DollarSign}
          label="Dia 5"
          value={formatCurrency(totaisGerais.totalDia5)}
          color="bg-primary/10 text-primary"
        />
        <SummaryCard
          icon={Bus}
          label="Total VT"
          value={formatCurrency(totaisGerais.totalVT)}
          color="bg-info/10 text-info"
        />
        <SummaryCard
          icon={Utensils}
          label="Total VR"
          value={formatCurrency(totaisGerais.totalVR)}
          color="bg-warning/10 text-warning"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Total Geral"
          value={formatCurrency(totaisGerais.totalGeral)}
          color="bg-accent/10 text-accent"
        />
        <SummaryCard
          icon={Users}
          label="Funcionários"
          value={totaisGerais.funcionarios.toString()}
          color="bg-muted text-muted-foreground"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lojas" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="lojas" className="gap-2 data-[state=active]:bg-background">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Por Loja</span>
          </TabsTrigger>
          <TabsTrigger value="funcionarios" className="gap-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Por Funcionário</span>
          </TabsTrigger>
          <TabsTrigger value="adiantamento" className="gap-2 data-[state=active]:bg-background">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Adiantamento</span>
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="gap-2 data-[state=active]:bg-background">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Relatório Geral</span>
          </TabsTrigger>
          <TabsTrigger value="decimo" className="gap-2 data-[state=active]:bg-background">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">13º Salário</span>
          </TabsTrigger>
          <TabsTrigger value="emprestimos" className="gap-2 data-[state=active]:bg-background">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Empréstimos</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2 data-[state=active]:bg-background">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
        </TabsList>

        {/* By Store Tab */}
        <TabsContent value="lojas" className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Resumo por Loja - {competencia}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table className="table-zebra">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Loja</TableHead>
                      <TableHead className="text-center font-semibold">Func.</TableHead>
                      <TableHead className="text-center font-semibold">Ativos</TableHead>
                      <TableHead className="text-center font-semibold">Férias</TableHead>
                      <TableHead className="text-center font-semibold">Afast.</TableHead>
                      <TableHead className="text-right font-semibold">Dia 20</TableHead>
                      <TableHead className="text-right font-semibold">Dia 5</TableHead>
                      <TableHead className="text-right font-semibold">VT</TableHead>
                      <TableHead className="text-right font-semibold">VR</TableHead>
                      <TableHead className="text-right font-semibold text-primary">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumoPorLoja.map((r) => (
                      <TableRow key={r.loja.id} className="transition-colors">
                        <TableCell className="font-medium">{r.loja.nome}</TableCell>
                        <TableCell className="text-center">{r.qtdFuncionarios}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            {r.funcionariosAtivos}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                            {r.funcionariosFerias}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            {r.funcionariosAfastados}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-success font-medium">
                          {formatCurrency(r.totalDia20)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(r.totalDia5)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(r.totalVT)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(r.totalVR)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(r.totalGeral)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Employee Tab */}
        <TabsContent value="funcionarios" className="space-y-4 animate-fade-in">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Loja</Label>
                  <Select value={lojaSelecionada} onValueChange={setLojaSelecionada}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas as lojas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as lojas</SelectItem>
                      {lojas.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="ativo">Ativos</SelectItem>
                      <SelectItem value="ferias">Em Férias</SelectItem>
                      <SelectItem value="afastado_acidente">Afastados (Acidente)</SelectItem>
                      <SelectItem value="afastado_doenca">Afastados (Doença)</SelectItem>
                      <SelectItem value="licenca_maternidade">Licença Maternidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Detalhamento por Funcionário
                <Badge variant="secondary" className="ml-2">{calculosLote.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full max-h-[600px]">
                <Table className="table-zebra">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Mat.</TableHead>
                      <TableHead className="font-semibold">Nome</TableHead>
                      <TableHead className="font-semibold">Loja</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Salário</TableHead>
                      <TableHead className="text-right font-semibold">Dia 20</TableHead>
                      <TableHead className="text-right font-semibold">Dia 5</TableHead>
                      <TableHead className="text-right font-semibold">VT</TableHead>
                      <TableHead className="text-right font-semibold">VR</TableHead>
                      <TableHead className="text-right font-semibold text-primary">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculosLote.map((c) => (
                      <TableRow key={c.profissional.id} className="transition-colors">
                        <TableCell className="font-mono text-xs">{c.profissional.matricula}</TableCell>
                        <TableCell className="font-medium max-w-[180px] truncate">{c.profissional.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{c.loja?.nome}</TableCell>
                        <TableCell>{getStatusBadge(c.profissional.status)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(c.profissional.salario)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-success">
                          {formatCurrency(c.valorDia20)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(c.salarioLiquido)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatCurrency(c.valorVT)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatCurrency(c.valorVR)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary">
                          {formatCurrency(c.totalMes)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="config" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Parâmetros da Competência
              </CardTitle>
              <CardDescription>
                Configure os valores base para o cálculo da folha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="competencia">Competência</Label>
                  <Input
                    id="competencia"
                    type="month"
                    value={competencia}
                    onChange={(e) => setCompetencia(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diasUteis6x1">Dias Úteis (6x1)</Label>
                  <Input
                    id="diasUteis6x1"
                    type="number"
                    value={diasUteis6x1}
                    onChange={(e) => setDiasUteis6x1(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diasUteis5x2">Dias Úteis (5x2)</Label>
                  <Input
                    id="diasUteis5x2"
                    type="number"
                    value={diasUteis5x2}
                    onChange={(e) => setDiasUteis5x2(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorVR">Valor VR / dia</Label>
                  <Input
                    id="valorVR"
                    type="number"
                    step="0.01"
                    value={valorVR}
                    onChange={(e) => setValorVR(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentualDia20">% Dia 20</Label>
                  <Input
                    id="percentualDia20"
                    type="number"
                    value={percentualDia20}
                    onChange={(e) => setPercentualDia20(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adiantamento Tab */}
        <TabsContent value="adiantamento" className="animate-fade-in">
          <AdiantamentoSalario />
        </TabsContent>

        {/* Relatório Geral Tab */}
        <TabsContent value="relatorio" className="animate-fade-in">
          <RelatorioFolha />
        </TabsContent>

        {/* 13º Salário Tab */}
        <TabsContent value="decimo" className="animate-fade-in">
          <DecimoTerceiro />
        </TabsContent>

        {/* Empréstimos Tab */}
        <TabsContent value="emprestimos" className="animate-fade-in">
          <GestaoEmprestimos />
        </TabsContent>
      </Tabs>
    </div>
  );
}