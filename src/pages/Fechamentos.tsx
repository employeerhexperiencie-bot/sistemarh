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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Lock, Unlock, Building2, Calendar, 
  CheckCircle2, AlertCircle, Clock, RefreshCw,
  TrendingUp, Users, DollarSign, Loader2, Download, Eye,
  History, ChevronLeft, Edit3, FileText, ArrowRight, FileDown
} from 'lucide-react';
import { formatCurrency, calcularFolhaProfissional, type ResultadoCalculo, type ProfissionalInput } from '@/lib/payrollCalculator';
import { getCompetenciaAtual, getCompetenciaAnterior, getCompetenciasDisponiveis, formatCompetencia } from '@/lib/competencia';
import { carregarDadosCompetenciaFromDB, buildProfissionalInput, getDefaultConfig, type DadosCompetencia } from '@/lib/buildProfissionalInput';
import { gerarHoleritePDF, gerarHoleriteDia20, gerarHoleriteDia5, gerarHoleriteVT } from '@/components/folha/HoleritePDF';
import { 
  gerarRelatorioDia20, gerarRelatorioDia5, gerarRelatorioVT, 
  gerarRelatorioCesta, exportarCSV,
  type ProfissionalRelatorio, type ConfigRelatorio
} from '@/lib/relatoriosPDF';

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

type ViewMode = 'lista' | 'preview' | 'resumo' | 'historico';

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

interface PreviewData {
  profissionais: any[];
  inputs: ProfissionalInput[];
  resultados: (ResultadoCalculo & { matricula: string; cargo: string | null; salarioBase: number; lojaNome?: string })[];
  dadosComp: DadosCompetencia;
}

// Editable overrides per professional
interface EditOverrides {
  [profissionalId: string]: {
    vales?: number;
    emprestimos?: number;
    valeCarne?: number;
    valeDinheiro?: number;
    outrosDescontos?: number;
    faltas?: number;
  };
}

