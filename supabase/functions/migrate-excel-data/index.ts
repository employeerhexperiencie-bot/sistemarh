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
  nascimento?: string; // Campo alternativo do ATIVOS.xlsx
  sexo?: string;
  genero?: string; // Campo alternativo
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
  admissaoCTPS?: string; // Campo do ATIVOS.xlsx
  inicioLoja?: string; // Campo alternativo
  cbo?: string;
  cracha?: string;
  primeiroSalario?: number;
  ultimoSalario?: number;
  salarioNominal?: number;
  salarioCTPS?: string; // Campo do ATIVOS.xlsx
  salarioReceber?: string; // Campo do ATIVOS.xlsx
  cestaBasica?: boolean | string;
  valeTransporte?: boolean | string;
  valeRefeicao?: boolean | string;
  sindicato?: string;
  pensaoAlimenticia?: number;
  pensao?: string; // Campo alternativo
  valorDiarioRota?: number;
  cnh?: string;
  categoriaCnh?: string;
  categoria?: string; // Campo alternativo
  validadeCnh?: string;
  dataVlCNH?: string; // Campo alternativo
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

interface BeneficioData {
  matricula: string;
  nome?: string;
  vtVc?: string;
  vr?: string;
  cestaBasica?: string;
  valorDiario?: any;
  inicioLoja?: string;
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
    const { profissionais, lojas, examesASO, beneficios, ferias, faltas, afastamentos, emprestimos } = await req.json();

    console.log(`Iniciando migração: ${lojas?.length || 0} lojas fornecidas, ${profissionais?.length || 0} profissionais`);
    console.log(`Dados adicionais: ${beneficios?.length || 0} benefícios, ${ferias?.length || 0} férias, ${faltas?.length || 0} faltas, ${afastamentos?.length || 0} afastamentos, ${emprestimos?.length || 0} empréstimos`);

    const results = {
      lojas: { inserted: 0, errors: [] as string[] },
      profissionais: { inserted: 0, errors: [] as string[], warnings: [] as string[] },
      examesASO: { inserted: 0, errors: [] as string[] },
      beneficios: { inserted: 0, errors: [] as string[] },
      ferias: { inserted: 0, errors: [] as string[] },
      faltas: { inserted: 0, errors: [] as string[] },
      afastamentos: { inserted: 0, errors: [] as string[] },
      emprestimos: { inserted: 0, errors: [] as string[] },
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

    // Função para converter SIM/NÃO em boolean
    const parseBoolean = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (!value) return false;
      const str = String(value).toUpperCase().trim();
      return str === 'SIM' || str === 'S' || str === '1' || str === 'TRUE' || str === 'YES';
    };

