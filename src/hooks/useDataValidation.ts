import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DataInconsistency {
  id: string;
  tipo: 'cargo_ausente' | 'salario_divergente' | 'loja_divergente' | 'vt_inconsistente' | 'dados_incompletos' | 'duplicado';
  severidade: 'alta' | 'media' | 'baixa';
  matricula: string;
  nome: string;
  campo: string;
  valorBanco: string | number | null;
  valorExibido?: string | number | null;
  mensagem: string;
  sugestaoCorrecao?: string;
}

export interface ValidationResult {
  isValid: boolean;
  inconsistencias: DataInconsistency[];
  ultimaValidacao: Date | null;
  totalProfissionais: number;
  profissionaisComProblemas: number;
}

interface ProfissionalDB {
  id: string;
  matricula: string;
  nome: string;
  cargo: string | null;
  loja_id: string | null;
  salario_nominal: number | null;
  primeiro_salario: number | null;
  ultimo_salario: number | null;
  vale_transporte: boolean | null;
  vale_refeicao: boolean | null;
  cesta_basica: boolean | null;
  valor_diario_rota: number | null;
  status: string | null;
  lojas?: { nome: string } | null;
}

export const useDataValidation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    inconsistencias: [],
    ultimaValidacao: null,
    totalProfissionais: 0,
    profissionaisComProblemas: 0,
  });

  const validarDados = useCallback(async () => {
    setIsLoading(true);
    const inconsistencias: DataInconsistency[] = [];

    try {
      // Buscar todos os profissionais ativos do banco
      const { data: profissionais, error } = await supabase
        .from('profissionais')
        .select('*, lojas:lojas!profissionais_loja_id_fkey(nome)')
        .eq('status', 'ativo');

      if (error) throw error;

      const profissionaisData = profissionais as ProfissionalDB[];

      // Verificar duplicados por matrícula
      const matriculaCount = new Map<string, ProfissionalDB[]>();
      profissionaisData.forEach(p => {
        const existing = matriculaCount.get(p.matricula) || [];
        existing.push(p);
        matriculaCount.set(p.matricula, existing);
      });

      matriculaCount.forEach((profs, matricula) => {
        if (profs.length > 1) {
          profs.forEach(p => {
            inconsistencias.push({
              id: `dup-${p.id}`,
              tipo: 'duplicado',
              severidade: 'alta',
              matricula: p.matricula,
              nome: p.nome,
              campo: 'matricula',
              valorBanco: matricula,
              mensagem: `Matrícula ${matricula} duplicada (${profs.length} registros)`,
              sugestaoCorrecao: 'Remover registros duplicados mantendo apenas um',
            });
          });
        }
      });

      // Validar cada profissional
      profissionaisData.forEach(p => {
        // 1. Cargo ausente ou inválido
        if (!p.cargo || p.cargo.trim() === '') {
          inconsistencias.push({
            id: `cargo-${p.id}`,
            tipo: 'cargo_ausente',
            severidade: 'media',
            matricula: p.matricula,
            nome: p.nome,
            campo: 'cargo',
            valorBanco: p.cargo,
            mensagem: 'Cargo não definido no cadastro',
            sugestaoCorrecao: 'Atualizar cadastro com o cargo correto',
          });
        }

        // 2. Salário zerado ou ausente
        const salario = p.salario_nominal || p.ultimo_salario || p.primeiro_salario;
        if (!salario || salario <= 0) {
          inconsistencias.push({
            id: `salario-${p.id}`,
            tipo: 'salario_divergente',
            severidade: 'alta',
            matricula: p.matricula,
            nome: p.nome,
            campo: 'salario',
            valorBanco: salario,
            mensagem: 'Salário não definido ou zerado',
            sugestaoCorrecao: 'Definir salário nominal no cadastro',
          });
        }

        // 3. Salário abaixo do mínimo (assumindo R$ 1.412)
        if (salario && salario < 1412) {
          inconsistencias.push({
            id: `salario-min-${p.id}`,
            tipo: 'salario_divergente',
            severidade: 'media',
            matricula: p.matricula,
            nome: p.nome,
            campo: 'salario',
            valorBanco: salario,
            mensagem: `Salário (R$ ${salario.toFixed(2)}) abaixo do mínimo federal`,
            sugestaoCorrecao: 'Verificar se o valor está correto',
          });
        }

        // 4. VT ativo mas sem valor diário
        if (p.vale_transporte === true && (!p.valor_diario_rota || p.valor_diario_rota <= 0)) {
          inconsistencias.push({
            id: `vt-${p.id}`,
            tipo: 'vt_inconsistente',
            severidade: 'media',
            matricula: p.matricula,
            nome: p.nome,
            campo: 'valor_diario_rota',
            valorBanco: p.valor_diario_rota,
            mensagem: 'VT ativo mas valor diário não definido',
            sugestaoCorrecao: 'Definir valor_diario_rota ou desativar VT',
          });
        }

        // 5. Loja não definida
        if (!p.loja_id) {
          inconsistencias.push({
            id: `loja-${p.id}`,
            tipo: 'loja_divergente',
            severidade: 'baixa',
            matricula: p.matricula,
            nome: p.nome,
            campo: 'loja_id',
            valorBanco: p.loja_id,
            mensagem: 'Profissional sem loja vinculada',
            sugestaoCorrecao: 'Vincular profissional a uma loja',
          });
        }

        // 6. Dados incompletos críticos
        const camposObrigatorios = [
          { campo: 'nome', valor: p.nome },
          { campo: 'matricula', valor: p.matricula },
        ];

        camposObrigatorios.forEach(({ campo, valor }) => {
          if (!valor || String(valor).trim() === '') {
            inconsistencias.push({
              id: `incompleto-${p.id}-${campo}`,
              tipo: 'dados_incompletos',
              severidade: 'alta',
              matricula: p.matricula || 'N/D',
              nome: p.nome || 'N/D',
              campo,
              valorBanco: valor,
              mensagem: `Campo obrigatório "${campo}" não preenchido`,
              sugestaoCorrecao: `Preencher o campo ${campo}`,
            });
          }
        });
      });

      // Contar profissionais únicos com problemas
      const profissionaisComProblemas = new Set(
        inconsistencias.map(i => i.matricula)
      ).size;

      setValidationResult({
        isValid: inconsistencias.length === 0,
        inconsistencias,
        ultimaValidacao: new Date(),
        totalProfissionais: profissionaisData.length,
        profissionaisComProblemas,
      });

    } catch (error) {
      console.error('Erro ao validar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validar profissional específico contra o banco
  const validarProfissional = useCallback(async (matricula: string): Promise<DataInconsistency[]> => {
    const inconsistencias: DataInconsistency[] = [];

    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*, lojas:lojas!profissionais_loja_id_fkey(nome)')
        .eq('matricula', matricula);

      if (error) throw error;

      if (!data || data.length === 0) {
        inconsistencias.push({
          id: `notfound-${matricula}`,
          tipo: 'dados_incompletos',
          severidade: 'alta',
          matricula,
          nome: 'N/D',
          campo: 'registro',
          valorBanco: null,
          mensagem: 'Profissional não encontrado no banco de dados',
        });
        return inconsistencias;
      }

      if (data.length > 1) {
        inconsistencias.push({
          id: `dup-${matricula}`,
          tipo: 'duplicado',
          severidade: 'alta',
          matricula,
          nome: data[0].nome,
          campo: 'matricula',
          valorBanco: matricula,
          mensagem: `Encontrados ${data.length} registros com a mesma matrícula`,
          sugestaoCorrecao: 'Remover registros duplicados',
        });
      }

      const p = data[0] as ProfissionalDB;

      if (!p.cargo) {
        inconsistencias.push({
          id: `cargo-${p.id}`,
          tipo: 'cargo_ausente',
          severidade: 'media',
          matricula: p.matricula,
          nome: p.nome,
          campo: 'cargo',
          valorBanco: p.cargo,
          mensagem: 'Cargo não definido',
        });
      }

      const salario = p.salario_nominal || p.ultimo_salario || p.primeiro_salario;
      if (!salario || salario <= 0) {
        inconsistencias.push({
          id: `salario-${p.id}`,
          tipo: 'salario_divergente',
          severidade: 'alta',
          matricula: p.matricula,
          nome: p.nome,
          campo: 'salario',
          valorBanco: salario,
          mensagem: 'Salário não definido',
        });
      }

    } catch (error) {
      console.error('Erro ao validar profissional:', error);
    }

    return inconsistencias;
  }, []);

  // Executar validação inicial
  useEffect(() => {
    validarDados();
  }, [validarDados]);

  return {
    isLoading,
    validationResult,
    validarDados,
    validarProfissional,
    inconsistencias: validationResult.inconsistencias,
    hasInconsistencias: validationResult.inconsistencias.length > 0,
  };
};

// Função utilitária para comparar valores exibidos com banco
export const compararValorExibido = (
  valorExibido: string | number | null | undefined,
  valorBanco: string | number | null | undefined,
  campo: string
): { isConsistent: boolean; mensagem?: string } => {
  // Normalizar valores
  const normalizar = (v: any) => {
    if (v === null || v === undefined || v === 'N/D' || v === '-') return null;
    if (typeof v === 'string') return v.trim().toUpperCase();
    return v;
  };

  const exibido = normalizar(valorExibido);
  const banco = normalizar(valorBanco);

  if (exibido === banco) {
    return { isConsistent: true };
  }

  // Se banco tem valor mas exibido não
  if (banco !== null && exibido === null) {
    return {
      isConsistent: false,
      mensagem: `${campo}: valor do banco "${banco}" não está sendo exibido`,
    };
  }

  // Se exibido tem valor diferente do banco
  if (banco !== null && exibido !== null && banco !== exibido) {
    return {
      isConsistent: false,
      mensagem: `${campo}: exibindo "${exibido}" mas banco tem "${banco}"`,
    };
  }

  return { isConsistent: true };
};
