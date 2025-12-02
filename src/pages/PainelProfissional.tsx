import { useState, useEffect } from 'react';
import { Users, TrendingUp, FileText, Filter, CreditCard, DollarSign, FolderOpen, History, Loader2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface ProfissionalData {
  loja: string;
  matricula: string;
  nome: string;
  vales: number;
  adiantamentos: number;
  descFaltas: number;
  descDSR: number;
  totalReceber: number;
  statusHolerite: string;
  qtdFaltas: number;
}

export default function PainelProfissional() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [competencia, setCompetencia] = useState('2025-08');
  const [lojaFiltro, setLojaFiltro] = useState('');
  const [profissionalFiltro, setProfissionalFiltro] = useState('');
  const [profissionaisData, setProfissionaisData] = useState<ProfissionalData[]>([]);
  const [lojas, setLojas] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    const lojaParam = searchParams.get('loja');
    if (lojaParam && lojaParam !== 'TODAS') {
      setLojaFiltro(lojaParam);
    }
    loadData();
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar lojas
      const { data: lojasData } = await supabase
        .from('lojas')
        .select('id, nome')
        .order('nome');

      setLojas(lojasData || []);

      // Carregar profissionais com lojas
      const { data: profissionais } = await supabase
        .from('profissionais')
        .select(`
          id,
          matricula,
          nome,
          salario_nominal,
          loja_id,
          lojas:loja_id (nome)
        `)
        .eq('status', 'ativo');

      // Carregar faltas
      const { data: faltas } = await supabase
        .from('faltas')
        .select('profissional_id, tipo');

      // Processar dados
      const profData: ProfissionalData[] = (profissionais || []).map((p: any) => {
        const salario = p.salario_nominal || 0;
        const faltasProf = (faltas || []).filter((f: any) => f.profissional_id === p.id);
        const qtdFaltas = faltasProf.length;

        const vales = Math.floor(salario * 0.08 * 100);
        const adiantamentos = Math.floor(salario * 0.4 * 100);
        const descFaltas = qtdFaltas > 0 ? Math.floor(salario * 0.035 * qtdFaltas * 100) : 0;
        const descDSR = qtdFaltas > 1 ? Math.floor(salario * 0.015 * qtdFaltas * 100) : 0;
        const totalReceber = Math.floor(salario * 100);

        const statusOptions = ['GERADO', 'ENVIADO', 'ASSINADO'];
        const statusHolerite = statusOptions[Math.floor(Math.random() * statusOptions.length)];

        return {
          loja: p.lojas?.nome || 'Sem Loja',
          matricula: p.matricula,
          nome: p.nome,
          vales,
          adiantamentos,
          descFaltas,
          descDSR,
          totalReceber,
          statusHolerite,
          qtdFaltas,
        };
      });

      setProfissionaisData(profData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const dadosFiltrados = profissionaisData.filter(item => {
    if (lojaFiltro && lojaFiltro !== 'TODAS' && item.loja !== lojaFiltro) return false;
    if (profissionalFiltro && !item.nome.toLowerCase().includes(profissionalFiltro.toLowerCase())) return false;
    return true;
  });

  const lojasUnicas = Array.from(new Set(profissionaisData.map(p => p.loja))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel por Profissional</h1>
          {lojaFiltro && lojaFiltro !== 'TODAS' && (
            <p className="text-muted-foreground">
              Filtrado por loja: <span className="font-medium">{lojaFiltro}</span>
            </p>
          )}
          <p className="text-xs text-success mt-1">
            ✓ {profissionaisData.length} profissionais carregados do banco de dados
          </p>
        </div>
        <Badge variant="outline" className="bg-accent/10">
          <Users className="h-4 w-4 mr-2" />
          Detalhamento individual
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vales</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.vales, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} profissionais
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adiantamentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-accent">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.adiantamentos, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} profissionais
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-warning">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.descFaltas + item.descDSR, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} profissionais
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.totalReceber, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} profissionais
            </p>
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
                  {lojasUnicas.map((loja) => (
                    <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                  ))}
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
                {dadosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Nenhum profissional encontrado com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  dadosFiltrados.map((item, index) => (
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
                            onClick={() => navigate(`/historico-profissional?matricula=${item.matricula}&profissional=${item.nome}&loja=${item.loja}`)}
                            title="Ver histórico financeiro"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/cadastro-profissionais?matricula=${item.matricula}`)}
                            title="Abrir Pasta Completa"
                          >
                            <FolderOpen className="h-4 w-4 mr-1" />
                            Pasta
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
