import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Lock, Unlock, FileText, Building2, Calendar, 
  CheckCircle2, AlertCircle, Clock, RefreshCw,
  TrendingUp, Users, DollarSign, Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/payrollCalculator';
import { getCompetenciaAtual, getCompetenciasDisponiveis, formatCompetencia } from '@/lib/competencia';

type TipoFechamento = 'dia_20' | 'dia_5' | 'vt' | 'beneficios';
type StatusFechamento = 'aberto' | 'fechado' | 'reaberto';

interface Fechamento {
  id: string;
  loja_id: string;
  competencia: string;
  tipo: TipoFechamento;
  status: StatusFechamento;
  versao: number;
  snapshot: any;
  total_profissionais: number;
  total_valor: number;
  fechado_por: string | null;
  fechado_em: string | null;
  reaberto_por: string | null;
  reaberto_em: string | null;
  observacoes: string | null;
  created_at: string;
}

interface Loja {
  id: string;
  nome: string;
}

const TIPOS_FECHAMENTO: { value: TipoFechamento; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'dia_20', label: 'Dia 20 (Adiantamento)', icon: <Calendar className="h-4 w-4" />, color: 'bg-primary/10 text-primary' },
  { value: 'dia_5', label: 'Dia 5 (Saldo)', icon: <DollarSign className="h-4 w-4" />, color: 'bg-accent/10 text-accent' },
  { value: 'vt', label: 'Vale Transporte', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-info/10 text-info' },
  { value: 'beneficios', label: 'Benefícios', icon: <Users className="h-4 w-4" />, color: 'bg-success/10 text-success' },
];

