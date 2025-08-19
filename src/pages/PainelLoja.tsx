import { useState, useEffect } from 'react';
import { Store, TrendingUp, FileText, Filter } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  },
];

export default function PainelLoja() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [competencia, setCompetencia] = useState('2025-08');
  const [lojaFiltro, setLojaFiltro] = useState('');
  const tipoFiltro = searchParams.get('tipo') || '';

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
    const rows = mockDados.map(item => [
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
    if (assinados === total) return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Completo</Badge>;
    if (enviados > 0) return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Em andamento</Badge>;
    if (gerados > 0) return <Badge variant="secondary">Gerados</Badge>;
    return <Badge variant="outline">Pendente</Badge>;
  };

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
                <TableHead className="text-right">Total a Receber</TableHead>
                <TableHead className="text-center">Holerites</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDados
                .filter(item => !lojaFiltro || lojaFiltro === 'TODAS' || item.loja === lojaFiltro)
                .map((item, index) => (
                <TableRow key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/painel-profissional?loja=${item.loja}`)}>
                  <TableCell className="font-medium">{item.loja}</TableCell>
                  <TableCell className="text-right text-emerald-400">
                    {formatCurrency(item.vales)}
                  </TableCell>
                  <TableCell className="text-right text-blue-400">
                    {formatCurrency(item.adiantamentos)}
                  </TableCell>
                  <TableCell className="text-right text-red-400">
                    -{formatCurrency(item.descFaltas)}
                  </TableCell>
                  <TableCell className="text-right text-red-400">
                    -{formatCurrency(item.descDSR)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-accent">
                    {formatCurrency(item.totalReceber)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        G: {item.holeritesG}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                        E: {item.holeritesE}
                      </Badge>
                      <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-emerald-400 truncate">
                  {formatCurrency(mockDados
                    .filter(item => !lojaFiltro || lojaFiltro === 'TODAS' || item.loja === lojaFiltro)
                    .reduce((acc, item) => acc + item.vales, 0))}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total em Vales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-blue-400 truncate">
                  {formatCurrency(mockDados
                    .filter(item => !lojaFiltro || lojaFiltro === 'TODAS' || item.loja === lojaFiltro)
                    .reduce((acc, item) => acc + item.adiantamentos, 0))}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total em Adiantamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-red-400 truncate">
                  {formatCurrency(mockDados
                    .filter(item => !lojaFiltro || lojaFiltro === 'TODAS' || item.loja === lojaFiltro)
                    .reduce((acc, item) => acc + item.descFaltas + item.descDSR, 0))}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total em Descontos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-accent truncate">
                  {formatCurrency(mockDados
                    .filter(item => !lojaFiltro || lojaFiltro === 'TODAS' || item.loja === lojaFiltro)
                    .reduce((acc, item) => acc + item.totalReceber, 0))}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total a Receber</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}