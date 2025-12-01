import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, DollarSign, Users, AlertTriangle, 
  Calendar, ArrowUpRight, ArrowDownRight, BarChart3 
} from 'lucide-react';
import { useMockData } from '@/hooks/useMockData';

export default function DashboardAnalitico() {
  const mockData = useMockData();
  const [lojaFiltro, setLojaFiltro] = useState('TODAS');
  const [periodoMeses, setPeriodoMeses] = useState('12');

  // Gerar dados históricos simulados baseados nos dados reais
  const dadosHistoricos = useMemo(() => {
    const meses = parseInt(periodoMeses);
    const hoje = new Date();
    const dados = [];

    for (let i = meses - 1; i >= 0; i--) {
      const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesAno = mes.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Variação aleatória para simular evolução temporal
      const variacao = 1 + (Math.random() * 0.2 - 0.1); // ±10%
      
      const beneficios = lojaFiltro === 'TODAS' 
        ? mockData.getBeneficios()
        : mockData.getBeneficios().filter((b: any) => b.loja === lojaFiltro);
      
      const faltas = lojaFiltro === 'TODAS'
        ? mockData.getFaltas()
        : mockData.getFaltas().filter((f: any) => f.loja === lojaFiltro);
      
      const profissionaisFiltrados = lojaFiltro === 'TODAS'
        ? mockData.profissionais
        : mockData.profissionais.filter(p => p.localTrabalho === lojaFiltro);

      const totalSalarios = profissionaisFiltrados.reduce((sum, p) => {
        const sal = typeof p.salarioReceber === 'string' 
          ? parseFloat(p.salarioReceber.replace(/[^0-9,]/g, '').replace(',', '.'))
          : 0;
        return sum + sal;
      }, 0);

      const totalVT = beneficios.reduce((sum: number, b: any) => sum + b.valorVT, 0);
      const totalVR = beneficios.reduce((sum: number, b: any) => sum + b.valorVR, 0);
      const totalCesta = beneficios.reduce((sum: number, b: any) => sum + b.cestaBasica, 0);
      
      const totalFaltas = faltas.reduce((sum: number, f: any) => sum + f.totalFaltas, 0);
      const faltasJust = faltas.reduce((sum: number, f: any) => sum + f.faltasJustificadas, 0);
      const faltasInjust = faltas.reduce((sum: number, f: any) => sum + f.faltasInjustificadas, 0);

      dados.push({
        mes: mesAno,
        salarioTotal: Math.round(totalSalarios * variacao),
        vt: Math.round(totalVT * variacao),
        vr: Math.round(totalVR * variacao),
        cesta: Math.round(totalCesta * variacao),
        beneficiosTotal: Math.round((totalVT + totalVR + totalCesta) * variacao),
        faltas: Math.round(totalFaltas * variacao),
        faltasJustificadas: Math.round(faltasJust * variacao),
        faltasInjustificadas: Math.round(faltasInjust * variacao),
        profissionais: profissionaisFiltrados.length,
        custoTotal: Math.round((totalSalarios + totalVT + totalVR + totalCesta) * variacao)
      });
    }

    return dados;
  }, [mockData, lojaFiltro, periodoMeses]);

  // Comparação entre lojas
  const comparacaoLojas = useMemo(() => {
    const estatisticas = mockData.getEstatisticasPorLoja();
    return estatisticas.slice(0, 10).map(stat => {
      const beneficios = mockData.getBeneficios().filter((b: any) => b.loja === stat.loja);
      const totalBeneficios = beneficios.reduce((sum: number, b: any) => 
        sum + b.valorVT + b.valorVR + b.cestaBasica, 0
      );
      
      return {
        loja: stat.loja.length > 15 ? stat.loja.substring(0, 15) + '...' : stat.loja,
        salarios: stat.totalSalarios,
        beneficios: totalBeneficios,
        total: stat.totalSalarios + totalBeneficios,
        profissionais: stat.totalProfissionais
      };
    }).sort((a, b) => b.total - a.total);
  }, [mockData]);

  // Distribuição de benefícios (Pie chart)
  const distribuicaoBeneficios = useMemo(() => {
    const ultimo = dadosHistoricos[dadosHistoricos.length - 1];
    if (!ultimo) return [];
    
    return [
      { name: 'Vale Transporte', value: ultimo.vt, color: '#0A84FF' },
      { name: 'Vale Refeição', value: ultimo.vr, color: '#f97316' },
      { name: 'Cesta Básica', value: ultimo.cesta, color: '#16a34a' }
    ];
  }, [dadosHistoricos]);

  // Métricas de crescimento
  const metricas = useMemo(() => {
    if (dadosHistoricos.length < 2) return null;
    
    const primeiro = dadosHistoricos[0];
    const ultimo = dadosHistoricos[dadosHistoricos.length - 1];
    
    const calcularCrescimento = (inicial: number, final: number) => {
      if (inicial === 0) return 0;
      return ((final - inicial) / inicial * 100).toFixed(1);
    };

    return {
      salarios: calcularCrescimento(primeiro.salarioTotal, ultimo.salarioTotal),
      beneficios: calcularCrescimento(primeiro.beneficiosTotal, ultimo.beneficiosTotal),
      faltas: calcularCrescimento(primeiro.faltas, ultimo.faltas),
      profissionais: calcularCrescimento(primeiro.profissionais, ultimo.profissionais)
    };
  }, [dadosHistoricos]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const lojasUnicas = ['TODAS', ...Array.from(new Set(mockData.profissionais.map(p => p.localTrabalho)))];

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Dashboard Analítico
          </h1>
          <p className="text-muted-foreground">Evolução temporal de salários, benefícios e faltas</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por loja" />
            </SelectTrigger>
            <SelectContent>
              {lojasUnicas.map(loja => (
                <SelectItem key={loja} value={loja}>{loja}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={periodoMeses} onValueChange={setPeriodoMeses}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
              <SelectItem value="24">24 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Métricas de Crescimento */}
      {metricas && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Salários</p>
                  <p className="text-2xl font-bold">{metricas.salarios}%</p>
                </div>
                <div className={`p-2 rounded-lg ${parseFloat(String(metricas.salarios)) >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {parseFloat(String(metricas.salarios)) >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">vs. {periodoMeses} meses atrás</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Benefícios</p>
                  <p className="text-2xl font-bold">{metricas.beneficios}%</p>
                </div>
                <div className={`p-2 rounded-lg ${parseFloat(String(metricas.beneficios)) >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {parseFloat(String(metricas.beneficios)) >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">vs. {periodoMeses} meses atrás</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Faltas</p>
                  <p className="text-2xl font-bold">{metricas.faltas}%</p>
                </div>
                <div className={`p-2 rounded-lg ${parseFloat(String(metricas.faltas)) <= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {parseFloat(String(metricas.faltas)) <= 0 ? (
                    <ArrowDownRight className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">vs. {periodoMeses} meses atrás</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Profissionais</p>
                  <p className="text-2xl font-bold">{metricas.profissionais}%</p>
                </div>
                <div className={`p-2 rounded-lg ${parseFloat(String(metricas.profissionais)) >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {parseFloat(String(metricas.profissionais)) >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">vs. {periodoMeses} meses atrás</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos Principais */}
      <Tabs defaultValue="salarios" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="salarios">Salários</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="faltas">Faltas</TabsTrigger>
          <TabsTrigger value="lojas">Comparação Lojas</TabsTrigger>
        </TabsList>

        {/* Evolução de Salários */}
        <TabsContent value="salarios" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Evolução de Salários Totais
                </CardTitle>
                <CardDescription>Projeção da folha de pagamento ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={dadosHistoricos}>
                    <defs>
                      <linearGradient id="colorSalario" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0A84FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="salarioTotal" 
                      stroke="#0A84FF" 
                      fillOpacity={1} 
                      fill="url(#colorSalario)" 
                      name="Salário Total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Custo Total Mensal</CardTitle>
                <CardDescription>Salários + Benefícios</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dadosHistoricos.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="custoTotal" fill="#0A84FF" name="Custo Total" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Evolução de Benefícios */}
        <TabsContent value="beneficios" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Evolução de Benefícios por Tipo
                </CardTitle>
                <CardDescription>VT, VR e Cesta Básica ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={dadosHistoricos}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="vt" stroke="#0A84FF" strokeWidth={2} name="Vale Transporte" />
                    <Line type="monotone" dataKey="vr" stroke="#f97316" strokeWidth={2} name="Vale Refeição" />
                    <Line type="monotone" dataKey="cesta" stroke="#16a34a" strokeWidth={2} name="Cesta Básica" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição Atual</CardTitle>
                <CardDescription>Proporção de benefícios</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={distribuicaoBeneficios}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribuicaoBeneficios.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Evolução de Faltas */}
        <TabsContent value="faltas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Evolução de Faltas e Absenteísmo
              </CardTitle>
              <CardDescription>Comparação entre faltas justificadas e injustificadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={dadosHistoricos}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="faltasJustificadas" stackId="a" fill="#16a34a" name="Justificadas" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="faltasInjustificadas" stackId="a" fill="#ef4444" name="Injustificadas" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="faltas" stroke="#f59e0b" strokeWidth={3} name="Total" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparação entre Lojas */}
        <TabsContent value="lojas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-success" />
                Ranking de Custos por Loja
              </CardTitle>
              <CardDescription>Top 10 lojas por custo total (salários + benefícios)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={comparacaoLojas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} className="text-xs" />
                  <YAxis dataKey="loja" type="category" width={120} className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="salarios" stackId="a" fill="#0A84FF" name="Salários" />
                  <Bar dataKey="beneficios" stackId="a" fill="#f97316" name="Benefícios" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
