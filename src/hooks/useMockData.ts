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
  const parseSalario = (salarioStr: string | number | undefined | null): number => {
    if (!salarioStr) return 0;
    
    // Se já for número, retorna direto
    if (typeof salarioStr === 'number') return salarioStr;
    
    // Converte para string se não for
    const strValue = String(salarioStr);
    
    const numeroLimpo = strValue
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
    // Tentar carregar dados reais do BASE_ASO.xlsx
    const dadosASOStr = localStorage.getItem('dadosASO');
    if (dadosASOStr) {
      try {
        const dadosASO = JSON.parse(dadosASOStr);
        console.log(`✅ Usando ${dadosASO.length} registros reais de ASO da BASE_ASO.xlsx`);
        
        return dadosASO.map((aso: any) => {
          const proximoExame = aso.proxExame && aso.proxExame !== 'NR' ? new Date(aso.proxExame) : null;
          const hoje = new Date();
          
          let diasParaVencer = 0;
          let status: 'regular' | 'vencendo' | 'vencido' = 'regular';
          
          if (proximoExame) {
            diasParaVencer = Math.floor((proximoExame.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
            if (diasParaVencer < 0) status = 'vencido';
            else if (diasParaVencer <= 30) status = 'vencendo';
          }
          
          return {
            matricula: aso.matricula,
            nome: aso.nome,
            loja: aso.localTrabalho,
            cargo: aso.cargo,
            ultimoExame: aso.ultimoASO || 'N/A',
            proximoExame: aso.proxASO || 'N/A',
            tipoExame: status === 'vencido' ? 'Vencido' : 'Periódico',
            status,
            diasParaVencer,
          };
        });
      } catch (error) {
        console.error('❌ Erro ao carregar dados ASO do localStorage:', error);
      }
    }
    
    console.log('⚠️ Usando dados simulados de ASO (BASE_ASO.xlsx não carregado)');
    // Fallback para dados gerados
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

  // Gerar dados de afastamentos
  const getAfastamentos = () => {
    return profissionais.slice(0, 25).map((prof, index) => {
      const motivos = ['ACIDENTE_TRABALHO', 'ACIDENTE_TRAJETO', 'DOENCA', 'LICENCA_MATERNIDADE', 'LICENCA_PATERNIDADE', 'OUTROS'];
      const status = ['ATIVO', 'FINALIZADO', 'AGUARDANDO_PERICIA'];
      
      const motivo = motivos[index % motivos.length];
      const statusAfastamento = status[index % status.length];
      
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - Math.floor(Math.random() * 90));
      
      const dataPericia = new Date(dataInicio);
      dataPericia.setDate(dataPericia.getDate() + 30);
      
      return {
        id: `${prof.matricula}-${index}`,
        matricula: prof.matricula,
        nome: prof.nome,
        loja: prof.localTrabalho,
        motivo,
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataPericia: statusAfastamento === 'AGUARDANDO_PERICIA' ? dataPericia.toISOString().split('T')[0] : undefined,
        dataFim: statusAfastamento === 'FINALIZADO' ? new Date().toISOString().split('T')[0] : undefined,
        status: statusAfastamento,
        observacao: motivo === 'LICENCA_MATERNIDADE' ? 'Recebe 40% no dia 20' : undefined,
      };
    });
  };

  // Gerar dados de benefícios
  const getBeneficios = () => {
    // Tentar carregar dados reais do BASE_Beneficios.xlsx
    const dadosBeneficiosStr = localStorage.getItem('dadosBeneficios');
    if (dadosBeneficiosStr) {
      try {
        const dadosBeneficios = JSON.parse(dadosBeneficiosStr);
        console.log(`✅ Usando ${dadosBeneficios.length} registros reais de Benefícios da BASE_Beneficios.xlsx`);
        
        return dadosBeneficios.map((ben: any) => {
          const parseValor = (valor: any): number => {
            if (!valor) return 0;
            if (typeof valor === 'number') return valor;
            const valorStr = String(valor).replace(/[R$\s.]/g, '').replace(',', '.');
            return parseFloat(valorStr) || 0;
          };
          
          const valorDiario = parseValor(ben.valorDiario);
          const escala = '6x1'; // Padrão
          const diasUteis = escala === '6x1' ? 26 : 22;
          
          const valorVT = valorDiario * diasUteis;
          const valorVR = ben.vr === 'SIM' ? 25 * diasUteis : 0;
          const cestaBasica = ben.cestaBasica === 'SIM' ? 150 : 0;
          
          return {
            matricula: ben.matricula,
            nome: ben.nome,
            loja: ben.localTrabalho,
            escala,
            diasUteis,
            diasTrabalhados: diasUteis,
            valorVT,
            valorVR,
            cestaBasica,
            temCestaBasica: ben.cestaBasica === 'SIM',
          };
        });
      } catch (error) {
        console.error('❌ Erro ao carregar dados Benefícios do localStorage:', error);
      }
    }
    
    console.log('⚠️ Usando dados simulados de Benefícios (BASE_Beneficios.xlsx não carregado)');
    // Fallback para dados gerados
    return profissionais.map((prof) => {
      const escala = prof.escala || '6x1';
      const diasUteis = escala === '6x1' ? 26 : 22;
      const valorPassagem = 4.40;
      const valorVR = 25.00;
      const valorCestaBasica = 150.00;
      
      const faltas = Math.floor(Math.random() * 3);
      const temCestaBasica = faltas === 0;
      
      const diasTrabalhados = Math.max(0, diasUteis - faltas);
      const valorVT = diasTrabalhados * 2 * valorPassagem;
      const valorVRTotal = diasTrabalhados * valorVR;
      
      return {
        matricula: prof.matricula,
        nome: prof.nome,
        loja: prof.localTrabalho,
        escala,
        diasUteis,
        diasTrabalhados,
        valorVT,
        valorVR: valorVRTotal,
        cestaBasica: temCestaBasica ? valorCestaBasica : 0,
        temCestaBasica,
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
    getAfastamentos,
    getBeneficios,
    getAlertas,
    
    // Estatísticas gerais
    totalProfissionais: profissionais.length,
    totalLojas: lojas.length,
    totalSalarios: profissionais.reduce((sum, p) => {
      return sum + parseSalario(p.salarioReceber || p.salarioCTPS);
    }, 0),
  };
};
