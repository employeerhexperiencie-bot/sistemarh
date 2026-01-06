import { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, FileText, Filter, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCompetenciaAtual } from '@/lib/competencia';

interface HistoricoItem {
  data: string;
  tipo: string;
  valor: number;
  descricao: string;
  status: string;
}

export default function HistoricoProfissional() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [competencia, setCompetencia] = useState(getCompetenciaAtual);
  const [novoItem, setNovoItem] = useState({ tipo: '', valor: '', descricao: '' });
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [profissionalInfo, setProfissionalInfo] = useState<{ nome: string; loja: string } | null>(null);
  
  const matricula = searchParams.get('matricula') || '';
  const profissional = searchParams.get('profissional') || '';
  const loja = searchParams.get('loja') || '';

  useEffect(() => {
    if (matricula) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [matricula]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar profissional
      const { data: prof } = await supabase
        .from('profissionais')
        .select(`
          id,
          nome,
          salario_nominal,
          lojas:lojas!profissionais_loja_id_fkey(nome)
        `)
        .eq('matricula', matricula)
        .maybeSingle();

      if (!prof) {
        setProfissionalInfo({ nome: profissional || 'Não encontrado', loja: loja || '' });
        setHistorico([]);
        setLoading(false);
        return;
      }

      setProfissionalInfo({
        nome: prof.nome,
        loja: prof.lojas?.nome || loja || ''
      });

      const historicoItems: HistoricoItem[] = [];
      const salario = prof.salario_nominal || 0;

      // Buscar benefícios
      const { data: beneficios } = await supabase
        .from('beneficios')
        .select('*')
        .eq('profissional_id', prof.id)
        .order('mes_referencia', { ascending: false })
        .limit(1);

      if (beneficios && beneficios.length > 0) {
        const b = beneficios[0];
        if (b.valor_liquido_vt) {
          historicoItems.push({
            data: b.mes_referencia,
            tipo: 'VALE',
            valor: Math.floor(b.valor_liquido_vt * 100),
            descricao: 'Vale Transporte',
            status: 'APROVADO',
          });
        }
        if (b.valor_liquido_vr) {
          historicoItems.push({
            data: b.mes_referencia,
            tipo: 'VALE',
            valor: Math.floor(b.valor_liquido_vr * 100),
            descricao: 'Vale Refeição',
            status: 'APROVADO',
          });
        }
        if (b.valor_cesta) {
          historicoItems.push({
            data: b.mes_referencia,
            tipo: 'VALE',
            valor: Math.floor(b.valor_cesta * 100),
            descricao: 'Cesta Básica',
            status: 'APROVADO',
          });
        }
      }

      // Adiantamento estimado
      if (salario > 0) {
        historicoItems.push({
          data: new Date().toISOString().split('T')[0],
          tipo: 'ADIANTAMENTO',
          valor: Math.floor(salario * 0.4 * 100),
          descricao: 'Adiantamento dia 20 (40%)',
          status: 'APROVADO',
        });
      }

      // Buscar faltas
      const { data: faltas } = await supabase
        .from('faltas')
        .select('*')
        .eq('profissional_id', prof.id)
        .order('data_falta', { ascending: false });

      (faltas || []).forEach((f: any) => {
        if (f.tipo === 'injustificada') {
          historicoItems.push({
            data: f.data_falta,
            tipo: 'FALTA',
            valor: -Math.floor(salario * 0.035 * 100),
            descricao: `Falta injustificada - ${f.motivo || 'sem observação'}`,
            status: 'DESCONTADO',
          });
        }
      });

      // Buscar vales
      const { data: vales } = await supabase
        .from('professional_vales')
        .select('*')
        .eq('profissional_id', prof.id)
        .order('data_lancamento', { ascending: false });

      (vales || []).forEach((v: any) => {
        historicoItems.push({
          data: v.data_lancamento,
          tipo: 'VALE',
          valor: Math.floor(v.valor * 100),
          descricao: v.descricao || v.tipo,
          status: v.status?.toUpperCase() || 'APROVADO',
        });
      });

      setHistorico(historicoItems.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Valor', 'Descrição', 'Status'];
    const rows = historico.map(item => [
      formatDate(item.data),
      item.tipo,
      formatCurrency(item.valor),
      item.descricao,
      item.status,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_${(profissionalInfo?.nome || profissional).replace(' ', '_')}_${competencia}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string, tipo: string) => {
    if (tipo === 'FALTA') {
      return <Badge variant="destructive">Desconto</Badge>;
    }
    
    switch (status) {
      case 'APROVADO':
        return <Badge className="bg-success/10 text-success border-success/20">Aprovado</Badge>;
      case 'DESCONTADO':
        return <Badge variant="destructive">Descontado</Badge>;
      case 'PENDENTE':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'VALE':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Vale</Badge>;
      case 'ADIANTAMENTO':
        return <Badge className="bg-accent/10 text-accent border-accent/20">Adiantamento</Badge>;
      case 'FALTA':
        return <Badge variant="destructive">Falta</Badge>;
      case 'EMPRESTIMO':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Empréstimo</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const totais = useMemo(() => ({
    vales: historico.filter(item => item.tipo === 'VALE' && item.valor > 0).reduce((acc, item) => acc + item.valor, 0),
    adiantamentos: historico.filter(item => item.tipo === 'ADIANTAMENTO').reduce((acc, item) => acc + item.valor, 0),
    descontos: Math.abs(historico.filter(item => item.valor < 0).reduce((acc, item) => acc + item.valor, 0)),
    saldo: historico.reduce((acc, item) => acc + item.valor, 0),
  }), [historico]);

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
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/painel-profissional?loja=${loja}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Histórico - {profissionalInfo?.nome || profissional}</h1>
            <p className="text-muted-foreground">
              Loja: <span className="font-medium">{profissionalInfo?.loja || loja}</span>
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-accent/10">
          <Calendar className="h-4 w-4 mr-2" />
          Histórico individual
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-primary">{formatCurrency(totais.vales)}</p>
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
                <p className="text-xl font-bold text-accent">{formatCurrency(totais.adiantamentos)}</p>
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
                <p className="text-xl font-bold text-destructive">{formatCurrency(totais.descontos)}</p>
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
                <p className="text-xl font-bold text-success">{formatCurrency(totais.saldo)}</p>
                <p className="text-xs text-muted-foreground">Saldo Líquido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Ações
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
            <Button onClick={exportCSV} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Exportar Histórico
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Histórico Detalhado - {competencia}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  historico.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(item.data)}</TableCell>
                      <TableCell>{getTipoBadge(item.tipo)}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        item.valor > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {item.valor > 0 ? '+' : ''}{formatCurrency(item.valor)}
                      </TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(item.status, item.tipo)}
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