    // Função para parsear datas do Excel (pode ser número serial ou string)
    const parseExcelDate = (value: any): string | null => {
      if (!value) return null;
      
      // Se for string vazia
      if (typeof value === 'string' && value.trim() === '') return null;
      
      // Se já for uma string de data válida
      if (typeof value === 'string') {
        // Tentar parsear como data ISO ou dd/mm/yyyy
        const dateStr = value.trim();
        
        // Formato dd/mm/yyyy
        const brMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (brMatch) {
          const [, day, month, year] = brMatch;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Formato yyyy-mm-dd
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        
        // Tentar parsear como data genérica
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch {
          // Ignorar erro
        }
        
        return null;
      }
      
      // Se for número (serial date do Excel)
      if (typeof value === 'number') {
        // Excel armazena datas como número de dias desde 01/01/1900
        // Mas há um bug: Excel considera 1900 como ano bissexto
        const date = new Date((value - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      return null;
    };

    // Criar mapa de benefícios por matrícula para cruzamento
    const beneficiosMap = new Map<string, BeneficioData>();
    if (beneficios && Array.isArray(beneficios)) {
      for (const ben of beneficios) {
        if (ben.matricula) {
          const matriculaNorm = String(ben.matricula).trim();
          beneficiosMap.set(matriculaNorm, ben);
          console.log(`Benefício mapeado: ${matriculaNorm} -> VT:${ben.vtVc}, VR:${ben.vr}, Cesta:${ben.cestaBasica}`);
        }
      }
      console.log(`Total de benefícios mapeados: ${beneficiosMap.size}`);
    }

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
        const salario = parseSalario(prof.salarioReceber) ||
                        parseSalario(prof.salarioNominal) || 
                        parseSalario(prof.ultimoSalario) || 
                        parseSalario(prof.primeiroSalario) ||
                        null;
        
        // salarioCTPS é o salário registrado em carteira (armazenar separadamente)
        const salarioCTPS = parseSalario(prof.salarioCTPS) || null;
        
        if (!salario) {
          results.profissionais.warnings.push(`${prof.nome} (${matricula}): sem salário definido`);
        }

        // Determinar data de admissão (verificar múltiplos campos)
        const dataAdmissao = parseExcelDate(prof.dataAdmissao) || 
                            parseExcelDate(prof.admissaoCTPS) || 
                            parseExcelDate(prof.inicioLoja) || 
                            null;
        
        if (!dataAdmissao) {
          results.profissionais.warnings.push(`${prof.nome} (${matricula}): sem data de admissão`);
        } else {
          console.log(`Data admissão para ${matricula}: ${dataAdmissao} (fonte: ${prof.dataAdmissao || prof.admissaoCTPS || prof.inicioLoja})`);
        }

        // Buscar benefícios no mapa de cruzamento
        const beneficioProf = beneficiosMap.get(String(matricula).trim());
        
        // Determinar flags de benefícios - priorizar dados já passados pelo frontend
        let temVT = parseBoolean(prof.valeTransporte);
        let temVR = parseBoolean(prof.valeRefeicao);
        let temCesta = parseBoolean(prof.cestaBasica);
        let valorDiarioRota = prof.valorDiarioRota || null;
        
        // Se houver dados de benefícios no mapa, usar como fallback
        if (beneficioProf) {
          if (!temVT) temVT = beneficioProf.vtVc === 'OPTANTE';
          if (!temVR) temVR = beneficioProf.vr === 'SIM';
          if (!temCesta) temCesta = beneficioProf.cestaBasica === 'SIM';
          if (!valorDiarioRota && beneficioProf.valorDiario) {
            valorDiarioRota = typeof beneficioProf.valorDiario === 'number' 
              ? beneficioProf.valorDiario 
              : parseFloat(String(beneficioProf.valorDiario).replace(/[R$\s.]/g, '').replace(',', '.')) || null;
          }
          console.log(`Benefícios para ${matricula}: VT=${temVT}, VR=${temVR}, Cesta=${temCesta}, ValorRota=${valorDiarioRota}`);
        }

        // Determinar data de nascimento
        const dataNascimento = parseExcelDate(prof.dataNascimento) || 
                              parseExcelDate(prof.nascimento) || 
                              null;

        // Determinar validade CNH
        const validadeCnh = parseExcelDate(prof.validadeCnh) || 
                           parseExcelDate(prof.dataVlCNH) || 
                           null;

        // Parsear pensão alimentícia
        const pensao = parseSalario(prof.pensaoAlimenticia) || parseSalario(prof.pensao) || null;

        const { data, error } = await supabase
          .from('profissionais')
          .upsert({
            matricula: matricula,
            nome: prof.nome,
            cpf: prof.cpf || null,
            rg: prof.rg || null,
            data_nascimento: dataNascimento,
            sexo: prof.sexo || prof.genero || null,
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
            data_admissao: dataAdmissao,
            cbo: prof.cbo || null,
            cracha: prof.cracha || null,
            primeiro_salario: salarioCTPS || prof.primeiroSalario || null,
            ultimo_salario: prof.ultimoSalario || null,
            salario_nominal: salario,
            cesta_basica: temCesta,
            vale_transporte: temVT,
            vale_refeicao: temVR,
            sindicato: prof.sindicato || null,
            pensao_alimenticia: pensao,
            valor_diario_rota: valorDiarioRota,
            cnh: prof.cnh || null,
            categoria_cnh: prof.categoriaCnh || prof.categoria || null,
            validade_cnh: validadeCnh,
            data_demissao: parseExcelDate(prof.dataDemissao),
            motivo_demissao: prof.motivoDemissao || null,
            aviso_trabalhado: prof.avisoTrabalhado || null,
            data_homologacao: parseExcelDate(prof.dataHomologacao),
            local_homologacao: prof.localHomologacao || null,
            data_cumprir_aviso: parseExcelDate(prof.dataCumprirAviso),
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
      console.log(`Processando ${examesASO.length} registros de ASO...`);
      
      for (const exame of examesASO) {
        // Buscar por matrícula primeiro, depois por nome
        let profId = null;
        
        if (exame.matricula) {
          const { data } = await supabase
            .from('profissionais')
            .select('id')
            .eq('matricula', String(exame.matricula).trim())
            .maybeSingle();
          if (data) profId = data.id;
        }
        
        if (!profId && exame.nome) {
          const { data } = await supabase
            .from('profissionais')
            .select('id')
            .ilike('nome', `%${exame.nome.trim()}%`)
            .maybeSingle();
          if (data) profId = data.id;
        }

        if (profId) {
          // Verificar se já existe um exame para este profissional
          const { data: existingExame } = await supabase
            .from('exames_aso')
            .select('id')
            .eq('profissional_id', profId)
            .maybeSingle();
            
          const exameData = {
            profissional_id: profId,
            tipo_exame: exame.tipoExame || 'Periódico',
            data_ultimo_exame: parseExcelDate(exame.dataUltimoExame) || parseExcelDate(exame.ultimoASO),
            data_proximo_exame: parseExcelDate(exame.dataProximoExame) || parseExcelDate(exame.proxASO),
            periodicidade: exame.periodicidade || '1 ano',
            status: exame.status || exame.statusASO || 'pendente',
          };
          
          let error;
          if (existingExame) {
            // Update existing
            const result = await supabase
              .from('exames_aso')
              .update(exameData)
              .eq('id', existingExame.id);
            error = result.error;
          } else {
            // Insert new
            const result = await supabase.from('exames_aso').insert(exameData);
            error = result.error;
          }

          if (error) {
            results.examesASO.errors.push(`${exame.nome || exame.matricula}: ${error.message}`);
          } else {
            results.examesASO.inserted++;
          }
        } else {
          console.log(`ASO: profissional não encontrado - matrícula: ${exame.matricula}, nome: ${exame.nome}`);
          results.examesASO.errors.push(`${exame.nome || exame.matricula}: profissional não encontrado`);
        }
      }
      console.log(`ASO inseridos/atualizados: ${results.examesASO.inserted}`);
    }

    // 4. Inserir Benefícios mensais (se houver)
    if (beneficios && beneficios.length > 0) {
      const mesReferencia = new Date().toISOString().split('T')[0];
      
      for (const beneficio of beneficios) {
        const profId = await buscarProfissional(beneficio.cpf, beneficio.matricula, beneficio.nome);

        if (profId) {
          const { error } = await supabase.from('beneficios').insert({
            profissional_id: profId,
            mes_referencia: mesReferencia,
            valor_diario_vt: parseSalario(beneficio.valorDiario) || null,
            valor_diario_vr: 25.00,
            valor_cesta: beneficio.valorCesta || null,
            elegivel_cesta: parseBoolean(beneficio.cestaBasica),
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
          const periodoInicio = parseExcelDate(feriaItem.periodoAquisitivoInicio) || 
            parseExcelDate(feriaItem.dataAdmissao) || 
            new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0];
          
          const periodoFim = parseExcelDate(feriaItem.periodoAquisitivoFim) || 
            new Date(new Date(periodoInicio).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const { error } = await supabase.from('ferias').insert({
            profissional_id: profId,
            periodo_aquisitivo_inicio: periodoInicio,
            periodo_aquisitivo_fim: periodoFim,
            periodo_gozo_inicio: parseExcelDate(feriaItem.periodoGozoInicio),
            periodo_gozo_fim: parseExcelDate(feriaItem.periodoGozoFim),
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
            data_falta: parseExcelDate(falta.dataFalta) || parseExcelDate(falta.data),
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
            data_inicio: parseExcelDate(afastamento.dataInicio) || parseExcelDate(afastamento.data),
            data_prevista_retorno: parseExcelDate(afastamento.dataPrevistaRetorno),
            data_retorno_efetivo: parseExcelDate(afastamento.dataRetornoEfetivo),
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

    // 8. Inserir Empréstimos (se houver)
    if (emprestimos && emprestimos.length > 0) {
      console.log(`Processando ${emprestimos.length} registros de empréstimos...`);
      
      for (const emp of emprestimos) {
        // Buscar profissional por matrícula ou nome
        let profId = null;
        
        if (emp.matricula) {
          const { data } = await supabase
            .from('profissionais')
            .select('id')
            .eq('matricula', String(emp.matricula).trim())
            .maybeSingle();
          if (data) profId = data.id;
        }
        
        if (!profId && emp.nome) {
          const { data } = await supabase
            .from('profissionais')
            .select('id')
            .ilike('nome', `%${emp.nome.trim()}%`)
            .maybeSingle();
          if (data) profId = data.id;
        }

        if (profId) {
          // Calcular data de previsão de término
          let dataPrevisaoTermino = null;
          if (emp.fimDesconto) {
            dataPrevisaoTermino = parseExcelDate(emp.fimDesconto);
          } else if (emp.inicioDesconto && emp.numeroParcelas) {
            const inicio = parseExcelDate(emp.inicioDesconto);
            if (inicio) {
              const dataFim = new Date(inicio);
              dataFim.setMonth(dataFim.getMonth() + (emp.numeroParcelas || 1));
              dataPrevisaoTermino = dataFim.toISOString().split('T')[0];
            }
          }

          const { error } = await supabase.from('emprestimos').insert({
            profissional_id: profId,
            tipo: emp.tipo || 'empresa',
            valor_total: emp.valorTotal || emp.valorParcela || 0,
            numero_parcelas: emp.numeroParcelas || 1,
            valor_parcela: emp.valorParcela || 0,
            parcelas_pagas: 0,
            saldo_devedor: emp.valorTotal || emp.valorParcela || 0,
            data_inicio: parseExcelDate(emp.inicioDesconto) || parseExcelDate(emp.dataLiberacao) || new Date().toISOString().split('T')[0],
            data_previsao_termino: dataPrevisaoTermino,
            status: emp.status || 'ativo',
            observacoes: emp.observacoes || null,
          });

          if (error) {
            results.emprestimos.errors.push(`${emp.nome || emp.matricula}: ${error.message}`);
          } else {
            results.emprestimos.inserted++;
          }
        } else {
          console.log(`Empréstimo: profissional não encontrado - matrícula: ${emp.matricula}, nome: ${emp.nome}`);
          results.emprestimos.errors.push(`${emp.nome || emp.matricula}: profissional não encontrado`);
        }
      }
      console.log(`Empréstimos inseridos: ${results.emprestimos.inserted}`);
    }

    // 9. Inserir configurações padrão do sistema
    const configuracoesDefault = [
      { chave: 'valor_diario_vr', valor: '25.00', tipo: 'numero', categoria: 'beneficios', descricao: 'Valor diário do Vale Refeição' },
      { chave: 'percentual_desconto_vt', valor: '6', tipo: 'numero', categoria: 'beneficios', descricao: 'Percentual de desconto VT em folha' },
      { chave: 'valor_cesta_basica', valor: '150.00', tipo: 'numero', categoria: 'beneficios', descricao: 'Valor da Cesta Básica' },
      { chave: 'dias_uteis_padrao', valor: '22', tipo: 'numero', categoria: 'folha', descricao: 'Dias úteis padrão por mês' },
      { chave: 'percentual_adiantamento', valor: '40', tipo: 'numero', categoria: 'folha', descricao: 'Percentual padrão de adiantamento (Dia 20)' },
    ];

    for (const config of configuracoesDefault) {
      await supabase.from('configuracoes_sistema').upsert(config, { onConflict: 'chave' });
    }

    // 10. Criar histórico de salários inicial para cada profissional inserido
    if (results.profissionais.inserted > 0) {
      const { data: profissionaisInseridos } = await supabase
        .from('profissionais')
        .select('id, matricula, salario_nominal, data_admissao')
        .not('salario_nominal', 'is', null);

      if (profissionaisInseridos) {
        for (const prof of profissionaisInseridos) {
          await supabase.from('historico_salarios').upsert({
            profissional_id: prof.id,
            salario_anterior: null,
            salario_novo: prof.salario_nominal,
            data_alteracao: prof.data_admissao || new Date().toISOString().split('T')[0],
            tipo_alteracao: 'admissao',
            motivo: 'Salário inicial de admissão',
          }, { onConflict: 'profissional_id,data_alteracao,tipo_alteracao' });
        }
      }
    }

    console.log('Migração concluída:', results);

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      message: `Migração concluída: ${results.lojas.inserted} lojas, ${results.profissionais.inserted} profissionais, ${results.examesASO.inserted} exames, ${results.beneficios.inserted} benefícios, ${results.ferias.inserted} férias, ${results.faltas.inserted} faltas, ${results.afastamentos.inserted} afastamentos, ${results.emprestimos.inserted} empréstimos`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na migração:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper para parsear salário (disponibilizado no escopo global para uso interno)
function parseSalario(valor: any): number | null {
  if (!valor) return null;
  if (typeof valor === 'number') return valor;
  const strValue = String(valor).replace(/[R$\s.]/g, '').replace(',', '.');
  const parsed = parseFloat(strValue);
  return isNaN(parsed) ? null : parsed;
}
