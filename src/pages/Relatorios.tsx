import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Filter, 
  Users, 
  Building2, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState({ inicio: '', fim: '' });
  const [loja, setLoja] = useState('TODAS');
  const [tipoRelatorio, setTipoRelatorio] = useState('geral');
  const [stats, setStats] = useState({
    totalLojas: 0,
    totalProfissionais: 0,
    feriasAgendadas: 0,
    alertasAtivos: 0,
  });
  const [lojas, setLojas] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lojasRes, profRes, feriasRes, alertasRes] = await Promise.all([
        supabase.from('lojas').select('id, nome'),
        supabase.from('profissionais').select('id').eq('status', 'ativo'),
        supabase.from('ferias').select('id').eq('status', 'agendada'),
        supabase.from('alertas_sistema').select('id').eq('lido', false),
      ]);

      setLojas(lojasRes.data || []);
      setStats({
        totalLojas: lojasRes.data?.length || 0,
        totalProfissionais: profRes.data?.length || 0,
        feriasAgendadas: feriasRes.data?.length || 0,
        alertasAtivos: alertasRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const relatoriosDisponiveis = [
    {
      id: 'financeiro',
      nome: 'Relatório Financeiro Consolidado',
      descricao: 'Vales, adiantamentos, descontos e saldo por loja e profissional',
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/5',
      borderColor: 'border-primary/20'
    },
    {
      id: 'faltas',
      nome: 'Relatório de Faltas e Absenteísmo',
      descricao: 'Análise de faltas justificadas e injustificadas por período',
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/5',
      borderColor: 'border-warning/20'
    },
    {
      id: 'ferias',
      nome: 'Relatório de Férias',
      descricao: 'Férias agendadas, vencendo e histórico por profissional',
      icon: Calendar,
      color: 'text-accent',
      bgColor: 'bg-accent/5',
      borderColor: 'border-accent/20'
    },
    {
      id: 'epi',
      nome: 'Relatório de EPIs',
      descricao: 'Estoque, entregas, termos assinados e vencimentos',
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/5',
      borderColor: 'border-success/20'
    },
    {
      id: 'holerites',
      nome: 'Relatório de Holerites',
      descricao: 'Status de geração, envio e assinatura por competência',
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/5',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'documentos',
      nome: 'Relatório de Documentos',
      descricao: 'Documentos expirando, pendentes e status por loja/profissional',
      icon: Clock,
      color: 'text-destructive',
      bgColor: 'bg-destructive/5',
      borderColor: 'border-destructive/20'
    }
  ];

  const handleExport = (formato: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exportando ${tipoRelatorio} em ${formato}`);
    // Implementação futura
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios e Análises</h1>
        <p className="text-muted-foreground">
          Gere relatórios detalhados e exporte dados do sistema
        </p>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Globais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inicio">Data Início</Label>
              <Input
                id="inicio"
                type="date"
                value={periodo.inicio}
                onChange={(e) => setPeriodo(prev => ({ ...prev, inicio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fim">Data Fim</Label>
              <Input
                id="fim"
                type="date"
                value={periodo.fim}
                onChange={(e) => setPeriodo(prev => ({ ...prev, fim: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loja">Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger id="loja">
                  <SelectValue placeholder="Todas as lojas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as lojas</SelectItem>
                  {lojas.map((l) => (
                    <SelectItem key={l.id} value={l.nome}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <Button className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatoriosDisponiveis.map((relatorio) => (
          <Card 
            key={relatorio.id}
            className={`smooth-transition hover:shadow-financial cursor-pointer ${relatorio.bgColor} ${relatorio.borderColor}`}
            onClick={() => setTipoRelatorio(relatorio.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <relatorio.icon className={`h-10 w-10 ${relatorio.color}`} />
                {tipoRelatorio === relatorio.id && (
                  <Badge className="bg-primary">Selecionado</Badge>
                )}
              </div>
              <CardTitle className="text-base mt-4">{relatorio.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {relatorio.descricao}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Relatório Selecionado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Relatório Selecionado:</p>
              <p className="text-lg font-bold capitalize">
                {relatoriosDisponiveis.find(r => r.id === tipoRelatorio)?.nome || 'Nenhum'}
              </p>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <Button 
                onClick={() => handleExport('pdf')}
                className="flex-1 min-w-[150px]"
                variant="default"
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button 
                onClick={() => handleExport('excel')}
                className="flex-1 min-w-[150px]"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button 
                onClick={() => handleExport('csv')}
                className="flex-1 min-w-[150px]"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{stats.totalLojas}</p>
                <p className="text-sm text-muted-foreground">Lojas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">{stats.totalProfissionais}</p>
                <p className="text-sm text-muted-foreground">Profissionais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{stats.feriasAgendadas}</p>
                <p className="text-sm text-muted-foreground">Férias Agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{stats.alertasAtivos}</p>
                <p className="text-sm text-muted-foreground">Alertas Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
