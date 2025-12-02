import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExcelProfissional {
  matricula: string;
  nome: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  sexo?: string;
  estadoCivil?: string;
  escolaridade?: string;
  pis?: string;
  ctps?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  celular?: string;
  localTrabalho?: string;
  departamento?: string;
  setor?: string;
  cargo?: string;
  dataAdmissao?: string;
  cbo?: string;
  cracha?: string;
  primeiroSalario?: number;
  ultimoSalario?: number;
  salarioNominal?: number;
  cestaBasica?: boolean;
  valeTransporte?: boolean;
  valeRefeicao?: boolean;
  sindicato?: string;
  pensaoAlimenticia?: number;
  valorDiarioRota?: number;
  cnh?: string;
  categoriaCnh?: string;
  validadeCnh?: string;
  dataDemissao?: string;
  motivoDemissao?: string;
  avisoTrabalhado?: boolean;
  dataHomologacao?: string;
  localHomologacao?: string;
  dataCumprirAviso?: string;
  status?: string;
}

interface ExcelLoja {
  id: string;
  nome: string;
  cnpj?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Receber dados do body
    const { profissionais, lojas, examesASO, beneficios, ferias, faltas, afastamentos } = await req.json();

    console.log(`Iniciando migração: ${lojas?.length || 0} lojas fornecidas, ${profissionais?.length || 0} profissionais`);
    console.log(`Dados adicionais: ${ferias?.length || 0} férias, ${faltas?.length || 0} faltas, ${afastamentos?.length || 0} afastamentos`);

    const results = {
      lojas: { inserted: 0, errors: [] as string[] },
      profissionais: { inserted: 0, errors: [] as string[], warnings: [] as string[] },
      examesASO: { inserted: 0, errors: [] as string[] },
      beneficios: { inserted: 0, errors: [] as string[] },
      ferias: { inserted: 0, errors: [] as string[] },
      faltas: { inserted: 0, errors: [] as string[] },
      afastamentos: { inserted: 0, errors: [] as string[] },
    };

    // Contador para gerar matrículas automáticas
    let autoMatriculaCounter = 1;

    // Mapa para relacionar nomes de lojas com IDs (case-insensitive)
    const lojaIdMap = new Map<string, string>();
    const lojaNomeNormalizado = new Map<string, string>(); // normalizado -> original

    // Função para normalizar nomes (remover espaços extras, lowercase)
    const normalizarNome = (nome: string) => {
      return nome.trim().toLowerCase().replace(/\s+/g, ' ');
    };

    // Função para buscar profissional por CPF ou matrícula
    const buscarProfissional = async (cpf?: string, matricula?: string, nome?: string) => {
      if (cpf) {
        const { data } = await supabase
          .from('profissionais')
          .select('id')
          .eq('cpf', cpf)
          .maybeSingle();
        if (data) return data.id;
      }
      
      if (matricula) {
        const { data } = await supabase
          .from('profissionais')
          .select('id')
          .eq('matricula', matricula)
          .maybeSingle();
        if (data) return data.id;
      }
      
      if (nome) {
        const { data } = await supabase
          .from('profissionais')
          .select('id')
          .ilike('nome', `%${nome}%`)
          .maybeSingle();
        if (data) return data.id;
      }
      
      return null;
    };

    // 1. EXTRAIR E CRIAR LOJAS a partir dos profissionais
    const lojasUnicas = new Set<string>();
    
    if (profissionais && profissionais.length > 0) {
      for (const prof of profissionais as ExcelProfissional[]) {
        if (prof.localTrabalho && prof.localTrabalho.trim()) {
          lojasUnicas.add(prof.localTrabalho.trim());
        }
      }
    }

    // Adicionar lojas fornecidas manualmente
    if (lojas && lojas.length > 0) {
      for (const loja of lojas as ExcelLoja[]) {
        if (loja.nome && loja.nome.trim()) {
          lojasUnicas.add(loja.nome.trim());
        }
      }
    }

    console.log(`Total de lojas únicas encontradas: ${lojasUnicas.size}`);
    console.log(`Lojas: ${Array.from(lojasUnicas).join(', ')}`);

    // Inserir cada loja única
    for (const nomeLoja of lojasUnicas) {
      const nomeNormalizado = normalizarNome(nomeLoja);
      
      const { data, error } = await supabase
        .from('lojas')
        .upsert({
          nome: nomeLoja,
          cnpj: null,
          endereco: null,
          telefone: null,
          email: null,
          gerente: null,
        }, {
          onConflict: 'nome',
          ignoreDuplicates: false
        })
        .select('id, nome')
        .single();

      if (error) {
        console.error(`Erro ao inserir loja ${nomeLoja}:`, error);
        results.lojas.errors.push(`${nomeLoja}: ${error.message}`);
      } else if (data) {
        results.lojas.inserted++;
        lojaIdMap.set(nomeLoja, data.id);
        lojaNomeNormalizado.set(nomeNormalizado, nomeLoja);
        console.log(`Loja criada: ${nomeLoja} -> ${data.id}`);
      }
    }

