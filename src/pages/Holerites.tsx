import { useState, useMemo, useEffect } from 'react';
import { FileText, Mail, CheckCircle, Download, Printer, Eye, Send, AlertTriangle, CheckCircle2, Bus, Calendar, CalendarDays, LayoutGrid, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  gerarHoleritePDF, 
  gerarHoleriteDia20, 
  gerarHoleriteDia5, 
  gerarHoleriteVT, 
  DadosHoleriteDia20, 
  DadosHoleriteDia5, 
  DadosHoleriteVT 
} from '@/components/folha/HoleritePDF';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { buscarDescontosProfissional } from '@/hooks/useHoleriteData';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

interface HoleriteItem {
  id: string;
  loja: string;
  matricula: string;
  nome: string;
  cargo: string;
  salario: number;
  status: 'pendente' | 'gerado' | 'enviado' | 'assinado';
  recebeVT?: boolean;
  valorDiarioVT?: number;
}

const gerarHoleritesMock = (): HoleriteItem[] => {
  const nomes = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima', 'Carlos Oliveira'];
  const lojas = ['Loja 01', 'Loja 02', 'Loja 03'];
  const cargos = ['Vendedor', 'Caixa', 'Repositor', 'Supervisor'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `hol-${i + 1}`,
    loja: lojas[Math.floor(Math.random() * lojas.length)],
    matricula: String(i + 1).padStart(4, '0'),
    nome: nomes[i % nomes.length],
    cargo: cargos[Math.floor(Math.random() * cargos.length)],
    salario: 1800 + Math.floor(Math.random() * 1500),
    status: 'pendente' as const,
    recebeVT: Math.random() > 0.3,
    valorDiarioVT: Math.random() > 0.3 ? 10 + Math.floor(Math.random() * 15) : 0,
  }));
};

