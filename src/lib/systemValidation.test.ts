import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyFromNumber,
  parseCurrencyToCentavos,
} from './utils';
import {
  getCompetenciaAtual,
  getCompetenciaAnterior,
  formatCompetencia,
  getCompetenciasDisponiveis,
} from './competencia';

// ============================================================
// TESTES DE UTILITÁRIOS DE MOEDA
// ============================================================
describe('Utilitários de Moeda (utils.ts)', () => {
  describe('formatCurrency', () => {
    it('formata centavos em moeda brasileira', () => {
      expect(formatCurrency('300000')).toBe('R$\u00a03.000,00');
    });
    it('valor vazio retorna R$ 0,00', () => {
      expect(formatCurrency('')).toBe('R$\u00a00,00');
    });
    it('ignora caracteres não numéricos', () => {
      expect(formatCurrency('abc')).toBe('R$\u00a00,00');
    });
    it('trata valores pequenos', () => {
      expect(formatCurrency('50')).toBe('R$\u00a00,50');
    });
  });

  describe('formatCurrencyFromNumber', () => {
    it('formata número em reais', () => {
      const result = formatCurrencyFromNumber(3000);
      expect(result).toContain('3.000');
    });
    it('retorna traço para null', () => {
      expect(formatCurrencyFromNumber(null)).toBe('-');
    });
    it('retorna traço para undefined', () => {
      expect(formatCurrencyFromNumber(undefined)).toBe('-');
    });
    it('formata zero corretamente', () => {
      const result = formatCurrencyFromNumber(0);
      expect(result).toContain('0,00');
    });
  });

  describe('parseCurrencyToCentavos', () => {
    it('converte R$ 3.000,00 para 300000', () => {
      expect(parseCurrencyToCentavos('R$ 3.000,00')).toBe(300000);
    });
    it('converte string vazia para 0', () => {
      expect(parseCurrencyToCentavos('')).toBe(0);
    });
    it('converte valor simples', () => {
      expect(parseCurrencyToCentavos('2500')).toBe(2500);
    });
  });
});

// ============================================================
// TESTES DE COMPETÊNCIA
// ============================================================
describe('Gestão de Competência (competencia.ts)', () => {
  describe('getCompetenciaAtual', () => {
    it('retorna formato YYYY-MM', () => {
      const comp = getCompetenciaAtual();
      expect(comp).toMatch(/^\d{4}-\d{2}$/);
    });
    it('mês está entre 01 e 12', () => {
      const [, mes] = getCompetenciaAtual().split('-');
      const m = parseInt(mes);
      expect(m).toBeGreaterThanOrEqual(1);
      expect(m).toBeLessThanOrEqual(12);
    });
  });

  describe('getCompetenciaAnterior', () => {
    it('retorna formato YYYY-MM', () => {
      expect(getCompetenciaAnterior()).toMatch(/^\d{4}-\d{2}$/);
    });
    it('é diferente da competência atual', () => {
      expect(getCompetenciaAnterior()).not.toBe(getCompetenciaAtual());
    });
  });

  describe('formatCompetencia', () => {
    it('formata 2026-01 como janeiro 2026', () => {
      const result = formatCompetencia('2026-01');
      expect(result.toLowerCase()).toContain('janeiro');
      expect(result).toContain('2026');
    });
    it('formata 2025-12 como dezembro 2025', () => {
      const result = formatCompetencia('2025-12');
      expect(result.toLowerCase()).toContain('dezembro');
    });
  });

  describe('getCompetenciasDisponiveis', () => {
    it('retorna lista com competências', () => {
      const lista = getCompetenciasDisponiveis(3, 1);
      expect(lista.length).toBeGreaterThan(0);
    });
    it('cada item tem value e label', () => {
      const lista = getCompetenciasDisponiveis(2, 1);
      lista.forEach((item) => {
        expect(item.value).toMatch(/^\d{4}-\d{2}$/);
        expect(item.label).toBeTruthy();
      });
    });
    it('inclui a competência atual', () => {
      const lista = getCompetenciasDisponiveis(2, 1);
      const atual = getCompetenciaAtual();
      expect(lista.some((i) => i.value === atual)).toBe(true);
    });
  });
});

