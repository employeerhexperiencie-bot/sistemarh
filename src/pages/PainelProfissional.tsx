import { useState, useEffect } from 'react';
import { Users, TrendingUp, FileText, Filter, CreditCard, DollarSign, FolderOpen, History } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
    qtdFaltas: 0,
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
    qtdFaltas: 2,
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
    qtdFaltas: 0,
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
    qtdFaltas: 0,
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
    qtdFaltas: 1,
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
    qtdFaltas: 0,
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
    qtdFaltas: 1,
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
    qtdFaltas: 0,
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
    qtdFaltas: 1,
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
    qtdFaltas: 0,
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
    qtdFaltas: 1,
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
    qtdFaltas: 0,
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
    qtdFaltas: 1,
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
    qtdFaltas: 0,
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
    qtdFaltas: 1,
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
    qtdFaltas: 0,
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
    qtdFaltas: 1,
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
    qtdFaltas: 0,
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
    qtdFaltas: 1,
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
    qtdFaltas: 0,
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
    qtdFaltas: 2,
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
    qtdFaltas: 0,
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
    qtdFaltas: 1,
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
    qtdFaltas: 0,
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
    qtdFaltas: 1,
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
    qtdFaltas: 0,
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
    qtdFaltas: 2,
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
    qtdFaltas: 0,
  },
];

export default function PainelProfissional() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
    const headers = ['Loja', 'Matrícula', 'Nome', 'Nº Faltas', 'Vales', 'Adiantamentos', 'Desc. Faltas', 'Desc. DSR', 'Total a Receber', 'Status Holerite'];
    const rows = dadosFiltrados.map(item => [
      item.loja,
      item.matricula,
      item.nome,
      item.qtdFaltas || 0,
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
        return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Enviado</Badge>;
      case 'ASSINADO':
        return <Badge className="bg-success/10 text-success border-success/20">Assinado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const dadosFiltrados = mockDados.filter(item => {
    if (lojaFiltro && lojaFiltro !== 'TODAS' && item.loja !== lojaFiltro) return false;
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

      {/* Cards resumo seguindo modelo do Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" 
              onClick={() => navigate(`/historico-profissional?profissional=Todos&loja=${lojaFiltro}&tipo=vales`)}>
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
                {dadosFiltrados.length} profissionais
              </p>
              <Badge variant="outline" className="text-success">
                +12%
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver histórico
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" 
              onClick={() => navigate(`/historico-profissional?profissional=Todos&loja=${lojaFiltro}&tipo=adiantamentos`)}>
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
                {dadosFiltrados.length} profissionais
              </p>
              <Badge variant="outline" className="text-success">
                +8%
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver histórico
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" 
              onClick={() => navigate(`/historico-profissional?profissional=Todos&loja=${lojaFiltro}&tipo=descontos`)}>
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
                {dadosFiltrados.length} profissionais
              </p>
              <Badge variant="outline" className="text-success">
                -5%
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver histórico
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" 
              onClick={() => navigate(`/historico-profissional?profissional=Todos&loja=${lojaFiltro}`)}>
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
                {dadosFiltrados.length} profissionais
              </p>
              <Badge variant="outline" className="text-success">
                +7%
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver histórico
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
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loja</TableHead>
                <TableHead>Matr.</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Nº Faltas</TableHead>
                <TableHead className="text-right">Vales</TableHead>
                <TableHead className="text-right">Adiantamentos</TableHead>
                <TableHead className="text-right">Desc. Faltas</TableHead>
                <TableHead className="text-right">Desc. DSR</TableHead>
                <TableHead className="text-right">Total a Receber</TableHead>
                <TableHead className="text-center">Status Holerite</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosFiltrados.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{item.loja}</TableCell>
                  <TableCell>{item.matricula}</TableCell>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell className="text-center">
                    {item.qtdFaltas > 0 ? (
                      <span className="font-semibold text-warning">{item.qtdFaltas}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-primary">
                    {item.vales > 0 ? formatCurrency(item.vales) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-accent">
                    {item.adiantamentos > 0 ? formatCurrency(item.adiantamentos) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {item.descFaltas > 0 ? `-${formatCurrency(item.descFaltas)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {item.descDSR > 0 ? `-${formatCurrency(item.descDSR)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-success">
                    {formatCurrency(item.totalReceber)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(item.statusHolerite)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/historico-profissional?profissional=${item.nome}&loja=${item.loja}`)}
                        title="Ver histórico financeiro"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/cadastro-profissionais')}
                        title="Ver pasta completa (Documentos, Advertências, Histórico)"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
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