export default function Holerites() {
  const { toast } = useToast();
  const supabaseData = useSupabaseData();
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Seleção separada para cada aba
  const [selecionadosDia20, setSelecionadosDia20] = useState<Set<string>>(new Set());
  const [selecionadosDia5, setSelecionadosDia5] = useState<Set<string>>(new Set());
  const [selecionadosVT, setSelecionadosVT] = useState<Set<string>>(new Set());
  
  const [gerando, setGerando] = useState(false);

  const [validacaoDados, setValidacaoDados] = useState({
    ativosCarregados: false,
  });

  useEffect(() => {
    if (!supabaseData.isLoading) {
      setValidacaoDados({
        ativosCarregados: supabaseData.totalProfissionais > 0,
      });
    }
  }, [supabaseData.isLoading, supabaseData.totalProfissionais]);
  
  const holerites = useMemo(() => {
    if (supabaseData.totalProfissionais > 0) {
      return supabaseData.profissionais.map((p: any) => ({
        id: p.id,
        loja: p.lojas?.nome || '-',
        matricula: p.matricula,
        nome: p.nome,
        cargo: p.cargo || '-',
        salario: p.salario_nominal || p.ultimo_salario || p.primeiro_salario || 0,
        status: 'pendente' as const,
        recebeVT: p.vale_transporte || false,
        valorDiarioVT: p.valor_diario_rota || 0,
      }));
    }
    return gerarHoleritesMock();
  }, [supabaseData.profissionais, supabaseData.totalProfissionais]);

  const holeritesVT = useMemo(() => {
    return holerites.filter(h => h.recebeVT && h.valorDiarioVT && h.valorDiarioVT > 0);
  }, [holerites]);
  
  const holeritesFiltrados = useMemo(() => {
    return holerites.filter(h => {
      if (lojaFiltro !== 'todas' && h.loja !== lojaFiltro) return false;
      if (searchTerm && !h.nome.toLowerCase().includes(searchTerm.toLowerCase()) && !h.matricula.includes(searchTerm)) return false;
      return true;
    });
  }, [holerites, lojaFiltro, searchTerm]);
  
  const lojas = useMemo(() => [...new Set(holerites.map(h => h.loja))], [holerites]);
  
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const exportarGerencialCSV = () => {
    if (holeritesFiltrados.length === 0) {
      toast({
        title: 'Sem dados',
        description: 'Nenhum profissional para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Matrícula', 'Nome', 'Loja', 'Salário Base', 'Dia 20', 'Dia 5', 'Total do Mês'];
    const linhas = holeritesFiltrados.map(h => {
      const dia20 = Math.round(h.salario * 0.4);
      const dia5 = h.salario - dia20;
      const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
      return [
        escape(h.matricula),
        escape(h.nome),
        escape(h.loja),
        h.salario.toFixed(2).replace('.', ','),
        dia20.toFixed(2).replace('.', ','),
        dia5.toFixed(2).replace('.', ','),
        h.salario.toFixed(2).replace('.', ','),
      ].join(';');
    });

    const csv = '\uFEFF' + [headers.join(';'), ...linhas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holerite_gerencial_${competencia}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV exportado',
      description: `${holeritesFiltrados.length} registros exportados.`,
    });
  };

  // ========== FUNÇÕES DIA 20 (Adiantamento 40%) ==========
  const gerarPDFDia20Individual = async (holerite: HoleriteItem) => {
    const dadosDia20: DadosHoleriteDia20 = {
      salarioBase: holerite.salario,
      percentualAdiantamento: 40,
    };

    const dados = gerarHoleriteDia20(
      holerite.nome,
      holerite.matricula,
      holerite.loja,
      holerite.salario,
      competencia,
      dadosDia20
    );
    
    const doc = gerarHoleritePDF(dados);
    doc.save(`holerite_dia20_${holerite.matricula}_${competencia}.pdf`);
    
    toast({
      title: 'PDF Dia 20 Gerado',
      description: `Adiantamento de ${holerite.nome} gerado com sucesso!`,
    });
  };

  const visualizarPDFDia20 = async (holerite: HoleriteItem) => {
    const dadosDia20: DadosHoleriteDia20 = {
      salarioBase: holerite.salario,
      percentualAdiantamento: 40,
    };

    const dados = gerarHoleriteDia20(
      holerite.nome,
      holerite.matricula,
      holerite.loja,
      holerite.salario,
      competencia,
      dadosDia20
    );
    
    const doc = gerarHoleritePDF(dados);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const sanitizeFolderName = (name: string) => name.replace(/[^a-zA-Z0-9À-ÿ\s_-]/g, '').trim() || 'Sem_Loja';

  const downloadZip = async (zip: JSZip, filename: string) => {
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const gerarPDFsDia20EmLote = async () => {
    if (selecionadosDia20.size === 0) {
      toast({
        title: 'Nenhum selecionado',
        description: 'Selecione pelo menos um funcionário.',
        variant: 'destructive',
      });
      return;
    }
    
    setGerando(true);
    
    try {
      const zip = new JSZip();
      const selecionadosArray = holeritesFiltrados.filter(h => selecionadosDia20.has(h.id));
      
      for (const holerite of selecionadosArray) {
        const dadosDia20: DadosHoleriteDia20 = {
          salarioBase: holerite.salario,
          percentualAdiantamento: 40,
        };

        const dados = gerarHoleriteDia20(
          holerite.nome,
          holerite.matricula,
          holerite.loja,
          holerite.salario,
          competencia,
          dadosDia20
        );
        
        const doc = gerarHoleritePDF(dados);
        const pdfBlob = doc.output('arraybuffer');
        const folderName = sanitizeFolderName(holerite.loja);
        zip.folder(folderName)?.file(
          `holerite_dia20_${holerite.matricula}_${holerite.nome.replace(/\s/g, '_')}.pdf`,
          pdfBlob
        );
      }
      
      await downloadZip(zip, `holerites_dia20_${competencia}.zip`);
      
      toast({
        title: 'ZIP Dia 20 Gerado',
        description: `${selecionadosDia20.size} holerites organizados por loja em um arquivo ZIP!`,
      });
      
      setSelecionadosDia20(new Set());
    } catch (error) {
      console.error('Erro ao gerar ZIP:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar o arquivo ZIP.',
        variant: 'destructive',
      });
    } finally {
      setGerando(false);
    }
  };

  // ========== FUNÇÕES DIA 5 (Saldo com descontos) ==========
  const gerarPDFDia5Individual = async (holerite: HoleriteItem) => {
    const descontos = await buscarDescontosProfissional(
      holerite.id,
      competencia,
      holerite.salario
    );

    const adiantamentoDia20 = Math.round(holerite.salario * 0.4);

    const dadosDia5: DadosHoleriteDia5 = {
      salarioBase: holerite.salario,
      adiantamentoDia20,
      faltas: descontos.faltas,
      vales: descontos.vales,
      emprestimos: descontos.emprestimos,
      adiantamentoExtra: descontos.adiantamento,
    };

    const dados = gerarHoleriteDia5(
      holerite.nome,
      holerite.matricula,
      holerite.loja,
      holerite.salario,
      competencia,
      dadosDia5
    );
    
    const doc = gerarHoleritePDF(dados);
    doc.save(`holerite_dia5_${holerite.matricula}_${competencia}.pdf`);
    
    toast({
      title: 'PDF Dia 5 Gerado',
      description: `Saldo de ${holerite.nome} gerado com sucesso!`,
    });
  };

  const visualizarPDFDia5 = async (holerite: HoleriteItem) => {
    const descontos = await buscarDescontosProfissional(
      holerite.id,
      competencia,
      holerite.salario
    );

    const adiantamentoDia20 = Math.round(holerite.salario * 0.4);

    const dadosDia5: DadosHoleriteDia5 = {
      salarioBase: holerite.salario,
      adiantamentoDia20,
      faltas: descontos.faltas,
      vales: descontos.vales,
      emprestimos: descontos.emprestimos,
      adiantamentoExtra: descontos.adiantamento,
    };

    const dados = gerarHoleriteDia5(
      holerite.nome,
      holerite.matricula,
      holerite.loja,
      holerite.salario,
      competencia,
      dadosDia5
    );
    
    const doc = gerarHoleritePDF(dados);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const gerarPDFsDia5EmLote = async () => {
    if (selecionadosDia5.size === 0) {
      toast({
        title: 'Nenhum selecionado',
        description: 'Selecione pelo menos um funcionário.',
        variant: 'destructive',
      });
      return;
    }
    
    setGerando(true);
    
    try {
      const zip = new JSZip();
      const selecionadosArray = holeritesFiltrados.filter(h => selecionadosDia5.has(h.id));
      
      for (const holerite of selecionadosArray) {
        const descontos = await buscarDescontosProfissional(
          holerite.id,
          competencia,
          holerite.salario
        );

        const adiantamentoDia20 = Math.round(holerite.salario * 0.4);

        const dadosDia5: DadosHoleriteDia5 = {
          salarioBase: holerite.salario,
          adiantamentoDia20,
          faltas: descontos.faltas,
          vales: descontos.vales,
          emprestimos: descontos.emprestimos,
          adiantamentoExtra: descontos.adiantamento,
        };

        const dados = gerarHoleriteDia5(
          holerite.nome,
          holerite.matricula,
          holerite.loja,
          holerite.salario,
          competencia,
          dadosDia5
        );
        
        const doc = gerarHoleritePDF(dados);
        const pdfBlob = doc.output('arraybuffer');
        const folderName = sanitizeFolderName(holerite.loja);
        zip.folder(folderName)?.file(
          `holerite_dia5_${holerite.matricula}_${holerite.nome.replace(/\s/g, '_')}.pdf`,
          pdfBlob
        );
      }
      
      await downloadZip(zip, `holerites_dia5_${competencia}.zip`);
      
      toast({
        title: 'ZIP Dia 5 Gerado',
        description: `${selecionadosDia5.size} holerites organizados por loja em um arquivo ZIP!`,
      });
      
      setSelecionadosDia5(new Set());
    } catch (error) {
      console.error('Erro ao gerar ZIP:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar o arquivo ZIP.',
        variant: 'destructive',
      });
    } finally {
      setGerando(false);
    }
  };

  // ========== FUNÇÕES VT ==========
  const buscarDadosVT = async (profissionalId: string): Promise<{ diasFalta: number; diasAtestado: number; diasFerias: number }> => {
    const [ano, mes] = competencia.split('-').map(Number);
    const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];

    const [faltasResult, feriasResult] = await Promise.all([
      supabase
        .from('faltas')
        .select('tipo')
        .eq('profissional_id', profissionalId)
        .gte('data_falta', inicioMes)
        .lte('data_falta', fimMes),
      supabase
        .from('ferias')
        .select('dias_gozados')
        .eq('profissional_id', profissionalId)
        .gte('periodo_gozo_inicio', inicioMes)
        .lte('periodo_gozo_inicio', fimMes)
    ]);

    const faltas = faltasResult.data || [];
    const diasFalta = faltas.filter((f: any) => f.tipo === 'injustificada').length;
    const diasAtestado = faltas.filter((f: any) => f.tipo === 'justificada' || f.tipo === 'atestado').length;
    const diasFerias = (feriasResult.data || []).reduce((sum: number, f: any) => sum + (f.dias_gozados || 0), 0);

    return { diasFalta, diasAtestado, diasFerias };
  };

  const calcularDiasUteis = (): number => {
    const [ano, mes] = competencia.split('-').map(Number);
    const ultimoDia = new Date(ano, mes, 0).getDate();
    let diasUteis = 0;
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = new Date(ano, mes - 1, dia);
      if (data.getDay() !== 0) diasUteis++;
    }
    return diasUteis;
  };

  const gerarPDFVTIndividual = async (holerite: HoleriteItem) => {
    if (!holerite.valorDiarioVT) {
      toast({
        title: 'Erro',
        description: 'Profissional não possui valor diário de VT cadastrado.',
        variant: 'destructive',
      });
      return;
    }

    const dadosVT = await buscarDadosVT(holerite.id);
    const diasUteis = calcularDiasUteis();
    const diasTrabalhados = Math.max(0, diasUteis - dadosVT.diasFalta - dadosVT.diasAtestado - dadosVT.diasFerias);

    const dadosHoleriteVT: DadosHoleriteVT = {
      valorDiario: holerite.valorDiarioVT,
      diasUteisMes: diasUteis,
      diasTrabalhados,
      diasFalta: dadosVT.diasFalta,
      diasAtestado: dadosVT.diasAtestado,
      diasFerias: dadosVT.diasFerias,
    };

    const dados = gerarHoleriteVT(
      holerite.nome,
      holerite.matricula,
      holerite.loja,
      competencia,
      dadosHoleriteVT
    );
    
    const doc = gerarHoleritePDF(dados);
    doc.save(`holerite_vt_${holerite.matricula}_${competencia}.pdf`);
    
    toast({
      title: 'PDF VT Gerado',
      description: `Holerite VT de ${holerite.nome} gerado com sucesso!`,
    });
  };

  const visualizarPDFVT = async (holerite: HoleriteItem) => {
    if (!holerite.valorDiarioVT) return;

    const dadosVT = await buscarDadosVT(holerite.id);
    const diasUteis = calcularDiasUteis();
    const diasTrabalhados = Math.max(0, diasUteis - dadosVT.diasFalta - dadosVT.diasAtestado - dadosVT.diasFerias);

    const dadosHoleriteVT: DadosHoleriteVT = {
      valorDiario: holerite.valorDiarioVT,
      diasUteisMes: diasUteis,
      diasTrabalhados,
      diasFalta: dadosVT.diasFalta,
      diasAtestado: dadosVT.diasAtestado,
      diasFerias: dadosVT.diasFerias,
    };

    const dados = gerarHoleriteVT(
      holerite.nome,
      holerite.matricula,
      holerite.loja,
      competencia,
      dadosHoleriteVT
    );
    
    const doc = gerarHoleritePDF(dados);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const gerarPDFsVTEmLote = async () => {
    if (selecionadosVT.size === 0) {
      toast({
        title: 'Nenhum selecionado',
        description: 'Selecione pelo menos um funcionário.',
        variant: 'destructive',
      });
      return;
    }
    
    setGerando(true);
    
    try {
      const zip = new JSZip();
      const diasUteis = calcularDiasUteis();
      const selecionadosArray = holeritesVT.filter(h => selecionadosVT.has(h.id));
      
      for (const holerite of selecionadosArray) {
        if (!holerite.valorDiarioVT) continue;
        
        const dadosVT = await buscarDadosVT(holerite.id);
        const diasTrabalhados = Math.max(0, diasUteis - dadosVT.diasFalta - dadosVT.diasAtestado - dadosVT.diasFerias);

        const dadosHoleriteVT: DadosHoleriteVT = {
          valorDiario: holerite.valorDiarioVT,
          diasUteisMes: diasUteis,
          diasTrabalhados,
          diasFalta: dadosVT.diasFalta,
          diasAtestado: dadosVT.diasAtestado,
          diasFerias: dadosVT.diasFerias,
        };

        const dados = gerarHoleriteVT(
          holerite.nome,
          holerite.matricula,
          holerite.loja,
          competencia,
          dadosHoleriteVT
        );
        
        const doc = gerarHoleritePDF(dados);
        const pdfBlob = doc.output('arraybuffer');
        const folderName = sanitizeFolderName(holerite.loja);
        zip.folder(folderName)?.file(
          `holerite_vt_${holerite.matricula}_${holerite.nome.replace(/\s/g, '_')}.pdf`,
          pdfBlob
        );
      }
      
      await downloadZip(zip, `holerites_vt_${competencia}.zip`);
      
      toast({
        title: 'ZIP VT Gerado',
        description: `${selecionadosVT.size} holerites organizados por loja em um arquivo ZIP!`,
      });
      
      setSelecionadosVT(new Set());
    } catch (error) {
      console.error('Erro ao gerar ZIP:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar o arquivo ZIP.',
        variant: 'destructive',
      });
    } finally {
      setGerando(false);
    }
  };

  // ========== HELPERS ==========
  const toggleSelecionadoDia20 = (id: string) => {
    setSelecionadosDia20(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelecionadoDia5 = (id: string) => {
    setSelecionadosDia5(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelecionadoVT = (id: string) => {
    setSelecionadosVT(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selecionarTodosDia20 = () => {
    if (selecionadosDia20.size === holeritesFiltrados.length) {
      setSelecionadosDia20(new Set());
    } else {
      setSelecionadosDia20(new Set(holeritesFiltrados.map(h => h.id)));
    }
  };

  const selecionarTodosDia5 = () => {
    if (selecionadosDia5.size === holeritesFiltrados.length) {
      setSelecionadosDia5(new Set());
    } else {
      setSelecionadosDia5(new Set(holeritesFiltrados.map(h => h.id)));
    }
  };

  const selecionarTodosVT = () => {
    const vtFiltrados = holeritesVT.filter(h => lojaFiltro === 'todas' || h.loja === lojaFiltro);
    if (selecionadosVT.size === vtFiltrados.length) {
      setSelecionadosVT(new Set());
    } else {
      setSelecionadosVT(new Set(vtFiltrados.map(h => h.id)));
    }
  };

  // Resumo financeiro
  const resumo = useMemo(() => {
    const totalSalarios = holeritesFiltrados.reduce((sum, h) => sum + h.salario, 0);
    const adiantamentoDia20 = Math.round(totalSalarios * 0.4);
    const saldoDia5 = totalSalarios - adiantamentoDia20;
    return { totalSalarios, adiantamentoDia20, saldoDia5 };
  }, [holeritesFiltrados]);
  
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Status de Validação */}
      {validacaoDados.ativosCarregados ? (
        <Alert className="border-success bg-success/5">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <AlertTitle className="text-success font-semibold">Dados Carregados</AlertTitle>
          <AlertDescription>
            <span className="text-sm">{supabaseData.totalProfissionais} profissionais • {supabaseData.totalLojas} lojas</span>
          </AlertDescription>
        </Alert>
      ) : supabaseData.totalProfissionais === 0 ? (
        <Alert className="border-warning bg-warning/5">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <AlertTitle className="text-warning font-semibold">Carregando Dados...</AlertTitle>
        </Alert>
      ) : null}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Gestão de Holerites
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Holerites separados: Dia 20 (Adiantamento) • Dia 5 (Saldo) • Vale Transporte
          </p>
        </div>
      </div>

      {/* Filtros Globais */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Competência</Label>
              <Input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loja</Label>
              <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Lojas</SelectItem>
                  {lojas.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Buscar</Label>
              <Input
                placeholder="Nome ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para os 3 tipos de holerite */}
      <Tabs defaultValue="dia20" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="dia20" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dia 20
          </TabsTrigger>
          <TabsTrigger value="dia5" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Dia 5
          </TabsTrigger>
          <TabsTrigger value="vt" className="flex items-center gap-2">
            <Bus className="h-4 w-4" />
            VT
          </TabsTrigger>
          <TabsTrigger value="gerencial" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Gerencial
          </TabsTrigger>
        </TabsList>

        {/* ========== TAB DIA 20 ========== */}
        <TabsContent value="dia20" className="space-y-4 mt-4">
          {/* Resumo Dia 20 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="bg-warning/5 border-warning/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Calendar className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Funcionários</p>
                    <p className="text-2xl font-bold">{holeritesFiltrados.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Dia 20 (40%)</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(resumo.adiantamentoDia20)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Selecionados</p>
                    <p className="text-2xl font-bold">{selecionadosDia20.size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações Dia 20 */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={gerarPDFsDia20EmLote}
              disabled={selecionadosDia20.size === 0 || gerando}
            >
              <Download className="h-4 w-4 mr-2" />
              {gerando ? 'Gerando...' : `Gerar PDFs (${selecionadosDia20.size})`}
            </Button>
          </div>

          {/* Tabela Dia 20 */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selecionadosDia20.size === holeritesFiltrados.length && holeritesFiltrados.length > 0}
                          onCheckedChange={selecionarTodosDia20}
                        />
                      </TableHead>
                      <TableHead className="w-20">Mat.</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead className="text-right">Salário Base</TableHead>
                      <TableHead className="text-right">Adiantamento (40%)</TableHead>
                      <TableHead className="w-24 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holeritesFiltrados.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>
                          <Checkbox
                            checked={selecionadosDia20.has(h.id)}
                            onCheckedChange={() => toggleSelecionadoDia20(h.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{h.matricula}</TableCell>
                        <TableCell className="font-medium">{h.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{h.loja}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(h.salario)}</TableCell>
                        <TableCell className="text-right font-bold text-warning">
                          {formatCurrency(Math.round(h.salario * 0.4))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => visualizarPDFDia20(h)} title="Visualizar">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => gerarPDFDia20Individual(h)} title="Download">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {holeritesFiltrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum funcionário encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Info Dia 20 */}
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Holerite Dia 20 - Adiantamento</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pagamento antecipado de 40% do salário combinado. Sem descontos adicionais.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB DIA 5 ========== */}
        <TabsContent value="dia5" className="space-y-4 mt-4">
          {/* Resumo Dia 5 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CalendarDays className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Funcionários</p>
                    <p className="text-2xl font-bold">{holeritesFiltrados.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo Dia 5 (60%)</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(resumo.saldoDia5)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Selecionados</p>
                    <p className="text-2xl font-bold">{selecionadosDia5.size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações Dia 5 */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={gerarPDFsDia5EmLote}
              disabled={selecionadosDia5.size === 0 || gerando}
            >
              <Download className="h-4 w-4 mr-2" />
              {gerando ? 'Gerando...' : `Gerar PDFs (${selecionadosDia5.size})`}
            </Button>
          </div>

          {/* Tabela Dia 5 */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selecionadosDia5.size === holeritesFiltrados.length && holeritesFiltrados.length > 0}
                          onCheckedChange={selecionarTodosDia5}
                        />
                      </TableHead>
                      <TableHead className="w-20">Mat.</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead className="text-right">Salário Base</TableHead>
                      <TableHead className="text-right">Saldo Estimado</TableHead>
                      <TableHead className="w-24 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holeritesFiltrados.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>
                          <Checkbox
                            checked={selecionadosDia5.has(h.id)}
                            onCheckedChange={() => toggleSelecionadoDia5(h.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{h.matricula}</TableCell>
                        <TableCell className="font-medium">{h.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{h.loja}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(h.salario)}</TableCell>
                        <TableCell className="text-right font-bold text-success">
                          {formatCurrency(Math.round(h.salario * 0.6))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => visualizarPDFDia5(h)} title="Visualizar">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => gerarPDFDia5Individual(h)} title="Download">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {holeritesFiltrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum funcionário encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Info Dia 5 */}
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Holerite Dia 5 - Saldo Final</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Saldo restante (60%) com descontos de: Adiantamento Dia 20, Faltas, Vales e Empréstimos.
                    Não inclui descontos legais (INSS, IRRF, DSR).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB VT ========== */}
        <TabsContent value="vt" className="space-y-4 mt-4">
          {/* Resumo VT */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recebem VT</p>
                    <p className="text-2xl font-bold text-primary">{holeritesVT.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dias Úteis (6x1)</p>
                    <p className="text-2xl font-bold">{calcularDiasUteis()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total VT Estimado</p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(holeritesVT.reduce((sum, h) => sum + ((h.valorDiarioVT || 0) * calcularDiasUteis()), 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações VT */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={gerarPDFsVTEmLote}
              disabled={selecionadosVT.size === 0 || gerando}
            >
              <Download className="h-4 w-4 mr-2" />
              {gerando ? 'Gerando...' : `Gerar PDFs VT (${selecionadosVT.size})`}
            </Button>
          </div>

          {/* Tabela VT */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selecionadosVT.size === holeritesVT.filter(h => lojaFiltro === 'todas' || h.loja === lojaFiltro).length && holeritesVT.length > 0}
                          onCheckedChange={selecionarTodosVT}
                        />
                      </TableHead>
                      <TableHead className="w-20">Mat.</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead className="text-right">Valor Diário</TableHead>
                      <TableHead className="text-right">VT Estimado</TableHead>
                      <TableHead className="w-24 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holeritesVT
                      .filter(h => lojaFiltro === 'todas' || h.loja === lojaFiltro)
                      .filter(h => !searchTerm || h.nome.toLowerCase().includes(searchTerm.toLowerCase()) || h.matricula.includes(searchTerm))
                      .map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>
                            <Checkbox
                              checked={selecionadosVT.has(h.id)}
                              onCheckedChange={() => toggleSelecionadoVT(h.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{h.matricula}</TableCell>
                          <TableCell className="font-medium">{h.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{h.loja}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(h.valorDiarioVT || 0)}</TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatCurrency((h.valorDiarioVT || 0) * calcularDiasUteis())}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => visualizarPDFVT(h)} title="Visualizar">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => gerarPDFVTIndividual(h)} title="Download">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {holeritesVT.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum profissional com Vale Transporte cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Info VT */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bus className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Holerite de Vale Transporte</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculado com base nos dias úteis do mês (escala 6x1). 
                    Descontos automáticos por faltas, atestados e férias.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
