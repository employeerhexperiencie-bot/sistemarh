import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, TrendingUp, Filter, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

interface HistoricoCompletoProps {
  professionalId: string;
  professionalName: string;
}

interface HistoricoItem {
  id: string;
  data: string;
  tipo: string;
  valor: number;
  descricao: string;
  status: string;
  categoria: 'vale' | 'adiantamento' | 'desconto' | 'beneficio';
}

export const HistoricoCompleto: React.FC<HistoricoCompletoProps> = ({
  professionalId,
  professionalName
}) => {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterCategoria, setFilterCategoria] = useState<string>('todos');
  const { toast } = useToast();

  const loadHistorico = async () => {
    try {
      // Carregar vales
      const { data: valesData, error: valesError } = await supabase
        .from('vales' as any)
        .select('*')
        .eq('professional_id', professionalId)
        .order('data_lancamento', { ascending: false });

      if (valesError) {
        console.error('Vales error:', valesError);
        // Se houver erro, usar dados vazios
        setHistorico([]);
        return;
      }

      // Transformar vales em itens de histórico
      const valesItems: HistoricoItem[] = ((valesData as any) || []).map((vale: any) => ({
        id: vale.id,
        data: vale.data_lancamento || vale.data || new Date().toISOString(),
        tipo: vale.tipo || 'Vale',
        valor: vale.valor,
        descricao: vale.descricao || '',
        status: vale.status || 'APROVADO',
        categoria: vale.tipo?.toLowerCase().includes('adiantamento') ? 'adiantamento' : 'vale'
      }));

      setHistorico(valesItems);
    } catch (error) {
      console.error('Load historico error:', error);
      setHistorico([]);
    }
  };

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Categoria', 'Valor', 'Descrição', 'Status'];
    const rows = filteredHistorico.map(item => [
      new Date(item.data).toLocaleDateString('pt-BR'),
      item.tipo,
      item.categoria,
      formatCurrency(item.valor.toString()),
      item.descricao,
      item.status,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_${professionalName.replace(' ', '_')}_${competencia}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTipoBadge = (tipo: string, categoria: string) => {
    switch (categoria) {
      case 'vale':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Vale</Badge>;
      case 'adiantamento':
        return <Badge className="bg-accent/10 text-accent border-accent/20">Adiantamento</Badge>;
      case 'desconto':
        return <Badge variant="destructive">Desconto</Badge>;
      case 'beneficio':
        return <Badge className="bg-success/10 text-success border-success/20">Benefício</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APROVADO':
        return <Badge className="bg-success/10 text-success border-success/20">Aprovado</Badge>;
      case 'DESCONTADO':
        return <Badge variant="destructive">Descontado</Badge>;
      case 'PENDENTE':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pendente</Badge>;
      case 'CANCELADO':
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    loadHistorico();
  }, [professionalId]);

  const filteredHistorico = historico.filter(item => {
    const itemDate = new Date(item.data);
    const [year, month] = competencia.split('-');
    const matchesCompetencia = itemDate.getFullYear() === parseInt(year) && 
                               (itemDate.getMonth() + 1) === parseInt(month);
    const matchesCategoria = filterCategoria === 'todos' || item.categoria === filterCategoria;
    return matchesCompetencia && matchesCategoria;
  });

  const totalVales = filteredHistorico
    .filter(item => item.categoria === 'vale' && item.valor > 0)
    .reduce((acc, item) => acc + item.valor, 0);

  const totalAdiantamentos = filteredHistorico
    .filter(item => item.categoria === 'adiantamento')
    .reduce((acc, item) => acc + item.valor, 0);

  const totalDescontos = Math.abs(filteredHistorico
    .filter(item => item.categoria === 'desconto' || item.valor < 0)
    .reduce((acc, item) => acc + item.valor, 0));

  const saldoLiquido = totalVales + totalAdiantamentos - totalDescontos;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(totalVales.toString())}
                </p>
                <p className="text-xs text-muted-foreground">Total em Vales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-accent">
                  {formatCurrency(totalAdiantamentos.toString())}
                </p>
                <p className="text-xs text-muted-foreground">Total Adiantamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-destructive" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-destructive">
                  {formatCurrency(totalDescontos.toString())}
                </p>
                <p className="text-xs text-muted-foreground">Total Descontos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-success">
                  {formatCurrency(saldoLiquido.toString())}
                </p>
                <p className="text-xs text-muted-foreground">Saldo Líquido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
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
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="w-40"
              />
            </div>
            <Tabs value={filterCategoria} onValueChange={setFilterCategoria} className="flex-1">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="vale">Vales</TabsTrigger>
                <TabsTrigger value="adiantamento">Adiantamentos</TabsTrigger>
                <TabsTrigger value="desconto">Descontos</TabsTrigger>
                <TabsTrigger value="beneficio">Benefícios</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={exportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela do Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico Detalhado - {competencia}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredHistorico.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum registro encontrado para este período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistorico.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{getTipoBadge(item.tipo, item.categoria)}</TableCell>
                      <TableCell className="font-medium">{item.tipo}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        item.valor > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {item.valor > 0 ? '+' : ''}{formatCurrency(item.valor.toString())}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={item.descricao}>
                        {item.descricao}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(item.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