const statusConfig: Record<StatusFechamento, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  aberto: { label: 'Aberto', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  fechado: { label: 'Fechado', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  reaberto: { label: 'Reaberto', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

export default function Fechamentos() {
  const { user } = useAuth();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [competencia, setCompetencia] = useState(getCompetenciaAtual());
  const [tipoAtivo, setTipoAtivo] = useState<TipoFechamento>('dia_20');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'fechar' | 'reabrir'>('fechar');
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const competencias = getCompetenciasDisponiveis(6, 1);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [lojasRes, fechamentosRes] = await Promise.all([
        supabase.from('lojas').select('id, nome').order('nome'),
        supabase.from('fechamentos_folha')
          .select('*')
          .eq('competencia', `${competencia}-01`)
          .eq('tipo', tipoAtivo),
      ]);

      if (lojasRes.data) setLojas(lojasRes.data);
      if (fechamentosRes.data) setFechamentos(fechamentosRes.data as Fechamento[]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [competencia, tipoAtivo]);

  useEffect(() => { loadData(); }, [loadData]);

  const getFechamentoLoja = (lojaId: string): Fechamento | undefined => {
    return fechamentos
      .filter(f => f.loja_id === lojaId)
      .sort((a, b) => b.versao - a.versao)[0];
  };

  const handleOpenDialog = (loja: Loja, action: 'fechar' | 'reabrir') => {
    setSelectedLoja(loja);
    setDialogAction(action);
    setObservacoes('');
    setDialogOpen(true);
  };

  const handleFechar = async () => {
    if (!selectedLoja) return;
    setIsProcessing(true);

    try {
      const existing = getFechamentoLoja(selectedLoja.id);

      // Buscar profissionais da loja para snapshot
      const { data: profissionais } = await supabase
        .from('profissionais')
        .select('id, nome, matricula, salario_nominal, ultimo_salario, primeiro_salario, cargo')
        .eq('loja_id', selectedLoja.id)
        .eq('status', 'ativo');

      const profs = profissionais || [];
      const totalValor = profs.reduce((sum, p) => sum + (p.salario_nominal || p.ultimo_salario || p.primeiro_salario || 0), 0);

      const snapshot = {
        profissionais: profs.map(p => ({
          id: p.id,
          nome: p.nome,
          matricula: p.matricula,
          cargo: p.cargo,
          salario: p.salario_nominal || p.ultimo_salario || p.primeiro_salario || 0,
        })),
        gerado_em: new Date().toISOString(),
        tipo: tipoAtivo,
        competencia,
      };

      const newVersao = existing ? existing.versao + 1 : 1;

      const { error } = await supabase.from('fechamentos_folha').insert({
        loja_id: selectedLoja.id,
        competencia: `${competencia}-01`,
        tipo: tipoAtivo,
        status: 'fechado',
        versao: newVersao,
        snapshot,
        total_profissionais: profs.length,
        total_valor: totalValor,
        fechado_por: user?.email || 'Sistema',
        fechado_em: new Date().toISOString(),
        observacoes,
      });

      if (error) throw error;

      toast.success(`Fechamento ${TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} realizado para ${selectedLoja.nome}`);
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Erro ao fechar:', error);
      toast.error(error.message || 'Erro ao realizar fechamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReabrir = async () => {
    if (!selectedLoja) return;
    setIsProcessing(true);

    try {
      const existing = getFechamentoLoja(selectedLoja.id);
      if (!existing) throw new Error('Fechamento não encontrado');

      const { error } = await supabase
        .from('fechamentos_folha')
        .update({
          status: 'reaberto',
          reaberto_por: user?.email || 'Sistema',
          reaberto_em: new Date().toISOString(),
          observacoes: observacoes ? `${existing.observacoes || ''}\n[REABERTO] ${observacoes}` : existing.observacoes,
        })
        .eq('id', existing.id);

      if (error) throw error;

      toast.success(`Fechamento reaberto para ${selectedLoja.nome}`);
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Erro ao reabrir:', error);
      toast.error(error.message || 'Erro ao reabrir fechamento');
    } finally {
      setIsProcessing(false);
    }
  };

  // Contadores
  const totalLojas = lojas.length;
  const lojasFechadas = lojas.filter(l => getFechamentoLoja(l.id)?.status === 'fechado').length;
  const lojasAbertas = totalLojas - lojasFechadas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Fechamentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os fechamentos de folha por loja e tipo</p>
        </div>
        <div className="flex gap-3">
          <Select value={competencia} onValueChange={setCompetencia}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {competencias.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Lojas</p>
                <p className="text-2xl font-bold text-foreground">{totalLojas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fechadas</p>
                <p className="text-2xl font-bold text-foreground">{lojasFechadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-foreground">{lojasAbertas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs por Tipo */}
      <Tabs value={tipoAtivo} onValueChange={(v) => setTipoAtivo(v as TipoFechamento)}>
        <TabsList className="grid w-full grid-cols-4">
          {TIPOS_FECHAMENTO.map(tipo => (
            <TabsTrigger key={tipo.value} value={tipo.value} className="flex items-center gap-2 text-xs sm:text-sm">
              {tipo.icon}
              <span className="hidden sm:inline">{tipo.label}</span>
              <span className="sm:hidden">{tipo.value === 'dia_20' ? 'D20' : tipo.value === 'dia_5' ? 'D5' : tipo.value === 'vt' ? 'VT' : 'Ben'}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TIPOS_FECHAMENTO.map(tipo => (
          <TabsContent key={tipo.value} value={tipo.value}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {tipo.icon}
                  {tipo.label} — {formatCompetencia(competencia)}
                </CardTitle>
                <CardDescription>
                  Fechamento independente por loja. Cada loja pode ser fechada/reaberta individualmente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loja</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Profissionais</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead>Versão</TableHead>
                        <TableHead>Fechado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lojas.map(loja => {
                        const fechamento = getFechamentoLoja(loja.id);
                        const status = fechamento?.status || 'aberto';
                        const cfg = statusConfig[status];

                        return (
                          <TableRow key={loja.id}>
                            <TableCell className="font-medium">{loja.nome}</TableCell>
                            <TableCell>
                              <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit">
                                {cfg.icon}
                                {cfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {fechamento?.total_profissionais || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              {fechamento?.total_valor ? formatCurrency(fechamento.total_valor) : '—'}
                            </TableCell>
                            <TableCell>
                              {fechamento ? `v${fechamento.versao}` : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {fechamento?.fechado_em 
                                ? new Date(fechamento.fechado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                : '—'
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              {status === 'aberto' || status === 'reaberto' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenDialog(loja, 'fechar')}
                                  className="gap-1"
                                >
                                  <Lock className="h-3.5 w-3.5" />
                                  Fechar
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenDialog(loja, 'reabrir')}
                                  className="gap-1"
                                >
                                  <Unlock className="h-3.5 w-3.5" />
                                  Reabrir
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {lojas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhuma loja cadastrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog de Confirmação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogAction === 'fechar' ? <Lock className="h-5 w-5 text-primary" /> : <Unlock className="h-5 w-5 text-destructive" />}
              {dialogAction === 'fechar' ? 'Confirmar Fechamento' : 'Reabrir Fechamento'}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'fechar' 
                ? `Fechar ${TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} de ${selectedLoja?.nome} para ${formatCompetencia(competencia)}. Um snapshot dos dados atuais será salvo.`
                : `Reabrir ${TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} de ${selectedLoja?.nome}. Ao fechar novamente, uma nova versão será criada.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <Textarea
              placeholder={dialogAction === 'fechar' ? 'Observações do fechamento (opcional)' : 'Motivo da reabertura (recomendado)'}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              onClick={dialogAction === 'fechar' ? handleFechar : handleReabrir}
              variant={dialogAction === 'fechar' ? 'default' : 'destructive'}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialogAction === 'fechar' ? 'Fechar Folha' : 'Reabrir Folha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
