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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Lock, Unlock, FileText, Building2, Calendar, 
  CheckCircle2, AlertCircle, Clock, RefreshCw,
  TrendingUp, Users, DollarSign, Loader2, Download, Eye,
  History, ChevronDown, ChevronUp
} from 'lucide-react';
import { formatCurrency, calcularFolhaProfissional, type ResultadoCalculo } from '@/lib/payrollCalculator';
import { getCompetenciaAtual, getCompetenciasDisponiveis, formatCompetencia } from '@/lib/competencia';
import { carregarDadosCompetenciaFromDB, buildProfissionalInput, getDefaultConfig } from '@/lib/buildProfissionalInput';
import { gerarHoleritePDF, gerarHoleriteDia20, gerarHoleriteDia5, gerarHoleriteVT } from '@/components/folha/HoleritePDF';

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
  const [detalheFechamento, setDetalheFechamento] = useState<Fechamento | null>(null);
  const [expandedLoja, setExpandedLoja] = useState<string | null>(null);

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

      // Buscar profissionais da loja com todos os campos necessários
      const { data: profissionais } = await supabase
        .from('profissionais')
        .select('*')
        .eq('loja_id', selectedLoja.id)
        .eq('status', 'ativo');

      const profs = profissionais || [];
      
      // Carregar dados reais da competência
      const dadosComp = await carregarDadosCompetenciaFromDB(competencia);
      const config = getDefaultConfig(competencia);

      // Calcular folha para cada profissional usando o motor centralizado
      const resultados: (ResultadoCalculo & { matricula: string; cargo: string | null; salarioBase: number })[] = profs.map(p => {
        const input = buildProfissionalInput(p, dadosComp);
        const resultado = calcularFolhaProfissional(input, config);
        return {
          ...resultado,
          matricula: p.matricula,
          cargo: p.cargo,
          salarioBase: input.salario,
        };
      });

      // Calcular total baseado no tipo de fechamento
      let totalValor = 0;
      switch (tipoAtivo) {
        case 'dia_20':
          totalValor = resultados.reduce((sum, r) => sum + r.valorDia20, 0);
          break;
        case 'dia_5':
          totalValor = resultados.reduce((sum, r) => sum + r.salarioLiquido, 0);
          break;
        case 'vt':
          totalValor = resultados.reduce((sum, r) => sum + r.valorVT, 0);
          break;
        case 'beneficios':
          totalValor = resultados.reduce((sum, r) => sum + r.valorVR + r.valorCesta, 0);
          break;
      }

      const snapshot = {
        resultados: resultados.map(r => ({
          profissionalId: r.profissionalId,
          profissionalNome: r.profissionalNome,
          matricula: r.matricula,
          cargo: r.cargo,
          salarioBase: r.salarioBase,
          diasUteis: r.diasUteis,
          diasTrabalhados: r.diasTrabalhados,
          recebeDia20: r.recebeDia20,
          valorDia20: r.valorDia20,
          motivoDia20: r.motivoDia20,
          valorVT: r.valorVT,
          valorVR: r.valorVR,
          recebeCesta: r.recebeCesta,
          valorCesta: r.valorCesta,
          descontoFaltas: r.descontoFaltas,
          totalDescontos: r.totalDescontos,
          valorAfastamento: r.valorAfastamento,
          tipoAfastamento: r.tipoAfastamento,
          salarioLiquido: r.salarioLiquido,
          totalMes: r.totalMes,
          detalhesCalculo: r.detalhesCalculo,
        })),
        config,
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
        snapshot: snapshot as any,
        total_profissionais: profs.length,
        total_valor: totalValor,
        fechado_por: user?.email || 'Sistema',
        fechado_em: new Date().toISOString(),
        observacoes,
      });

      if (error) throw error;

      // Registrar no histórico de ações
      await supabase.from('historico_acoes').insert({
        usuario: user?.email || 'Sistema',
        acao: 'fechamento',
        modulo: 'folha',
        entidade_tipo: 'fechamento_folha',
        entidade_id: selectedLoja.id,
        entidade_nome: selectedLoja.nome,
        descricao: `Fechamento ${TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} v${newVersao} - ${formatCompetencia(competencia)} - ${profs.length} profissionais - ${formatCurrency(totalValor)}`,
        dados_novos: { tipo: tipoAtivo, competencia, versao: newVersao, total_valor: totalValor, total_profissionais: profs.length },
      });

      toast.success(`Fechamento realizado com cálculos reais para ${selectedLoja.nome} - ${formatCurrency(totalValor)}`);
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

      // Registrar no histórico
      await supabase.from('historico_acoes').insert({
        usuario: user?.email || 'Sistema',
        acao: 'reabertura',
        modulo: 'folha',
        entidade_tipo: 'fechamento_folha',
        entidade_id: selectedLoja.id,
        entidade_nome: selectedLoja.nome,
        descricao: `Reabertura ${TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} v${existing.versao} - ${formatCompetencia(competencia)}`,
      });

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

  // Gerar holerites PDF a partir do snapshot fechado
  const gerarHoleritesDaLoja = async (fechamento: Fechamento, lojaNome: string) => {
    if (!fechamento.snapshot?.resultados) {
      toast.error('Snapshot sem dados de cálculo');
      return;
    }

    const resultados = fechamento.snapshot.resultados;
    let gerados = 0;

    for (const r of resultados) {
      try {
        if (fechamento.tipo === 'dia_20') {
          const dados = gerarHoleriteDia20(r.profissionalNome, r.matricula, lojaNome, r.salarioBase, competencia, {
            salarioBase: r.salarioBase,
            percentualAdiantamento: 40,
          });
          const doc = gerarHoleritePDF(dados);
          doc.save(`holerite_dia20_${r.matricula}_${competencia}.pdf`);
        } else if (fechamento.tipo === 'dia_5') {
          const dados = gerarHoleriteDia5(r.profissionalNome, r.matricula, lojaNome, r.salarioBase, competencia, {
            salarioBase: r.salarioBase,
            adiantamentoDia20: r.valorDia20,
            faltas: r.descontoFaltas > 0 ? { dias: Math.round(r.descontoFaltas / (r.salarioBase / 30)), valor: r.descontoFaltas } : undefined,
            vales: r.totalDescontos > r.descontoFaltas ? [{ descricao: 'Descontos operacionais', valor: r.totalDescontos - r.descontoFaltas }] : undefined,
          });
          const doc = gerarHoleritePDF(dados);
          doc.save(`holerite_dia5_${r.matricula}_${competencia}.pdf`);
        } else if (fechamento.tipo === 'vt' && r.valorVT > 0) {
          const dados = gerarHoleriteVT(r.profissionalNome, r.matricula, lojaNome, competencia, {
            valorDiario: r.valorVT / Math.max(1, r.diasTrabalhados),
            diasUteisMes: r.diasUteis,
            diasTrabalhados: r.diasTrabalhados,
            diasFalta: 0,
            diasAtestado: 0,
            diasFerias: 0,
          });
          const doc = gerarHoleritePDF(dados);
          doc.save(`holerite_vt_${r.matricula}_${competencia}.pdf`);
        }
        gerados++;
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        console.error(`Erro ao gerar holerite de ${r.profissionalNome}:`, err);
      }
    }

    // Registrar geração de holerites no histórico
    await supabase.from('historico_acoes').insert({
      usuario: user?.email || 'Sistema',
      acao: 'geracao_holerites',
      modulo: 'folha',
      entidade_tipo: 'fechamento_folha',
      entidade_id: fechamento.id,
      entidade_nome: lojaNome,
      descricao: `${gerados} holerites ${fechamento.tipo} gerados de snapshot v${fechamento.versao} - ${formatCompetencia(competencia)}`,
    });

    toast.success(`${gerados} holerites gerados com sucesso!`);
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
          <p className="text-sm text-muted-foreground">Fechamentos com cálculos reais do motor de folha</p>
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
                  Cálculos reais via motor centralizado. Clique na seta para ver detalhes do snapshot.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lojas.map(loja => {
                      const fechamento = getFechamentoLoja(loja.id);
                      const status = fechamento?.status || 'aberto';
                      const cfg = statusConfig[status];
                      const isExpanded = expandedLoja === loja.id;
                      const snapshotResultados = fechamento?.snapshot?.resultados || [];

                      return (
                        <div key={loja.id} className="border rounded-lg">
                          <div className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              {fechamento && snapshotResultados.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setExpandedLoja(isExpanded ? null : loja.id)}
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              )}
                              <span className="font-medium">{loja.nome}</span>
                              <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit">
                                {cfg.icon}
                                {cfg.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">{fechamento?.total_profissionais || '—'} prof.</span>
                              <span className="font-semibold min-w-[100px] text-right">
                                {fechamento?.total_valor ? formatCurrency(Number(fechamento.total_valor)) : '—'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {fechamento ? `v${fechamento.versao}` : ''}
                              </span>
                              <div className="flex items-center gap-1">
                                {status === 'fechado' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => gerarHoleritesDaLoja(fechamento!, loja.nome)}
                                    className="gap-1 h-8"
                                    title="Gerar holerites PDF"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    <span className="hidden md:inline">Holerites</span>
                                  </Button>
                                )}
                                {status === 'aberto' || status === 'reaberto' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenDialog(loja, 'fechar')}
                                    className="gap-1 h-8"
                                  >
                                    <Lock className="h-3.5 w-3.5" />
                                    Fechar
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenDialog(loja, 'reabrir')}
                                    className="gap-1 h-8"
                                  >
                                    <Unlock className="h-3.5 w-3.5" />
                                    Reabrir
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Detalhes expandidos do snapshot */}
                          {isExpanded && snapshotResultados.length > 0 && (
                            <div className="border-t bg-muted/10 p-3">
                              <ScrollArea className="max-h-[400px]">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="text-xs">
                                      <TableHead className="w-16">Mat.</TableHead>
                                      <TableHead>Nome</TableHead>
                                      <TableHead className="text-right">Salário</TableHead>
                                      {(tipoAtivo === 'dia_20' || tipoAtivo === 'dia_5') && (
                                        <TableHead className="text-right">Dia 20</TableHead>
                                      )}
                                      {tipoAtivo === 'dia_5' && (
                                        <>
                                          <TableHead className="text-right">Descontos</TableHead>
                                          <TableHead className="text-right">Líquido (Dia 5)</TableHead>
                                        </>
                                      )}
                                      {tipoAtivo === 'vt' && (
                                        <>
                                          <TableHead className="text-right">Dias Trab.</TableHead>
                                          <TableHead className="text-right">VT</TableHead>
                                        </>
                                      )}
                                      {tipoAtivo === 'beneficios' && (
                                        <>
                                          <TableHead className="text-right">VR</TableHead>
                                          <TableHead className="text-right">Cesta</TableHead>
                                        </>
                                      )}
                                      <TableHead className="text-right">Total Mês</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {snapshotResultados.map((r: any) => (
                                      <TableRow key={r.profissionalId} className="text-xs">
                                        <TableCell className="font-mono">{r.matricula}</TableCell>
                                        <TableCell className="font-medium">{r.profissionalNome}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(r.salarioBase)}</TableCell>
                                        {(tipoAtivo === 'dia_20' || tipoAtivo === 'dia_5') && (
                                          <TableCell className="text-right">
                                            {r.recebeDia20 ? formatCurrency(r.valorDia20) : (
                                              <span className="text-destructive text-xs">{r.motivoDia20}</span>
                                            )}
                                          </TableCell>
                                        )}
                                        {tipoAtivo === 'dia_5' && (
                                          <>
                                            <TableCell className="text-right text-destructive">
                                              {r.totalDescontos > 0 ? `-${formatCurrency(r.totalDescontos)}` : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-success">
                                              {formatCurrency(r.salarioLiquido)}
                                            </TableCell>
                                          </>
                                        )}
                                        {tipoAtivo === 'vt' && (
                                          <>
                                            <TableCell className="text-right">{r.diasTrabalhados}</TableCell>
                                            <TableCell className="text-right font-bold">
                                              {r.valorVT > 0 ? formatCurrency(r.valorVT) : '—'}
                                            </TableCell>
                                          </>
                                        )}
                                        {tipoAtivo === 'beneficios' && (
                                          <>
                                            <TableCell className="text-right">{r.valorVR > 0 ? formatCurrency(r.valorVR) : '—'}</TableCell>
                                            <TableCell className="text-right">
                                              {r.recebeCesta ? formatCurrency(r.valorCesta) : <span className="text-destructive">Perdeu</span>}
                                            </TableCell>
                                          </>
                                        )}
                                        <TableCell className="text-right font-semibold">{formatCurrency(r.totalMes)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </ScrollArea>
                              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                                <History className="h-3 w-3" />
                                Fechado em {fechamento?.fechado_em ? new Date(fechamento.fechado_em).toLocaleString('pt-BR') : '—'} por {fechamento?.fechado_por || '—'}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {lojas.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma loja cadastrada
                      </div>
                    )}
                  </div>
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
                ? `Fechar ${TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} de ${selectedLoja?.nome} para ${formatCompetencia(competencia)}. Os cálculos reais serão processados pelo motor de folha e salvos no snapshot.`
                : `Reabrir ${TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} de ${selectedLoja?.nome}. Ao fechar novamente, uma nova versão será criada com recalculos.`
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