    // 2. Inserir Profissionais
    if (profissionais && profissionais.length > 0) {
      for (const prof of profissionais as ExcelProfissional[]) {
        // Gerar matrícula automática se inválida ou ausente
        let matricula = prof.matricula;
        let matriculaGerada = false;
        
        if (!matricula || matricula.trim() === '' || matricula === '00-00' || matricula.trim().length < 2) {
          // Gerar matrícula automática no formato AUTO-XXXX
          matricula = `AUTO-${String(autoMatriculaCounter).padStart(4, '0')}`;
          autoMatriculaCounter++;
          matriculaGerada = true;
          results.profissionais.warnings.push(`${prof.nome}: matrícula original inválida, gerada automaticamente: ${matricula}`);
          console.log(`Matrícula gerada para ${prof.nome}: ${matricula}`);
        }

        // Buscar ID da loja pelo nome (com matching case-insensitive)
        let lojaId = null;
        if (prof.localTrabalho && prof.localTrabalho.trim()) {
          const localNormalizado = normalizarNome(prof.localTrabalho);
          const nomeLojaOriginal = lojaNomeNormalizado.get(localNormalizado);
          lojaId = nomeLojaOriginal ? lojaIdMap.get(nomeLojaOriginal) : null;
          
          if (!lojaId) {
            // Tentar match direto também
            lojaId = lojaIdMap.get(prof.localTrabalho.trim());
          }
          
          if (!lojaId) {
            console.warn(`Loja não encontrada para profissional ${matricula}: "${prof.localTrabalho}"`);
            results.profissionais.warnings.push(`${prof.nome} (${matricula}): loja "${prof.localTrabalho}" não encontrada`);
          }
        } else {
          results.profissionais.warnings.push(`${prof.nome} (${matricula}): sem loja definida`);
        }

        // Determinar salário (verificar múltiplos campos possíveis)
        const parseSalario = (valor: any): number | null => {
          if (!valor) return null;
          if (typeof valor === 'number') return valor;
          const strValue = String(valor).replace(/[R$\s.]/g, '').replace(',', '.');
          const parsed = parseFloat(strValue);
          return isNaN(parsed) ? null : parsed;
        };
        
        // Priorizar salarioReceber como salário base (nominal)
        const salario = parseSalario((prof as any).salarioReceber) ||
                        parseSalario(prof.salarioNominal) || 
                        parseSalario(prof.ultimoSalario) || 
                        parseSalario(prof.primeiroSalario) ||
                        null;
        
        // salarioCTPS é o salário registrado em carteira (armazenar separadamente)
        const salarioCTPS = parseSalario((prof as any).salarioCTPS) || null;
        
        if (!salario) {
          results.profissionais.warnings.push(`${prof.nome} (${matricula}): sem salário definido`);
        }

        const { data, error } = await supabase
          .from('profissionais')
          .upsert({
            matricula: matricula,
            nome: prof.nome,
            cpf: prof.cpf || null,
            rg: prof.rg || null,
            data_nascimento: prof.dataNascimento || null,
            sexo: prof.sexo || null,
            estado_civil: prof.estadoCivil || null,
            escolaridade: prof.escolaridade || null,
            pis: prof.pis || null,
            ctps: prof.ctps || null,
            endereco: prof.endereco || null,
            bairro: prof.bairro || null,
            cidade: prof.cidade || null,
            estado: prof.estado || null,
            cep: prof.cep || null,
            telefone: prof.telefone || null,
            celular: prof.celular || null,
            loja_id: lojaId || null,
            departamento: prof.departamento || null,
            setor: prof.setor || null,
            cargo: prof.cargo || null,
            data_admissao: prof.dataAdmissao || null,
            cbo: prof.cbo || null,
            cracha: prof.cracha || null,
            primeiro_salario: salarioCTPS || prof.primeiroSalario || null,
            ultimo_salario: prof.ultimoSalario || null,
            salario_nominal: salario,
            cesta_basica: prof.cestaBasica || false,
            vale_transporte: prof.valeTransporte || false,
            vale_refeicao: prof.valeRefeicao || false,
            sindicato: prof.sindicato || null,
            pensao_alimenticia: prof.pensaoAlimenticia || null,
            valor_diario_rota: prof.valorDiarioRota || null,
            cnh: prof.cnh || null,
            categoria_cnh: prof.categoriaCnh || null,
            validade_cnh: prof.validadeCnh || null,
            data_demissao: prof.dataDemissao || null,
            motivo_demissao: prof.motivoDemissao || null,
            aviso_trabalhado: prof.avisoTrabalhado || null,
            data_homologacao: prof.dataHomologacao || null,
            local_homologacao: prof.localHomologacao || null,
            data_cumprir_aviso: prof.dataCumprirAviso || null,
            status: prof.status || 'ativo',
          }, {
            onConflict: 'matricula',
            ignoreDuplicates: false
          })
          .select('id, matricula, nome')
          .single();

        if (error) {
          if (error.code === '23505') {
            console.log(`Profissional ${matricula} já existe, pulando...`);
          } else {
            console.error(`Erro ao inserir profissional ${prof.nome}:`, error);
            results.profissionais.errors.push(`${matricula} - ${prof.nome}: ${error.message}`);
          }
        } else {
          results.profissionais.inserted++;
          if (results.profissionais.inserted % 50 === 0) {
            console.log(`${results.profissionais.inserted} profissionais inseridos...`);
          }
        }
      }
    }

