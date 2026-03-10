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
  nascimento?: string;
  sexo?: string;
  genero?: string;
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
  localRegistro?: string;
  departamento?: string;
  setor?: string;
  cargo?: string;
  dataAdmissao?: string;
  admissaoCTPS?: string;
  inicioLoja?: string;
  cbo?: string;
  cracha?: string;
  primeiroSalario?: number;
  ultimoSalario?: number;
  salarioNominal?: number;
  salarioCTPS?: string;
  salarioReceber?: string;
  cestaBasica?: boolean | string;
  valeTransporte?: boolean | string;
  valeRefeicao?: boolean | string;
  sindicato?: string;
  pensaoAlimenticia?: number;
  pensao?: string;
  valorDiarioRota?: number;
  cnh?: string;
  categoriaCnh?: string;
  categoria?: string;
  validadeCnh?: string;
  dataVlCNH?: string;
  dataDemissao?: string;
  motivoDemissao?: string;
  avisoTrabalhado?: boolean;
  dataHomologacao?: string;
  localHomologacao?: string;
  dataCumprirAviso?: string;
  status?: string;
  nomeMae?: string;
  nomePai?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  contaPoupanca?: string;
  pixTelefone?: string;
  pixCpf?: string;
  tipoContaDetectado?: string;
  chavePix?: string;
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
    // ============================================
    // VERIFICAÇÃO DE AUTENTICAÇÃO E AUTORIZAÇÃO
    // ============================================
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Tentativa de acesso sem autenticação');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Autenticação necessária. Faça login para continuar.' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Criar cliente com anon key para verificar o token do usuário
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Token inválido ou expirado:', authError?.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Sessão expirada. Faça login novamente.' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Criar cliente com service role para operações administrativas
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar se o usuário é admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'admin') {
      console.error(`Acesso negado para usuário ${user.email}. Role: ${roleData?.role || 'não definido'}`);
      
      // Registrar tentativa de acesso não autorizado
      await supabase.from('security_logs').insert({
        user_id: user.id,
        action: 'MIGRATION_ATTEMPT',
        resource: 'migrate-excel-data',
        success: false,
        error_message: `Acesso negado. Role do usuário: ${roleData?.role || 'não definido'}`,
        metadata: { email: user.email }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Acesso negado. Apenas administradores podem executar migrações de dados.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Migração autorizada para admin: ${user.email}`);

    // Registrar início da migração
    await supabase.from('security_logs').insert({
      user_id: user.id,
      action: 'MIGRATION_START',
      resource: 'migrate-excel-data',
      success: true,
      metadata: { email: user.email, timestamp: new Date().toISOString() }
    });

    // ============================================
    // PROCESSAMENTO DA MIGRAÇÃO
    // ============================================

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

    let autoMatriculaCounter = 1;
    const lojaIdMap = new Map<string, string>();
    const lojaNomeNormalizado = new Map<string, string>();

  const normalizarNome = (nome: string) => {
    return nome.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  // SECURITY: Escape special characters for ILIKE patterns to prevent unintended matching
  const escapeLikePattern = (str: string): string => {
    return str.replace(/[%_\\]/g, '\\$&');
  };

    const parseBoolean = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (!value) return false;
      const str = String(value).toUpperCase().trim();
      return str === 'SIM' || str === 'S' || str === '1' || str === 'TRUE' || str === 'YES';
    };

    const parseExcelDate = (value: any): string | null => {
      if (!value) return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      
      if (typeof value === 'string') {
        const dateStr = value.trim();
        const brMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (brMatch) {
          const [, day, month, year] = brMatch;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
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
      
      if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      return null;
    };

    const beneficiosMap = new Map<string, BeneficioData>();
    if (beneficios && Array.isArray(beneficios)) {
      for (const ben of beneficios) {
        if (ben.matricula) {
          const matriculaNorm = String(ben.matricula).trim();
          beneficiosMap.set(matriculaNorm, ben);
        }
      }
      console.log(`Total de benefícios mapeados: ${beneficiosMap.size}`);
    }

    // 1. EXTRAIR E CRIAR LOJAS
    const lojasUnicas = new Set<string>();
    
    if (profissionais && profissionais.length > 0) {
      for (const prof of profissionais as ExcelProfissional[]) {
        if (prof.localTrabalho && prof.localTrabalho.trim()) {
          lojasUnicas.add(prof.localTrabalho.trim());
        }
        if (prof.localRegistro && prof.localRegistro.trim()) {
          lojasUnicas.add(prof.localRegistro.trim());
        }
      }
    }

    if (lojas && lojas.length > 0) {
      for (const loja of lojas as ExcelLoja[]) {
        if (loja.nome && loja.nome.trim()) {
          lojasUnicas.add(loja.nome.trim());
        }
      }
    }

    console.log(`Total de lojas únicas encontradas: ${lojasUnicas.size}`);

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
      }
    }

    // 2. Inserir Profissionais
    if (profissionais && profissionais.length > 0) {
      for (const prof of profissionais as ExcelProfissional[]) {
        let matricula = prof.matricula;
        
        if (!matricula || matricula.trim() === '' || matricula === '00-00' || matricula.trim().length < 2) {
          matricula = `AUTO-${String(autoMatriculaCounter).padStart(4, '0')}`;
          autoMatriculaCounter++;
          results.profissionais.warnings.push(`${prof.nome}: matrícula original inválida, gerada automaticamente: ${matricula}`);
        }

        let lojaId = null;
        if (prof.localTrabalho && prof.localTrabalho.trim()) {
          const localNormalizado = normalizarNome(prof.localTrabalho);
          const nomeLojaOriginal = lojaNomeNormalizado.get(localNormalizado);
          lojaId = nomeLojaOriginal ? lojaIdMap.get(nomeLojaOriginal) : null;
          
          if (!lojaId) {
            lojaId = lojaIdMap.get(prof.localTrabalho.trim());
          }
          
          if (!lojaId) {
            results.profissionais.warnings.push(`${prof.nome} (${matricula}): loja "${prof.localTrabalho}" não encontrada`);
          }
        } else {
          results.profissionais.warnings.push(`${prof.nome} (${matricula}): sem loja definida`);
        }

        const parseSalario = (valor: any): number | null => {
          if (!valor) return null;
          if (typeof valor === 'number') return valor;
          const strValue = String(valor).replace(/[R$\s.]/g, '').replace(',', '.');
          const parsed = parseFloat(strValue);
          return isNaN(parsed) ? null : parsed;
        };
        
        const salario = parseSalario(prof.salarioReceber) ||
                        parseSalario(prof.salarioNominal) || 
                        parseSalario(prof.ultimoSalario) || 
                        parseSalario(prof.primeiroSalario) ||
                        null;
        
        const salarioCTPS = parseSalario(prof.salarioCTPS) || null;
        
        if (!salario) {
          results.profissionais.warnings.push(`${prof.nome} (${matricula}): sem salário definido`);
        }

        const dataAdmissao = parseExcelDate(prof.dataAdmissao) || 
                            parseExcelDate(prof.admissaoCTPS) || 
                            parseExcelDate(prof.inicioLoja) || 
                            null;
        
        if (!dataAdmissao) {
          results.profissionais.warnings.push(`${prof.nome} (${matricula}): sem data de admissão`);
        }

        const beneficioProf = beneficiosMap.get(String(matricula).trim());
        
        let temVT = parseBoolean(prof.valeTransporte);
        let temVR = parseBoolean(prof.valeRefeicao);
        let temCesta = parseBoolean(prof.cestaBasica);
        let valorDiarioRota = prof.valorDiarioRota || null;
        
        if (beneficioProf) {
          if (!temVT) temVT = beneficioProf.vtVc === 'OPTANTE';
          if (!temVR) temVR = beneficioProf.vr === 'SIM';
          if (!temCesta) temCesta = beneficioProf.cestaBasica === 'SIM';
          if (!valorDiarioRota && beneficioProf.valorDiario) {
            valorDiarioRota = typeof beneficioProf.valorDiario === 'number' 
              ? beneficioProf.valorDiario 
              : parseFloat(String(beneficioProf.valorDiario).replace(/[R$\s.]/g, '').replace(',', '.')) || null;
          }
        }

        const dataNascimento = parseExcelDate(prof.dataNascimento) || 
                              parseExcelDate(prof.nascimento) || 
                              null;

        const validadeCnh = parseExcelDate(prof.validadeCnh) || 
                           parseExcelDate(prof.dataVlCNH) || 
                           null;

        const pensao = parseSalario(prof.pensaoAlimenticia) || parseSalario(prof.pensao) || null;

        // Determine bank account info
        const bancoVal = prof.banco && String(prof.banco).trim() !== '' && String(prof.banco).trim() !== 'NA' ? String(prof.banco).trim() : null;
        const agenciaVal = prof.agencia && String(prof.agencia).trim() !== '' ? String(prof.agencia).trim() : null;
        const contaCorrente = prof.conta && String(prof.conta).trim() !== '' && String(prof.conta).trim() !== 'N/A' ? String(prof.conta).trim() : null;
        const contaPoupanca = prof.contaPoupanca && String(prof.contaPoupanca).trim() !== '' && String(prof.contaPoupanca).trim() !== 'N/A' ? String(prof.contaPoupanca).trim() : null;
        const contaFinal = contaCorrente || contaPoupanca || null;
        const tipoContaFinal = contaPoupanca && !contaCorrente ? 'poupanca' : contaFinal ? 'corrente' : 'corrente';
        
        // PIX: use pixTelefone or pixCpf, whichever is available
        const pixTel = prof.pixTelefone && String(prof.pixTelefone).trim() !== '' && String(prof.pixTelefone).trim() !== 'N/A' ? String(prof.pixTelefone).trim() : null;
        const pixCpfVal = prof.pixCpf && String(prof.pixCpf).trim() !== '' && String(prof.pixCpf).trim() !== 'N/A' ? String(prof.pixCpf).trim() : null;
        const chavePix = prof.chavePix || pixTel || pixCpfVal || null;

        const { error } = await supabase
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
            nome_mae: prof.nomeMae || null,
            banco: bancoVal,
            agencia: agenciaVal,
            conta: contaFinal,
            tipo_conta: tipoContaFinal,
            chave_pix: chavePix,
          }, {
            onConflict: 'matricula',
            ignoreDuplicates: false
          });

        if (error) {
          if (error.code !== '23505') {
            console.error(`Erro ao inserir profissional ${prof.nome}:`, error);
            results.profissionais.errors.push(`${matricula} - ${prof.nome}: ${error.message}`);
          }
        } else {
          results.profissionais.inserted++;
        }
      }
    }

    // 3. Inserir Exames ASO
    if (examesASO && examesASO.length > 0) {
      for (const exame of examesASO) {
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
          // SECURITY: Escape special ILIKE characters to prevent pattern matching attacks
          const escapedName = escapeLikePattern(exame.nome.trim());
          const { data } = await supabase
            .from('profissionais')
            .select('id')
            .ilike('nome', `%${escapedName}%`)
            .maybeSingle();
          if (data) profId = data.id;
        }

        if (!profId) {
          results.examesASO.errors.push(`Exame sem profissional: ${exame.matricula || exame.nome}`);
          continue;
        }

        const { error } = await supabase
          .from('exames_aso')
          .upsert({
            profissional_id: profId,
            tipo_exame: exame.tipoExame || 'Periódico',
            data_ultimo_exame: parseExcelDate(exame.dataUltimoExame),
            data_proximo_exame: parseExcelDate(exame.dataProximoExame),
            clinica: exame.clinica || null,
            status: exame.status || 'pendente',
          }, {
            onConflict: 'profissional_id,tipo_exame',
            ignoreDuplicates: false
          });

        if (error) {
          results.examesASO.errors.push(`${exame.matricula}: ${error.message}`);
        } else {
          results.examesASO.inserted++;
        }
      }
    }

    // 4. Inserir Férias
    if (ferias && ferias.length > 0) {
      for (const fer of ferias) {
        let profId = null;
        
        if (fer.matricula) {
          const { data } = await supabase
            .from('profissionais')
            .select('id')
            .eq('matricula', String(fer.matricula).trim())
            .maybeSingle();
          if (data) profId = data.id;
        }

        if (!profId) {
          results.ferias.errors.push(`Férias sem profissional: ${fer.matricula}`);
          continue;
        }

        const { error } = await supabase
          .from('ferias')
          .insert({
            profissional_id: profId,
            periodo_aquisitivo_inicio: parseExcelDate(fer.inicioAquisitivo) || new Date().toISOString().split('T')[0],
            periodo_aquisitivo_fim: parseExcelDate(fer.fimAquisitivo) || new Date().toISOString().split('T')[0],
            periodo_gozo_inicio: parseExcelDate(fer.inicioGozo),
            periodo_gozo_fim: parseExcelDate(fer.fimGozo),
            dias_direito: fer.diasDireito || 30,
            status: fer.status || 'pendente',
          });

        if (error) {
          results.ferias.errors.push(`${fer.matricula}: ${error.message}`);
        } else {
          results.ferias.inserted++;
        }
      }
    }

    // 5. Inserir Faltas
    if (faltas && faltas.length > 0) {
      for (const falta of faltas) {
        let profId = null;
        
        if (falta.matricula) {
          const { data } = await supabase
            .from('profissionais')
            .select('id')
            .eq('matricula', String(falta.matricula).trim())
            .maybeSingle();
          if (data) profId = data.id;
        }

        if (!profId) {
          results.faltas.errors.push(`Falta sem profissional: ${falta.matricula}`);
          continue;
        }

        const { error } = await supabase
          .from('faltas')
          .insert({
            profissional_id: profId,
            data_falta: parseExcelDate(falta.data) || new Date().toISOString().split('T')[0],
            tipo: falta.tipo || 'injustificada',
            motivo: falta.motivo || null,
          });

        if (error) {
          results.faltas.errors.push(`${falta.matricula}: ${error.message}`);
        } else {
          results.faltas.inserted++;
        }
      }
    }

    // 6. Inserir Afastamentos
    if (afastamentos && afastamentos.length > 0) {
      for (const afast of afastamentos) {
        let profId = null;
        
        if (afast.matricula) {
          const { data } = await supabase
            .from('profissionais')
            .select('id')
            .eq('matricula', String(afast.matricula).trim())
            .maybeSingle();
          if (data) profId = data.id;
        }

        if (!profId) {
          results.afastamentos.errors.push(`Afastamento sem profissional: ${afast.matricula}`);
          continue;
        }

        const { error } = await supabase
          .from('afastamentos')
          .insert({
            profissional_id: profId,
            tipo: afast.tipo || 'licenca_medica',
            data_inicio: parseExcelDate(afast.dataInicio) || new Date().toISOString().split('T')[0],
            data_prevista_retorno: parseExcelDate(afast.dataPrevisaoRetorno),
            motivo: afast.motivo || null,
            status: 'ativo',
          });

        if (error) {
          results.afastamentos.errors.push(`${afast.matricula}: ${error.message}`);
        } else {
          results.afastamentos.inserted++;
        }
      }
    }

    // 7. Inserir Empréstimos
    if (emprestimos && emprestimos.length > 0) {
      for (const emp of emprestimos) {
        let profId = null;
        
        if (emp.matricula) {
          const { data } = await supabase
            .from('profissionais')
            .select('id')
            .eq('matricula', String(emp.matricula).trim())
            .maybeSingle();
          if (data) profId = data.id;
        }

        if (!profId) {
          results.emprestimos.errors.push(`Empréstimo sem profissional: ${emp.matricula}`);
          continue;
        }

        const { error } = await supabase
          .from('emprestimos')
          .insert({
            profissional_id: profId,
            tipo: emp.tipo || 'empresa',
            valor_total: emp.valorTotal || 0,
            valor_parcela: emp.valorParcela || 0,
            numero_parcelas: emp.numeroParcelas || 1,
            parcelas_pagas: emp.parcelasPagas || 0,
            saldo_devedor: emp.saldoDevedor || emp.valorTotal || 0,
            data_inicio: parseExcelDate(emp.dataInicio) || new Date().toISOString().split('T')[0],
            status: 'ativo',
          });

        if (error) {
          results.emprestimos.errors.push(`${emp.matricula}: ${error.message}`);
        } else {
          results.emprestimos.inserted++;
        }
      }
    }

    // Registrar conclusão da migração
    await supabase.from('security_logs').insert({
      user_id: user.id,
      action: 'MIGRATION_COMPLETE',
      resource: 'migrate-excel-data',
      success: true,
      metadata: { 
        email: user.email, 
        results: {
          lojas: results.lojas.inserted,
          profissionais: results.profissionais.inserted,
          examesASO: results.examesASO.inserted,
          beneficios: results.beneficios.inserted,
          ferias: results.ferias.inserted,
          faltas: results.faltas.inserted,
          afastamentos: results.afastamentos.inserted,
          emprestimos: results.emprestimos.inserted,
        }
      }
    });

    console.log('Migração concluída:', results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Erro na migração:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
