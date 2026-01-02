import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Vale {
  id: string;
  profissional_id: string;
  tipo: string;
  valor: number;
  descricao: string | null;
  data_lancamento: string;
  status: string;
}

interface Emprestimo {
  id: string;
  profissional_id: string;
  tipo: string;
  valor_parcela: number;
  parcelas_pagas: number;
  numero_parcelas: number;
  saldo_devedor: number;
  status: string;
  observacoes: string | null;
}

interface Falta {
  id: string;
  profissional_id: string;
  data_falta: string;
  tipo: string;
  motivo: string | null;
}

interface Adiantamento {
  id: string;
  profissional_id: string;
  mes_referencia: string;
  valor_adiantamento: number;
  pago: boolean;
}

export interface DescontosHolerite {
  vales: { descricao: string; valor: number }[];
  emprestimos: { descricao: string; valor: number }[];
  faltas: { dias: number; valor: number };
  adiantamento: number;
}

export function useHoleriteData(profissionalId: string | null, competencia: string) {
  const [vales, setVales] = useState<Vale[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [adiantamento, setAdiantamento] = useState<Adiantamento | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profissionalId) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Parse competência para pegar mês/ano
      const [ano, mes] = competencia.split('-').map(Number);
      const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];

      // Buscar vales pendentes do profissional no mês
      const { data: valesData } = await supabase
        .from('professional_vales')
        .select('*')
        .eq('profissional_id', profissionalId)
        .eq('status', 'pendente')
        .gte('data_lancamento', inicioMes)
        .lte('data_lancamento', fimMes);

      // Buscar empréstimos ativos do profissional
      const { data: emprestimosData } = await supabase
        .from('emprestimos')
        .select('*')
        .eq('profissional_id', profissionalId)
        .eq('status', 'ativo');

      // Buscar faltas do profissional no mês
      const { data: faltasData } = await supabase
        .from('faltas')
        .select('*')
        .eq('profissional_id', profissionalId)
        .gte('data_falta', inicioMes)
        .lte('data_falta', fimMes);

      // Buscar adiantamento do mês
      const { data: adiantamentoData } = await supabase
        .from('adiantamentos')
        .select('*')
        .eq('profissional_id', profissionalId)
        .eq('mes_referencia', inicioMes)
        .eq('pago', true)
        .maybeSingle();

      setVales(valesData || []);
      setEmprestimos(emprestimosData || []);
      setFaltas(faltasData || []);
      setAdiantamento(adiantamentoData);
      setIsLoading(false);
    };

    fetchData();
  }, [profissionalId, competencia]);

  // Calcular descontos formatados para o holerite
  const calcularDescontos = (salarioBase: number): DescontosHolerite => {
    // Vales
    const valesFormatados = vales.map(v => ({
      descricao: v.descricao || `Vale ${v.tipo}`,
      valor: Number(v.valor),
    }));

    // Empréstimos - valor da parcela mensal
    const emprestimosFormatados = emprestimos.map(e => ({
      descricao: `${e.tipo} (${e.parcelas_pagas + 1}/${e.numero_parcelas})`,
      valor: Number(e.valor_parcela),
    }));

    // Faltas - apenas dias que faltou (sem DSR)
    const diasFalta = faltas.filter(f => f.tipo === 'injustificada').length;
    const valorDia = salarioBase / 30;
    const faltasDesconto = {
      dias: diasFalta,
      valor: Math.round(valorDia * diasFalta),
    };

    // Adiantamento
    const valorAdiantamento = adiantamento ? Number(adiantamento.valor_adiantamento) : 0;

    return {
      vales: valesFormatados,
      emprestimos: emprestimosFormatados,
      faltas: faltasDesconto,
      adiantamento: valorAdiantamento,
    };
  };

  return {
    vales,
    emprestimos,
    faltas,
    adiantamento,
    isLoading,
    calcularDescontos,
  };
}

// Função para buscar descontos de um profissional específico (para uso em lote)
export async function buscarDescontosProfissional(
  profissionalId: string, 
  competencia: string,
  salarioBase: number
): Promise<DescontosHolerite> {
  const [ano, mes] = competencia.split('-').map(Number);
  const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];

  // Buscar todos os dados em paralelo
  const [valesResult, emprestimosResult, faltasResult, adiantamentoResult] = await Promise.all([
    supabase
      .from('professional_vales')
      .select('*')
      .eq('profissional_id', profissionalId)
      .eq('status', 'pendente')
      .gte('data_lancamento', inicioMes)
      .lte('data_lancamento', fimMes),
    
    supabase
      .from('emprestimos')
      .select('*')
      .eq('profissional_id', profissionalId)
      .eq('status', 'ativo'),
    
    supabase
      .from('faltas')
      .select('*')
      .eq('profissional_id', profissionalId)
      .gte('data_falta', inicioMes)
      .lte('data_falta', fimMes),
    
    supabase
      .from('adiantamentos')
      .select('*')
      .eq('profissional_id', profissionalId)
      .eq('mes_referencia', inicioMes)
      .eq('pago', true)
      .maybeSingle(),
  ]);

  const vales = valesResult.data || [];
  const emprestimos = emprestimosResult.data || [];
  const faltas = faltasResult.data || [];
  const adiantamento = adiantamentoResult.data;

  // Vales
  const valesFormatados = vales.map((v: any) => ({
    descricao: v.descricao || `Vale ${v.tipo}`,
    valor: Number(v.valor),
  }));

  // Empréstimos
  const emprestimosFormatados = emprestimos.map((e: any) => ({
    descricao: `${e.tipo} (${(e.parcelas_pagas || 0) + 1}/${e.numero_parcelas})`,
    valor: Number(e.valor_parcela),
  }));

  // Faltas (apenas injustificadas)
  const diasFalta = faltas.filter((f: any) => f.tipo === 'injustificada').length;
  const valorDia = salarioBase / 30;

  return {
    vales: valesFormatados,
    emprestimos: emprestimosFormatados,
    faltas: {
      dias: diasFalta,
      valor: Math.round(valorDia * diasFalta),
    },
    adiantamento: adiantamento ? Number(adiantamento.valor_adiantamento) : 0,
  };
}