    // 3. Inserir Exames ASO (se houver)
    if (examesASO && examesASO.length > 0) {
      for (const exame of examesASO) {
        const profId = await buscarProfissional(exame.cpf, exame.matricula, exame.nome);

        if (profId) {
          const { error } = await supabase.from('exames_aso').insert({
            profissional_id: profId,
            tipo_exame: exame.tipoExame || 'Periódico',
            data_ultimo_exame: exame.dataUltimoExame || null,
            data_proximo_exame: exame.dataProximoExame || null,
            periodicidade: exame.periodicidade || '1 ano',
            status: exame.status || 'pendente',
          });

          if (error) {
            results.examesASO.errors.push(`${exame.nome || exame.cpf}: ${error.message}`);
          } else {
            results.examesASO.inserted++;
          }
        } else {
          results.examesASO.errors.push(`${exame.nome || exame.cpf}: profissional não encontrado`);
        }
      }
    }

    // 4. Inserir Benefícios (se houver)
    if (beneficios && beneficios.length > 0) {
      const mesReferencia = new Date().toISOString().split('T')[0];
      
      for (const beneficio of beneficios) {
        const profId = await buscarProfissional(beneficio.cpf, beneficio.matricula, beneficio.nome);

        if (profId) {
          const { error } = await supabase.from('beneficios').insert({
            profissional_id: profId,
            mes_referencia: mesReferencia,
            valor_diario_vt: beneficio.valorVT || null,
            valor_diario_vr: 25.00,
            valor_cesta: beneficio.valorCesta || null,
            elegivel_cesta: beneficio.cestaBasica || false,
          });

          if (error) {
            results.beneficios.errors.push(`${beneficio.nome || beneficio.cpf}: ${error.message}`);
          } else {
            results.beneficios.inserted++;
          }
        }
      }
    }

    // 5. Inserir Férias (se houver)
    if (ferias && ferias.length > 0) {
      console.log(`Processando ${ferias.length} registros de férias...`);
      
      for (const feriaItem of ferias) {
        const profId = await buscarProfissional(feriaItem.cpf, feriaItem.matricula, feriaItem.nome);

        if (profId) {
          // Calcular período aquisitivo se não fornecido
          const periodoInicio = feriaItem.periodoAquisitivoInicio || 
            feriaItem.dataAdmissao || 
            new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0];
          
          const periodoFim = feriaItem.periodoAquisitivoFim || 
            new Date(new Date(periodoInicio).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const { error } = await supabase.from('ferias').insert({
            profissional_id: profId,
            periodo_aquisitivo_inicio: periodoInicio,
            periodo_aquisitivo_fim: periodoFim,
            periodo_gozo_inicio: feriaItem.periodoGozoInicio || null,
            periodo_gozo_fim: feriaItem.periodoGozoFim || null,
            dias_direito: feriaItem.diasDireito || 30,
            dias_vendidos: feriaItem.diasVendidos || 0,
            dias_gozados: feriaItem.diasGozados || 0,
            valor_ferias: feriaItem.valorFerias || null,
            valor_terco_constitucional: feriaItem.valorTerco || null,
            status: feriaItem.status || 'pendente',
          });

          if (error) {
            results.ferias.errors.push(`${feriaItem.nome || feriaItem.cpf}: ${error.message}`);
          } else {
            results.ferias.inserted++;
          }
        } else {
          results.ferias.errors.push(`${feriaItem.nome || feriaItem.cpf || feriaItem.matricula}: profissional não encontrado`);
        }
      }
      console.log(`Férias inseridas: ${results.ferias.inserted}`);
    }

