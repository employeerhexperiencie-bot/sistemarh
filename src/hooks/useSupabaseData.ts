import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Busca paginada para tabelas com potencial de +1000 registros.
 * Evita o limite silencioso de 1000 linhas do Supabase.
 */
async function fetchAllPaginated(
  queryBuilder: () => any,
  pageSize = 1000
): Promise<any[]> {
  const allData: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await queryBuilder()
      .range(from, from + pageSize - 1);

    if (error || !data || data.length === 0) {
      hasMore = false;
      if (data && data.length > 0) allData.push(...data);
    } else {
      allData.push(...data);
      from += pageSize;
      hasMore = data.length === pageSize;
    }
  }

  return allData;
}

interface Profissional {
  id: string;
  matricula: string;
  nome: string;
  cargo: string | null;
  loja_id: string | null;
  salario_nominal: number | null;
  primeiro_salario: number | null;
  ultimo_salario: number | null;
  data_admissao: string | null;
  status: string | null;
  vale_transporte: boolean | null;
  vale_refeicao: boolean | null;
  cesta_basica: boolean | null;
  pensao_alimenticia: number | null;
  valor_diario_rota: number | null;
  /** Colunas carregadas para buscas agregadas / holerites (evita `select('*')`). */
  cpf?: string | null;
  telefone?: string | null;
  celular?: string | null;
  lojas?: { nome: string } | null;
}

/** Colunas usadas pelo dashboard/relatórios/holerites — manter alinhado a `Profissional` e consumidores. */
const SELECT_PROFISSIONAIS_DASHBOARD =
  'id, matricula, nome, cargo, loja_id, salario_nominal, primeiro_salario, ultimo_salario, data_admissao, status, vale_transporte, vale_refeicao, cesta_basica, pensao_alimenticia, valor_diario_rota, cpf, telefone, celular, lojas:lojas!profissionais_loja_id_fkey(nome)';

interface Loja {
  id: string;
  nome: string;
}

interface Afastamento {
  id: string;
  profissional_id: string | null;
  tipo: string;
  motivo: string | null;
  data_inicio: string;
  data_prevista_retorno: string | null;
  status: string | null;
  profissionais?: { nome: string; matricula: string } | null;
}

interface Falta {
  id: string;
  profissional_id: string | null;
  data_falta: string;
  tipo: string;
  motivo: string | null;
  profissionais?: { nome: string; matricula: string; loja_id: string | null } | null;
}

interface ExameASO {
  id: string;
  profissional_id: string | null;
  tipo_exame: string;
  data_ultimo_exame: string | null;
  data_proximo_exame: string | null;
  status: string | null;
  profissionais?: { nome: string; matricula: string; cargo: string | null } | null;
}

interface Ferias {
  id: string;
  profissional_id: string | null;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  status: string | null;
  dias_direito: number | null;
  dias_gozados: number | null;
  profissionais?: { nome: string; matricula: string; data_admissao: string | null } | null;
}

