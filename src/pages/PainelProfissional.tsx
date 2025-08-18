import { useState } from 'react';
import { Users, TrendingUp, FileText, Filter } from 'lucide-react';
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
    matricula: '123',
    nome: 'João Silva',
    vales: 12050,
    adiantamentos: 35000,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 150000,
    statusHolerite: 'ASSINADO',
  },
  {
    loja: 'BROOKLIN',
    matricula: '124',
    nome: 'Maria Santos',
    vales: 8500,
    adiantamentos: 25000,
    descFaltas: 2150,
    descDSR: 1890,
    totalReceber: 135000,
    statusHolerite: 'ENVIADO',
  },
  {
    loja: 'TATUAPÉ',
    matricula: '125',
    nome: 'Pedro Costa',
    vales: 15200,
    adiantamentos: 40000,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 160000,
    statusHolerite: 'GERADO',
  },
  {
    loja: 'TATUAPÉ',
    matricula: '126',
    nome: 'Ana Oliveira',
    vales: 9800,
    adiantamentos: 27800,
    descFaltas: 1750,
    descDSR: 1450,
    totalReceber: 128000,
    statusHolerite: 'ASSINADO',
  },
];

export default function PainelProfissional() {
  const [competencia, setCompetencia] = useState('2025-08');
  const [lojaFiltro, setLojaFiltro] = useState('');
  const [profissionalFiltro, setProfissionalFiltro] = useState('');

  const formatCurrency = (centavos: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(centavos / 100);
  };

  const exportCSV = () => {
    const headers = ['Loja', 'Matrícula', 'Nome', 'Vales', 'Adiantamentos', 'Desc. Faltas', 'Desc. DSR', 'Total a Receber', 'Status Holerite'];
    const rows = dadosFiltrados.map(item => [
      item.loja,
      item.matricula,
      item.nome,
      formatCurrency(item.vales),
      formatCurrency(item.adiantamentos),
      formatCurrency(item.descFaltas),
      formatCurrency(item.descDSR),
      formatCurrency(item.totalReceber),
      item.statusHolerite,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `painel_profissionais_${competencia}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GERADO':
        return <Badge variant="secondary">Gerado</Badge>;
      case 'ENVIADO':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Enviado</Badge>;
      case 'ASSINADO':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Assinado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const dadosFiltrados = mockDados.filter(item => {
    if (lojaFiltro && item.loja !== lojaFiltro) return false;
    if (profissionalFiltro && !item.nome.toLowerCase().includes(profissionalFiltro.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Painel por Profissional</h1>
        <Badge variant="outline" className="bg-accent/10">
          <Users className="h-4 w-4 mr-2" />
          Detalhamento individual
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
                className="w-32"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loja">Loja</Label>
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
            <div className="space-y-2">
              <Label htmlFor="profissional">Profissional</Label>
              <Input
                id="profissional"
                placeholder="Nome do profissional"
                value={profissionalFiltro}
                onChange={(e) => setProfissionalFiltro(e.target.value)}
                className="w-48"
              />
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
          <CardTitle>Detalhamento por Profissional - {competencia}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loja</TableHead>
                <TableHead>Matr.</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Vales</TableHead>
                <TableHead className="text-right">Adiantamentos</TableHead>
                <TableHead className="text-right">Desc. Faltas</TableHead>
                <TableHead className="text-right">Desc. DSR</TableHead>
                <TableHead className="text-right">Total a Receber</TableHead>
                <TableHead className="text-center">Status Holerite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosFiltrados.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.loja}</TableCell>
                  <TableCell>{item.matricula}</TableCell>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell className="text-right text-emerald-400">
                    {item.vales > 0 ? formatCurrency(item.vales) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-blue-400">
                    {item.adiantamentos > 0 ? formatCurrency(item.adiantamentos) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-red-400">
                    {item.descFaltas > 0 ? `-${formatCurrency(item.descFaltas)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right text-red-400">
                    {item.descDSR > 0 ? `-${formatCurrency(item.descDSR)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-accent">
                    {formatCurrency(item.totalReceber)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(item.statusHolerite)}
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
                  {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.vales, 0))}
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
                  {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.adiantamentos, 0))}
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
                  {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.descFaltas + item.descDSR, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total em Descontos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">{dadosFiltrados.length}</p>
                <p className="text-sm text-muted-foreground">Profissionais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}