    // 6. Inserir Faltas (se houver)
    if (faltas && faltas.length > 0) {
      console.log(`Processando ${faltas.length} registros de faltas...`);
      
      for (const falta of faltas) {
        const profId = await buscarProfissional(falta.cpf, falta.matricula, falta.nome);

        if (profId) {
          const { error } = await supabase.from('faltas').insert({
            profissional_id: profId,
            data_falta: falta.dataFalta || falta.data,
            tipo: falta.tipo || (falta.justificada ? 'justificada' : 'injustificada'),
            motivo: falta.motivo || null,
            documento_comprovante: falta.documentoComprovante || null,
          });

          if (error) {
            results.faltas.errors.push(`${falta.nome || falta.cpf}: ${error.message}`);
          } else {
            results.faltas.inserted++;
          }
        } else {
          results.faltas.errors.push(`${falta.nome || falta.cpf || falta.matricula}: profissional não encontrado`);
        }
      }
      console.log(`Faltas inseridas: ${results.faltas.inserted}`);
    }

    // 7. Inserir Afastamentos (se houver)
    if (afastamentos && afastamentos.length > 0) {
      console.log(`Processando ${afastamentos.length} registros de afastamentos...`);
      
      for (const afastamento of afastamentos) {
        const profId = await buscarProfissional(afastamento.cpf, afastamento.matricula, afastamento.nome);

        if (profId) {
          const { error } = await supabase.from('afastamentos').insert({
            profissional_id: profId,
            tipo: afastamento.tipo || 'outros',
            data_inicio: afastamento.dataInicio || afastamento.data,
            data_prevista_retorno: afastamento.dataPrevistaRetorno || null,
            data_retorno_efetivo: afastamento.dataRetornoEfetivo || null,
            motivo: afastamento.motivo || null,
            documento_comprovante: afastamento.documentoComprovante || null,
            status: afastamento.status || 'ativo',
          });

          if (error) {
            results.afastamentos.errors.push(`${afastamento.nome || afastamento.cpf}: ${error.message}`);
          } else {
            results.afastamentos.inserted++;
          }
        } else {
          results.afastamentos.errors.push(`${afastamento.nome || afastamento.cpf || afastamento.matricula}: profissional não encontrado`);
        }
      }
      console.log(`Afastamentos inseridos: ${results.afastamentos.inserted}`);
    }

    // 8. Inserir configurações padrão do sistema
    const configuracoesDefault = [
      { chave: 'percentual_vr_desconto', valor: '6.00', tipo: 'number', categoria: 'beneficios', descricao: 'Percentual de desconto do VR na folha' },
      { chave: 'valor_diario_vr', valor: '25.00', tipo: 'number', categoria: 'beneficios', descricao: 'Valor diário padrão do Vale Refeição' },
      { chave: 'dias_antecedencia_aso', valor: '30', tipo: 'number', categoria: 'alertas', descricao: 'Dias de antecedência para alertas de ASO' },
      { chave: 'dias_antecedencia_ferias', valor: '30', tipo: 'number', categoria: 'alertas', descricao: 'Dias de antecedência para alertas de férias' },
      { chave: 'percentual_day20_padrao', valor: '50', tipo: 'number', categoria: 'folha', descricao: 'Percentual padrão de adiantamento Day 20' },
    ];

    let configsInseridas = 0;
    for (const config of configuracoesDefault) {
      const { error } = await supabase.from('configuracoes_sistema').upsert(config, {
        onConflict: 'chave',
        ignoreDuplicates: false
      });
      if (!error) configsInseridas++;
    }

    console.log(`${configsInseridas} configurações inseridas`);

    // 9. Criar histórico de salários para profissionais
    const { data: profsComSalario } = await supabase
      .from('profissionais')
      .select('id, salario_nominal, data_admissao')
      .not('salario_nominal', 'is', null);

    let salariosInseridos = 0;
    if (profsComSalario && profsComSalario.length > 0) {
      for (const prof of profsComSalario) {
        const { error } = await supabase.from('historico_salarios').insert({
          profissional_id: prof.id,
          salario_anterior: null,
          salario_novo: prof.salario_nominal,
          tipo_alteracao: 'admissao',
          motivo: 'Salário inicial de admissão',
          data_alteracao: prof.data_admissao || new Date().toISOString().split('T')[0],
        });
        if (!error) salariosInseridos++;
      }
    }

    console.log(`${salariosInseridos} históricos de salário criados`);

    console.log('Migração concluída:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dados migrados com sucesso!',
        results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro na migração:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
