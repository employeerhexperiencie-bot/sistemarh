import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Calculator, DollarSign, Calendar, Bus, Utensils, ShoppingBasket,
  TrendingUp, Users, Building2, Download, Settings2, FileSpreadsheet,
  FileText, Gift, Banknote, AlertTriangle, CheckCircle2, XCircle, Info, ChevronRight,
  MoreHorizontal, FileDown, Sparkles, Pencil, ChevronDown, ChevronUp, X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RelatorioFolha } from '@/components/folha/RelatorioFolha';
import { DecimoTerceiro } from '@/components/folha/DecimoTerceiro';
import { GestaoEmprestimos } from '@/components/folha/GestaoEmprestimos';
import { AdiantamentoSalario } from '@/components/folha/AdiantamentoSalario';
import { EditarLancamentosModal } from '@/components/folha/EditarLancamentosModal';
import { GraficoTendenciaFolha } from '@/components/folha/GraficoTendenciaFolha';
import { ChecklistDados } from '@/components/folha/ChecklistDados';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataValidationAlert, ProfissionalValidationBadge } from '@/components/DataValidationAlert';

// Função de arredondamento conforme regra do sistema
const arredondarValor = (valor: number): number => {
  const centavos = valor % 1;
  if (centavos >= 0.50) {
    return Math.ceil(valor);
  }
  return Math.floor(valor);
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface Loja {
  id: string;
  nome: string;
  codigo: string;
}

interface Profissional {
  id: string;
  nome: string;
  matricula: string;
  cargo: string | null;
  lojaId: string;
  salario: number;
  escala: '6x1' | '5x2';
  valorPassagem: number;
  dataAdmissao: string | null;
  status: 'ativo' | 'ferias' | 'afastado_acidente' | 'afastado_doenca' | 'licenca_maternidade';
  recebeCesta: boolean;
  recebeVT: boolean;
  recebeVR: boolean;
  faltas: number;
  atestados: number;
  diasFerias: number;
  vales: number;
  emprestimos: number;
  pensao: number;
}

// Mock de 20 lojas
const mockLojas: Loja[] = Array.from({ length: 20 }, (_, i) => ({
  id: `loja-${i + 1}`,
  nome: `Loja ${String(i + 1).padStart(2, '0')}`,
  codigo: String(i + 1).padStart(3, '0'),
}));

// Mock de profissionais (13 por loja = 260 total)
const gerarProfissionais = (): Profissional[] => {
  const nomes = ['João', 'Maria', 'Ana', 'Pedro', 'Carlos', 'Julia', 'Lucas', 'Fernanda', 'Ricardo', 'Mariana', 'Bruno', 'Camila', 'Gabriel'];
  const sobrenomes = ['Silva', 'Santos', 'Costa', 'Lima', 'Oliveira', 'Souza', 'Ferreira', 'Alves', 'Rodrigues', 'Pereira', 'Carvalho', 'Gomes', 'Martins'];
  const cargos = ['Açougueiro', 'Operador de Caixa', 'Repositor', 'Balconista', 'Faxineiro', 'Ajudante', 'Gerente', 'Subgerente'];
  const statusOptions: Profissional['status'][] = ['ativo', 'ativo', 'ativo', 'ativo', 'ativo', 'ativo', 'ativo', 'ativo', 'ferias', 'afastado_doenca', 'licenca_maternidade', 'ativo', 'ativo'];
  
  const profissionais: Profissional[] = [];
  let matriculaCounter = 1;
  
  mockLojas.forEach((loja) => {
    for (let i = 0; i < 13; i++) {
      const nome = nomes[i];
      const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
      const salario = 1800 + Math.floor(Math.random() * 700);
      const status = statusOptions[i];
      
      profissionais.push({
        id: `prof-${matriculaCounter}`,
        nome: `${nome} ${sobrenome}`,
        matricula: String(matriculaCounter).padStart(4, '0'),
        cargo: cargos[Math.floor(Math.random() * cargos.length)],
        lojaId: loja.id,
        salario,
        escala: Math.random() > 0.3 ? '6x1' : '5x2',
        valorPassagem: 4.40,
        dataAdmissao: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        status,
        recebeCesta: true,
        recebeVT: status === 'ativo',
        recebeVR: status === 'ativo',
        faltas: Math.floor(Math.random() * 3),
        atestados: Math.floor(Math.random() * 2),
        diasFerias: status === 'ferias' ? 30 : 0,
        vales: Math.random() > 0.7 ? Math.floor(Math.random() * 200) : 0,
        emprestimos: Math.random() > 0.8 ? Math.floor(Math.random() * 300) : 0,
        pensao: Math.random() > 0.95 ? Math.floor(Math.random() * 400) : 0,
      });
      matriculaCounter++;
    }
  });
  
  return profissionais;
};

const mockProfissionais = gerarProfissionais();

// Função para calcular valores de um profissional
const calcularProfissional = (
  p: Profissional,
  diasUteis6x1: number,
  diasUteis5x2: number,
  valorVR: number,
  percentualDia20: number,
  competencia: string
) => {
  const diasUteis = p.escala === '6x1' ? diasUteis6x1 : diasUteis5x2;
  const diasAbatidos = p.faltas + p.atestados + p.diasFerias;
  const diasTrabalhados = Math.max(0, diasUteis - diasAbatidos);
  const valorDia = p.salario / 30;
  
  let valorDia20 = 0;
  let recebeDia20 = true;
  let motivoDia20 = '';
  
  // Tratamento seguro para data de admissão
  const temDataAdmissao = p.dataAdmissao && p.dataAdmissao !== '';
  const dataAdmissao = temDataAdmissao ? new Date(p.dataAdmissao) : null;
  const mesCompetencia = new Date(competencia + '-01');
  
  // Verificar se é mesmo mês de admissão (só se tiver data válida)
  const mesmaCompetencia = dataAdmissao 
    ? (dataAdmissao.getMonth() === mesCompetencia.getMonth() && 
       dataAdmissao.getFullYear() === mesCompetencia.getFullYear())
    : false;
  
  // Regras de elegibilidade para Dia 20
  if (mesmaCompetencia && dataAdmissao && dataAdmissao.getDate() > 10) {
    // Admitido após dia 10 do mês de competência - recebe apenas 40%
    valorDia20 = arredondarValor(p.salario * 0.40);
    motivoDia20 = 'Admitido após dia 10 (40%)';
  } else if (p.status === 'ferias') {
    recebeDia20 = false;
    motivoDia20 = 'Em férias';
  } else if (p.status === 'afastado_acidente') {
    recebeDia20 = false;
    motivoDia20 = 'Afastado acidente';
  } else if (p.faltas >= 10) {
    recebeDia20 = false;
    motivoDia20 = '+10 faltas';
  } else if (mesmaCompetencia && dataAdmissao && dataAdmissao.getDate() <= 10) {
    valorDia20 = arredondarValor(p.salario * 0.40);
    motivoDia20 = 'Admitido no mês (40%)';
  } else {
    // Caso padrão - usar percentual configurado
    valorDia20 = arredondarValor(p.salario * (percentualDia20 / 100));
    motivoDia20 = temDataAdmissao ? `${percentualDia20}%` : `${percentualDia20}% (sem data adm.)`;
  }
  
  let valorVT = 0;
  if (p.recebeVT && p.status === 'ativo') {
    // valor_diario_rota já representa o custo diário total de transporte
    valorVT = arredondarValor(diasTrabalhados * p.valorPassagem);
  }
  
  let valorVRTotal = 0;
  if (p.recebeVR && p.status === 'ativo') {
    valorVRTotal = arredondarValor(diasTrabalhados * valorVR);
  }
  
  // Valor da Cesta Básica padronizado
  const VALOR_CESTA_BASICA = 180;
  
  let recebeCesta = p.recebeCesta;
  // Cesta só é perdida por faltas INJUSTIFICADAS (não atestados)
  if (p.faltas > 0) recebeCesta = false;
  // Verificar data de admissão apenas se existir (admitido após dia 15 não recebe cesta)
  if (mesmaCompetencia && dataAdmissao && dataAdmissao.getDate() > 15) recebeCesta = false;
  
  const valorCesta = recebeCesta ? VALOR_CESTA_BASICA : 0;
  
  const descontoFaltas = arredondarValor(p.faltas * valorDia);
  const totalDescontos = p.vales + p.emprestimos + p.pensao + descontoFaltas;
  
  const salarioBruto = p.salario - descontoFaltas;
  const salarioLiquido = arredondarValor(salarioBruto - (recebeDia20 ? valorDia20 : 0) - totalDescontos + descontoFaltas);
  
  return {
    diasTrabalhados,
    recebeDia20,
    valorDia20: recebeDia20 ? valorDia20 : 0,
    motivoDia20,
    valorVT,
    valorVR: valorVRTotal,
    recebeCesta,
    valorCesta,
    descontoFaltas,
    totalDescontos,
    salarioLiquido: Math.max(0, salarioLiquido),
    totalMes: arredondarValor((recebeDia20 ? valorDia20 : 0) + Math.max(0, salarioLiquido) + valorVT + valorVRTotal + valorCesta),
  };
};

type CardType = 'dia20' | 'dia5' | 'vt' | 'vr' | 'cesta' | 'total' | 'funcionarios' | null;

// Summary Card Component - Padrão
function SummaryCard({ icon: Icon, label, value, color, onClick, clickable = true, variant = 'default' }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  onClick?: () => void;
  clickable?: boolean;
  variant?: 'default' | 'primary' | 'secondary';
}) {
  const baseClasses = "overflow-hidden transition-all";
  const clickableClasses = clickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : '';
  
  // Card destacado para Total Geral
  if (variant === 'primary') {
    return (
      <Card 
        className={`${baseClasses} ${clickableClasses} col-span-2 sm:col-span-2 lg:col-span-1 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg`}
        onClick={onClick}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20 text-primary shadow-inner">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary/80">{label}</p>
              <p className="text-2xl font-bold tracking-tight text-primary">{value}</p>
            </div>
            {clickable && <ChevronRight className="h-5 w-5 text-primary/60" />}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card 
      className={`${baseClasses} ${clickableClasses}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-lg font-bold tracking-tight">{value}</p>
          </div>
          {clickable && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}

// Status Checklist removido - agora usando ChecklistDados

export default function SimuladorFolha() {
  const supabaseData = useSupabaseData();
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [diasUteis6x1, setDiasUteis6x1] = useState(26);
  const [diasUteis5x2, setDiasUteis5x2] = useState(22);
  const [valorVR, setValorVR] = useState(25);
  const [percentualDia20, setPercentualDia20] = useState(40);
  const [lojaSelecionada, setLojaSelecionada] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [selectedCardType, setSelectedCardType] = useState<CardType>(null);
  const [activeTab, setActiveTab] = useState<string>('lojas');
  const [showTendencia, setShowTendencia] = useState(false);
  const [lojaDetalhada, setLojaDetalhada] = useState<string | null>(null);
  
  // Modal de edição de lançamentos
  const [modalEdicao, setModalEdicao] = useState<{
    open: boolean;
    profissional: { id: string; nome: string; matricula: string } | null;
  }>({ open: false, profissional: null });

  // Modal de detalhamento individual do profissional
  const [profissionalDetalhado, setProfissionalDetalhado] = useState<string | null>(null);

  const abrirModalEdicao = (profissional: { id: string; nome: string; matricula: string }) => {
    setModalEdicao({ open: true, profissional });
  };

  const fecharModalEdicao = () => {
    setModalEdicao({ open: false, profissional: null });
  };

  // Função para exportar CSV da loja
  const exportarCSVLoja = (lojaResumo: typeof resumoPorLoja[0], funcionarios: typeof calculosLote) => {
    const headers = ['Nome', 'Status', 'Dia 20', 'Dia 5', 'VT', 'VR', 'Cesta', 'Total'];
    const rows = funcionarios.map(c => [
      c.profissional.nome,
      c.profissional.status,
      c.valorDia20.toFixed(2),
      c.salarioLiquido.toFixed(2),
      c.valorVT.toFixed(2),
      c.valorVR.toFixed(2),
      c.valorCesta.toFixed(2),
      c.totalMes.toFixed(2),
    ]);
    
    const csvContent = [
      `Loja: ${lojaResumo.loja.nome}`,
      `Competência: ${competencia}`,
      '',
      headers.join(';'),
      ...rows.map(r => r.join(';')),
      '',
      `Total Dia 20: ${lojaResumo.totalDia20.toFixed(2)}`,
      `Total Dia 5: ${lojaResumo.totalDia5.toFixed(2)}`,
      `Total VT: ${lojaResumo.totalVT.toFixed(2)}`,
      `Total VR: ${lojaResumo.totalVR.toFixed(2)}`,
      `Total Cesta: ${lojaResumo.totalCesta.toFixed(2)}`,
      `Total Geral: ${lojaResumo.totalGeral.toFixed(2)}`,
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `folha_${lojaResumo.loja.nome.replace(/\s+/g, '_')}_${competencia}.csv`;
    link.click();
  };

  // Dados reais da competência
  const [dadosCompetencia, setDadosCompetencia] = useState<{
    faltas: Record<string, { injustificadas: number; justificadas: number }>;
    ferias: Record<string, number>;
    vales: Record<string, number>;
    emprestimos: Record<string, number>;
    afastamentos: Record<string, string>;
    isLoading: boolean;
  }>({
    faltas: {},
    ferias: {},
    vales: {},
    emprestimos: {},
    afastamentos: {},
    isLoading: true,
  });

  // Estado de validação de dados
  const [validacaoDados, setValidacaoDados] = useState<{
    ativosCarregados: boolean;
    asoCarregados: boolean;
    beneficiosCarregados: boolean;
    timestampAtivos: string | null;
    timestampASO: string | null;
    timestampBeneficios: string | null;
  }>({
    ativosCarregados: false,
    asoCarregados: false,
    beneficiosCarregados: false,
    timestampAtivos: null,
    timestampASO: null,
    timestampBeneficios: null,
  });

  // Buscar dados reais da competência selecionada
  const carregarDadosCompetencia = useCallback(async () => {
    setDadosCompetencia(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [ano, mes] = competencia.split('-').map(Number);
      const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];

      // Buscar todos os dados em paralelo
      const [faltasRes, feriasRes, valesRes, emprestimosRes, afastamentosRes] = await Promise.all([
        // Faltas do mês
        supabase
          .from('faltas')
          .select('profissional_id, tipo')
          .gte('data_falta', inicioMes)
          .lte('data_falta', fimMes),
        
        // Férias ativas no mês
        supabase
          .from('ferias')
          .select('profissional_id, periodo_gozo_inicio, periodo_gozo_fim, dias_gozados')
          .or(`and(periodo_gozo_inicio.lte.${fimMes},periodo_gozo_fim.gte.${inicioMes})`),
        
        // Vales pendentes do mês
        supabase
          .from('professional_vales')
          .select('profissional_id, valor')
          .gte('data_lancamento', inicioMes)
          .lte('data_lancamento', fimMes)
          .eq('status', 'pendente'),
        
        // Empréstimos ativos
        supabase
          .from('emprestimos')
          .select('profissional_id, valor_parcela')
          .eq('status', 'ativo'),
        
        // Afastamentos ativos no mês
        supabase
          .from('afastamentos')
          .select('profissional_id, tipo')
          .eq('status', 'ativo')
          .lte('data_inicio', fimMes)
          .or(`data_prevista_retorno.is.null,data_prevista_retorno.gte.${inicioMes}`)
      ]);

      // Processar faltas
      const faltasMap: Record<string, { injustificadas: number; justificadas: number }> = {};
      faltasRes.data?.forEach(f => {
        if (!f.profissional_id) return;
        if (!faltasMap[f.profissional_id]) {
          faltasMap[f.profissional_id] = { injustificadas: 0, justificadas: 0 };
        }
        if (f.tipo === 'justificada' || f.tipo === 'atestado') {
          faltasMap[f.profissional_id].justificadas++;
        } else {
          faltasMap[f.profissional_id].injustificadas++;
        }
      });

      // Processar férias (dias no mês atual)
      const feriasMap: Record<string, number> = {};
      feriasRes.data?.forEach(f => {
        if (!f.profissional_id || !f.periodo_gozo_inicio || !f.periodo_gozo_fim) return;
        
        const inicioGozo = new Date(f.periodo_gozo_inicio);
        const fimGozo = new Date(f.periodo_gozo_fim);
        const inicioCompetencia = new Date(inicioMes);
        const fimCompetencia = new Date(fimMes);
        
        // Calcular dias de férias dentro do mês
        const inicioEfetivo = inicioGozo > inicioCompetencia ? inicioGozo : inicioCompetencia;
        const fimEfetivo = fimGozo < fimCompetencia ? fimGozo : fimCompetencia;
        const dias = Math.max(0, Math.ceil((fimEfetivo.getTime() - inicioEfetivo.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        feriasMap[f.profissional_id] = (feriasMap[f.profissional_id] || 0) + dias;
      });

      // Processar vales
      const valesMap: Record<string, number> = {};
      valesRes.data?.forEach(v => {
        if (!v.profissional_id) return;
        valesMap[v.profissional_id] = (valesMap[v.profissional_id] || 0) + Number(v.valor);
      });

      // Processar empréstimos
      const emprestimosMap: Record<string, number> = {};
      emprestimosRes.data?.forEach(e => {
        if (!e.profissional_id) return;
        emprestimosMap[e.profissional_id] = (emprestimosMap[e.profissional_id] || 0) + Number(e.valor_parcela);
      });

      // Processar afastamentos
      const afastamentosMap: Record<string, string> = {};
      afastamentosRes.data?.forEach(a => {
        if (!a.profissional_id) return;
        afastamentosMap[a.profissional_id] = a.tipo;
      });

      setDadosCompetencia({
        faltas: faltasMap,
        ferias: feriasMap,
        vales: valesMap,
        emprestimos: emprestimosMap,
        afastamentos: afastamentosMap,
        isLoading: false,
      });
    } catch (error) {
      console.error('Erro ao carregar dados da competência:', error);
      setDadosCompetencia(prev => ({ ...prev, isLoading: false }));
    }
  }, [competencia]);

  // Carregar dados quando a competência mudar
  useEffect(() => {
    carregarDadosCompetencia();
  }, [carregarDadosCompetencia]);

  // Verificar dados carregados do Supabase
  useEffect(() => {
    if (!supabaseData.isLoading) {
      setValidacaoDados({
        ativosCarregados: supabaseData.totalProfissionais > 0,
        asoCarregados: true,
        beneficiosCarregados: true,
        timestampAtivos: new Date().toISOString(),
        timestampASO: new Date().toISOString(),
        timestampBeneficios: new Date().toISOString(),
      });
    }
  }, [supabaseData.isLoading, supabaseData.totalProfissionais]);

  const dadosCompletos = validacaoDados.ativosCarregados && 
                         validacaoDados.asoCarregados && 
                         validacaoDados.beneficiosCarregados;

  // Usar dados do Supabase com dados reais da competência
  const profissionais = supabaseData.totalProfissionais > 0
    ? supabaseData.profissionais.map((p: any) => {
        const salario = p.salario_nominal || p.ultimo_salario || p.primeiro_salario || 0;
        
        // Verificar afastamento ativo
        const tipoAfastamento = dadosCompetencia.afastamentos[p.id];
        let status: 'ativo' | 'ferias' | 'afastado_acidente' | 'afastado_doenca' | 'licenca_maternidade' = 'ativo';
        
        if (tipoAfastamento) {
          if (tipoAfastamento.includes('acidente')) status = 'afastado_acidente';
          else if (tipoAfastamento.includes('maternidade')) status = 'licenca_maternidade';
          else status = 'afastado_doenca';
        } else if (dadosCompetencia.ferias[p.id] && dadosCompetencia.ferias[p.id] >= 15) {
          status = 'ferias';
        } else if (p.status === 'inativo') {
          status = 'afastado_doenca';
        }
        
        // Dados reais da competência
        const faltasProf = dadosCompetencia.faltas[p.id] || { injustificadas: 0, justificadas: 0 };
        
        return {
          id: p.id,
          nome: p.nome,
          matricula: p.matricula,
          cargo: p.cargo || null,
          lojaId: p.loja_id || 'sem-loja',
          salario: salario,
          escala: '6x1' as '6x1' | '5x2',
          // VT: só tem valor se o campo vale_transporte for true E tiver valor_diario_rota definido
          valorPassagem: p.vale_transporte === true && p.valor_diario_rota ? Number(p.valor_diario_rota) : 0,
          dataAdmissao: p.data_admissao || null,
          status,
          recebeCesta: p.cesta_basica === true,
          // VT: precisa ter vale_transporte = true E valor_diario_rota > 0
          recebeVT: p.vale_transporte === true && p.valor_diario_rota && Number(p.valor_diario_rota) > 0,
          recebeVR: p.vale_refeicao === true,
          faltas: faltasProf.injustificadas,
          atestados: faltasProf.justificadas,
          diasFerias: dadosCompetencia.ferias[p.id] || 0,
          vales: dadosCompetencia.vales[p.id] || 0,
          emprestimos: dadosCompetencia.emprestimos[p.id] || 0,
          pensao: p.pensao_alimenticia || 0,
        };
      })
    : mockProfissionais;

  const lojas = supabaseData.totalLojas > 0
    ? supabaseData.lojas.map((l: any) => ({
        id: l.id,
        nome: l.nome,
        codigo: l.id.substring(0, 3),
      }))
    : mockLojas;

  const profissionaisFiltrados = useMemo(() => {
    return profissionais.filter(p => {
      if (lojaSelecionada !== 'todas' && p.lojaId !== lojaSelecionada) return false;
      if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false;
      return true;
    });
  }, [lojaSelecionada, filtroStatus, profissionais]);

  const calculosLote = useMemo(() => {
    return profissionaisFiltrados.map(p => ({
      profissional: p,
      loja: lojas.find(l => l.id === p.lojaId),
      ...calcularProfissional(p, diasUteis6x1, diasUteis5x2, valorVR, percentualDia20, competencia),
    }));
  }, [profissionaisFiltrados, diasUteis6x1, diasUteis5x2, valorVR, percentualDia20, competencia, lojas]);

  const resumoPorLoja = useMemo(() => {
    const resumo: Record<string, {
      loja: Loja;
      qtdFuncionarios: number;
      totalDia20: number;
      totalDia5: number;
      totalVT: number;
      totalVR: number;
      totalCesta: number;
      totalGeral: number;
      funcionariosAtivos: number;
      funcionariosFerias: number;
      funcionariosAfastados: number;
    }> = {};

    lojas.forEach(loja => {
      resumo[loja.id] = {
        loja,
        qtdFuncionarios: 0,
        totalDia20: 0,
        totalDia5: 0,
        totalVT: 0,
        totalVR: 0,
        totalCesta: 0,
        totalGeral: 0,
        funcionariosAtivos: 0,
        funcionariosFerias: 0,
        funcionariosAfastados: 0,
      };
    });

    calculosLote.forEach(c => {
      const r = resumo[c.profissional.lojaId];
      if (r) {
        r.qtdFuncionarios++;
        r.totalDia20 += c.valorDia20;
        r.totalDia5 += c.salarioLiquido;
        r.totalVT += c.valorVT;
        r.totalVR += c.valorVR;
        r.totalCesta += c.valorCesta;
        r.totalGeral += c.totalMes;
        
        if (c.profissional.status === 'ativo') r.funcionariosAtivos++;
        else if (c.profissional.status === 'ferias') r.funcionariosFerias++;
        else r.funcionariosAfastados++;
      }
    });

    return Object.values(resumo);
  }, [calculosLote]);

  const totaisGerais = useMemo(() => {
    return resumoPorLoja.reduce((acc, r) => ({
      totalDia20: acc.totalDia20 + r.totalDia20,
      totalDia5: acc.totalDia5 + r.totalDia5,
      totalVT: acc.totalVT + r.totalVT,
      totalVR: acc.totalVR + r.totalVR,
      totalCesta: acc.totalCesta + r.totalCesta,
      totalGeral: acc.totalGeral + r.totalGeral,
      funcionarios: acc.funcionarios + r.qtdFuncionarios,
    }), { totalDia20: 0, totalDia5: 0, totalVT: 0, totalVR: 0, totalCesta: 0, totalGeral: 0, funcionarios: 0 });
  }, [resumoPorLoja]);

  const getStatusBadge = (status: Profissional['status']) => {
    const config: Record<string, { label: string; className: string }> = {
      ativo: { label: 'Ativo', className: 'bg-success/10 text-success border-success/20' },
      ferias: { label: 'Férias', className: 'bg-info/10 text-info border-info/20' },
      afastado_acidente: { label: 'Af. Acidente', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      afastado_doenca: { label: 'Af. Doença', className: 'bg-warning/10 text-warning border-warning/20' },
      licenca_maternidade: { label: 'Maternidade', className: 'bg-accent/10 text-accent border-accent/20' },
    };
    const c = config[status] || config.ativo;
    return <Badge variant="outline" className={`${c.className} text-xs`}>{c.label}</Badge>;
  };

  const exportarCSV = () => {
    const headers = ['Loja', 'Matrícula', 'Nome', 'Status', 'Faltas', 'Atestados', 'Férias', 'Salário', 'Dia 20', 'Dia 5', 'Vales', 'Empréstimos', 'Descontos', 'VT', 'VR', 'Cesta', 'Total'];
    const rows = calculosLote.map(c => [
      c.loja?.nome || '',
      c.profissional.matricula,
      c.profissional.nome,
      c.profissional.status,
      c.profissional.faltas,
      c.profissional.atestados,
      c.profissional.diasFerias,
      c.profissional.salario,
      c.valorDia20,
      c.salarioLiquido,
      c.profissional.vales,
      c.profissional.emprestimos,
      c.totalDescontos,
      c.valorVT,
      c.valorVR,
      c.valorCesta,
      c.totalMes,
    ]);
    
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `folha_${competencia}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header com Botões de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Simulador de Folha</h1>
          <p className="text-sm text-muted-foreground">
            Competência: {competencia}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportarCSV} className="gap-2">
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button variant="default" className="gap-2 shadow-lg">
            <Sparkles className="h-4 w-4" />
            Finalizar e Gerar Holerites
          </Button>
        </div>
      </div>

      {/* Checklist de Dados - Pré-Simulação */}
      <ChecklistDados
        profissionais={supabaseData.totalProfissionais}
        lojas={supabaseData.totalLojas}
        ativosCarregados={validacaoDados.ativosCarregados}
        asoCarregados={validacaoDados.asoCarregados}
        beneficiosCarregados={validacaoDados.beneficiosCarregados}
      />

      {/* Summary Cards - Reorganizado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bloco Principal - Total Geral */}
        <Card className="lg:col-span-4 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => setSelectedCardType('total')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary/80">Total Geral da Folha</p>
                <p className="text-3xl font-bold tracking-tight text-primary mt-1">{formatCurrency(totaisGerais.totalGeral)}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {totaisGerais.funcionarios} funcionários
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-primary/20 text-primary shadow-inner">
                <Calculator className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco Pagamentos */}
        <Card className="lg:col-span-4">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Pagamentos</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors" onClick={() => setSelectedCardType('dia20')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Dia 20 (Adiantamento)</span>
                </div>
                <span className="text-lg font-bold">{formatCurrency(totaisGerais.totalDia20)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors" onClick={() => setSelectedCardType('dia5')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600/10">
                    <DollarSign className="h-4 w-4 text-blue-700" />
                  </div>
                  <span className="text-sm font-medium">Dia 5 (Salário)</span>
                </div>
                <span className="text-lg font-bold">{formatCurrency(totaisGerais.totalDia5)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco Benefícios */}
        <Card className="lg:col-span-4">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Benefícios</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors" onClick={() => setSelectedCardType('vt')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Bus className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm">Vale Transporte</span>
                </div>
                <span className="font-semibold">{formatCurrency(totaisGerais.totalVT)}</span>
              </div>
              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors" onClick={() => setSelectedCardType('vr')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600/10">
                    <Utensils className="h-4 w-4 text-emerald-700" />
                  </div>
                  <span className="text-sm">Vale Refeição</span>
                </div>
                <span className="font-semibold">{formatCurrency(totaisGerais.totalVR)}</span>
              </div>
              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors" onClick={() => setSelectedCardType('cesta')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-700/10">
                    <ShoppingBasket className="h-4 w-4 text-emerald-800" />
                  </div>
                  <span className="text-sm">Cesta Básica</span>
                </div>
                <span className="font-semibold">{formatCurrency(totaisGerais.totalCesta)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão Tendência + Gráfico Expansível */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowTendencia(!showTendencia)}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ver Tendência da Folha (últimos 6 meses)
          </span>
          {showTendencia ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {showTendencia && (
          <GraficoTendenciaFolha
            competenciaAtual={competencia}
            totalDia20={totaisGerais.totalDia20}
            totalDia5={totaisGerais.totalDia5}
          />
        )}
      </div>

      {/* Barra de Filtros Fixa */}
      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[180px] max-w-[250px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Competência</Label>
              <Input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-1 min-w-[180px] max-w-[250px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Loja</Label>
              <Select value={lojaSelecionada} onValueChange={setLojaSelecionada}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas as lojas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as lojas</SelectItem>
                  {lojas.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px] max-w-[250px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="ferias">Em Férias</SelectItem>
                  <SelectItem value="afastado_acidente">Afastados (Acidente)</SelectItem>
                  <SelectItem value="afastado_doenca">Afastados (Doença)</SelectItem>
                  <SelectItem value="licenca_maternidade">Licença Maternidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs - Reorganizadas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TabsList className="bg-muted/50 p-1 h-auto gap-1">
              <TabsTrigger value="lojas" className="gap-2 data-[state=active]:bg-background">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Por Loja</span>
              </TabsTrigger>
              <TabsTrigger value="funcionarios" className="gap-2 data-[state=active]:bg-background">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Por Funcionário</span>
              </TabsTrigger>
              <TabsTrigger value="adiantamento" className="gap-2 data-[state=active]:bg-background">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Adiantamento</span>
              </TabsTrigger>
              <TabsTrigger value="relatorio" className="gap-2 data-[state=active]:bg-background">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Relatório Geral</span>
              </TabsTrigger>
              <TabsTrigger value="decimo" className="gap-2 data-[state=active]:bg-background">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">13º Salário</span>
              </TabsTrigger>
              <TabsTrigger value="emprestimos" className="gap-2 data-[state=active]:bg-background">
                <Banknote className="h-4 w-4" />
                <span className="hidden sm:inline">Empréstimos</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Ícone de Configurações */}
          <TabsList className="bg-transparent">
            <TabsTrigger value="config" className="gap-2 data-[state=active]:bg-background rounded-lg border border-transparent hover:border-border">
              <Settings2 className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </div>

        {/* By Store Tab */}
        <TabsContent value="lojas" className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Resumo por Loja - {competencia}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <div className="overflow-x-auto">
                  <Table className="table-zebra w-full min-w-[950px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold whitespace-nowrap min-w-[120px]">Loja</TableHead>
                        <TableHead className="text-center font-semibold whitespace-nowrap w-16">Func.</TableHead>
                        <TableHead className="text-center font-semibold whitespace-nowrap w-16">Ativos</TableHead>
                        <TableHead className="text-center font-semibold whitespace-nowrap w-16">Férias</TableHead>
                        <TableHead className="text-center font-semibold whitespace-nowrap w-16">Afast.</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">Dia 20</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">Dia 5</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">VT</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">VR</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">Cesta</TableHead>
                        <TableHead className="text-right font-semibold text-primary whitespace-nowrap">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumoPorLoja.map((r) => (
                        <TableRow 
                          key={r.loja.id} 
                          className="transition-colors cursor-pointer hover:bg-muted/50"
                          onClick={() => setLojaDetalhada(r.loja.id)}
                        >
                          <TableCell className="font-medium whitespace-nowrap">{r.loja.nome}</TableCell>
                          <TableCell className="text-center tabular-nums">{r.qtdFuncionarios}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              {r.funcionariosAtivos}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                              {r.funcionariosFerias}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              {r.funcionariosAfastados}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-success whitespace-nowrap">
                            {formatCurrency(r.totalDia20)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {formatCurrency(r.totalDia5)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                            {formatCurrency(r.totalVT)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                            {formatCurrency(r.totalVR)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                            {formatCurrency(r.totalCesta)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums font-bold text-primary whitespace-nowrap">
                            {formatCurrency(r.totalGeral)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Modal de Detalhes da Loja */}
          <Dialog open={lojaDetalhada !== null} onOpenChange={(open) => { if (!open) setLojaDetalhada(null); }}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              {(() => {
                if (!lojaDetalhada) return null;
                const lojaResumo = resumoPorLoja.find(r => r.loja.id === lojaDetalhada);
                const funcionariosLoja = calculosLote.filter(c => c.profissional.lojaId === lojaDetalhada);
                if (!lojaResumo) return <p className="text-muted-foreground">Loja não encontrada</p>;
                
                return (
                  <>
                    <DialogHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {lojaResumo.loja.nome} - Detalhes da Folha
                          </DialogTitle>
                          <DialogDescription>
                            Competência: {competencia}
                          </DialogDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportarCSVLoja(lojaResumo, funcionariosLoja)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Exportar
                        </Button>
                      </div>
                    </DialogHeader>
                    
                    {/* Resumo da Loja */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                      <Card className="p-3">
                        <p className="text-xs text-muted-foreground">Funcionários</p>
                        <p className="text-xl font-bold">{lojaResumo.qtdFuncionarios}</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-xs text-muted-foreground">Dia 20</p>
                        <p className="text-xl font-bold text-success">{formatCurrency(lojaResumo.totalDia20)}</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-xs text-muted-foreground">Dia 5</p>
                        <p className="text-xl font-bold">{formatCurrency(lojaResumo.totalDia5)}</p>
                      </Card>
                      <Card className="p-3 border-primary/30">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(lojaResumo.totalGeral)}</p>
                      </Card>
                    </div>

                    {/* Tabela de Funcionários da Loja */}
                    <ScrollArea className="max-h-[400px]">
                      <Table className="table-zebra">
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Nome</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Dia 20</TableHead>
                            <TableHead className="text-right">Dia 5</TableHead>
                            <TableHead className="text-right">VT</TableHead>
                            <TableHead className="text-right">VR</TableHead>
                            <TableHead className="text-right">Cesta</TableHead>
                            <TableHead className="text-right font-bold">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {funcionariosLoja.map((c) => (
                            <TableRow 
                              key={c.profissional.id}
                              className="cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => {
                                setLojaDetalhada(null);
                                setProfissionalDetalhado(c.profissional.id);
                              }}
                            >
                              <TableCell className="font-medium">{c.profissional.nome}</TableCell>
                              <TableCell>{getStatusBadge(c.profissional.status)}</TableCell>
                              <TableCell className="text-right text-success">{formatCurrency(c.valorDia20)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(c.salarioLiquido)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{formatCurrency(c.valorVT)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{formatCurrency(c.valorVR)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{formatCurrency(c.valorCesta)}</TableCell>
                              <TableCell className="text-right font-bold text-primary">{formatCurrency(c.totalMes)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>

                    {/* Resumo de Benefícios */}
                    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">VT Total</p>
                          <p className="font-semibold">{formatCurrency(lojaResumo.totalVT)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-emerald-700" />
                        <div>
                          <p className="text-xs text-muted-foreground">VR Total</p>
                          <p className="font-semibold">{formatCurrency(lojaResumo.totalVR)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShoppingBasket className="h-4 w-4 text-emerald-800" />
                        <div>
                          <p className="text-xs text-muted-foreground">Cesta Total</p>
                          <p className="font-semibold">{formatCurrency(lojaResumo.totalCesta)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* By Employee Tab */}
        <TabsContent value="funcionarios" className="space-y-4 animate-fade-in">
          {/* Table - Filtros movidos para barra fixa */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Detalhamento por Funcionário
                <Badge variant="secondary" className="ml-2">{calculosLote.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full max-h-[600px]">
                <div className="overflow-x-auto">
                  <Table className="table-zebra w-full min-w-[1100px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold w-[50px]"></TableHead>
                        <TableHead className="font-semibold whitespace-nowrap w-20">Mat.</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap min-w-[150px]">Nome</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap">Loja</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap w-24">Status</TableHead>
                        <TableHead className="text-center font-semibold whitespace-nowrap w-20">Faltas</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">Salário</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">Dia 20</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">Dia 5</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">Descontos</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">VT</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">VR</TableHead>
                        <TableHead className="text-right font-semibold whitespace-nowrap">Cesta</TableHead>
                        <TableHead className="text-right font-semibold text-primary whitespace-nowrap">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosCompetencia.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                            Carregando dados da competência...
                          </TableCell>
                        </TableRow>
                      ) : calculosLote.map((c) => (
                        <TableRow 
                          key={c.profissional.id} 
                          className="transition-colors group cursor-pointer hover:bg-muted/80"
                          onClick={() => setProfissionalDetalhado(c.profissional.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      abrirModalEdicao({
                                        id: c.profissional.id,
                                        nome: c.profissional.nome,
                                        matricula: c.profissional.matricula,
                                      });
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar faltas e vales</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{c.profissional.matricula}</TableCell>
                          <TableCell className="font-medium max-w-[180px] truncate">{c.profissional.nome}</TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{c.loja?.nome}</TableCell>
                          <TableCell>{getStatusBadge(c.profissional.status)}</TableCell>
                          <TableCell className="text-center">
                            {(c.profissional.faltas > 0 || c.profissional.atestados > 0) ? (
                              <div className="flex items-center justify-center gap-1">
                                {c.profissional.faltas > 0 && (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                    {c.profissional.faltas}F
                                  </Badge>
                                )}
                                {c.profissional.atestados > 0 && (
                                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                                    {c.profissional.atestados}A
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {formatCurrency(c.profissional.salario)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-success whitespace-nowrap">
                            {formatCurrency(c.valorDia20)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {formatCurrency(c.salarioLiquido)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {c.totalDescontos > 0 ? (
                              <span className="text-destructive">-{formatCurrency(c.totalDescontos)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                            {formatCurrency(c.valorVT)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                            {formatCurrency(c.valorVR)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                            {formatCurrency(c.valorCesta)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums font-bold text-primary whitespace-nowrap">
                            {formatCurrency(c.totalMes)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="config" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Parâmetros da Competência
              </CardTitle>
              <CardDescription>
                Configure os valores base para o cálculo da folha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="competencia">Competência</Label>
                  <Input
                    id="competencia"
                    type="month"
                    value={competencia}
                    onChange={(e) => setCompetencia(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diasUteis6x1">Dias Úteis (6x1)</Label>
                  <Input
                    id="diasUteis6x1"
                    type="number"
                    value={diasUteis6x1}
                    onChange={(e) => setDiasUteis6x1(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diasUteis5x2">Dias Úteis (5x2)</Label>
                  <Input
                    id="diasUteis5x2"
                    type="number"
                    value={diasUteis5x2}
                    onChange={(e) => setDiasUteis5x2(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorVR">Valor VR / dia</Label>
                  <Input
                    id="valorVR"
                    type="number"
                    step="0.01"
                    value={valorVR}
                    onChange={(e) => setValorVR(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentualDia20">% Dia 20</Label>
                  <Input
                    id="percentualDia20"
                    type="number"
                    value={percentualDia20}
                    onChange={(e) => setPercentualDia20(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adiantamento Tab */}
        <TabsContent value="adiantamento" className="animate-fade-in">
          <AdiantamentoSalario />
        </TabsContent>

        {/* Relatório Geral Tab */}
        <TabsContent value="relatorio" className="animate-fade-in">
          <RelatorioFolha />
        </TabsContent>

        {/* 13º Salário Tab */}
        <TabsContent value="decimo" className="animate-fade-in">
          <DecimoTerceiro />
        </TabsContent>

        {/* Empréstimos Tab */}
        <TabsContent value="emprestimos" className="animate-fade-in">
          <GestaoEmprestimos />
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={selectedCardType !== null} onOpenChange={(open) => !open && setSelectedCardType(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCardType === 'dia20' && <><Calendar className="h-5 w-5 text-success" /> Pagamentos Dia 20</>}
              {selectedCardType === 'dia5' && <><DollarSign className="h-5 w-5 text-primary" /> Pagamentos Dia 5</>}
              {selectedCardType === 'vt' && <><Bus className="h-5 w-5 text-info" /> Vale Transporte (VT)</>}
              {selectedCardType === 'vr' && <><Utensils className="h-5 w-5 text-warning" /> Vale Refeição (VR)</>}
              {selectedCardType === 'total' && <><TrendingUp className="h-5 w-5 text-accent" /> Total Geral</>}
              {selectedCardType === 'funcionarios' && <><Users className="h-5 w-5 text-muted-foreground" /> Lista de Funcionários</>}
            </DialogTitle>
            <DialogDescription>
              {selectedCardType === 'dia20' && `Total: ${formatCurrency(totaisGerais.totalDia20)} • ${calculosLote.filter(c => c.valorDia20 > 0).length} funcionários`}
              {selectedCardType === 'dia5' && `Total: ${formatCurrency(totaisGerais.totalDia5)} • ${calculosLote.filter(c => c.salarioLiquido > 0).length} funcionários`}
              {selectedCardType === 'vt' && `Total: ${formatCurrency(totaisGerais.totalVT)} • ${calculosLote.filter(c => c.valorVT > 0).length} funcionários`}
              {selectedCardType === 'vr' && `Total: ${formatCurrency(totaisGerais.totalVR)} • ${calculosLote.filter(c => c.valorVR > 0).length} funcionários`}
              {selectedCardType === 'total' && `Total: ${formatCurrency(totaisGerais.totalGeral)} • ${calculosLote.length} funcionários`}
              {selectedCardType === 'funcionarios' && `${totaisGerais.funcionarios} funcionários cadastrados`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Loja</TableHead>
                  {selectedCardType === 'dia20' && <TableHead className="text-right">Valor Dia 20</TableHead>}
                  {selectedCardType === 'dia20' && <TableHead>Motivo</TableHead>}
                  {selectedCardType === 'dia5' && <TableHead className="text-right">Salário Base</TableHead>}
                  {selectedCardType === 'dia5' && <TableHead className="text-right">Valor Dia 5</TableHead>}
                  {selectedCardType === 'vt' && <TableHead className="text-center">Dias</TableHead>}
                  {selectedCardType === 'vt' && <TableHead className="text-right">Valor VT</TableHead>}
                  {selectedCardType === 'vr' && <TableHead className="text-center">Dias</TableHead>}
                  {selectedCardType === 'vr' && <TableHead className="text-right">Valor VR</TableHead>}
                  {selectedCardType === 'total' && <TableHead className="text-right">Dia 20</TableHead>}
                  {selectedCardType === 'total' && <TableHead className="text-right">Dia 5</TableHead>}
                  {selectedCardType === 'total' && <TableHead className="text-right">VT</TableHead>}
                  {selectedCardType === 'total' && <TableHead className="text-right">VR</TableHead>}
                  {selectedCardType === 'total' && <TableHead className="text-right text-primary">Total</TableHead>}
                  {selectedCardType === 'funcionarios' && <TableHead>Status</TableHead>}
                  {selectedCardType === 'funcionarios' && <TableHead className="text-right">Salário</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculosLote
                  .filter(c => {
                    if (selectedCardType === 'dia20') return c.valorDia20 > 0;
                    if (selectedCardType === 'dia5') return c.salarioLiquido > 0;
                    if (selectedCardType === 'vt') return c.valorVT > 0;
                    if (selectedCardType === 'vr') return c.valorVR > 0;
                    return true;
                  })
                  .sort((a, b) => {
                    if (selectedCardType === 'dia20') return b.valorDia20 - a.valorDia20;
                    if (selectedCardType === 'dia5') return b.salarioLiquido - a.salarioLiquido;
                    if (selectedCardType === 'vt') return b.valorVT - a.valorVT;
                    if (selectedCardType === 'vr') return b.valorVR - a.valorVR;
                    if (selectedCardType === 'total') return b.totalMes - a.totalMes;
                    return a.profissional.nome.localeCompare(b.profissional.nome);
                  })
                  .map((c) => (
                    <TableRow key={c.profissional.id}>
                      <TableCell className="font-mono text-xs">{c.profissional.matricula}</TableCell>
                      <TableCell className="font-medium">{c.profissional.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{c.loja?.nome || '-'}</TableCell>
                      {selectedCardType === 'dia20' && (
                        <TableCell className="text-right font-semibold text-success">{formatCurrency(c.valorDia20)}</TableCell>
                      )}
                      {selectedCardType === 'dia20' && (
                        <TableCell className="text-xs text-muted-foreground">{c.motivoDia20}</TableCell>
                      )}
                      {selectedCardType === 'dia5' && (
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(c.profissional.salario)}</TableCell>
                      )}
                      {selectedCardType === 'dia5' && (
                        <TableCell className="text-right font-semibold text-primary">{formatCurrency(c.salarioLiquido)}</TableCell>
                      )}
                      {selectedCardType === 'vt' && (
                        <TableCell className="text-center">{c.diasTrabalhados}</TableCell>
                      )}
                      {selectedCardType === 'vt' && (
                        <TableCell className="text-right font-semibold text-info">{formatCurrency(c.valorVT)}</TableCell>
                      )}
                      {selectedCardType === 'vr' && (
                        <TableCell className="text-center">{c.diasTrabalhados}</TableCell>
                      )}
                      {selectedCardType === 'vr' && (
                        <TableCell className="text-right font-semibold text-warning">{formatCurrency(c.valorVR)}</TableCell>
                      )}
                      {selectedCardType === 'total' && (
                        <>
                          <TableCell className="text-right text-success">{formatCurrency(c.valorDia20)}</TableCell>
                          <TableCell className="text-right text-primary">{formatCurrency(c.salarioLiquido)}</TableCell>
                          <TableCell className="text-right text-info">{formatCurrency(c.valorVT)}</TableCell>
                          <TableCell className="text-right text-warning">{formatCurrency(c.valorVR)}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{formatCurrency(c.totalMes)}</TableCell>
                        </>
                      )}
                      {selectedCardType === 'funcionarios' && (
                        <>
                          <TableCell>{getStatusBadge(c.profissional.status)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.profissional.salario)}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Lançamentos */}
      <EditarLancamentosModal
        open={modalEdicao.open}
        onClose={fecharModalEdicao}
        profissional={modalEdicao.profissional}
        competencia={competencia}
        onDataUpdated={carregarDadosCompetencia}
      />

      {/* Modal de Detalhamento Individual do Profissional */}
      <Dialog open={profissionalDetalhado !== null} onOpenChange={(open) => { if (!open) setProfissionalDetalhado(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {(() => {
            if (!profissionalDetalhado) return null;
            const calculo = calculosLote.find(c => c.profissional.id === profissionalDetalhado);
            if (!calculo) return <p className="text-muted-foreground">Profissional não encontrado</p>;
            
            const p = calculo.profissional;
            const VALOR_CESTA_BASICA = 180;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {p.nome}
                    <ProfissionalValidationBadge matricula={p.matricula} showDetails />
                  </DialogTitle>
                  <DialogDescription>
                    Matrícula: {p.matricula} • {calculo.loja?.nome} • Competência: {competencia}
                  </DialogDescription>
                </DialogHeader>
                
                {/* Informações Básicas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(p.status)}</div>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">Cargo</p>
                    <p className="font-medium text-sm truncate">{p.cargo || 'N/D'}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">Salário Base</p>
                    <p className="text-lg font-bold">{formatCurrency(p.salario)}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">Dias Trabalhados</p>
                    <p className="text-lg font-bold">{calculo.diasTrabalhados}</p>
                  </Card>
                </div>

                <Separator />

                {/* Proventos */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Proventos
                  </h4>
                  <div className="space-y-2 bg-success/5 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Salário Base</span>
                      <span className="font-mono font-medium">{formatCurrency(p.salario)}</span>
                    </div>
                    {calculo.valorVT > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <Bus className="h-3.5 w-3.5 text-emerald-600" />
                          Vale Transporte ({calculo.diasTrabalhados} dias × {formatCurrency(p.valorPassagem)})
                        </span>
                        <span className="font-mono font-medium">{formatCurrency(calculo.valorVT)}</span>
                      </div>
                    )}
                    {calculo.valorVR > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <Utensils className="h-3.5 w-3.5 text-emerald-700" />
                          Vale Refeição
                        </span>
                        <span className="font-mono font-medium">{formatCurrency(calculo.valorVR)}</span>
                      </div>
                    )}
                    {calculo.valorCesta > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <ShoppingBasket className="h-3.5 w-3.5 text-emerald-800" />
                          Cesta Básica
                        </span>
                        <span className="font-mono font-medium">{formatCurrency(calculo.valorCesta)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Proventos</span>
                      <span className="font-mono text-success">
                        {formatCurrency(p.salario + calculo.valorVT + calculo.valorVR + calculo.valorCesta)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Descontos */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Descontos
                  </h4>
                  <div className="space-y-2 bg-destructive/5 rounded-lg p-3">
                    {calculo.valorDia20 > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-blue-600" />
                          Adiantamento Dia 20 ({calculo.motivoDia20})
                        </span>
                        <span className="font-mono font-medium text-destructive">-{formatCurrency(calculo.valorDia20)}</span>
                      </div>
                    )}
                    {calculo.descontoFaltas > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Desconto Faltas ({p.faltas} dias)</span>
                        <span className="font-mono font-medium text-destructive">-{formatCurrency(calculo.descontoFaltas)}</span>
                      </div>
                    )}
                    {p.vales > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Vales</span>
                        <span className="font-mono font-medium text-destructive">-{formatCurrency(p.vales)}</span>
                      </div>
                    )}
                    {p.emprestimos > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Empréstimos</span>
                        <span className="font-mono font-medium text-destructive">-{formatCurrency(p.emprestimos)}</span>
                      </div>
                    )}
                    {p.pensao > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pensão Alimentícia</span>
                        <span className="font-mono font-medium text-destructive">-{formatCurrency(p.pensao)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Descontos</span>
                      <span className="font-mono text-destructive">
                        -{formatCurrency(calculo.valorDia20 + calculo.totalDescontos)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Resumo de Pagamento */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4 bg-success/10 border-success/30">
                    <p className="text-xs text-muted-foreground">Dia 20 (Adiantamento)</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(calculo.valorDia20)}</p>
                  </Card>
                  <Card className="p-4 bg-primary/10 border-primary/30">
                    <p className="text-xs text-muted-foreground">Dia 5 (Salário)</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(calculo.salarioLiquido)}</p>
                  </Card>
                </div>

                <Card className="p-4 mt-3 bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total do Mês (incluindo benefícios)</p>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(calculo.totalMes)}</p>
                    </div>
                    <Calculator className="h-8 w-8 text-primary/50" />
                  </div>
                </Card>

                {/* Ações */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setProfissionalDetalhado(null);
                      abrirModalEdicao({
                        id: p.id,
                        nome: p.nome,
                        matricula: p.matricula,
                      });
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar Lançamentos
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link to={`/painel-profissional/${p.id}`}>
                      Ver Cadastro Completo
                    </Link>
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}