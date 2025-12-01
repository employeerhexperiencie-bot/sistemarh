import { useState, useEffect } from 'react';
import { Store, TrendingUp, FileText, Filter, CreditCard, Users, AlertTriangle, DollarSign } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMockData } from '@/hooks/useMockData';

const mockDados = [
  {
    loja: 'REI DO GADO',
    vales: 45300,
    adiantamentos: 89500,
    descFaltas: 2150,
    descDSR: 1890,
    totalReceber: 450000,
    holeritesG: 12,
    holeritesE: 8,
    holeritesA: 3,
    faltasComputadas: 5,
    profissionaisComFaltas: 3,
    totalProfissionais: 12,
  },
  {
    loja: 'BIG OSASCO',
    vales: 38200,
    adiantamentos: 67800,
    descFaltas: 1750,
    descDSR: 1450,
    totalReceber: 380000,
    holeritesG: 10,
    holeritesE: 7,
    holeritesA: 4,
    faltasComputadas: 4,
    profissionaisComFaltas: 2,
    totalProfissionais: 10,
  },
  {
    loja: 'BOSQUE SAUDE',
    vales: 29100,
    adiantamentos: 54200,
    descFaltas: 890,
    descDSR: 650,
    totalReceber: 290000,
    holeritesG: 8,
    holeritesE: 6,
    holeritesA: 2,
    faltasComputadas: 2,
    profissionaisComFaltas: 1,
    totalProfissionais: 8,
  },
  {
    loja: 'BROOKLYN',
    vales: 32400,
    adiantamentos: 59300,
    descFaltas: 1200,
    descDSR: 980,
    totalReceber: 315000,
    holeritesG: 9,
    holeritesE: 7,
    holeritesA: 5,
    faltasComputadas: 3,
    profissionaisComFaltas: 2,
    totalProfissionais: 9,
  },
  {
    loja: 'ITAPECERICA',
    vales: 28900,
    adiantamentos: 48700,
    descFaltas: 750,
    descDSR: 560,
    totalReceber: 275000,
    holeritesG: 7,
    holeritesE: 5,
    holeritesA: 3,
    faltasComputadas: 2,
    profissionaisComFaltas: 1,
    totalProfissionais: 7,
  },
  {
    loja: 'LAJEDO',
    vales: 31200,
    adiantamentos: 52800,
    descFaltas: 980,
    descDSR: 720,
    totalReceber: 295000,
    holeritesG: 8,
    holeritesE: 6,
    holeritesA: 4,
    faltasComputadas: 2,
    profissionaisComFaltas: 2,
    totalProfissionais: 8,
  },
  {
    loja: 'MATEO BEI',
    vales: 35600,
    adiantamentos: 61200,
    descFaltas: 1350,
    descDSR: 1100,
    totalReceber: 340000,
    holeritesG: 10,
    holeritesE: 8,
    holeritesA: 6,
    faltasComputadas: 3,
    profissionaisComFaltas: 3,
    totalProfissionais: 10,
  },
  {
    loja: 'MUTINGA',
    vales: 27800,
    adiantamentos: 46500,
    descFaltas: 680,
    descDSR: 450,
    totalReceber: 265000,
    holeritesG: 6,
    holeritesE: 4,
    holeritesA: 2,
    faltasComputadas: 1,
    profissionaisComFaltas: 1,
    totalProfissionais: 6,
  },
  {
    loja: 'RAGUEB',
    vales: 33100,
    adiantamentos: 57900,
    descFaltas: 1150,
    descDSR: 890,
    totalReceber: 320000,
    holeritesG: 9,
    holeritesE: 7,
    holeritesA: 5,
    faltasComputadas: 3,
    profissionaisComFaltas: 2,
    totalProfissionais: 9,
  },
  {
    loja: 'SBC',
    vales: 39800,
    adiantamentos: 72400,
    descFaltas: 1580,
    descDSR: 1230,
    totalReceber: 385000,
    holeritesG: 11,
    holeritesE: 9,
    holeritesA: 7,
    faltasComputadas: 4,
    profissionaisComFaltas: 3,
    totalProfissionais: 11,
  },
  {
    loja: 'SUPER LAPA',
    vales: 36900,
    adiantamentos: 64300,
    descFaltas: 1420,
    descDSR: 1080,
    totalReceber: 355000,
    holeritesG: 10,
    holeritesE: 8,
    holeritesA: 6,
    faltasComputadas: 3,
    profissionaisComFaltas: 3,
    totalProfissionais: 10,
  },
  {
    loja: 'TABOÃO',
    vales: 30500,
    adiantamentos: 53600,
    descFaltas: 920,
    descDSR: 710,
    totalReceber: 285000,
    holeritesG: 8,
    holeritesE: 6,
    holeritesA: 4,
    faltasComputadas: 2,
    profissionaisComFaltas: 2,
    totalProfissionais: 8,
  },
  {
    loja: 'COMERCIAL',
    vales: 41200,
    adiantamentos: 78600,
    descFaltas: 1680,
    descDSR: 1340,
    totalReceber: 395000,
    holeritesG: 12,
    holeritesE: 10,
    holeritesA: 8,
    faltasComputadas: 4,
    profissionaisComFaltas: 3,
    totalProfissionais: 12,
  },
];

