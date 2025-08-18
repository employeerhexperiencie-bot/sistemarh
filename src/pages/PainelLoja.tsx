import { useState } from 'react';
import { Store, TrendingUp, FileText, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const mockDados = [
  {
    loja: 'BROOKLIN',
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
    loja: 'TATUAPÉ',
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
    loja: 'VILA MADALENA',
    vales: 29100,
    adiantamentos: 54200,
    descFaltas: 890,
    descDSR: 650,
    totalReceber: 290000,
    holeritesG: 8,
    holeritesE: 6,
    holeritesA: 2,
  },
];

export default function PainelLoja() {
  const [competencia, setCompetencia] = useState('2025-08');
  const [lojaFiltro, setLojaFiltro] = useState('');

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
        <h1 className="text-3xl font-bold">Painel por Loja</h1>
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
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="competencia">Competência</Label>
              <Input
                id="competencia"
                placeholder="2025-08"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loja">Loja (opcional)</Label>
              <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as lojas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as lojas</SelectItem>
                  <SelectItem value="BROOKLIN">Brooklin</SelectItem>
                  <SelectItem value="TATUAPÉ">Tatuapé</SelectItem>
                  <SelectItem value="VILA MADALENA">Vila Madalena</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportCSV} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Resumo Financeiro por Loja - {competencia}</CardTitle>
        </CardHeader>
        <CardContent>
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
                .filter(item => !lojaFiltro || item.loja === lojaFiltro)
                .map((item, index) => (
                <TableRow key={index}>
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
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(mockDados.reduce((acc, item) => acc + item.vales, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total em Vales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(mockDados.reduce((acc, item) => acc + item.adiantamentos, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total em Adiantamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(mockDados.reduce((acc, item) => acc + item.descFaltas + item.descDSR, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total em Descontos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(mockDados.reduce((acc, item) => acc + item.totalReceber, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total a Receber</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}