export default function Fechamentos() {
  const { user } = useAuth();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Dia 5 paga a competência anterior, então padrão = mês passado se estamos antes do dia 15
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    if (now.getDate() <= 15) {
      return getCompetenciaAnterior();
    }
    return getCompetenciaAtual();
  });
  const [tipoAtivo, setTipoAtivo] = useState<TipoFechamento>('dia_20');
  const [observacoes, setObservacoes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);
  const [selectedLojas, setSelectedLojas] = useState<Loja[]>([]);
  const [checkedLojaIds, setCheckedLojaIds] = useState<Set<string>>(new Set());
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [editOverrides, setEditOverrides] = useState<EditOverrides>({});
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // Dialog for reopen
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenLoja, setReopenLoja] = useState<Loja | null>(null);
  
  // Loja summary cache (pre-calculated totals for list view)
  const [lojaSummaries, setLojaSummaries] = useState<Record<string, { totalProf: number; totalValor: number; loading: boolean }>>({});

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

  // Load summary for open stores (calculate on-the-fly)
  const loadLojaSummaries = useCallback(async () => {
    if (lojas.length === 0) return;
    
    const openLojas = lojas.filter(l => {
      const f = fechamentos.filter(fe => fe.loja_id === l.id).sort((a, b) => b.versao - a.versao)[0];
      return !f || f.status !== 'fechado';
    });
    
    if (openLojas.length === 0) return;

    try {
      const dadosComp = await carregarDadosCompetenciaFromDB(competencia);
      const config = getDefaultConfig(competencia);
      const summaries: Record<string, { totalProf: number; totalValor: number; loading: boolean }> = {};

      for (const loja of openLojas) {
        const { data: profs } = await supabase
          .from('profissionais')
          .select('id, nome, matricula, cargo, salario_nominal, ultimo_salario, primeiro_salario, loja_id, data_admissao, vale_transporte, valor_diario_rota, vale_refeicao, cesta_basica, pensao_alimenticia, status, insalubridade')
          .eq('loja_id', loja.id)
          .in('status', ['ativo', 'afastado_acidente', 'afastado_doenca', 'licenca_maternidade']);

        if (!profs || profs.length === 0) {
          summaries[loja.id] = { totalProf: 0, totalValor: 0, loading: false };
          continue;
        }

        const resultados = profs.map(p => {
          const input = buildProfissionalInput(p, dadosComp);
          return calcularFolhaProfissional(input, config);
        });

        let total = 0;
        switch (tipoAtivo) {
          case 'dia_20': total = resultados.reduce((s, r) => s + r.valorDia20, 0); break;
          case 'dia_5': total = resultados.reduce((s, r) => s + r.salarioLiquido, 0); break;
          case 'vt': total = resultados.reduce((s, r) => s + r.valorVT, 0); break;
          case 'beneficios': total = resultados.reduce((s, r) => s + r.valorVR + r.valorCesta, 0); break;
        }

        summaries[loja.id] = { totalProf: profs.length, totalValor: total, loading: false };
      }

      setLojaSummaries(summaries);
    } catch (err) {
      console.error('Erro ao calcular resumos:', err);
    }
  }, [lojas, fechamentos, competencia, tipoAtivo]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (!isLoading && lojas.length > 0) loadLojaSummaries(); }, [isLoading, lojas, loadLojaSummaries]);

  const getFechamentoLoja = (lojaId: string): Fechamento | undefined => {
    return fechamentos
      .filter(f => f.loja_id === lojaId)
      .sort((a, b) => b.versao - a.versao)[0];
  };

  const getAllFechamentosLoja = (lojaId: string): Fechamento[] => {
    return fechamentos
      .filter(f => f.loja_id === lojaId)
      .sort((a, b) => b.versao - a.versao);
  };

  // Open preview for a single store
  const handleOpenPreview = async (loja: Loja) => {
    setSelectedLoja(loja);
    setSelectedLojas([loja]);
    setViewMode('preview');
    setIsLoadingPreview(true);
    setEditOverrides({});

    try {
      const { data: profissionais } = await supabase
        .from('profissionais')
        .select('*')
        .eq('loja_id', loja.id)
        .in('status', ['ativo', 'afastado_acidente', 'afastado_doenca', 'licenca_maternidade']);

      const profs = profissionais || [];
      const dadosComp = await carregarDadosCompetenciaFromDB(competencia);
      const config = getDefaultConfig(competencia);

      const inputs = profs.map(p => buildProfissionalInput(p, dadosComp));
      const resultados = profs.map((p, i) => {
        const resultado = calcularFolhaProfissional(inputs[i], config);
        return { ...resultado, matricula: p.matricula, cargo: p.cargo, salarioBase: inputs[i].salario, lojaNome: loja.nome };
      });

      setPreviewData({ profissionais: profs, inputs, resultados, dadosComp });
    } catch (err) {
      console.error('Erro ao carregar preview:', err);
      toast.error('Erro ao carregar dados da loja');
      setViewMode('lista');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Open preview for multiple stores (consolidated)
  const handleOpenMultiPreview = async (lojasToPreview: Loja[]) => {
    if (lojasToPreview.length === 0) {
      toast.error('Selecione ao menos uma loja');
      return;
    }
    setSelectedLoja(lojasToPreview.length === 1 ? lojasToPreview[0] : null);
    setSelectedLojas(lojasToPreview);
    setViewMode('preview');
    setIsLoadingPreview(true);
    setEditOverrides({});

    try {
      const dadosComp = await carregarDadosCompetenciaFromDB(competencia);
      const config = getDefaultConfig(competencia);

      let allProfs: any[] = [];
      let allInputs: ProfissionalInput[] = [];
      let allResultados: (ResultadoCalculo & { matricula: string; cargo: string | null; salarioBase: number; lojaNome?: string })[] = [];

      // Build lojaMap for name lookups
      const lojaMap = new Map(lojasToPreview.map(l => [l.id, l.nome]));

      for (const loja of lojasToPreview) {
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('*')
          .eq('loja_id', loja.id)
          .in('status', ['ativo', 'afastado_acidente', 'afastado_doenca', 'licenca_maternidade']);

        const profs = profissionais || [];
        const inputs = profs.map(p => buildProfissionalInput(p, dadosComp));
        const resultados = profs.map((p, i) => {
          const resultado = calcularFolhaProfissional(inputs[i], config);
          return { ...resultado, matricula: p.matricula, cargo: p.cargo, salarioBase: inputs[i].salario, lojaNome: loja.nome };
        });

        allProfs = [...allProfs, ...profs];
        allInputs = [...allInputs, ...inputs];
        allResultados = [...allResultados, ...resultados];
      }

      setPreviewData({ profissionais: allProfs, inputs: allInputs, resultados: allResultados, dadosComp });
    } catch (err) {
      console.error('Erro ao carregar preview consolidado:', err);
      toast.error('Erro ao carregar dados');
      setViewMode('lista');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Toggle loja checkbox
  const toggleLojaCheck = (lojaId: string) => {
    setCheckedLojaIds(prev => {
      const next = new Set(prev);
      if (next.has(lojaId)) next.delete(lojaId);
      else next.add(lojaId);
      return next;
    });
  };

  const toggleAllLojas = () => {
    if (checkedLojaIds.size === lojas.length) {
      setCheckedLojaIds(new Set());
    } else {
      setCheckedLojaIds(new Set(lojas.map(l => l.id)));
    }
  };

  // Recalculate a single professional with overrides and update previewData
  const handleEditField = (profissionalId: string, field: keyof EditOverrides[string], value: number) => {
    const newOverrides = {
      ...editOverrides,
      [profissionalId]: {
        ...editOverrides[profissionalId],
        [field]: value,
      },
    };
    setEditOverrides(newOverrides);

    // Recalculate
    if (!previewData) return;
    const config = getDefaultConfig(competencia);
    const idx = previewData.inputs.findIndex(inp => inp.id === profissionalId);
    if (idx === -1) return;

    const overrides = newOverrides[profissionalId] || {};
    const originalInput = previewData.inputs[idx];
    const adjustedInput: ProfissionalInput = {
      ...originalInput,
      vales: overrides.vales ?? originalInput.vales,
      emprestimos: overrides.emprestimos ?? originalInput.emprestimos,
      valeCarne: overrides.valeCarne ?? originalInput.valeCarne,
      valeDinheiro: overrides.valeDinheiro ?? originalInput.valeDinheiro,
      outrosDescontos: overrides.outrosDescontos ?? originalInput.outrosDescontos,
      faltas: overrides.faltas ?? originalInput.faltas,
    };

    const resultado = calcularFolhaProfissional(adjustedInput, config);
    const newResultado = {
      ...resultado,
      matricula: previewData.resultados[idx].matricula,
      cargo: previewData.resultados[idx].cargo,
      salarioBase: previewData.resultados[idx].salarioBase,
    };

    const newResultados = [...previewData.resultados];
    newResultados[idx] = newResultado;

    const newInputs = [...previewData.inputs];
    newInputs[idx] = adjustedInput;

    setPreviewData({ ...previewData, inputs: newInputs, resultados: newResultados });
  };

  // Open resumo (summary before closing)
  const handleOpenResumo = () => {
    setObservacoes('');
    setViewMode('resumo');
  };

  // Perform closing
  const handleFechar = async () => {
    if (!selectedLoja || !previewData) return;
    setIsProcessing(true);

    try {
      const existing = getFechamentoLoja(selectedLoja.id);
      const config = getDefaultConfig(competencia);

      let totalValor = 0;
      switch (tipoAtivo) {
        case 'dia_20': totalValor = previewData.resultados.reduce((s, r) => s + r.valorDia20, 0); break;
        case 'dia_5': totalValor = previewData.resultados.reduce((s, r) => s + r.salarioLiquido, 0); break;
        case 'vt': totalValor = previewData.resultados.reduce((s, r) => s + r.valorVT, 0); break;
        case 'beneficios': totalValor = previewData.resultados.reduce((s, r) => s + r.valorVR + r.valorCesta, 0); break;
      }

      const snapshot = {
        resultados: previewData.resultados.map(r => ({
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
        total_profissionais: previewData.resultados.length,
        total_valor: totalValor,
        fechado_por: user?.email || 'Sistema',
        fechado_em: new Date().toISOString(),
        observacoes,
      });

      if (error) throw error;

      await supabase.from('historico_acoes').insert({
        usuario: user?.email || 'Sistema',
        acao: 'fechamento',
        modulo: 'folha',
        entidade_tipo: 'fechamento_folha',
        entidade_id: selectedLoja.id,
        entidade_nome: selectedLoja.nome,
        descricao: `Fechamento ${TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} v${newVersao} - ${formatCompetencia(competencia)} - ${previewData.resultados.length} profissionais - ${formatCurrency(totalValor)}`,
        dados_novos: { tipo: tipoAtivo, competencia, versao: newVersao, total_valor: totalValor, total_profissionais: previewData.resultados.length },
      });

      toast.success(`Fechamento v${newVersao} realizado — ${formatCurrency(totalValor)}`);
      setViewMode('lista');
      setSelectedLoja(null);
      setPreviewData(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao fechar:', error);
      toast.error(error.message || 'Erro ao realizar fechamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReabrir = async () => {
    if (!reopenLoja) return;
    setIsProcessing(true);

    try {
      const existing = getFechamentoLoja(reopenLoja.id);
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

      await supabase.from('historico_acoes').insert({
        usuario: user?.email || 'Sistema',
        acao: 'reabertura',
        modulo: 'folha',
        entidade_tipo: 'fechamento_folha',
        entidade_id: reopenLoja.id,
        entidade_nome: reopenLoja.nome,
        descricao: `Reabertura ${TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} v${existing.versao} - ${formatCompetencia(competencia)}`,
      });

      toast.success(`Fechamento reaberto para ${reopenLoja.nome}`);
      setReopenDialogOpen(false);
      setObservacoes('');
      loadData();
    } catch (error: any) {
      console.error('Erro ao reabrir:', error);
      toast.error(error.message || 'Erro ao reabrir fechamento');
    } finally {
      setIsProcessing(false);
    }
  };

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

  const totalLojas = lojas.length;
  const lojasFechadas = lojas.filter(l => getFechamentoLoja(l.id)?.status === 'fechado').length;
  const lojasAbertas = totalLojas - lojasFechadas;

  const getValorPrincipal = (r: any) => {
    switch (tipoAtivo) {
      case 'dia_20': return r.valorDia20;
      case 'dia_5': return r.salarioLiquido;
      case 'vt': return r.valorVT;
      case 'beneficios': return (r.valorVR || 0) + (r.valorCesta || 0);
      default: return 0;
    }
  };

  // ============ RENDER ============

  // Inline editable number cell
  const EditableCell = ({ profId, field, value }: { profId: string; field: keyof EditOverrides[string]; value: number }) => {
    const [editing, setEditing] = useState(false);
    const [localVal, setLocalVal] = useState(String(value));

    if (!editing) {
      return (
        <span 
          className="cursor-pointer hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors border border-transparent hover:border-primary/20"
          onClick={() => { setLocalVal(String(value)); setEditing(true); }}
          title="Clique para editar"
        >
          {value > 0 ? formatCurrency(value) : '—'}
        </span>
      );
    }

    return (
      <Input
        type="number"
        className="h-6 w-20 text-xs text-right p-1"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={() => {
          const num = parseFloat(localVal) || 0;
          handleEditField(profId, field, num);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const num = parseFloat(localVal) || 0;
            handleEditField(profId, field, num);
            setEditing(false);
          }
          if (e.key === 'Escape') setEditing(false);
        }}
        autoFocus
      />
    );
  };

  // Helper to build report data from preview
  const buildReportProfs = (): ProfissionalRelatorio[] => {
    if (!previewData) return [];
    return previewData.resultados.map((r, idx) => {
      const inp = previewData.inputs[idx];
      const p = previewData.profissionais[idx];
      return {
        nome: r.profissionalNome,
        matricula: r.matricula,
        cpf: p?.cpf || '',
        cargo: r.cargo || '',
        loja: r.lojaNome || selectedLoja?.nome || '',
        salarioBase: r.salarioBase,
        dataAdmissao: p?.data_admissao || '',
        nomeMae: p?.nome_mae || '',
        valorDia20: r.valorDia20,
        valorDia5: r.salarioLiquido,
        valorVT: r.valorVT,
        valorVR: r.valorVR,
        valorCesta: r.valorCesta,
        valorAlelo: inp.valeAlimentacao || 0,
        diasTrabalhados: r.diasTrabalhados,
        diasUteis: r.diasUteis,
        faltas: inp.faltas,
        descontoFaltas: r.descontoFaltas,
        emprestimo: inp.emprestimos,
        vales: inp.vales,
        totalDescontos: r.totalDescontos,
        insalubridade: 0,
      };
    });
  };

  const handleDownloadPDF = () => {
    if (!previewData) return;
    const profs = buildReportProfs();
    const lojaLabel = selectedLojas.length === 1 ? selectedLojas[0].nome : `${selectedLojas.length} Lojas`;
    const config: ConfigRelatorio = {
      empresaNome: 'Sistema RH',
      empresaCNPJ: '',
      competencia: formatCompetencia(competencia),
      loja: lojaLabel,
      geradoPor: user?.email || 'Sistema',
    };

    let doc;
    switch (tipoAtivo) {
      case 'dia_20': doc = gerarRelatorioDia20(profs, config); break;
      case 'dia_5': doc = gerarRelatorioDia5(profs, config); break;
      case 'vt': doc = gerarRelatorioVT(profs, config); break;
      case 'beneficios': doc = gerarRelatorioCesta(profs, config); break;
    }

    if (doc) {
      const fileLabel = selectedLojas.length === 1 ? selectedLojas[0].nome : 'consolidado';
      doc.save(`relatorio_${tipoAtivo}_${fileLabel}_${competencia}.pdf`);
      toast.success('Relatório PDF gerado!');
    }
  };

  const handleDownloadCSV = () => {
    if (!previewData) return;
    const profs = buildReportProfs();
    const lojaLabel = selectedLojas.length === 1 ? selectedLojas[0].nome : 'consolidado';
    const config: ConfigRelatorio = {
      empresaNome: 'Sistema RH',
      empresaCNPJ: '',
      competencia: formatCompetencia(competencia),
      loja: lojaLabel,
    };
    exportarCSV(profs, tipoAtivo, config);
    toast.success('CSV exportado!');
  };

  // Sub-view: Preview of professionals (single or multi-store)
  if (viewMode === 'preview' && (selectedLoja || selectedLojas.length > 0)) {
    const isMulti = selectedLojas.length > 1;
    const previewTitle = isMulti 
      ? `${selectedLojas.length} Lojas Selecionadas` 
      : (selectedLoja?.nome || selectedLojas[0]?.nome || '');

    // Calculate totals for summary
    const totalPrincipal = previewData?.resultados.reduce((s, r) => s + getValorPrincipal(r), 0) || 0;
    const totalSalariosPreview = previewData?.resultados.reduce((s, r) => s + r.salarioBase, 0) || 0;
    const totalDescontosPreview = previewData?.resultados.reduce((s, r) => s + r.totalDescontos, 0) || 0;
    const totalDia20Prev = previewData?.resultados.reduce((s, r) => s + r.valorDia20, 0) || 0;
    const totalVTPrev = previewData?.resultados.reduce((s, r) => s + r.valorVT, 0) || 0;
    const totalVRPrev = previewData?.resultados.reduce((s, r) => s + r.valorVR, 0) || 0;
    const totalCestaPrev = previewData?.resultados.reduce((s, r) => s + r.valorCesta, 0) || 0;
    const profCount = previewData?.resultados.length || 0;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('lista'); setSelectedLoja(null); setSelectedLojas([]); setPreviewData(null); setEditOverrides({}); }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{previewTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} — {formatCompetencia(competencia)}
              {isMulti && <span className="ml-2 text-xs">({selectedLojas.map(l => l.nome).join(', ')})</span>}
            </p>
          </div>
          {Object.keys(editOverrides).length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Edit3 className="h-3 w-3" />
              {Object.keys(editOverrides).length} editado(s)
            </Badge>
          )}
          {previewData && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5">
                <FileDown className="h-4 w-4" />
                <span className="hidden md:inline">Baixar PDF</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="gap-1.5">
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">CSV</span>
              </Button>
              {!isMulti && (
                <Button onClick={handleOpenResumo} className="gap-2">
                  <Lock className="h-4 w-4" />
                  Revisar e Fechar
                </Button>
              )}
            </div>
          )}
        </div>

        {isLoadingPreview ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Calculando folha...</span>
          </div>
        ) : previewData ? (
          <>
            {/* 💰 RESUMO FINANCEIRO */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1 text-center md:text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      {tipoAtivo === 'dia_20' ? 'Total Adiantamento' : tipoAtivo === 'dia_5' ? 'Total Líquido a Pagar' : tipoAtivo === 'vt' ? 'Total VT' : 'Total Benefícios'}
                    </p>
                    <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(totalPrincipal)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{profCount} profissionais{isMulti ? ` • ${selectedLojas.length} lojas` : ''}</p>
                  </div>
                  {tipoAtivo === 'dia_5' && (
                    <>
                      <div><p className="text-xs text-muted-foreground">Folha Bruta</p><p className="text-lg font-semibold">{formatCurrency(totalSalariosPreview)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Adiantamento D20</p><p className="text-lg font-semibold text-warning">-{formatCurrency(totalDia20Prev)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Descontos</p><p className="text-lg font-semibold text-destructive">-{formatCurrency(totalDescontosPreview)}</p></div>
                    </>
                  )}
                  {tipoAtivo === 'dia_20' && (
                    <>
                      <div><p className="text-xs text-muted-foreground">Folha Bruta</p><p className="text-lg font-semibold">{formatCurrency(totalSalariosPreview)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Percentual</p><p className="text-lg font-semibold">40%</p></div>
                      <div><p className="text-xs text-muted-foreground">Profissionais</p><p className="text-lg font-semibold">{profCount}</p></div>
                    </>
                  )}
                  {tipoAtivo === 'vt' && (
                    <>
                      <div><p className="text-xs text-muted-foreground">Recebem VT</p><p className="text-lg font-semibold">{previewData.resultados.filter(r => r.valorVT > 0).length}</p></div>
                      <div><p className="text-xs text-muted-foreground">Não recebem</p><p className="text-lg font-semibold">{previewData.resultados.filter(r => r.valorVT === 0).length}</p></div>
                      <div><p className="text-xs text-muted-foreground">Média/prof</p><p className="text-lg font-semibold">{formatCurrency(totalVTPrev / Math.max(1, previewData.resultados.filter(r => r.valorVT > 0).length))}</p></div>
                    </>
                  )}
                  {tipoAtivo === 'beneficios' && (
                    <>
                      <div><p className="text-xs text-muted-foreground">VR Total</p><p className="text-lg font-semibold">{formatCurrency(totalVRPrev)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Cesta Básica</p><p className="text-lg font-semibold">{formatCurrency(totalCestaPrev)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Recebem Cesta</p><p className="text-lg font-semibold">{previewData.resultados.filter(r => r.recebeCesta).length}</p></div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabela de profissionais */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{profCount} Profissionais</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Clique nos valores de <strong>Vales</strong>, <strong>Empréstimos</strong>, <strong>V. Carne</strong>, <strong>V. Dinheiro</strong>, <strong>Outros Desc.</strong> ou <strong>Faltas</strong> para editar diretamente.
                </p>
              </CardHeader>
              <CardContent>
                <div className="max-h-[60vh] overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        {isMulti && <TableHead>Loja</TableHead>}
                        <TableHead className="w-14">Mat.</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Salário</TableHead>
                        <TableHead className="text-right">Faltas</TableHead>
                        <TableHead className="text-right">Vales</TableHead>
                        <TableHead className="text-right">Emprést.</TableHead>
                        <TableHead className="text-right">V.Carne</TableHead>
                        <TableHead className="text-right">V.Dinh.</TableHead>
                        <TableHead className="text-right">Outros</TableHead>
                        {tipoAtivo === 'dia_20' && <TableHead className="text-right font-bold">Dia 20</TableHead>}
                        {tipoAtivo === 'dia_5' && (
                          <>
                            <TableHead className="text-right">Dia 20</TableHead>
                            <TableHead className="text-right font-bold">Líquido</TableHead>
                          </>
                        )}
                        {tipoAtivo === 'vt' && <TableHead className="text-right font-bold">VT</TableHead>}
                        {tipoAtivo === 'beneficios' && (
                          <>
                            <TableHead className="text-right">VR</TableHead>
                            <TableHead className="text-right">Cesta</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.resultados.map((r, idx) => {
                        const inp = previewData.inputs[idx];
                        const isEdited = !!editOverrides[r.profissionalId];
                        return (
                          <TableRow key={r.profissionalId} className={`text-xs ${isEdited ? 'bg-primary/5' : ''}`}>
                            {isMulti && <TableCell className="text-xs text-muted-foreground">{r.lojaNome}</TableCell>}
                            <TableCell className="font-mono">{r.matricula}</TableCell>
                            <TableCell className="font-medium max-w-[120px] truncate" title={r.profissionalNome}>{r.profissionalNome}</TableCell>
                            <TableCell className="text-right">{formatCurrency(r.salarioBase)}</TableCell>
                            <TableCell className="text-right"><EditableCell profId={r.profissionalId} field="faltas" value={inp.faltas} /></TableCell>
                            <TableCell className="text-right"><EditableCell profId={r.profissionalId} field="vales" value={inp.vales} /></TableCell>
                            <TableCell className="text-right"><EditableCell profId={r.profissionalId} field="emprestimos" value={inp.emprestimos} /></TableCell>
                            <TableCell className="text-right"><EditableCell profId={r.profissionalId} field="valeCarne" value={inp.valeCarne || 0} /></TableCell>
                            <TableCell className="text-right"><EditableCell profId={r.profissionalId} field="valeDinheiro" value={inp.valeDinheiro || 0} /></TableCell>
                            <TableCell className="text-right"><EditableCell profId={r.profissionalId} field="outrosDescontos" value={inp.outrosDescontos || 0} /></TableCell>
                            {tipoAtivo === 'dia_20' && (
                              <TableCell className="text-right font-semibold">
                                {r.recebeDia20 ? formatCurrency(r.valorDia20) : <span className="text-destructive">{r.motivoDia20}</span>}
                              </TableCell>
                            )}
                            {tipoAtivo === 'dia_5' && (
                              <>
                                <TableCell className="text-right">{r.recebeDia20 ? formatCurrency(r.valorDia20) : <span className="text-destructive">{r.motivoDia20}</span>}</TableCell>
                                <TableCell className="text-right font-bold text-success">{formatCurrency(r.salarioLiquido)}</TableCell>
                              </>
                            )}
                            {tipoAtivo === 'vt' && (
                              <TableCell className="text-right font-semibold">{r.valorVT > 0 ? formatCurrency(r.valorVT) : '—'}</TableCell>
                            )}
                            {tipoAtivo === 'beneficios' && (
                              <>
                                <TableCell className="text-right">{r.valorVR > 0 ? formatCurrency(r.valorVR) : '—'}</TableCell>
                                <TableCell className="text-right">{r.recebeCesta ? formatCurrency(r.valorCesta) : <span className="text-destructive">Perdeu</span>}</TableCell>
                              </>
                            )}
                          </TableRow>
                        );
                      })}
                      {/* Linha de totais */}
                      <TableRow className="bg-muted/50 font-semibold text-xs border-t-2">
                        {isMulti && <TableCell />}
                        <TableCell colSpan={2}>TOTAL</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalSalariosPreview)}</TableCell>
                        <TableCell className="text-right">{previewData.inputs.reduce((s, i) => s + i.faltas, 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(previewData.inputs.reduce((s, i) => s + i.vales, 0))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(previewData.inputs.reduce((s, i) => s + i.emprestimos, 0))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(previewData.inputs.reduce((s, i) => s + (i.valeCarne || 0), 0))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(previewData.inputs.reduce((s, i) => s + (i.valeDinheiro || 0), 0))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(previewData.inputs.reduce((s, i) => s + (i.outrosDescontos || 0), 0))}</TableCell>
                        {tipoAtivo === 'dia_20' && <TableCell className="text-right text-primary">{formatCurrency(totalDia20Prev)}</TableCell>}
                        {tipoAtivo === 'dia_5' && (
                          <>
                            <TableCell className="text-right">{formatCurrency(totalDia20Prev)}</TableCell>
                            <TableCell className="text-right text-success">{formatCurrency(totalPrincipal)}</TableCell>
                          </>
                        )}
                        {tipoAtivo === 'vt' && <TableCell className="text-right text-primary">{formatCurrency(totalVTPrev)}</TableCell>}
                        {tipoAtivo === 'beneficios' && (
                          <>
                            <TableCell className="text-right">{formatCurrency(totalVRPrev)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalCestaPrev)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    );
  }

  // Sub-view: Summary before closing
  if (viewMode === 'resumo' && selectedLoja && previewData) {
    const totalValor = previewData.resultados.reduce((s, r) => s + getValorPrincipal(r), 0);
    const totalDia20 = previewData.resultados.reduce((s, r) => s + r.valorDia20, 0);
    const totalDescontos = previewData.resultados.reduce((s, r) => s + r.totalDescontos, 0);
    const totalVT = previewData.resultados.reduce((s, r) => s + r.valorVT, 0);
    const totalVR = previewData.resultados.reduce((s, r) => s + r.valorVR, 0);
    const totalCesta = previewData.resultados.reduce((s, r) => s + r.valorCesta, 0);
    const existing = getFechamentoLoja(selectedLoja.id);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('preview')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Editar
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Resumo do Fechamento</h1>
            <p className="text-sm text-muted-foreground">{selectedLoja.nome} — {formatCompetencia(competencia)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Loja</span><span className="font-medium">{selectedLoja.nome}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span className="font-medium">{TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Competência</span><span className="font-medium">{formatCompetencia(competencia)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Versão</span><span className="font-medium">v{existing ? existing.versao + 1 : 1}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Profissionais</span><span className="font-medium">{previewData.resultados.length}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Valores Totais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(tipoAtivo === 'dia_20' || tipoAtivo === 'dia_5') && (
                <div className="flex justify-between"><span className="text-muted-foreground">Dia 20 (Adiantamento)</span><span className="font-medium">{formatCurrency(totalDia20)}</span></div>
              )}
              {tipoAtivo === 'dia_5' && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Descontos</span><span className="font-medium text-destructive">-{formatCurrency(totalDescontos)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Líquido Dia 5</span><span className="font-bold text-success">{formatCurrency(totalValor)}</span></div>
                </>
              )}
              {tipoAtivo === 'vt' && (
                <div className="flex justify-between"><span className="text-muted-foreground">VT Total</span><span className="font-bold">{formatCurrency(totalVT)}</span></div>
              )}
              {tipoAtivo === 'beneficios' && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">VR</span><span className="font-medium">{formatCurrency(totalVR)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cesta Básica</span><span className="font-medium">{formatCurrency(totalCesta)}</span></div>
                </>
              )}
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">{formatCurrency(totalValor)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Textarea
              placeholder="Observações do fechamento (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setViewMode('preview')}>
            <Edit3 className="h-4 w-4 mr-2" />
            Voltar e Editar
          </Button>
          <Button onClick={handleFechar} disabled={isProcessing} className="gap-2">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Confirmar Fechamento e Gerar Holerites
          </Button>
        </div>
      </div>
    );
  }

  // Sub-view: History of a store
  if (viewMode === 'historico' && selectedLoja) {
    const allFechamentos = getAllFechamentosLoja(selectedLoja.id);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('lista'); setSelectedLoja(null); }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Histórico — {selectedLoja.nome}</h1>
            <p className="text-sm text-muted-foreground">{TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} — {formatCompetencia(competencia)}</p>
          </div>
        </div>

        {allFechamentos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum fechamento registrado para esta loja e competência.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {allFechamentos.map(f => (
              <Card key={f.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Versão {f.versao}
                      <Badge variant={statusConfig[f.status].variant} className="flex items-center gap-1">
                        {statusConfig[f.status].icon}
                        {statusConfig[f.status].label}
                      </Badge>
                    </CardTitle>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(Number(f.total_valor))}</p>
                      <p className="text-xs text-muted-foreground">{f.total_profissionais} prof.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {f.fechado_em && (
                    <div className="flex gap-2 text-muted-foreground">
                      <Lock className="h-3.5 w-3.5 mt-0.5" />
                      Fechado em {new Date(f.fechado_em).toLocaleString('pt-BR')} por {f.fechado_por}
                    </div>
                  )}
                  {f.reaberto_em && (
                    <div className="flex gap-2 text-destructive">
                      <Unlock className="h-3.5 w-3.5 mt-0.5" />
                      Reaberto em {new Date(f.reaberto_em).toLocaleString('pt-BR')} por {f.reaberto_por}
                    </div>
                  )}
                  {f.observacoes && (
                    <p className="text-xs bg-muted/50 p-2 rounded">{f.observacoes}</p>
                  )}
                  {f.status === 'fechado' && (
                    <Button size="sm" variant="outline" onClick={() => gerarHoleritesDaLoja(f, selectedLoja.nome)} className="gap-1 mt-2">
                      <Download className="h-3.5 w-3.5" />
                      Gerar Holerites desta versão
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============ MAIN LIST VIEW ============
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {tipo.icon}
                      {tipo.label} — {formatCompetencia(competencia)}
                    </CardTitle>
                    <CardDescription>
                      Selecione lojas para visualizar consolidado ou clique individualmente.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAllLojas}
                      className="gap-1.5"
                    >
                      <Checkbox checked={checkedLojaIds.size === lojas.length && lojas.length > 0} className="h-3.5 w-3.5" />
                      {checkedLojaIds.size === lojas.length ? 'Desmarcar' : 'Todas'}
                    </Button>
                    {checkedLojaIds.size > 0 && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const lojasSelected = lojas.filter(l => checkedLojaIds.has(l.id));
                          handleOpenMultiPreview(lojasSelected);
                        }}
                        className="gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Visualizar {checkedLojaIds.size === lojas.length ? 'Todas' : `${checkedLojaIds.size} selecionada(s)`}
                      </Button>
                    )}
                  </div>
                </div>
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
                      const summary = lojaSummaries[loja.id];
                      const allVersions = getAllFechamentosLoja(loja.id);

                      const totalProf = fechamento?.total_profissionais || summary?.totalProf || 0;
                      const totalValor = fechamento?.total_valor ? Number(fechamento.total_valor) : (summary?.totalValor || 0);

                      return (
                        <div key={loja.id} className="border rounded-lg hover:border-primary/30 transition-colors">
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3 flex-1">
                              <Checkbox
                                checked={checkedLojaIds.has(loja.id)}
                                onCheckedChange={() => toggleLojaCheck(loja.id)}
                                className="h-4 w-4"
                              />
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => {
                                  if (status === 'fechado') {
                                    setSelectedLoja(loja);
                                    setViewMode('historico');
                                  } else {
                                    handleOpenPreview(loja);
                                  }
                                }}
                              >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{loja.nome}</span>
                                  <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit text-xs">
                                    {cfg.icon}
                                    {cfg.label}
                                  </Badge>
                                  {fechamento && allVersions.length > 0 && (
                                    <span className="text-xs text-muted-foreground">v{fechamento.versao}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {totalProf} profissionais
                                  </span>
                                  {totalValor > 0 && (
                                    <span className="font-semibold text-foreground text-sm">
                                      {formatCurrency(totalValor)}
                                    </span>
                                  )}
                                  {fechamento?.fechado_em && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(fechamento.fechado_em).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {allVersions.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => { setSelectedLoja(loja); setViewMode('historico'); }}
                                  className="gap-1 h-8"
                                  title="Ver histórico"
                                >
                                  <History className="h-3.5 w-3.5" />
                                  <span className="hidden md:inline">{allVersions.length}v</span>
                                </Button>
                              )}
                              {status === 'fechado' && (
                                <>
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
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setReopenLoja(loja); setObservacoes(''); setReopenDialogOpen(true); }}
                                    className="gap-1 h-8"
                                  >
                                    <Unlock className="h-3.5 w-3.5" />
                                    Reabrir
                                  </Button>
                                </>
                              )}
                              {(status === 'aberto' || status === 'reaberto') && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenPreview(loja)}
                                  className="gap-1 h-8"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Visualizar
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
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

      {/* Dialog de Reabertura */}
      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-destructive" />
              Reabrir Fechamento
            </DialogTitle>
            <DialogDescription>
              Reabrir {TIPOS_FECHAMENTO.find(t => t.value === tipoAtivo)?.label} de {reopenLoja?.nome}. 
              Ao fechar novamente, uma nova versão será criada com recálculos.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da reabertura (recomendado)"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReabrir}
              variant="destructive"
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reabrir Folha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