export default function PainelLoja() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mockData = useMockData();
  const [competencia, setCompetencia] = useState('2025-08');
  const [lojaFiltro, setLojaFiltro] = useState('');
  const tipoFiltro = searchParams.get('tipo') || '';

  // Usar dados da planilha
  const faltasPorLoja = mockData.getFaltas().reduce((acc: any, f: any) => {
    if (!acc[f.loja]) {
      acc[f.loja] = { total: 0, profissionais: 0 };
    }
    acc[f.loja].total += f.totalFaltas;
    if (f.totalFaltas > 0) acc[f.loja].profissionais += 1;
    return acc;
  }, {});

  const estatisticasLojas = mockData.getEstatisticasPorLoja().map(stat => ({
    loja: stat.loja,
    vales: Math.floor(stat.totalProfissionais * 15000), // R$150 médio por profissional
    adiantamentos: Math.floor(stat.totalSalarios * 0.4), // 40% dia 20
    descFaltas: Math.floor(stat.totalSalarios * 0.02), // 2% estimado
    descDSR: Math.floor(stat.totalSalarios * 0.015), // 1.5% estimado
    totalReceber: Math.floor(stat.totalSalarios),
    holeritesG: stat.totalProfissionais,
    holeritesE: Math.floor(stat.totalProfissionais * 0.9),
    holeritesA: Math.floor(stat.totalProfissionais * 0.8),
    faltasComputadas: faltasPorLoja[stat.loja]?.total || 0,
    profissionaisComFaltas: faltasPorLoja[stat.loja]?.profissionais || 0,
    totalProfissionais: stat.totalProfissionais,
  }));

  useEffect(() => {
    if (tipoFiltro) {
      // Scroll to top when navigating with tipo filter
      window.scrollTo(0, 0);
    }
  }, [tipoFiltro]);

  const formatCurrency = (centavos: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(centavos / 100);
  };

  const exportCSV = () => {
    const headers = ['Loja', 'Vales', 'Adiantamentos', 'Desc. Faltas', 'Desc. DSR', 'Total a Receber', 'Holerites G', 'Holerites E', 'Holerites A'];
    const rows = estatisticasLojas.map(item => [
      item.loja,
      formatCurrency(item.vales),
      formatCurrency(item.adiantamentos),
      formatCurrency(item.descFaltas),
      formatCurrency(item.descDSR),
      formatCurrency(item.totalReceber),
      item.holeritesG,
      item.holeritesE,
      item.holeritesA,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `painel_lojas_${competencia}.csv`;
    a.click();
  };

  const getHoleriteBadge = (gerados: number, enviados: number, assinados: number) => {
    const total = gerados;
    if (assinados === total) return <Badge className="bg-success/10 text-success border-success/20">Completo</Badge>;
    if (enviados > 0) return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Em andamento</Badge>;
    if (gerados > 0) return <Badge variant="secondary">Gerados</Badge>;
    return <Badge variant="outline">Pendente</Badge>;
  };

  const dadosFiltrados = estatisticasLojas.filter(item => !lojaFiltro || lojaFiltro === 'TODAS' || item.loja === lojaFiltro);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel por Loja</h1>
          {tipoFiltro && (
            <p className="text-muted-foreground">
              Filtrado por: <span className="capitalize font-medium">{tipoFiltro}</span>
            </p>
          )}
        </div>
        <Badge variant="outline" className="bg-accent/10">
          <Store className="h-4 w-4 mr-2" />
          Resumo financeiro
        </Badge>
      </div>

      {/* Cards principais seguindo modelo do Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" 
              onClick={() => navigate(`/painel-profissional?tipo=vales&loja=${lojaFiltro || 'TODAS'}`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vales</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.vales, 0))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dadosFiltrados.length} lojas
              </p>
              <Badge variant="outline" className="text-success">
                +12%
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver por profissional
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" 
              onClick={() => navigate(`/painel-profissional?tipo=adiantamentos&loja=${lojaFiltro || 'TODAS'}`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adiantamentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-accent">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.adiantamentos, 0))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dadosFiltrados.length} lojas
              </p>
              <Badge variant="outline" className="text-success">
                +8%
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver por profissional
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" 
              onClick={() => navigate(`/painel-profissional?tipo=descontos&loja=${lojaFiltro || 'TODAS'}`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-warning">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.descFaltas + item.descDSR, 0))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dadosFiltrados.length} lojas
              </p>
              <Badge variant="outline" className="text-success">
                -5%
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver por profissional
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" 
              onClick={() => navigate(`/painel-profissional?loja=${lojaFiltro || 'TODAS'}`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.totalReceber, 0))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dadosFiltrados.length} lojas
              </p>
              <Badge variant="outline" className="text-success">
                +7%
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver por profissional
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="space-y-2">
              <Label htmlFor="competencia">Competência</Label>
              <Input
                id="competencia"
                placeholder="2025-08"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="w-32 sm:w-40"
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="loja">Loja (opcional)</Label>
              <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Todas as lojas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as lojas</SelectItem>
                  <SelectItem value="REI DO GADO">Rei do Gado</SelectItem>
                  <SelectItem value="BIG OSASCO">Big Osasco</SelectItem>
                  <SelectItem value="BOSQUE SAUDE">Bosque Saúde</SelectItem>
                  <SelectItem value="BROOKLYN">Brooklyn</SelectItem>
                  <SelectItem value="ITAPECERICA">Itapecerica</SelectItem>
                  <SelectItem value="LAJEDO">Lajedo</SelectItem>
                  <SelectItem value="MATEO BEI">Mateo Bei</SelectItem>
                  <SelectItem value="MUTINGA">Mutinga</SelectItem>
                  <SelectItem value="RAGUEB">Ragueb</SelectItem>
                  <SelectItem value="SBC">SBC</SelectItem>
                  <SelectItem value="SUPER LAPA">Super Lapa</SelectItem>
                  <SelectItem value="TABOÃO">Taboão</SelectItem>
                  <SelectItem value="COMERCIAL">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportCSV} variant="outline" className="w-full sm:w-auto">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Resumo Financeiro por Loja - {competencia}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loja</TableHead>
                <TableHead className="text-right">Vales</TableHead>
                <TableHead className="text-right">Adiantamentos</TableHead>
                <TableHead className="text-right">Desc. Faltas</TableHead>
                <TableHead className="text-right">Desc. DSR</TableHead>
                <TableHead className="text-center">Faltas Computadas</TableHead>
                <TableHead className="text-center">Profissionais c/ Faltas</TableHead>
                <TableHead className="text-center">Total Profissionais</TableHead>
                <TableHead className="text-right">Total a Receber</TableHead>
                <TableHead className="text-center">Holerites</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosFiltrados.map((item, index) => (
                <TableRow key={index} className="cursor-pointer hover:bg-muted/50" 
                         onClick={() => navigate(`/painel-profissional?loja=${item.loja}`)}>
                  <TableCell className="font-medium">{item.loja}</TableCell>
                  <TableCell className="text-right text-primary">
                    {formatCurrency(item.vales)}
                  </TableCell>
                  <TableCell className="text-right text-accent">
                    {formatCurrency(item.adiantamentos)}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    -{formatCurrency(item.descFaltas)}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    -{formatCurrency(item.descDSR)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-destructive/10 text-destructive">
                      {item.faltasComputadas}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-warning/10 text-warning">
                      {item.profissionaisComFaltas}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {item.totalProfissionais}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-success">
                    {formatCurrency(item.totalReceber)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        G: {item.holeritesG}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                        E: {item.holeritesE}
                      </Badge>
                      <Badge className="text-xs bg-success/10 text-success border-success/20">
                        A: {item.holeritesA}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getHoleriteBadge(item.holeritesG, item.holeritesE, item.holeritesA)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}