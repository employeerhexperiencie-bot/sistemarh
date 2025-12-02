import { useState, useEffect } from 'react';
import { Store, TrendingUp, FileText, Filter, CreditCard, Users, DollarSign, Loader2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface LojaStats {
  loja: string;
  lojaId: string;
  vales: number;
  adiantamentos: number;
  descFaltas: number;
  descDSR: number;
  totalReceber: number;
  holeritesG: number;
  holeritesE: number;
  holeritesA: number;
  faltasComputadas: number;
  profissionaisComFaltas: number;
  totalProfissionais: number;
}

export default function PainelLoja() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [competencia, setCompetencia] = useState('2025-08');
  const [lojaFiltro, setLojaFiltro] = useState('');
  const [estatisticasLojas, setEstatisticasLojas] = useState<LojaStats[]>([]);
  const [lojas, setLojas] = useState<{ id: string; nome: string }[]>([]);
  const tipoFiltro = searchParams.get('tipo') || '';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar lojas
      const { data: lojasData } = await supabase
        .from('lojas')
        .select('id, nome')
        .order('nome');

      setLojas(lojasData || []);

      // Carregar profissionais agrupados por loja
      const { data: profissionais } = await supabase
        .from('profissionais')
        .select(`
          id,
          matricula,
          nome,
          salario_nominal,
          loja_id,
          lojas:loja_id (id, nome)
        `)
        .eq('status', 'ativo');

      // Carregar faltas
      const { data: faltas } = await supabase
        .from('faltas')
        .select('profissional_id, tipo');

      // Agrupar por loja
      const lojaMap = new Map<string, LojaStats>();

      (profissionais || []).forEach((p: any) => {
        const lojaId = p.loja_id || 'sem-loja';
        const lojaNome = p.lojas?.nome || 'Sem Loja';
        const salario = p.salario_nominal || 0;

        if (!lojaMap.has(lojaId)) {
          lojaMap.set(lojaId, {
            loja: lojaNome,
            lojaId,
            vales: 0,
            adiantamentos: 0,
            descFaltas: 0,
            descDSR: 0,
            totalReceber: 0,
            holeritesG: 0,
            holeritesE: 0,
            holeritesA: 0,
            faltasComputadas: 0,
            profissionaisComFaltas: 0,
            totalProfissionais: 0,
          });
        }

        const stats = lojaMap.get(lojaId)!;
        stats.totalProfissionais += 1;
        stats.vales += Math.floor(salario * 0.08 * 100); // 8% em vales
        stats.adiantamentos += Math.floor(salario * 0.4 * 100); // 40% adiantamento
        stats.totalReceber += Math.floor(salario * 100);
        stats.holeritesG += 1;
        stats.holeritesE += Math.random() > 0.2 ? 1 : 0;
        stats.holeritesA += Math.random() > 0.3 ? 1 : 0;

        // Contabilizar faltas
        const faltasProf = (faltas || []).filter((f: any) => f.profissional_id === p.id);
        if (faltasProf.length > 0) {
          stats.profissionaisComFaltas += 1;
          stats.faltasComputadas += faltasProf.length;
          stats.descFaltas += Math.floor(salario * 0.035 * faltasProf.length * 100);
          stats.descDSR += Math.floor(salario * 0.015 * faltasProf.length * 100);
        }
      });

      setEstatisticasLojas(Array.from(lojaMap.values()).sort((a, b) => a.loja.localeCompare(b.loja)));
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
    const headers = ['Loja', 'Vales', 'Adiantamentos', 'Desc. Faltas', 'Desc. DSR', 'Total a Receber', 'Total Profissionais'];
    const rows = dadosFiltrados.map(item => [
      item.loja,
      formatCurrency(item.vales),
      formatCurrency(item.adiantamentos),
      formatCurrency(item.descFaltas),
      formatCurrency(item.descDSR),
      formatCurrency(item.totalReceber),
      item.totalProfissionais,
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
    if (assinados === total && total > 0) return <Badge className="bg-success/10 text-success border-success/20">Completo</Badge>;
    if (enviados > 0) return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Em andamento</Badge>;
    if (gerados > 0) return <Badge variant="secondary">Gerados</Badge>;
    return <Badge variant="outline">Pendente</Badge>;
  };

  const dadosFiltrados = estatisticasLojas.filter(item => 
    !lojaFiltro || lojaFiltro === 'TODAS' || item.loja === lojaFiltro
  );

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
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} lojas
            </p>
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
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} lojas
            </p>
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
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} lojas
            </p>
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
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} lojas
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
                  {lojas.map((loja) => (
                    <SelectItem key={loja.id} value={loja.nome}>{loja.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportCSV} variant="outline" className="w-full sm:w-auto">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Vales</TableHead>
                  <TableHead className="text-right">Adiantamentos</TableHead>
                  <TableHead className="text-right">Desc. Faltas</TableHead>
                  <TableHead className="text-right">Desc. DSR</TableHead>
                  <TableHead className="text-center">Faltas</TableHead>
                  <TableHead className="text-center">Prof. c/ Faltas</TableHead>
                  <TableHead className="text-center">Total Prof.</TableHead>
                  <TableHead className="text-right">Total a Receber</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhuma loja encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  dadosFiltrados.map((item, index) => (
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
                        {item.faltasComputadas > 0 ? (
                          <span className="font-semibold text-warning">{item.faltasComputadas}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.profissionaisComFaltas > 0 ? (
                          <span className="text-warning">{item.profissionaisComFaltas}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {item.totalProfissionais}
                      </TableCell>
                      <TableCell className="text-right font-bold text-success">
                        {formatCurrency(item.totalReceber)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getHoleriteBadge(item.holeritesG, item.holeritesE, item.holeritesA)}
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
