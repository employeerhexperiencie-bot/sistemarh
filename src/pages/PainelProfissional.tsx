import { useState, useEffect } from 'react';
import { Users, TrendingUp, FileText, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const mockDados = [
  // REI DO GADO
  {
    loja: 'REI DO GADO',
    matricula: '001',
    nome: 'João Silva',
    vales: 12050,
    adiantamentos: 35000,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 150000,
    statusHolerite: 'ASSINADO',
  },
  {
    loja: 'REI DO GADO',
    matricula: '002',
    nome: 'Maria Santos',
    vales: 8500,
    adiantamentos: 25000,
    descFaltas: 2150,
    descDSR: 1890,
    totalReceber: 135000,
    statusHolerite: 'ENVIADO',
  },
  {
    loja: 'REI DO GADO',
    matricula: '003',
    nome: 'Carlos Pereira',
    vales: 10200,
    adiantamentos: 29500,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 165000,
    statusHolerite: 'GERADO',
  },
  // BIG OSASCO
  {
    loja: 'BIG OSASCO',
    matricula: '101',
    nome: 'Pedro Costa',
    vales: 15200,
    adiantamentos: 40000,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 160000,
    statusHolerite: 'GERADO',
  },
  {
    loja: 'BIG OSASCO',
    matricula: '102',
    nome: 'Ana Oliveira',
    vales: 9800,
    adiantamentos: 27800,
    descFaltas: 1750,
    descDSR: 1450,
    totalReceber: 128000,
    statusHolerite: 'ASSINADO',
  },
  {
    loja: 'BIG OSASCO',
    matricula: '103',
    nome: 'Roberto Lima',
    vales: 13200,
    adiantamentos: 32000,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 145000,
    statusHolerite: 'ENVIADO',
  },
  // BOSQUE SAUDE
  {
    loja: 'BOSQUE SAUDE',
    matricula: '201',
    nome: 'Fernanda Alves',
    vales: 11400,
    adiantamentos: 28000,
    descFaltas: 890,
    descDSR: 650,
    totalReceber: 125000,
    statusHolerite: 'ASSINADO',
  },
  {
    loja: 'BOSQUE SAUDE',
    matricula: '202',
    nome: 'Ricardo Souza',
    vales: 9700,
    adiantamentos: 26200,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 140000,
    statusHolerite: 'GERADO',
  },
  // BROOKLYN
  {
    loja: 'BROOKLYN',
    matricula: '301',
    nome: 'Juliana Castro',
    vales: 14100,
    adiantamentos: 31500,
    descFaltas: 1200,
    descDSR: 980,
    totalReceber: 138000,
    statusHolerite: 'ENVIADO',
  },
  {
    loja: 'BROOKLYN',
    matricula: '302',
    nome: 'Marcos Rodrigues',
    vales: 10800,
    adiantamentos: 27800,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 155000,
    statusHolerite: 'ASSINADO',
  },
  // ITAPECERICA
  {
    loja: 'ITAPECERICA',
    matricula: '401',
    nome: 'Patricia Mendes',
    vales: 12900,
    adiantamentos: 24350,
    descFaltas: 750,
    descDSR: 560,
    totalReceber: 120000,
    statusHolerite: 'GERADO',
  },
  {
    loja: 'ITAPECERICA',
    matricula: '402',
    nome: 'Eduardo Ferreira',
    vales: 8000,
    adiantamentos: 24350,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 130000,
    statusHolerite: 'ENVIADO',
  },
  // LAJEDO
  {
    loja: 'LAJEDO',
    matricula: '501',
    nome: 'Camila Barbosa',
    vales: 13600,
    adiantamentos: 26400,
    descFaltas: 980,
    descDSR: 720,
    totalReceber: 125000,
    statusHolerite: 'ASSINADO',
  },
  {
    loja: 'LAJEDO',
    matricula: '502',
    nome: 'Thiago Nascimento',
    vales: 9600,
    adiantamentos: 26400,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 145000,
    statusHolerite: 'GERADO',
  },
  // MATEO BEI
  {
    loja: 'MATEO BEI',
    matricula: '601',
    nome: 'Luciana Ramos',
    vales: 15800,
    adiantamentos: 30600,
    descFaltas: 1350,
    descDSR: 1100,
    totalReceber: 148000,
    statusHolerite: 'ENVIADO',
  },
  {
    loja: 'MATEO BEI',
    matricula: '602',
    nome: 'Alexandre Teixeira',
    vales: 11800,
    adiantamentos: 30600,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 165000,
    statusHolerite: 'ASSINADO',
  },
  // MUTINGA
  {
    loja: 'MUTINGA',
    matricula: '701',
    nome: 'Bianca Correia',
    vales: 12400,
    adiantamentos: 23250,
    descFaltas: 680,
    descDSR: 450,
    totalReceber: 118000,
    statusHolerite: 'GERADO',
  },
  {
    loja: 'MUTINGA',
    matricula: '702',
    nome: 'Diego Moreira',
    vales: 7400,
    adiantamentos: 23250,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 125000,
    statusHolerite: 'ASSINADO',
  },
  // RAGUEB
  {
    loja: 'RAGUEB',
    matricula: '801',
    nome: 'Gabriela Santos',
    vales: 14550,
    adiantamentos: 28950,
    descFaltas: 1150,
    descDSR: 890,
    totalReceber: 142000,
    statusHolerite: 'ENVIADO',
  },
  {
    loja: 'RAGUEB',
    matricula: '802',
    nome: 'Leonardo Silva',
    vales: 10550,
    adiantamentos: 28950,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 155000,
    statusHolerite: 'GERADO',
  },
  // SBC
  {
    loja: 'SBC',
    matricula: '901',
    nome: 'Isabella Costa',
    vales: 17400,
    adiantamentos: 36200,
    descFaltas: 1580,
    descDSR: 1230,
    totalReceber: 168000,
    statusHolerite: 'ASSINADO',
  },
  {
    loja: 'SBC',
    matricula: '902',
    nome: 'Rafael Oliveira',
    vales: 12400,
    adiantamentos: 36200,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 185000,
    statusHolerite: 'ENVIADO',
  },
  // SUPER LAPA
  {
    loja: 'SUPER LAPA',
    matricula: '1001',
    nome: 'Amanda Pereira',
    vales: 16200,
    adiantamentos: 32150,
    descFaltas: 1420,
    descDSR: 1080,
    totalReceber: 155000,
    statusHolerite: 'GERADO',
  },
  {
    loja: 'SUPER LAPA',
    matricula: '1002',
    nome: 'Bruno Martins',
    vales: 11700,
    adiantamentos: 32150,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 175000,
    statusHolerite: 'ASSINADO',
  },
  // TABOÃO
  {
    loja: 'TABOÃO',
    matricula: '1101',
    nome: 'Carolina Lima',
    vales: 13250,
    adiantamentos: 26800,
    descFaltas: 920,
    descDSR: 710,
    totalReceber: 128000,
    statusHolerite: 'ENVIADO',
  },
  {
    loja: 'TABOÃO',
    matricula: '1102',
    nome: 'Felipe Santos',
    vales: 9250,
    adiantamentos: 26800,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 140000,
    statusHolerite: 'GERADO',
  },
  // COMERCIAL
  {
    loja: 'COMERCIAL',
    matricula: '1201',
    nome: 'Vanessa Rodrigues',
    vales: 18100,
    adiantamentos: 39300,
    descFaltas: 1680,
    descDSR: 1340,
    totalReceber: 172000,
    statusHolerite: 'ASSINADO',
  },
  {
    loja: 'COMERCIAL',
    matricula: '1202',
    nome: 'Gustavo Almeida',
    vales: 13100,
    adiantamentos: 39300,
    descFaltas: 0,
    descDSR: 0,
    totalReceber: 195000,
    statusHolerite: 'ENVIADO',
  },
];

export default function PainelProfissional() {
  const [searchParams] = useSearchParams();
  const [competencia, setCompetencia] = useState('2025-08');
  const [lojaFiltro, setLojaFiltro] = useState('');
  const [profissionalFiltro, setProfissionalFiltro] = useState('');

  useEffect(() => {
    const lojaParam = searchParams.get('loja');
    if (lojaParam) {
      setLojaFiltro(lojaParam);
    }
  }, [searchParams]);

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
        <div>
          <h1 className="text-3xl font-bold">Painel por Profissional</h1>
          {lojaFiltro && (
            <p className="text-muted-foreground">
              Filtrado por loja: <span className="font-medium">{lojaFiltro}</span>
            </p>
          )}
        </div>
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