export const useSupabaseData = () => {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [examesASO, setExamesASO] = useState<ExameASO[]>([]);
  const [ferias, setFerias] = useState<Ferias[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Carregar todos os dados em paralelo
        // Profissionais usa paginação (pode ter +1000 registros)
        const [
          profissionaisData,
          lojasResult,
          afastamentosResult,
          faltasResult,
          examesResult,
          feriasResult
        ] = await Promise.all([
          fetchAllPaginated(() =>
            supabase.from('profissionais').select(SELECT_PROFISSIONAIS_DASHBOARD).eq('status', 'ativo')
          ),
          supabase.from('lojas').select('id, nome'),
          supabase.from('afastamentos')
            .select('*, profissionais(nome, matricula)')
            .eq('status', 'ativo'),
          supabase.from('faltas')
            .select('*, profissionais(nome, matricula, loja_id)')
            .gte('data_falta', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
          supabase.from('exames_aso')
            .select('*, profissionais(nome, matricula, cargo)'),
          supabase.from('ferias')
            .select('*, profissionais(nome, matricula, data_admissao)')
        ]);

        if (profissionaisData) setProfissionais(profissionaisData);
        if (lojasResult.data) setLojas(lojasResult.data);
        if (afastamentosResult.data) setAfastamentos(afastamentosResult.data);
        if (faltasResult.data) setFaltas(faltasResult.data);
        if (examesResult.data) setExamesASO(examesResult.data);
        if (feriasResult.data) setFerias(feriasResult.data);
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calcular salário total
  const totalSalarios = profissionais.reduce((sum, p) => {
    return sum + (p.salario_nominal || p.ultimo_salario || p.primeiro_salario || 0);
  }, 0);

  // Agrupar profissionais por loja
  const getProfissionaisPorLoja = () => {
    const agrupado: Record<string, Profissional[]> = {};
    
    profissionais.forEach(prof => {
      const lojaNome = prof.lojas?.nome || 'Sem Loja';
      if (!agrupado[lojaNome]) {
        agrupado[lojaNome] = [];
      }
      agrupado[lojaNome].push(prof);
    });

    return agrupado;
  };

  // Estatísticas por loja
  const getEstatisticasPorLoja = () => {
    const porLoja = getProfissionaisPorLoja();
    
    return Object.entries(porLoja).map(([loja, profs]) => {
      const totalSalariosLoja = profs.reduce((sum, p) => {
        return sum + (p.salario_nominal || p.ultimo_salario || p.primeiro_salario || 0);
      }, 0);

      const mediaSalarial = profs.length > 0 ? totalSalariosLoja / profs.length : 0;

      return {
        loja,
        totalProfissionais: profs.length,
        totalSalarios: totalSalariosLoja,
        mediaSalarial,
        profissionais: profs,
      };
    }).sort((a, b) => b.totalProfissionais - a.totalProfissionais);
  };

  // Dados de afastamentos formatados
  const getAfastamentos = () => {
    return afastamentos.map(af => ({
      id: af.id,
      matricula: af.profissionais?.matricula || '',
      nome: af.profissionais?.nome || '',
      loja: '', // Será preenchido se necessário
      motivo: af.tipo === 'licenca_maternidade' ? 'LICENCA_MATERNIDADE' :
              af.tipo === 'acidente_trabalho' ? 'ACIDENTE_TRABALHO' :
              af.tipo === 'acidente_trajeto' ? 'ACIDENTE_TRAJETO' :
              af.tipo === 'doenca' ? 'DOENCA' : 'OUTROS',
      dataInicio: af.data_inicio,
      dataPericia: af.data_prevista_retorno,
      status: af.status === 'ativo' ? 'ATIVO' : 
              af.status === 'finalizado' ? 'FINALIZADO' : 'AGUARDANDO_PERICIA',
    }));
  };

  // Dados de faltas formatados
  const getFaltas = () => {
    // Agrupar faltas por profissional
    const faltasPorProfissional: Record<string, { 
      justificadas: number; 
      injustificadas: number;
      nome: string;
      matricula: string;
    }> = {};

    faltas.forEach(f => {
      const profId = f.profissional_id || 'unknown';
      if (!faltasPorProfissional[profId]) {
        faltasPorProfissional[profId] = {
          justificadas: 0,
          injustificadas: 0,
          nome: f.profissionais?.nome || '',
          matricula: f.profissionais?.matricula || '',
        };
      }
      if (f.tipo === 'justificada') {
        faltasPorProfissional[profId].justificadas++;
      } else {
        faltasPorProfissional[profId].injustificadas++;
      }
    });

    return Object.values(faltasPorProfissional).map(f => ({
      matricula: f.matricula,
      nome: f.nome,
      loja: '',
      cargo: '',
      totalFaltas: f.justificadas + f.injustificadas,
      faltasJustificadas: f.justificadas,
      faltasInjustificadas: f.injustificadas,
      ultimaFalta: null,
    }));
  };

  // Dados de exames ASO formatados
  const getExamesASO = () => {
    const hoje = new Date();
    
    return examesASO.map(exame => {
      const proximoExame = exame.data_proximo_exame ? new Date(exame.data_proximo_exame) : null;
      
      let diasParaVencer = 0;
      let status: 'regular' | 'vencendo' | 'vencido' = 'regular';
      
      if (proximoExame) {
        diasParaVencer = Math.floor((proximoExame.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        if (diasParaVencer < 0) status = 'vencido';
        else if (diasParaVencer <= 30) status = 'vencendo';
      }
      
      return {
        matricula: exame.profissionais?.matricula || '',
        nome: exame.profissionais?.nome || '',
        loja: '',
        cargo: exame.profissionais?.cargo || '',
        ultimoExame: exame.data_ultimo_exame || 'N/A',
        proximoExame: exame.data_proximo_exame || 'N/A',
        tipoExame: exame.tipo_exame,
        status,
        diasParaVencer,
      };
    });
  };

  // Dados de férias formatados
  const getFerias = () => {
    const hoje = new Date();
    
    return ferias.map((f, index) => {
      const periodoFim = new Date(f.periodo_aquisitivo_fim);
      const diasRestantes = Math.floor((periodoFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: 'vencendo' | 'vencida' | 'agendada' = 'vencendo';
      if (f.status === 'agendada') status = 'agendada';
      else if (diasRestantes < 0) status = 'vencida';
      
      return {
        matricula: f.profissionais?.matricula || '',
        nome: f.profissionais?.nome || '',
        loja: '',
        dataAdmissao: f.profissionais?.data_admissao || '',
        diasDisponiveis: (f.dias_direito || 30) - (f.dias_gozados || 0),
        periodoAquisitivo: `${f.periodo_aquisitivo_inicio} - ${f.periodo_aquisitivo_fim}`,
        status,
        dataVencimento: f.periodo_aquisitivo_fim,
      };
    });
  };

  // Dados de benefícios calculados
  const getBeneficios = () => {
    const diasUteisBase = 22;
    const valorVRDiario = 25;
    const valorCestaBasica = 180; // Valor padronizado R$ 180,00
    
    return profissionais.map(prof => {
      const temVT = prof.vale_transporte || false;
      const temVR = prof.vale_refeicao || false;
      const temCesta = prof.cesta_basica || false;
      
      // VT: valor_diario_rota já representa o custo diário total (ida e volta)
      // Usar valor do banco ou padrão de R$ 4,40 × 22 dias úteis
      const valorDiarioRota = prof.valor_diario_rota || 4.40;
      const valorVT = temVT ? diasUteisBase * valorDiarioRota : 0;
      const valorVR = temVR ? diasUteisBase * valorVRDiario : 0;
      const valorCesta = temCesta ? valorCestaBasica : 0;
      
      return {
        matricula: prof.matricula,
        nome: prof.nome,
        loja: prof.lojas?.nome || '',
        escala: '6x1',
        diasUteis: diasUteisBase,
        diasTrabalhados: diasUteisBase,
        valorVT,
        valorVR,
        cestaBasica: valorCesta,
        temCestaBasica: temCesta,
      };
    });
  };

  // Gerar alertas baseados nos dados
  const getAlertas = () => {
    const alertas: any[] = [];
    const exames = getExamesASO();
    const feriasData = getFerias();

    // Alertas de exames
    exames.filter(e => e.status === 'vencido').forEach(exame => {
      alertas.push({
        tipo: 'exame',
        prioridade: 'alta',
        titulo: 'ASO Vencido',
        descricao: `${exame.nome} - Exame vencido desde ${exame.proximoExame}`,
        profissional: exame.nome,
        loja: exame.loja,
        data: exame.proximoExame,
      });
    });

    exames.filter(e => e.status === 'vencendo').forEach(exame => {
      alertas.push({
        tipo: 'exame',
        prioridade: 'media',
        titulo: 'ASO Vencendo',
        descricao: `${exame.nome} - Exame vence em ${exame.diasParaVencer} dias`,
        profissional: exame.nome,
        loja: exame.loja,
        data: exame.proximoExame,
      });
    });

    // Alertas de férias
    feriasData.filter(f => f.status === 'vencida').forEach(feria => {
      alertas.push({
        tipo: 'ferias',
        prioridade: 'alta',
        titulo: 'Férias Vencidas',
        descricao: `${feria.nome} - Período de férias vencido`,
        profissional: feria.nome,
        loja: feria.loja,
        data: feria.dataVencimento,
      });
    });

    return alertas;
  };

  // Folha de pagamento
  const getFolhaPagamento = () => {
    return profissionais.map(prof => {
      const salarioBase = prof.salario_nominal || prof.ultimo_salario || prof.primeiro_salario || 0;
      const adiantamentoDia20 = salarioBase * 0.4;
      const descontos = {
        inss: salarioBase * 0.11,
        valeTransporte: salarioBase * 0.06,
        pensao: (prof.pensao_alimenticia || 0) > 0 ? salarioBase * 0.30 : 0,
      };
      const totalDescontos = descontos.inss + descontos.valeTransporte + descontos.pensao;
      const liquido = salarioBase - totalDescontos;

      return {
        matricula: prof.matricula,
        nome: prof.nome,
        cargo: prof.cargo,
        loja: prof.lojas?.nome || '',
        salarioBase,
        adiantamentoDia20,
        descontos,
        totalDescontos,
        liquido,
      };
    });
  };

  return {
    profissionais,
    lojas,
    isLoading,
    hasMockData: profissionais.length > 0,
    
    // Funções utilitárias
    parseSalario: (valor: any) => {
      if (!valor) return 0;
      if (typeof valor === 'number') return valor;
      return parseFloat(String(valor).replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    },
    
    // Dados calculados
    getFolhaPagamento,
    getProfissionaisPorLoja,
    getEstatisticasPorLoja,
    getFerias,
    getFaltas,
    getExamesASO,
    getAfastamentos,
    getBeneficios,
    getAlertas,
    
    // Estatísticas gerais
    totalProfissionais: profissionais.length,
    totalLojas: lojas.length,
    totalSalarios,
  };
};
