import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, DollarSign, Calendar, Bus, Utensils, AlertTriangle, 
  TrendingDown, TrendingUp, Users, CheckCircle, XCircle, Info,
  Minus, Plus, FileText
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

interface Profissional {
  id: string;
  nome: string;
  matricula: string;
  salario: number;
  escala: '6x1' | '5x2';
  valorPassagem: number;
  dataAdmissao: string;
  status: 'ativo' | 'ferias' | 'afastado_acidente' | 'afastado_doenca' | 'licenca_maternidade';
  recebeCesta: boolean;
  recebeVT: boolean;
  recebeVR: boolean;
}

interface Descontos {
  faltas: number;
  atestados: number;
  diasFerias: number;
  vales: number;
  emprestimos: number;
  emprestimoCLT: number;
  pensao: number;
  adiantamento: number;
  outros: number;
}

// Mock de profissionais para demonstração
const mockProfissionais: Profissional[] = [
  { id: '1', nome: 'João Silva', matricula: '001', salario: 1800, escala: '6x1', valorPassagem: 4.40, dataAdmissao: '2023-05-15', status: 'ativo', recebeCesta: true, recebeVT: true, recebeVR: true },
  { id: '2', nome: 'Maria Santos', matricula: '002', salario: 2200, escala: '5x2', valorPassagem: 4.40, dataAdmissao: '2025-01-05', status: 'ativo', recebeCesta: true, recebeVT: true, recebeVR: true },
  { id: '3', nome: 'Ana Costa', matricula: '003', salario: 1900, escala: '6x1', valorPassagem: 4.40, dataAdmissao: '2024-03-10', status: 'licenca_maternidade', recebeCesta: true, recebeVT: false, recebeVR: false },
  { id: '4', nome: 'Pedro Lima', matricula: '004', salario: 2500, escala: '5x2', valorPassagem: 4.40, dataAdmissao: '2022-08-20', status: 'ferias', recebeCesta: true, recebeVT: false, recebeVR: false },
];

