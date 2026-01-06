import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Banknote, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  PauseCircle, 
  TrendingDown,
  Building2,
  CreditCard,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Emprestimo {
  id: string;
  tipo: 'empresa' | 'clt';
  valorTotal: number | null;
  numeroParcelas: number | null;
  valorParcela: number;
  parcelasPagas: number;
  saldoDevedor: number;
  dataInicio: string;
  dataPrevisaoTermino: string | null;
  status: string;
  observacoes: string | null;
}

interface EmprestimosTimelineProps {
  profissionalId: string;
  profissionalNome?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

export function EmprestimosTimeline({ profissionalId, profissionalNome }: EmprestimosTimelineProps) {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadEmprestimos();
  }, [profissionalId]);

  const loadEmprestimos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emprestimos')
        .select('*')
        .eq('profissional_id', profissionalId)
        .order('data_inicio', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(e => ({
        id: e.id,
        tipo: e.tipo as 'empresa' | 'clt',
        valorTotal: e.valor_total,
        numeroParcelas: e.numero_parcelas,
        valorParcela: e.valor_parcela,
        parcelasPagas: e.parcelas_pagas || 0,
        saldoDevedor: e.saldo_devedor,
        dataInicio: e.data_inicio,
        dataPrevisaoTermino: e.data_previsao_termino,
        status: e.status || 'ativo',
        observacoes: e.observacoes,
      }));

      setEmprestimos(formatted);
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error);
    } finally {
      setLoading(false);
    }
  };

  const emprestimosAtivos = emprestimos.filter(e => e.status === 'ativo');
  const emprestimosHistorico = emprestimos.filter(e => e.status !== 'ativo');
  
  const totalDescontoMensal = emprestimosAtivos.reduce((acc, e) => acc + e.valorParcela, 0);
  const totalSaldoDevedor = emprestimosAtivos
    .filter(e => e.tipo === 'empresa')
    .reduce((acc, e) => acc + e.saldoDevedor, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (emprestimos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-5 w-5 text-muted-foreground" />
            Empréstimos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Nenhum empréstimo registrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Empréstimos
          </CardTitle>
          {emprestimosAtivos.length > 0 && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              <TrendingDown className="h-3 w-3 mr-1" />
              {formatCurrency(totalDescontoMensal)}/mês
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-lg font-bold">{emprestimosAtivos.length}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Desconto Mensal</p>
            <p className="text-lg font-bold text-warning">{formatCurrency(totalDescontoMensal)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Saldo Devedor</p>
            <p className="text-lg font-bold text-destructive">{formatCurrency(totalSaldoDevedor)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Histórico</p>
            <p className="text-lg font-bold text-muted-foreground">{emprestimosHistorico.length}</p>
          </div>
        </div>

        <Separator />

        {/* Empréstimos Ativos */}
        {emprestimosAtivos.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Empréstimos Ativos ({emprestimosAtivos.length})
            </p>
            {emprestimosAtivos.map((emp) => (
              <EmprestimoCard key={emp.id} emprestimo={emp} />
            ))}
          </div>
        )}

        {/* Histórico (colapsável) */}
        {emprestimosHistorico.length > 0 && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Histórico ({emprestimosHistorico.length})
              </span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {expanded && (
              <div className="space-y-2 pl-2 border-l-2 border-muted">
                {emprestimosHistorico.map((emp) => (
                  <EmprestimoCard key={emp.id} emprestimo={emp} compact />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aviso de desconto na folha */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-300">Desconto em Folha</p>
              <p className="text-blue-600 dark:text-blue-400">
                O valor de {formatCurrency(totalDescontoMensal)} será descontado automaticamente no holerite do dia 5 de cada mês.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmprestimoCard({ emprestimo, compact = false }: { emprestimo: Emprestimo; compact?: boolean }) {
  const isEmpresa = emprestimo.tipo === 'empresa';
  const progresso = isEmpresa && emprestimo.numeroParcelas 
    ? (emprestimo.parcelasPagas / emprestimo.numeroParcelas) * 100 
    : 0;

  const getStatusBadge = () => {
    switch (emprestimo.status) {
      case 'ativo':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Descontando</Badge>;
      case 'quitado':
        return <Badge className="bg-success/10 text-success border-success/20">Quitado</Badge>;
      case 'pausado':
        return <Badge className="bg-muted text-muted-foreground">Pausado</Badge>;
      default:
        return <Badge variant="outline">{emprestimo.status}</Badge>;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          {isEmpresa ? (
            <Building2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">{isEmpresa ? 'Empresa' : 'CLT'}</span>
          <span className="text-xs text-muted-foreground">
            {isEmpresa && emprestimo.valorTotal ? formatCurrency(emprestimo.valorTotal) : formatCurrency(emprestimo.valorParcela) + '/mês'}
          </span>
        </div>
        {getStatusBadge()}
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isEmpresa ? (
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-accent/10">
              <CreditCard className="h-4 w-4 text-accent" />
            </div>
          )}
          <div>
            <p className="font-medium">{isEmpresa ? 'Empréstimo Empresa' : 'Empréstimo CLT'}</p>
            <p className="text-xs text-muted-foreground">
              Início: {formatDate(emprestimo.dataInicio)}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {isEmpresa && emprestimo.valorTotal && (
          <div>
            <p className="text-xs text-muted-foreground">Valor Total</p>
            <p className="font-semibold">{formatCurrency(emprestimo.valorTotal)}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Parcela</p>
          <p className="font-semibold text-warning">{formatCurrency(emprestimo.valorParcela)}</p>
        </div>
        {isEmpresa && emprestimo.numeroParcelas && (
          <div>
            <p className="text-xs text-muted-foreground">Parcelas</p>
            <p className="font-semibold">{emprestimo.parcelasPagas}/{emprestimo.numeroParcelas}</p>
          </div>
        )}
        {isEmpresa && (
          <div>
            <p className="text-xs text-muted-foreground">Saldo Devedor</p>
            <p className="font-semibold text-destructive">{formatCurrency(emprestimo.saldoDevedor)}</p>
          </div>
        )}
      </div>

      {isEmpresa && emprestimo.numeroParcelas && emprestimo.status === 'ativo' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Progresso</span>
            <span>{Math.round(progresso)}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>
      )}

      {emprestimo.observacoes && (
        <p className="text-xs text-muted-foreground italic">{emprestimo.observacoes}</p>
      )}
    </div>
  );
}