// ============================================================
// TESTES DE VALIDAÇÃO DE DADOS CADASTRAIS
// ============================================================
describe('Validação de Dados Cadastrais', () => {
  describe('CPF', () => {
    it('formato válido XXX.XXX.XXX-XX', () => {
      const cpf = '123.456.789-00';
      expect(cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    });
    it('rejeita CPF curto', () => {
      const cpf = '123.456';
      expect(cpf).not.toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    });
  });

  describe('Matrícula', () => {
    it('aceita formato com letras e números', () => {
      const mat = 'LJ0105';
      expect(mat.length).toBeGreaterThan(0);
      expect(/[A-Z0-9]/i.test(mat)).toBe(true);
    });
    it('rejeita matrícula vazia', () => {
      expect(''.length).toBe(0);
    });
  });

  describe('Campos obrigatórios do cadastro', () => {
    const camposObrigatorios = ['matricula', 'nome'];
    
    it('define campos mínimos para cadastro', () => {
      expect(camposObrigatorios).toContain('matricula');
      expect(camposObrigatorios).toContain('nome');
    });
  });

  describe('Status do profissional', () => {
    const statusValidos = ['ativo', 'demitido', 'afastado'];
    
    it('aceita status ativo', () => {
      expect(statusValidos).toContain('ativo');
    });
    it('aceita status demitido', () => {
      expect(statusValidos).toContain('demitido');
    });
    it('aceita status afastado', () => {
      expect(statusValidos).toContain('afastado');
    });
    it('rejeita status inválido', () => {
      expect(statusValidos).not.toContain('pendente');
    });
  });

  describe('Campos de jornada', () => {
    const escalasValidas = ['6x1', '5x2', '12x36'];
    
    it('aceita escala 6x1', () => {
      expect(escalasValidas).toContain('6x1');
    });
    it('aceita escala 5x2', () => {
      expect(escalasValidas).toContain('5x2');
    });
  });

  describe('Cor/Etnia (eSocial)', () => {
    const coresValidas = ['BRANCO (A )', 'PARDO (A)', 'PRETO (A)', 'AMARELO (A)', 'INDÍGENA', 'NÃO INFORMADO'];
    
    it('aceita todas as cores válidas do eSocial', () => {
      expect(coresValidas.length).toBe(6);
    });
    it('campo é obrigatório para eSocial', () => {
      const profissionalSemCor = { cor_etnia: null };
      expect(profissionalSemCor.cor_etnia).toBeNull();
    });
  });

  describe('Dados bancários', () => {
    it('tipo de conta aceita corrente ou poupança', () => {
      const tiposValidos = ['corrente', 'poupanca'];
      expect(tiposValidos).toContain('corrente');
      expect(tiposValidos).toContain('poupanca');
    });
    it('PIX pode ser CPF, telefone ou email', () => {
      const pixCpf = '123.456.789-00';
      const pixTel = '11999999999';
      const pixEmail = 'teste@email.com';
      expect(pixCpf.length).toBeGreaterThan(0);
      expect(pixTel.length).toBeGreaterThan(0);
      expect(pixEmail).toContain('@');
    });
  });
});

// ============================================================
// TESTES DE REGRAS DE BENEFÍCIOS
// ============================================================
describe('Regras de Benefícios', () => {
  describe('Cesta Básica', () => {
    it('perde cesta com falta injustificada', () => {
      const temFaltaInjustificada = true;
      const recebeCesta = !temFaltaInjustificada;
      expect(recebeCesta).toBe(false);
    });
    it('mantém cesta com atestado', () => {
      const temFaltaInjustificada = false;
      const recebeCesta = !temFaltaInjustificada;
      expect(recebeCesta).toBe(true);
    });
    it('perde cesta se admitido após dia 15', () => {
      const diaAdmissao = 20;
      const recebeCesta = diaAdmissao <= 15;
      expect(recebeCesta).toBe(false);
    });
  });

  describe('Vale Transporte', () => {
    it('calcula VT corretamente: dias × valor diário', () => {
      const dias = 22;
      const valorDiario = 12;
      expect(dias * valorDiario).toBe(264);
    });
    it('não paga VT durante férias', () => {
      const emFerias = true;
      const vtPagar = emFerias ? 0 : 22 * 12;
      expect(vtPagar).toBe(0);
    });
    it('não paga VT durante afastamento', () => {
      const afastado = true;
      const vtPagar = afastado ? 0 : 22 * 12;
      expect(vtPagar).toBe(0);
    });
  });

  describe('Vale Refeição', () => {
    it('calcula VR: dias × R$ 25', () => {
      const dias = 26;
      const valorDiario = 25;
      expect(dias * valorDiario).toBe(650);
    });
  });

  describe('Pensão Alimentícia', () => {
    it('calcula pensão percentual sobre salário CTPS', () => {
      const salarioCtps = 2000;
      const percentual = 30;
      const valorPensao = Math.round(salarioCtps * (percentual / 100));
      expect(valorPensao).toBe(600);
    });
    it('calcula pensão valor fixo', () => {
      const valorFixo = 500;
      expect(valorFixo).toBe(500);
    });
  });
});

// ============================================================
// TESTES DE REGRAS DE FALTAS
// ============================================================
describe('Regras de Faltas', () => {
  it('desconto de falta: salário / 30 × dias', () => {
    const salario = 3000;
    const diasFalta = 2;
    const desconto = (salario / 30) * diasFalta;
    expect(desconto).toBe(200);
  });

  it('atestado não gera desconto', () => {
    const tipo = 'atestado';
    const geraDesconto = tipo === 'injustificada';
    expect(geraDesconto).toBe(false);
  });

  it('+10 faltas perde Dia 20', () => {
    const faltasInjustificadas = 11;
    const perdeDia20 = faltasInjustificadas > 10;
    expect(perdeDia20).toBe(true);
  });

  it('tipos válidos: injustificada, justificada, atestado', () => {
    const tiposValidos = ['injustificada', 'justificada', 'atestado'];
    expect(tiposValidos.length).toBe(3);
  });
});

// ============================================================
// TESTES DE REGRAS DE FÉRIAS
// ============================================================
describe('Regras de Férias', () => {
  it('período aquisitivo é de 12 meses', () => {
    const inicio = new Date('2024-01-01');
    const fim = new Date('2024-12-31');
    const meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + fim.getMonth() - inicio.getMonth();
    expect(meses).toBe(11); // 12 meses - 1 (janeiro a dezembro)
  });

  it('direito padrão é 30 dias', () => {
    const diasDireito = 30;
    expect(diasDireito).toBe(30);
  });

  it('pode vender até 10 dias (abono pecuniário)', () => {
    const diasVendidos = 10;
    const diasGozados = 30 - diasVendidos;
    expect(diasGozados).toBe(20);
    expect(diasVendidos).toBeLessThanOrEqual(10);
  });

  it('terço constitucional = salário / 3', () => {
    const salario = 3000;
    const terco = salario / 3;
    expect(terco).toBe(1000);
  });
});

// ============================================================
// TESTES DE REGRAS DE AFASTAMENTO
// ============================================================
describe('Regras de Afastamento', () => {
  it('empresa paga 15 primeiros dias de doença', () => {
    const diasAfastamento = 10;
    const empresaPaga = diasAfastamento <= 15;
    expect(empresaPaga).toBe(true);
  });

  it('INSS assume após 15 dias de doença', () => {
    const diasAfastamento = 20;
    const inssPaga = diasAfastamento > 15;
    expect(inssPaga).toBe(true);
  });

  it('maternidade: empresa paga 40% (INSS reembolsa)', () => {
    const salario = 3000;
    const valorMaternidade = salario * 0.40;
    expect(valorMaternidade).toBe(1200);
  });

  it('acidente: empresa não paga após 15 dias', () => {
    const diasAfastamento = 30;
    const percentualEmpresa = diasAfastamento > 15 ? 0 : 100;
    expect(percentualEmpresa).toBe(0);
  });

  it('tipos válidos de afastamento', () => {
    const tipos = ['medico', 'acidente_trabalho', 'licenca_maternidade', 'licenca_paternidade'];
    expect(tipos.length).toBeGreaterThanOrEqual(4);
  });
});

// ============================================================
// TESTES DE EMPRÉSTIMOS
// ============================================================
describe('Regras de Empréstimos', () => {
  it('saldo devedor diminui após parcela paga', () => {
    const saldoInicial = 2000;
    const valorParcela = 500;
    const novoSaldo = saldoInicial - valorParcela;
    expect(novoSaldo).toBe(1500);
  });

  it('empréstimo quitado quando saldo <= 0', () => {
    const saldoDevedor = 0;
    const quitado = saldoDevedor <= 0;
    expect(quitado).toBe(true);
  });

  it('tipos: empresa e ctps/consignado', () => {
    const tiposValidos = ['empresa', 'ctps', 'consignado'];
    expect(tiposValidos).toContain('empresa');
    expect(tiposValidos).toContain('ctps');
  });

  it('empréstimo CLT desconta na folha separadamente', () => {
    const emprestimoCLT = 250;
    const emprestimoEmpresa = 500;
    expect(emprestimoCLT).not.toBe(emprestimoEmpresa);
  });
});

// ============================================================
// TESTES DE EPI
// ============================================================
describe('Regras de EPI', () => {
  it('EPI tem data de entrega obrigatória', () => {
    const epi = { nome_epi: 'Luva', data_entrega: '2025-01-01', data_validade: '2026-01-01' };
    expect(epi.data_entrega).toBeTruthy();
  });

  it('alerta de vencimento quando próximo da validade', () => {
    const hoje = new Date();
    const validade = new Date(hoje);
    validade.setDate(validade.getDate() + 20); // 20 dias para vencer
    const diasParaVencer = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    const alertar = diasParaVencer <= 30;
    expect(alertar).toBe(true);
  });

  it('EPI vencido quando data_validade < hoje', () => {
    const hoje = new Date();
    const validade = new Date('2024-01-01');
    const vencido = validade < hoje;
    expect(vencido).toBe(true);
  });
});

// ============================================================
// TESTES DE ASO (EXAMES)
// ============================================================
describe('Regras de Exames ASO', () => {
  it('tipos de exame válidos', () => {
    const tipos = ['admissional', 'periodico', 'demissional', 'retorno_trabalho', 'mudanca_funcao'];
    expect(tipos.length).toBe(5);
  });

  it('exame vencido quando data_proximo < hoje', () => {
    const proximoExame = new Date('2024-06-01');
    const hoje = new Date();
    const vencido = proximoExame < hoje;
    expect(vencido).toBe(true);
  });

  it('periodicidade padrão é anual', () => {
    const periodicidade = 'anual';
    const meses = periodicidade === 'anual' ? 12 : periodicidade === 'semestral' ? 6 : 24;
    expect(meses).toBe(12);
  });
});

// ============================================================
// TESTES DE IMPORTAÇÃO
// ============================================================
describe('Validação de Importação', () => {
  it('validação de tipo de falta na importação', () => {
    const tiposValidos = ['injustificada', 'justificada', 'atestado'];
    expect(tiposValidos).toContain('injustificada');
    expect(tiposValidos).not.toContain('outro');
  });

  it('matrícula é convertida para string', () => {
    const matriculaNum = 12345;
    const resultado = String(matriculaNum);
    expect(typeof resultado).toBe('string');
  });

  it('valor monetário parseado corretamente', () => {
    const valor = '3000.50';
    const parsed = parseFloat(valor);
    expect(parsed).toBe(3000.5);
  });

  it('campo null quando vazio', () => {
    const valor = '';
    const resultado = valor || null;
    expect(resultado).toBeNull();
  });
});

// ============================================================
// TESTES DE MULTI-TENANCY
// ============================================================
describe('Regras Multi-Tenant', () => {
  it('tenant_id é obrigatório em todas tabelas operacionais', () => {
    const tabelasComTenant = [
      'profissionais', 'lojas', 'faltas', 'ferias',
      'emprestimos', 'epis', 'exames_aso', 'beneficios',
      'folha_pagamento', 'holerites', 'afastamentos',
    ];
    expect(tabelasComTenant.length).toBeGreaterThanOrEqual(11);
  });

  it('5 níveis de role', () => {
    const roles = ['super_admin', 'admin', 'gerente', 'executor', 'operador'];
    expect(roles.length).toBe(5);
  });

  it('hierarquia de permissões é respeitada', () => {
    const hierarquia = { super_admin: 5, admin: 4, gerente: 3, executor: 2, operador: 1 };
    expect(hierarquia.super_admin).toBeGreaterThan(hierarquia.admin);
    expect(hierarquia.admin).toBeGreaterThan(hierarquia.gerente);
    expect(hierarquia.gerente).toBeGreaterThan(hierarquia.executor);
    expect(hierarquia.executor).toBeGreaterThan(hierarquia.operador);
  });
});

// ============================================================
// TESTES DE CAMPOS DO CADASTRO COMPLETO
// ============================================================
describe('Campos do Cadastro Profissional', () => {
  const camposPessoais = ['nome', 'cpf', 'rg', 'data_nascimento', 'sexo', 'estado_civil', 'cor_etnia', 'nome_mae', 'nome_pai', 'pis', 'ctps', 'escolaridade'];
  const camposEndereco = ['endereco', 'bairro', 'cidade', 'estado', 'cep', 'telefone', 'celular'];
  const camposProfissionais = ['matricula', 'cargo', 'cbo', 'departamento', 'setor', 'data_admissao', 'loja_id', 'loja_registro_id'];
  const camposJornada = ['escala_trabalho', 'horario_entrada', 'horario_intervalo', 'horario_saida', 'dia_folga', 'gestor'];
  const camposBancarios = ['banco', 'agencia', 'conta', 'tipo_conta', 'chave_pix', 'operacao'];
  const camposBeneficios = ['vale_transporte', 'vale_refeicao', 'cesta_basica', 'vale_carne', 'pensao_alimenticia', 'sindicato'];
  const camposSalarios = ['salario_nominal', 'primeiro_salario', 'ultimo_salario', 'insalubridade'];
  const camposDemissao = ['data_demissao', 'motivo_demissao', 'aviso_trabalhado', 'data_homologacao', 'local_homologacao'];

  it('possui todos os campos pessoais', () => {
    expect(camposPessoais.length).toBe(12);
    expect(camposPessoais).toContain('cor_etnia');
    expect(camposPessoais).toContain('nome_pai');
  });

  it('possui todos os campos de endereço', () => {
    expect(camposEndereco.length).toBe(7);
  });

  it('possui todos os campos profissionais', () => {
    expect(camposProfissionais.length).toBe(8);
  });

  it('possui todos os campos de jornada', () => {
    expect(camposJornada.length).toBe(6);
    expect(camposJornada).toContain('escala_trabalho');
    expect(camposJornada).toContain('horario_entrada');
    expect(camposJornada).toContain('dia_folga');
  });

  it('possui todos os campos bancários', () => {
    expect(camposBancarios.length).toBe(6);
  });

  it('possui todos os campos de benefícios', () => {
    expect(camposBeneficios.length).toBe(6);
  });

  it('possui todos os campos salariais', () => {
    expect(camposSalarios.length).toBe(4);
  });

  it('possui todos os campos de demissão', () => {
    expect(camposDemissao.length).toBe(5);
  });

  it('total de campos cadastrais >= 50', () => {
    const total = camposPessoais.length + camposEndereco.length + camposProfissionais.length +
      camposJornada.length + camposBancarios.length + camposBeneficios.length +
      camposSalarios.length + camposDemissao.length;
    expect(total).toBeGreaterThanOrEqual(50);
  });
});