export default function SimuladorFolha() {
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [diasUteis6x1, setDiasUteis6x1] = useState(26);
  const [diasUteis5x2, setDiasUteis5x2] = useState(22);
  const [valorVR, setValorVR] = useState(25);
  const [percentualDia20, setPercentualDia20] = useState(40);
  
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<Profissional | null>(null);
  const [descontos, setDescontos] = useState<Descontos>({
    faltas: 0,
    atestados: 0,
    diasFerias: 0,
    vales: 0,
    emprestimos: 0,
    emprestimoCLT: 0,
    pensao: 0,
    adiantamento: 0,
    outros: 0,
  });

  // Cálculos do profissional selecionado
  const calculos = useMemo(() => {
    if (!profissionalSelecionado) return null;
    
    const p = profissionalSelecionado;
    const diasUteis = p.escala === '6x1' ? diasUteis6x1 : diasUteis5x2;
    const diasAbatidos = descontos.faltas + descontos.atestados + descontos.diasFerias;
    const diasTrabalhados = Math.max(0, diasUteis - diasAbatidos);
    
    // Valor por dia
    const valorDia = p.salario / 30;
    
    // === PAGAMENTO DIA 20 (Adiantamento) ===
    let valorDia20 = 0;
    let motivoDia20 = '';
    let recebeDia20 = true;
    
    // Verificar data de admissão (até dia 10 = 40% do salário combinado, após dia 10 = não recebe)
    const dataAdmissao = new Date(p.dataAdmissao);
    const mesCompetencia = new Date(competencia + '-01');
    const mesmaCompetencia = dataAdmissao.getMonth() === mesCompetencia.getMonth() && 
                            dataAdmissao.getFullYear() === mesCompetencia.getFullYear();
    
    if (mesmaCompetencia && dataAdmissao.getDate() > 10) {
      recebeDia20 = false;
      motivoDia20 = 'Admitido após dia 10';
    } else if (p.status === 'ferias') {
      recebeDia20 = false;
      motivoDia20 = 'Em férias - não recebe dia 20';
    } else if (p.status === 'afastado_acidente') {
      recebeDia20 = false;
      motivoDia20 = 'Afastado por acidente - pagar no mês seguinte';
    } else if (descontos.faltas >= 10) {
      recebeDia20 = false;
      motivoDia20 = '+10 faltas - não recebe adiantamento';
    } else if (p.status === 'licenca_maternidade') {
      recebeDia20 = true;
      valorDia20 = arredondarValor(p.salario * (percentualDia20 / 100));
      motivoDia20 = 'Licença maternidade - recebe normalmente';
    } else {
      // Admitido até dia 10 no mês = apenas 40%
      if (mesmaCompetencia && dataAdmissao.getDate() <= 10) {
        valorDia20 = arredondarValor(p.salario * 0.40);
        motivoDia20 = 'Admitido no mês (até dia 10) - apenas 40%';
      } else {
        valorDia20 = arredondarValor(p.salario * (percentualDia20 / 100));
        motivoDia20 = `${percentualDia20}% do salário`;
      }
    }
    
    // === VALE TRANSPORTE ===
    let valorVT = 0;
    if (p.recebeVT && p.status === 'ativo') {
      const passagensDia = 2; // ida e volta
      valorVT = arredondarValor(diasTrabalhados * passagensDia * p.valorPassagem);
    }
    
    // === VALE REFEIÇÃO ===
    let valorVRTotal = 0;
    if (p.recebeVR && p.status === 'ativo') {
      valorVRTotal = arredondarValor(diasTrabalhados * valorVR);
    }
    
    // === CESTA BÁSICA ===
    let recebeCesta = p.recebeCesta;
    let motivoCesta = '';
    if (descontos.faltas > 0) {
      // Verificar se há falta injustificada (faltas - atestados)
      const faltasInjustificadas = descontos.faltas;
      if (faltasInjustificadas > 0) {
        recebeCesta = false;
        motivoCesta = 'Falta injustificada - perdeu direito';
      }
    }
    // Admissão após dia 15 não tem direito
    if (mesmaCompetencia && dataAdmissao.getDate() > 15) {
      recebeCesta = false;
      motivoCesta = 'Admitido após dia 15';
    }
    
    // === DESCONTOS TOTAIS ===
    const descontoFaltas = arredondarValor(descontos.faltas * valorDia);
    const totalDescontos = descontos.vales + descontos.emprestimos + descontos.emprestimoCLT + 
                          descontos.pensao + descontos.adiantamento + descontos.outros + descontoFaltas;
    
    // === PAGAMENTO DIA 5 (Fechamento) ===
    let salarioBruto = p.salario;
    
    // Se teve faltas, desconta proporcional
    salarioBruto = salarioBruto - descontoFaltas;
    
    // Desconta o adiantamento do dia 20
    const salarioLiquido = arredondarValor(salarioBruto - valorDia20 - totalDescontos + descontoFaltas);
    
    return {
      profissional: p,
      diasUteis,
      diasAbatidos,
      diasTrabalhados,
      valorDia,
      // Dia 20
      recebeDia20,
      valorDia20: recebeDia20 ? valorDia20 : 0,
      motivoDia20,
      // VT
      valorVT,
      // VR
      valorVR: valorVRTotal,
      // Cesta
      recebeCesta,
      motivoCesta,
      // Descontos
      descontoFaltas,
      totalDescontos,
      // Dia 5
      salarioBruto,
      salarioLiquido: Math.max(0, salarioLiquido),
      // Total a receber no mês
      totalMes: arredondarValor((recebeDia20 ? valorDia20 : 0) + Math.max(0, salarioLiquido) + valorVT + valorVRTotal),
    };
  }, [profissionalSelecionado, descontos, diasUteis6x1, diasUteis5x2, valorVR, percentualDia20, competencia]);

  const getStatusBadge = (status: Profissional['status']) => {
    const config: Record<string, { label: string; className: string }> = {
      ativo: { label: 'Ativo', className: 'bg-success/10 text-success border-success/20' },
      ferias: { label: 'Férias', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      afastado_acidente: { label: 'Af. Acidente', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      afastado_doenca: { label: 'Af. Doença', className: 'bg-warning/10 text-warning border-warning/20' },
      licenca_maternidade: { label: 'Lic. Maternidade', className: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
    };
    const c = config[status] || config.ativo;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Simulador de Folha de Pagamento</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Cálculos para tomada de decisão do RH</p>
      </div>

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Cálculo Individual
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Configurações do Mês
          </TabsTrigger>
        </TabsList>

        {/* CONFIGURAÇÕES */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Configurações da Competência
              </CardTitle>
              <CardDescription>Defina os parâmetros do mês para os cálculos</CardDescription>
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

          {/* Regras de Pagamento */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Regras de Pagamento Aplicadas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <h4 className="font-semibold text-primary mb-1">Arredondamento</h4>
                <p>• ≥ R$ 0,50 centavos → arredonda para CIMA</p>
                <p>• &lt; R$ 0,50 centavos → arredonda para BAIXO</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-warning mb-1">Pagamento Dia 20</h4>
                <p>• Admitidos até dia 10: recebem 40% do salário</p>
                <p>• Férias: não recebe (apenas dias vendidos)</p>
                <p>• Acidente trabalho/trajeto: não recebe, pagar mês seguinte</p>
                <p>• Maternidade: recebe normalmente</p>
                <p>• +10 faltas: não recebe adiantamento</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-destructive mb-1">Cesta Básica</h4>
                <p>• Falta injustificada: PERDE o direito</p>
                <p>• Admissão após dia 15: não tem direito</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CÁLCULO INDIVIDUAL */}
        <TabsContent value="individual" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Lista de Profissionais */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Selecione o Profissional</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {mockProfissionais.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setProfissionalSelecionado(p);
                        setDescontos({
                          faltas: 0, atestados: 0, diasFerias: 0, vales: 0,
                          emprestimos: 0, emprestimoCLT: 0, pensao: 0, adiantamento: 0, outros: 0,
                        });
                      }}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                        profissionalSelecionado?.id === p.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">Mat: {p.matricula} • {formatCurrency(p.salario)}</p>
                        </div>
                        {getStatusBadge(p.status)}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Área de Cálculo */}
            <div className="lg:col-span-2 space-y-4">
              {!profissionalSelecionado ? (
                <Card className="flex items-center justify-center h-64">
                  <div className="text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Selecione um profissional para calcular</p>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Inputs de Descontos */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        Lançamentos e Descontos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Faltas</Label>
                          <Input
                            type="number"
                            value={descontos.faltas}
                            onChange={(e) => setDescontos(d => ({ ...d, faltas: parseInt(e.target.value) || 0 }))}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Atestados (dias)</Label>
                          <Input
                            type="number"
                            value={descontos.atestados}
                            onChange={(e) => setDescontos(d => ({ ...d, atestados: parseInt(e.target.value) || 0 }))}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dias de Férias</Label>
                          <Input
                            type="number"
                            value={descontos.diasFerias}
                            onChange={(e) => setDescontos(d => ({ ...d, diasFerias: parseInt(e.target.value) || 0 }))}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Vales (R$)</Label>
                          <Input
                            type="number"
                            value={descontos.vales}
                            onChange={(e) => setDescontos(d => ({ ...d, vales: parseFloat(e.target.value) || 0 }))}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Empréstimo Loja (R$)</Label>
                          <Input
                            type="number"
                            value={descontos.emprestimos}
                            onChange={(e) => setDescontos(d => ({ ...d, emprestimos: parseFloat(e.target.value) || 0 }))}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Empréstimo CLT (R$)</Label>
                          <Input
                            type="number"
                            value={descontos.emprestimoCLT}
                            onChange={(e) => setDescontos(d => ({ ...d, emprestimoCLT: parseFloat(e.target.value) || 0 }))}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Pensão (R$)</Label>
                          <Input
                            type="number"
                            value={descontos.pensao}
                            onChange={(e) => setDescontos(d => ({ ...d, pensao: parseFloat(e.target.value) || 0 }))}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Outros (R$)</Label>
                          <Input
                            type="number"
                            value={descontos.outros}
                            onChange={(e) => setDescontos(d => ({ ...d, outros: parseFloat(e.target.value) || 0 }))}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resultado dos Cálculos */}
                  {calculos && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Pagamento Dia 20 */}
                      <Card className={calculos.recebeDia20 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Pagamento Dia 20
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            {calculos.recebeDia20 ? (
                              <Badge className="bg-success/20 text-success"><CheckCircle className="h-3 w-3 mr-1" />Recebe</Badge>
                            ) : (
                              <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Não Recebe</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{calculos.motivoDia20}</p>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Valor:</span>
                            <span className={`text-xl font-bold ${calculos.recebeDia20 ? 'text-success' : 'text-muted-foreground'}`}>
                              {formatCurrency(calculos.valorDia20)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pagamento Dia 5 */}
                      <Card className="border-primary/30 bg-primary/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Pagamento Dia 5
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Salário Bruto:</span>
                            <span>{formatCurrency(profissionalSelecionado.salario)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-destructive">
                            <span>(-) Adiantamento dia 20:</span>
                            <span>{formatCurrency(calculos.valorDia20)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-destructive">
                            <span>(-) Desc. Faltas ({descontos.faltas}d):</span>
                            <span>{formatCurrency(calculos.descontoFaltas)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-destructive">
                            <span>(-) Outros Descontos:</span>
                            <span>{formatCurrency(calculos.totalDescontos - calculos.descontoFaltas)}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Líquido:</span>
                            <span className="text-xl font-bold text-primary">{formatCurrency(calculos.salarioLiquido)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Vale Transporte */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Bus className="h-4 w-4 text-blue-500" />
                            Vale Transporte
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Dias trabalhados:</span>
                            <span>{calculos.diasTrabalhados} de {calculos.diasUteis}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Passagens:</span>
                            <span>{calculos.diasTrabalhados * 2} (ida+volta)</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Valor passagem:</span>
                            <span>{formatCurrency(profissionalSelecionado.valorPassagem)}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Total VT:</span>
                            <span className="text-lg font-bold text-blue-500">{formatCurrency(calculos.valorVT)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Vale Refeição */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-orange-500" />
                            Vale Refeição
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Dias trabalhados:</span>
                            <span>{calculos.diasTrabalhados}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Valor/dia:</span>
                            <span>{formatCurrency(valorVR)}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Total VR:</span>
                            <span className="text-lg font-bold text-orange-500">{formatCurrency(calculos.valorVR)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Resumo Final */}
                  {calculos && (
                    <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          Resumo do Mês - {profissionalSelecionado.nome}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Dia 20</p>
                            <p className="text-lg font-bold text-success">{formatCurrency(calculos.valorDia20)}</p>
                          </div>
                          <div className="text-center p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Dia 5</p>
                            <p className="text-lg font-bold text-primary">{formatCurrency(calculos.salarioLiquido)}</p>
                          </div>
                          <div className="text-center p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">VT</p>
                            <p className="text-lg font-bold text-blue-500">{formatCurrency(calculos.valorVT)}</p>
                          </div>
                          <div className="text-center p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">VR</p>
                            <p className="text-lg font-bold text-orange-500">{formatCurrency(calculos.valorVR)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-primary/20 rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">Total a Receber no Mês</p>
                            <p className="text-xs text-muted-foreground">
                              Cesta Básica: {calculos.recebeCesta ? (
                                <span className="text-success">✓ Tem direito</span>
                              ) : (
                                <span className="text-destructive">✗ {calculos.motivoCesta}</span>
                              )}
                            </p>
                          </div>
                          <p className="text-3xl font-bold text-primary">{formatCurrency(calculos.totalMes)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
