import { useState, useEffect } from 'react';

interface ProfissionalImportado {
  matricula: string;
  nome: string;
  cargo: string;
  localTrabalho: string;
  localRegistro: string;
  gestor: string;
  salarioCTPS: string;
  salarioReceber: string;
  admissaoCTPS: string;
  cpf: string;
  rg: string;
  telefone: string;
  nascimento: string;
  idade: string;
  genero: string;
  estadoCivil: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  escala: string;
  horario: string;
  pensao: string;
  cnh: string;
  categoria: string;
}

export const useMockData = () => {
  const [profissionais, setProfissionais] = useState<ProfissionalImportado[]>([]);
  const [lojas, setLojas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const importedDataStr = localStorage.getItem('profissionaisImportados');
      const lojasImportadasStr = localStorage.getItem('lojasImportadas');

      if (importedDataStr) {
        const data = JSON.parse(importedDataStr);
        setProfissionais(data);
      }

      if (lojasImportadasStr) {
        const lojasData = JSON.parse(lojasImportadasStr);
        setLojas(lojasData);
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Converter salário string para número
  const parseSalario = (salarioStr: string): number => {
    if (!salarioStr) return 0;
    const numeroLimpo = salarioStr
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    return parseFloat(numeroLimpo) || 0;
  };

  // Gerar dados de folha de pagamento
  const getFolhaPagamento = () => {
    return profissionais.map(prof => {
      const salarioBase = parseSalario(prof.salarioReceber || prof.salarioCTPS);
      const adiantamentoDia20 = salarioBase * 0.4;
      const descontos = {
        inss: salarioBase * 0.11,
        valeTransporte: salarioBase * 0.06,
        pensao: prof.pensao === 'SIM' ? salarioBase * 0.30 : 0,
      };
      const totalDescontos = descontos.inss + descontos.valeTransporte + descontos.pensao;
      const liquido = salarioBase - totalDescontos;

      return {
        matricula: prof.matricula,
        nome: prof.nome,
        cargo: prof.cargo,
        loja: prof.localTrabalho,
        salarioBase,
        adiantamentoDia20,
        descontos,
        totalDescontos,
        liquido,
      };
    });
  };

  // Agrupar por loja
  const getProfissionaisPorLoja = () => {
    const agrupado: Record<string, ProfissionalImportado[]> = {};
    
    profissionais.forEach(prof => {
      const loja = prof.localTrabalho || 'Sem Loja';
      if (!agrupado[loja]) {
        agrupado[loja] = [];
      }
      agrupado[loja].push(prof);
    });

    return agrupado;
  };

  // Estatísticas por loja
  const getEstatisticasPorLoja = () => {
    const porLoja = getProfissionaisPorLoja();
    
    return Object.entries(porLoja).map(([loja, profs]) => {
      const totalSalarios = profs.reduce((sum, p) => {
        return sum + parseSalario(p.salarioReceber || p.salarioCTPS);
      }, 0);

      const mediaSalarial = totalSalarios / profs.length;

      return {
        loja,
        totalProfissionais: profs.length,
        totalSalarios,
        mediaSalarial,
        profissionais: profs,
      };
    }).sort((a, b) => b.totalProfissionais - a.totalProfissionais);
  };

  // Gerar dados de férias (mock baseado em datas de admissão)
  const getFerias = () => {
    return profissionais.slice(0, 30).map((prof, index) => {
      const dataAdmissao = new Date(prof.admissaoCTPS || '2020-01-01');
      const hoje = new Date();
      const diasTrabalhados = Math.floor((hoje.getTime() - dataAdmissao.getTime()) / (1000 * 60 * 60 * 24));
      const diasFerias = Math.min(30, Math.floor(diasTrabalhados / 365 * 30));

      // Distribuir entre vencendo, vencidas e agendadas
      let status: 'vencendo' | 'vencida' | 'agendada' = 'vencendo';
      if (index % 3 === 0) status = 'vencida';
      if (index % 3 === 1) status = 'agendada';

      return {
        matricula: prof.matricula,
        nome: prof.nome,
        loja: prof.localTrabalho,
        dataAdmissao: prof.admissaoCTPS,
        diasDisponiveis: diasFerias,
        periodoAquisitivo: `01/01/${new Date().getFullYear()} - 31/12/${new Date().getFullYear()}`,
        status,
        dataVencimento: status === 'vencida' ? '2024-12-01' : '2025-06-30',
      };
    });
  };

  // Gerar dados de faltas (mock aleatório)
  const getFaltas = () => {
    return profissionais.slice(0, 40).map((prof, index) => {
      const faltas = Math.floor(Math.random() * 8);
      const faltasJustificadas = Math.floor(faltas * 0.6);
      const faltasInjustificadas = faltas - faltasJustificadas;

      return {
        matricula: prof.matricula,
        nome: prof.nome,
        loja: prof.localTrabalho,
        cargo: prof.cargo,
        totalFaltas: faltas,
        faltasJustificadas,
        faltasInjustificadas,
        ultimaFalta: faltas > 0 ? '2024-11-25' : null,
      };
    });
  };

  // Gerar dados de exames ASO
  const getExamesASO = () => {
    return profissionais.slice(0, 50).map((prof, index) => {
      const ultimoExame = new Date();
      ultimoExame.setMonth(ultimoExame.getMonth() - Math.floor(Math.random() * 12));
      
      const proximoExame = new Date(ultimoExame);
      proximoExame.setMonth(proximoExame.getMonth() + (index % 2 === 0 ? 6 : 12));
      
      const hoje = new Date();
      const diasParaVencer = Math.floor((proximoExame.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: 'regular' | 'vencendo' | 'vencido' = 'regular';
      if (diasParaVencer < 0) status = 'vencido';
      else if (diasParaVencer <= 30) status = 'vencendo';

      return {
        matricula: prof.matricula,
        nome: prof.nome,
        loja: prof.localTrabalho,
        cargo: prof.cargo,
        ultimoExame: ultimoExame.toISOString().split('T')[0],
        proximoExame: proximoExame.toISOString().split('T')[0],
        tipoExame: index % 2 === 0 ? 'Periódico' : 'Anual',
        status,
        diasParaVencer,
      };
    });
  };

  // Gerar alertas baseados nos dados
  const getAlertas = () => {
    const alertas = [];
    const exames = getExamesASO();
    const ferias = getFerias();

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
    ferias.filter(f => f.status === 'vencida').forEach(feria => {
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

  return {
    profissionais,
    lojas,
    isLoading,
    hasMockData: profissionais.length > 0,
    
    // Funções utilitárias
    parseSalario,
    
    // Dados calculados
    getFolhaPagamento,
    getProfissionaisPorLoja,
    getEstatisticasPorLoja,
    getFerias,
    getFaltas,
    getExamesASO,
    getAlertas,
    
    // Estatísticas gerais
    totalProfissionais: profissionais.length,
    totalLojas: lojas.length,
    totalSalarios: profissionais.reduce((sum, p) => {
      return sum + parseSalario(p.salarioReceber || p.salarioCTPS);
    }, 0),
  };
};
