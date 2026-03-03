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
  Calendar, ArrowUpRight, ArrowDownRight, BarChart3, Loader2, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Profissional {
  id: string;
  nome: string;
  salario_nominal: number | null;
  ultimo_salario: number | null;
  status: string | null;
  loja_id: string | null;
  vale_transporte: boolean | null;
  vale_refeicao: boolean | null;
  cesta_basica: boolean | null;
}

interface Loja {
  id: string;
  nome: string;
}

interface Falta {
  id: string;
  profissional_id: string | null;
  tipo: string;
  data_falta: string;
  motivo: string | null;
}

interface Beneficio {
  id: string;
  profissional_id: string | null;
  mes_referencia: string;
  valor_total_vt: number | null;
  valor_total_vr: number | null;
  valor_cesta: number | null;
  valor_odonto: number | null;
  valor_seguro_vida: number | null;
  valor_bem_mais: number | null;
  valor_vale_alimentacao: number | null;
  valor_vale_carne: number | null;
  valor_vale_dinheiro: number | null;
}

export default function DashboardAnalitico() {
  const [lojaFiltro, setLojaFiltro] = useState('TODAS');
  const [periodoMeses, setPeriodoMeses] = useState('12');

  // Fetch real data from Supabase
  const { data: profissionais = [], isLoading: loadingProf } = useQuery({
    queryKey: ['dashboard-analitico-profissionais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profissionais')
        .select('id, nome, salario_nominal, ultimo_salario, status, loja_id, vale_transporte, vale_refeicao, cesta_basica')
        .eq('status', 'ativo');
      if (error) throw error;
      return (data || []) as Profissional[];
    },
  });

  const { data: lojas = [], isLoading: loadingLojas } = useQuery({
    queryKey: ['dashboard-analitico-lojas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lojas').select('id, nome');
      if (error) throw error;
      return (data || []) as Loja[];
    },
  });

  const { data: faltas = [], isLoading: loadingFaltas } = useQuery({
    queryKey: ['dashboard-analitico-faltas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('faltas').select('id, profissional_id, tipo, data_falta, motivo');
      if (error) throw error;
      return (data || []) as Falta[];
    },
  });

  const { data: beneficios = [], isLoading: loadingBen } = useQuery({
    queryKey: ['dashboard-analitico-beneficios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beneficios')
        .select('id, profissional_id, mes_referencia, valor_total_vt, valor_total_vr, valor_cesta, valor_odonto, valor_seguro_vida, valor_bem_mais, valor_vale_alimentacao, valor_vale_carne, valor_vale_dinheiro');
      if (error) throw error;
      return (data || []) as Beneficio[];
    },
  });

  const isLoading = loadingProf || loadingLojas || loadingFaltas || loadingBen;

  // Build loja lookup
  const lojaMap = useMemo(() => {
    const map: Record<string, string> = {};
    lojas.forEach(l => { map[l.id] = l.nome; });
    return map;
  }, [lojas]);

  const getLojaName = (lojaId: string | null) => lojaId ? (lojaMap[lojaId] || 'Sem Loja') : 'Sem Loja';

  // Filter profissionais by loja
  const profsFiltrados = useMemo(() => {
    if (lojaFiltro === 'TODAS') return profissionais;
    const lojaId = lojas.find(l => l.nome === lojaFiltro)?.id;
    return profissionais.filter(p => p.loja_id === lojaId);
  }, [profissionais, lojaFiltro, lojas]);

  // Historical data from real beneficios grouped by mes_referencia
  const dadosHistoricos = useMemo(() => {
    const meses = parseInt(periodoMeses);
    const hoje = new Date();
    const dados = [];

    const lojaIdFiltro = lojaFiltro !== 'TODAS' ? lojas.find(l => l.nome === lojaFiltro)?.id : null;
    const profIds = lojaIdFiltro
      ? new Set(profissionais.filter(p => p.loja_id === lojaIdFiltro).map(p => p.id))
      : null;

    for (let i = meses - 1; i >= 0; i--) {
      const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesKey = mes.toISOString().slice(0, 7); // YYYY-MM
      const mesAno = mes.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      // Filter beneficios for this month
      const benMes = beneficios.filter(b => {
        const bMes = b.mes_referencia?.slice(0, 7);
        const matchMes = bMes === mesKey;
        const matchLoja = profIds ? profIds.has(b.profissional_id || '') : true;
        return matchMes && matchLoja;
      });

      // Filter faltas for this month
      const faltasMes = faltas.filter(f => {
        const fMes = f.data_falta?.slice(0, 7);
        const matchMes = fMes === mesKey;
        const matchLoja = profIds ? profIds.has(f.profissional_id || '') : true;
        return matchMes && matchLoja;
      });

      const profsAtivos = profIds ? profsFiltrados.length : profissionais.length;
      const totalSalarios = (profIds ? profsFiltrados : profissionais).reduce((sum, p) => sum + (p.ultimo_salario || p.salario_nominal || 0), 0);

      const totalVT = benMes.reduce((sum, b) => sum + (b.valor_total_vt || 0), 0);
      const totalVR = benMes.reduce((sum, b) => sum + (b.valor_total_vr || 0), 0);
      const totalCesta = benMes.reduce((sum, b) => sum + (b.valor_cesta || 0), 0);

      const faltasJust = faltasMes.filter(f => f.tipo === 'justificada').length;
      const faltasInjust = faltasMes.filter(f => f.tipo === 'injustificada').length;
      const totalFaltas = faltasMes.length;

      dados.push({
        mes: mesAno,
        salarioTotal: Math.round(totalSalarios),
        vt: Math.round(totalVT),
        vr: Math.round(totalVR),
        cesta: Math.round(totalCesta),
        beneficiosTotal: Math.round(totalVT + totalVR + totalCesta),
        faltas: totalFaltas,
        faltasJustificadas: faltasJust,
        faltasInjustificadas: faltasInjust,
        profissionais: profsAtivos,
        custoTotal: Math.round(totalSalarios + totalVT + totalVR + totalCesta),
      });
    }
    return dados;
  }, [profissionais, profsFiltrados, beneficios, faltas, lojaFiltro, lojas, periodoMeses]);

  // Comparison by loja
  const comparacaoLojas = useMemo(() => {
    const porLoja: Record<string, { salarios: number; beneficios: number; profissionais: number; nome: string }> = {};

    profissionais.forEach(p => {
      const lojaName = getLojaName(p.loja_id);
      if (!porLoja[lojaName]) porLoja[lojaName] = { salarios: 0, beneficios: 0, profissionais: 0, nome: lojaName };
      porLoja[lojaName].salarios += p.ultimo_salario || p.salario_nominal || 0;
      porLoja[lojaName].profissionais += 1;
    });

    beneficios.forEach(b => {
      const prof = profissionais.find(p => p.id === b.profissional_id);
      const lojaName = getLojaName(prof?.loja_id || null);
      if (!porLoja[lojaName]) porLoja[lojaName] = { salarios: 0, beneficios: 0, profissionais: 0, nome: lojaName };
      porLoja[lojaName].beneficios += (b.valor_total_vt || 0) + (b.valor_total_vr || 0) + (b.valor_cesta || 0);
    });

    return Object.values(porLoja)
      .map(l => ({
        loja: l.nome.length > 15 ? l.nome.substring(0, 15) + '...' : l.nome,
        salarios: Math.round(l.salarios),
        beneficios: Math.round(l.beneficios),
        total: Math.round(l.salarios + l.beneficios),
        profissionais: l.profissionais,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [profissionais, beneficios, lojaMap]);

  // Pie chart for benefits distribution
  const distribuicaoBeneficios = useMemo(() => {
    const ultimo = dadosHistoricos[dadosHistoricos.length - 1];
    if (!ultimo) return [];
    return [
      { name: 'Vale Transporte', value: ultimo.vt, color: '#0A84FF' },
      { name: 'Vale Refeição', value: ultimo.vr, color: '#f97316' },
      { name: 'Cesta Básica', value: ultimo.cesta, color: '#16a34a' },
    ].filter(d => d.value > 0);
  }, [dadosHistoricos]);

  // Faltas by motivo
  const faltasPorMotivo = useMemo(() => {
    const filteredFaltas = lojaFiltro === 'TODAS'
      ? faltas
      : (() => {
          const lojaId = lojas.find(l => l.nome === lojaFiltro)?.id;
          const profIds = new Set(profissionais.filter(p => p.loja_id === lojaId).map(p => p.id));
          return faltas.filter(f => profIds.has(f.profissional_id || ''));
        })();

    const motivos: Record<string, number> = {};
    filteredFaltas.forEach(f => {
      const motivo = f.tipo === 'injustificada' ? 'Sem Justificativa' : (f.motivo || 'Justificada');
      motivos[motivo] = (motivos[motivo] || 0) + 1;
    });

    const colors: Record<string, string> = {
      'Sem Justificativa': '#ef4444',
      'Justificada': '#16a34a',
      'Atestado': '#f59e0b',
      'Doença': '#f59e0b',
    };

    return Object.entries(motivos)
      .map(([name, value]) => ({ name, value, color: colors[name] || '#0A84FF' }))
      .filter(m => m.value > 0);
  }, [faltas, lojaFiltro, lojas, profissionais]);

  // Faltas by loja
  const faltasPorLoja = useMemo(() => {
    const profPorLoja: Record<string, string[]> = {};
    profissionais.forEach(p => {
      const lName = getLojaName(p.loja_id);
      if (!profPorLoja[lName]) profPorLoja[lName] = [];
      profPorLoja[lName].push(p.id);
    });

    return Object.entries(profPorLoja).map(([loja, profIds]) => {
      const profSet = new Set(profIds);
      const faltasLoja = faltas.filter(f => profSet.has(f.profissional_id || ''));
      const just = faltasLoja.filter(f => f.tipo === 'justificada').length;
      const injust = faltasLoja.filter(f => f.tipo === 'injustificada').length;
      const total = faltasLoja.length;
      const taxaAbsenteismo = profIds.length > 0
        ? parseFloat(((total / (profIds.length * 22)) * 100).toFixed(1))
        : 0;

      return {
        loja: loja.length > 15 ? loja.substring(0, 15) + '...' : loja,
        totalFaltas: total,
        justificadas: just,
        injustificadas: injust,
        profissionais: profIds.length,
        taxaAbsenteismo,
      };
    }).sort((a, b) => b.totalFaltas - a.totalFaltas).slice(0, 10);
  }, [profissionais, faltas, lojaMap]);

  // Growth metrics
  const metricas = useMemo(() => {
    if (dadosHistoricos.length < 2) return null;
    const primeiro = dadosHistoricos[0];
    const ultimo = dadosHistoricos[dadosHistoricos.length - 1];
    const calc = (ini: number, fin: number) => ini === 0 ? '0.0' : ((fin - ini) / ini * 100).toFixed(1);
    return {
      salarios: calc(primeiro.salarioTotal, ultimo.salarioTotal),
      beneficios: calc(primeiro.beneficiosTotal, ultimo.beneficiosTotal),
      faltas: calc(primeiro.faltas, ultimo.faltas),
      profissionais: calc(primeiro.profissionais, ultimo.profissionais),
    };
  }, [dadosHistoricos]);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

  const lojasUnicas = ['TODAS', ...lojas.map(l => l.nome)];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando dados analíticos...</p>
        </div>
      </div>
    );
  }

  if (profissionais.length === 0) {
    return (
      <div className="space-y-6 max-w-[1800px] mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Dashboard Analítico
          </h1>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum profissional cadastrado. Cadastre profissionais e importe dados de benefícios/faltas para visualizar os gráficos analíticos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
                  <p className="text-2xl font-bold">{formatCurrency((profsFiltrados).reduce((s, p) => s + (p.ultimo_salario || p.salario_nominal || 0), 0))}</p>
                </div>
                <div className={`p-2 rounded-lg ${parseFloat(String(metricas.salarios)) >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {parseFloat(String(metricas.salarios)) >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{profsFiltrados.length} profissionais ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Benefícios</p>
                  <p className="text-2xl font-bold">{formatCurrency(dadosHistoricos[dadosHistoricos.length - 1]?.beneficiosTotal || 0)}</p>
                </div>
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">VT + VR + Cesta mês atual</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Faltas</p>
                  <p className="text-2xl font-bold">{faltas.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total registrado</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lojas</p>
                  <p className="text-2xl font-bold">{lojas.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <Users className="h-5 w-5 text-success" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Unidades ativas</p>
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
                  Folha de Salários por Loja
                </CardTitle>
                <CardDescription>Distribuição salarial entre as unidades</CardDescription>
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
                {distribuicaoBeneficios.length > 0 ? (
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
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados de benefícios para exibir</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Evolução de Faltas */}
        <TabsContent value="faltas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Faltas por Período
                </CardTitle>
                <CardDescription>Justificadas vs Injustificadas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Motivos das Faltas</CardTitle>
                <CardDescription>Distribuição por tipo</CardDescription>
              </CardHeader>
              <CardContent>
                {faltasPorMotivo.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={faltasPorMotivo}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {faltasPorMotivo.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {faltasPorMotivo.map((motivo, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: motivo.color }} />
                            <span>{motivo.name}</span>
                          </div>
                          <span className="font-medium">{motivo.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma falta registrada</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Análise por Loja */}
          {faltasPorLoja.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-destructive" />
                  Análise de Faltas por Loja
                </CardTitle>
                <CardDescription>Detalhamento e taxa de absenteísmo por unidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Loja</th>
                        <th className="text-center p-2">Profissionais</th>
                        <th className="text-center p-2">Total Faltas</th>
                        <th className="text-center p-2">Justificadas</th>
                        <th className="text-center p-2">Injustificadas</th>
                        <th className="text-center p-2">Taxa Absenteísmo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faltasPorLoja.map((loja, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{loja.loja}</td>
                          <td className="text-center p-2">{loja.profissionais}</td>
                          <td className="text-center p-2">
                            <span className="font-bold text-warning">{loja.totalFaltas}</span>
                          </td>
                          <td className="text-center p-2">
                            <span className="text-success">{loja.justificadas}</span>
                          </td>
                          <td className="text-center p-2">
                            <span className="text-destructive">{loja.injustificadas}</span>
                          </td>
                          <td className="text-center p-2">
                            <Badge 
                              variant={loja.taxaAbsenteismo > 5 ? "destructive" : loja.taxaAbsenteismo > 3 ? "outline" : "secondary"}
                              className={loja.taxaAbsenteismo > 5 ? "" : loja.taxaAbsenteismo > 3 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}
                            >
                              {loja.taxaAbsenteismo}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Taxa de Absenteísmo:</strong> (Total Faltas / (Profissionais × 22 dias úteis)) × 100
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    • <span className="text-success">Ótimo:</span> {'<'} 3% | 
                    • <span className="text-warning ml-2">Atenção:</span> 3-5% | 
                    • <span className="text-destructive ml-2">Crítico:</span> {'>'} 5%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
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
