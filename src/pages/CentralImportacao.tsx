import { useEffect, useState, useCallback } from "react";
import { Store, Users, UserX, Banknote, Heart, Package, Gift, Plane, CalendarDays, Upload } from "lucide-react";
import { ImportModuleCard, ImportModuleConfig } from "@/components/importacao/ImportModuleCard";
import { supabase } from "@/integrations/supabase/client";

const importModules: ImportModuleConfig[] = [
  {
    id: "lojas",
    title: "Lojas",
    description: "Cadastro de lojas/unidades",
    icon: <Store className="h-5 w-5" />,
    tableName: "lojas",
    requiredColumns: ["nome"],
    optionalColumns: ["cnpj", "endereco", "telefone", "email", "gerente"],
    templateData: [
      { nome: "Loja Exemplo 1", cnpj: "00.000.000/0001-00", endereco: "Rua Exemplo, 123", telefone: "(11) 1234-5678", email: "loja1@exemplo.com", gerente: "João Silva" },
      { nome: "Loja Exemplo 2", cnpj: "00.000.000/0001-01", endereco: "Av Exemplo, 456", telefone: "(11) 8765-4321", email: "loja2@exemplo.com", gerente: "Maria Santos" },
    ],
    mapRow: (row) => ({ nome: row.nome, cnpj: row.cnpj, endereco: row.endereco, telefone: row.telefone, email: row.email, gerente: row.gerente }),
  },
  {
    id: "profissionais",
    title: "Profissionais",
    description: "Cadastro de colaboradores",
    icon: <Users className="h-5 w-5" />,
    tableName: "profissionais",
    requiredColumns: ["matricula", "nome"],
    optionalColumns: ["cpf", "rg", "cargo", "data_admissao", "salario_nominal", "status", "nome_mae", "nome_pai", "sexo", "estado_civil", "data_nascimento", "pis", "cbo", "endereco", "bairro", "cidade", "cep", "telefone", "banco", "agencia", "conta", "chave_pix", "escala_trabalho", "horario_entrada", "horario_intervalo", "horario_saida", "dia_folga", "gestor", "cnh", "validade_cnh", "categoria_cnh"],
    columnAliases: {
      matricula: ["Nº MATRICULA", "MATRICULA", "matricula", "Matrícula", "Nº Matrícula", "N MATRICULA"],
      nome: ["NOME", "nome", "NOME COMPLETO", "Nome Completo"],
      cpf: ["CPF", "cpf"],
      rg: ["RG", "rg"],
      cargo: ["CARGO", "cargo", "Cargo"],
      data_admissao: ["ADMISSÃO CTPS", "DATA ADMISSÃO", "data_admissao", "ADMISSAO", "Data Admissão"],
      data_inicio_loja: ["INICIO LOJA", "DATA INICIO LOJA", "data_inicio_loja"],
      salario_nominal: ["SALARIO CTPS", "SALÁRIO CTPS", "salario_nominal", "SALARIO", "Salário"],
      ultimo_salario: ["SALARIO Á RECEBER", "SALÁRIO A RECEBER", "ultimo_salario"],
      status: ["STATUS", "status", "OBS"],
      nome_mae: ["NOME DA MÃE", "NOME MAE", "nome_mae", "Mãe"],
      nome_pai: ["NOME DO PAI", "NOME PAI", "nome_pai", "Pai"],
      sexo: ["GENERO", "GÊNERO", "SEXO", "sexo"],
      estado_civil: ["ESTADO CIVIL", "estado_civil"],
      data_nascimento: ["NASCIMENTO", "DATA NASCIMENTO", "data_nascimento"],
      pis: ["PIS / CNPJ", "PIS", "pis", "PIS/CNPJ"],
      cbo: ["CBO", "cbo"],
      endereco: ["ENDEREÇO", "endereco", "ENDERECO"],
      numero_endereco: ["NÚMERO", "NUMERO", "Nº"],
      bairro: ["BAIRRO", "bairro"],
      cidade: ["CIDADE", "cidade"],
      cep: ["CEP", "cep"],
      cor_etnia: ["COR/ETNIA", "COR", "cor_etnia"],
      telefone: ["TELEFONE", "telefone", "CELULAR"],
      escala_trabalho: ["ESCALA", "escala_trabalho"],
      horario_entrada: ["HORARIO ENTRADA", "HORÁRIO ENTRADA", "horario_entrada"],
      horario_intervalo: ["HORARIO INTERVALO/PAUSA", "HORÁRIO INTERVALO", "horario_intervalo"],
      horario_saida: ["HORARIO SAÍDA", "HORÁRIO SAÍDA", "horario_saida", "HORARIO SAIDA"],
      dia_folga: ["DIA FOLGA FIXA", "DIA FOLGA", "dia_folga"],
      gestor: ["GESTOR", "gestor"],
      cnh: ["CNH", "cnh"],
      validade_cnh: ["DATA VL CNH", "VALIDADE CNH", "validade_cnh"],
      categoria_cnh: ["CATEGORIA", "categoria_cnh"],
      banco: ["BANCO", "banco"],
      agencia: ["AGÊNCIA", "AGENCIA", "agencia"],
      conta: ["CONTA CORRENTE", "CONTA", "conta"],
      conta_poupanca: ["CONTA POUPANÇA", "CONTA POUPANCA"],
      pix_telefone: ["PIX TELEFONE"],
      pix_email: ["PIX EMAIL"],
      pix_cpf: ["PIX CPF"],
      tem_dependentes: ["DEPENDENTE", "DEPENDENTES", "tem_dependentes"],
      pensao_alimenticia: ["PENSÃO", "PENSAO", "pensao_alimenticia"],
      loja_atuacao: ["LOCAL TRABALHO", "LOJA ATUAÇÃO"],
      loja_registro: ["LOCAL REGISTRO", "LOJA REGISTRO"],
      numero_contabil: ["Nº LOJA CONTAB", "NUMERO CONTABIL", "numero_contabil"],
    },
    upsertConflict: "matricula",
    templateData: [
      { matricula: "MAT001", nome: "Profissional 1", cpf: "000.000.000-00", rg: "00.000.000-0", cargo: "Vendedor", data_admissao: "2024-01-01", salario_nominal: "3000.00", status: "ativo" },
      { matricula: "MAT002", nome: "Profissional 2", cpf: "000.000.000-01", rg: "00.000.000-1", cargo: "Gerente", data_admissao: "2024-01-01", salario_nominal: "5000.00", status: "ativo" },
    ],
    mapRow: (row: any) => {
      const cleanCurrency = (val: any): number | null => {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') return val;
        const s = String(val).replace(/R\$\s*/g, '').replace(/\s/g, '').trim();
        // Handle BR format (1.234,56) and US format (1,234.56)
        if (s.includes(',') && s.indexOf(',') > s.lastIndexOf('.')) {
          return parseFloat(s.replace(/\./g, '').replace(',', '.')) || null;
        }
        return parseFloat(s.replace(/,/g, '')) || null;
      };

      const formatDate = (val: any): string | null => {
        if (!val) return null;
        if (val instanceof Date || (typeof val === 'object' && val.getTime)) {
          const d = new Date(val);
          return d.toISOString().split('T')[0];
        }
        const s = String(val).trim();
        // dd/mm/yyyy
        const brMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (brMatch) return `${brMatch[3]}-${brMatch[2].padStart(2,'0')}-${brMatch[1].padStart(2,'0')}`;
        // Already yyyy-mm-dd
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        try { return new Date(s).toISOString().split('T')[0]; } catch { return null; }
      };

      // Resolve PIX - pick first available
      const chave_pix = row.pix_cpf || row.pix_telefone || row.pix_email || row.chave_pix || null;
      
      // Build address from parts
      let endereco = row.endereco || null;
      if (endereco && row.numero_endereco) {
        endereco = `${endereco}, ${row.numero_endereco}`;
      }

      // Map pensao
      const pensaoVal = row.pensao_alimenticia;
      let pensao: number | null = null;
      if (pensaoVal && String(pensaoVal).toUpperCase() !== 'NÃO' && String(pensaoVal).toUpperCase() !== 'NAO') {
        pensao = cleanCurrency(pensaoVal);
      }

      // Map dependentes
      let temDependentes = false;
      if (row.tem_dependentes) {
        const dep = String(row.tem_dependentes).toUpperCase().trim();
        temDependentes = dep === 'SIM' || dep === 'S' || dep === 'TRUE' || dep === '1';
      }

      // Map status from OBS
      let status = 'ativo';
      if (row.status) {
        const s = String(row.status).toLowerCase().trim();
        if (['ativo', 'inativo', 'afastado', 'ferias', 'demitido'].includes(s)) status = s;
      }

      // Map gender
      let sexo = row.sexo || null;
      if (sexo) {
        const s = String(sexo).toUpperCase().trim();
        if (s === 'M' || s.startsWith('MASC')) sexo = 'masculino';
        else if (s === 'F' || s.startsWith('FEM')) sexo = 'feminino';
      }

      // These are intermediate fields - will be resolved before insert
      const result: Record<string, any> = {
        matricula: String(row.matricula).trim(),
        nome: String(row.nome).trim(),
        cpf: row.cpf ? String(row.cpf).trim() : null,
        rg: row.rg ? String(row.rg).trim() : null,
        cargo: row.cargo || null,
        data_admissao: formatDate(row.data_admissao),
        data_inicio_loja: formatDate(row.data_inicio_loja),
        salario_nominal: cleanCurrency(row.salario_nominal),
        ultimo_salario: cleanCurrency(row.ultimo_salario),
        status,
        nome_mae: row.nome_mae ? String(row.nome_mae).trim() : null,
        nome_pai: row.nome_pai ? String(row.nome_pai).trim() : null,
        sexo,
        estado_civil: row.estado_civil || null,
        data_nascimento: formatDate(row.data_nascimento),
        pis: row.pis ? String(row.pis).trim() : null,
        cbo: row.cbo ? String(row.cbo).trim() : null,
        endereco,
        bairro: row.bairro ? String(row.bairro).trim() : null,
        cidade: row.cidade ? String(row.cidade).trim() : null,
        cep: row.cep ? String(row.cep).trim() : null,
        cor_etnia: row.cor_etnia || null,
        telefone: row.telefone ? String(row.telefone).trim() : null,
        escala_trabalho: row.escala_trabalho || null,
        horario_entrada: row.horario_entrada ? String(row.horario_entrada).trim() : null,
        horario_intervalo: row.horario_intervalo ? String(row.horario_intervalo).trim() : null,
        horario_saida: row.horario_saida ? String(row.horario_saida).trim() : null,
        dia_folga: row.dia_folga || null,
        gestor: row.gestor || null,
        cnh: row.cnh ? String(row.cnh).trim() : null,
        validade_cnh: formatDate(row.validade_cnh),
        categoria_cnh: row.categoria_cnh || null,
        banco: row.banco || null,
        agencia: row.agencia ? String(row.agencia).trim() : null,
        conta: row.conta || row.conta_poupanca ? String(row.conta || row.conta_poupanca).trim() : null,
        tipo_conta: row.conta_poupanca && !row.conta ? 'poupanca' : 'corrente',
        chave_pix,
        tem_dependentes: temDependentes,
        pensao_alimenticia: pensao,
      };

      // Store loja names for resolution (prefixed with _ to be removed before insert)
      if (row.loja_atuacao) result._loja_atuacao = String(row.loja_atuacao).trim();
      if (row.loja_registro) result._loja_registro = String(row.loja_registro).trim();

      return result;
    },
  },
  {
    id: "faltas",
    title: "Faltas",
    description: "Registros de faltas dos profissionais",
    icon: <UserX className="h-5 w-5" />,
    tableName: "faltas",
    requiredColumns: ["MATRICULA", "DATA_FALTA", "TIPO"],
    optionalColumns: ["MOTIVO"],
    templateData: [
      { MATRICULA: "MAT001", DATA_FALTA: "2025-03-05", TIPO: "injustificada", MOTIVO: "" },
      { MATRICULA: "MAT001", DATA_FALTA: "2025-03-10", TIPO: "atestado", MOTIVO: "Atestado médico" },
      { MATRICULA: "MAT002", DATA_FALTA: "2025-03-12", TIPO: "justificada", MOTIVO: "Consulta agendada" },
    ],
    validateRow: (row) => {
      const tipo = String(row.TIPO || "").toLowerCase().trim();
      if (!["injustificada", "justificada", "atestado"].includes(tipo)) {
        return `TIPO "${row.TIPO}" inválido. Use: injustificada, justificada, atestado`;
      }
      return null;
    },
    mapRow: (row) => {
      // Will need profissional_id lookup - handled specially
      return {
        _matricula: String(row.MATRICULA),
        data_falta: row.DATA_FALTA,
        tipo: String(row.TIPO).toLowerCase().trim(),
        motivo: row.MOTIVO || null,
      };
    },
  },
  {
    id: "emprestimos",
    title: "Empréstimos",
    description: "Empréstimos e financiamentos",
    icon: <Banknote className="h-5 w-5" />,
    tableName: "emprestimos",
    requiredColumns: ["MATRICULA", "tipo", "valor_parcela", "saldo_devedor", "data_inicio"],
    optionalColumns: ["valor_total", "numero_parcelas", "parcelas_pagas", "observacoes"],
    templateData: [
      { MATRICULA: "MAT001", tipo: "empresa", valor_total: "2000", valor_parcela: "500", saldo_devedor: "1500", numero_parcelas: "4", parcelas_pagas: "1", data_inicio: "2025-01-01", observacoes: "" },
      { MATRICULA: "MAT002", tipo: "ctps", valor_total: "5000", valor_parcela: "250", saldo_devedor: "4500", numero_parcelas: "20", parcelas_pagas: "2", data_inicio: "2025-02-01", observacoes: "Banco X" },
    ],
    mapRow: (row) => ({
      _matricula: String(row.MATRICULA),
      tipo: row.tipo,
      valor_total: row.valor_total ? parseFloat(row.valor_total) : null,
      valor_parcela: parseFloat(row.valor_parcela),
      saldo_devedor: parseFloat(row.saldo_devedor),
      numero_parcelas: row.numero_parcelas ? parseInt(row.numero_parcelas) : null,
      parcelas_pagas: row.parcelas_pagas ? parseInt(row.parcelas_pagas) : 0,
      data_inicio: row.data_inicio,
      observacoes: row.observacoes || null,
      status: "ativo",
    }),
  },
  {
    id: "exames_aso",
    title: "Exames ASO",
    description: "Exames ocupacionais",
    icon: <Heart className="h-5 w-5" />,
    tableName: "exames_aso",
    requiredColumns: ["MATRICULA", "tipo_exame"],
    optionalColumns: ["data_ultimo_exame", "data_proximo_exame", "clinica", "valor", "status"],
    templateData: [
      { MATRICULA: "MAT001", tipo_exame: "admissional", data_ultimo_exame: "2025-01-15", data_proximo_exame: "2026-01-15", clinica: "Clínica X", valor: "150", status: "em_dia" },
      { MATRICULA: "MAT002", tipo_exame: "periodico", data_ultimo_exame: "2024-06-01", data_proximo_exame: "2025-06-01", clinica: "Clínica Y", valor: "120", status: "vencido" },
    ],
    mapRow: (row) => ({
      _matricula: String(row.MATRICULA),
      tipo_exame: row.tipo_exame,
      data_ultimo_exame: row.data_ultimo_exame || null,
      data_proximo_exame: row.data_proximo_exame || null,
      clinica: row.clinica || null,
      valor: row.valor ? parseFloat(row.valor) : null,
      status: row.status || "pendente",
    }),
  },
  {
    id: "epis",
    title: "EPIs",
    description: "Equipamentos de proteção individual",
    icon: <Package className="h-5 w-5" />,
    tableName: "epis",
    requiredColumns: ["MATRICULA", "nome_epi", "data_entrega"],
    optionalColumns: ["categoria", "numero_ca", "data_validade", "observacoes"],
    templateData: [
      { MATRICULA: "MAT001", nome_epi: "Luva de Proteção", data_entrega: "2025-01-10", categoria: "mao", numero_ca: "12345", data_validade: "2026-01-10", observacoes: "" },
      { MATRICULA: "MAT002", nome_epi: "Capacete", data_entrega: "2025-02-01", categoria: "cabeca", numero_ca: "67890", data_validade: "2028-02-01", observacoes: "" },
    ],
    mapRow: (row) => ({
      _matricula: String(row.MATRICULA),
      nome_epi: row.nome_epi,
      data_entrega: row.data_entrega,
      categoria: row.categoria || null,
      numero_ca: row.numero_ca ? String(row.numero_ca) : null,
      data_validade: row.data_validade || null,
      observacoes: row.observacoes || null,
    }),
  },
  {
    id: "ferias",
    title: "Férias",
    description: "Períodos de férias",
    icon: <Plane className="h-5 w-5" />,
    tableName: "ferias",
    requiredColumns: ["MATRICULA", "periodo_aquisitivo_inicio", "periodo_aquisitivo_fim"],
    optionalColumns: ["periodo_gozo_inicio", "periodo_gozo_fim", "dias_vendidos", "status"],
    templateData: [
      { MATRICULA: "MAT001", periodo_aquisitivo_inicio: "2024-01-01", periodo_aquisitivo_fim: "2024-12-31", periodo_gozo_inicio: "2025-03-01", periodo_gozo_fim: "2025-03-30", dias_vendidos: "0", status: "programada" },
    ],
    mapRow: (row) => ({
      _matricula: String(row.MATRICULA),
      periodo_aquisitivo_inicio: row.periodo_aquisitivo_inicio,
      periodo_aquisitivo_fim: row.periodo_aquisitivo_fim,
      periodo_gozo_inicio: row.periodo_gozo_inicio || null,
      periodo_gozo_fim: row.periodo_gozo_fim || null,
      dias_vendidos: row.dias_vendidos ? parseInt(row.dias_vendidos) : 0,
      status: row.status || "pendente",
    }),
  },
  {
    id: "afastamentos",
    title: "Afastamentos",
    description: "Licenças e afastamentos",
    icon: <CalendarDays className="h-5 w-5" />,
    tableName: "afastamentos",
    requiredColumns: ["MATRICULA", "tipo", "data_inicio"],
    optionalColumns: ["motivo", "data_prevista_retorno", "data_retorno_efetivo", "status"],
    templateData: [
      { MATRICULA: "MAT001", tipo: "medico", data_inicio: "2025-02-01", motivo: "Cirurgia", data_prevista_retorno: "2025-03-01", data_retorno_efetivo: "", status: "ativo" },
    ],
    mapRow: (row) => ({
      _matricula: String(row.MATRICULA),
      tipo: row.tipo,
      data_inicio: row.data_inicio,
      motivo: row.motivo || null,
      data_prevista_retorno: row.data_prevista_retorno || null,
      data_retorno_efetivo: row.data_retorno_efetivo || null,
      status: row.status || "ativo",
    }),
  },
];

export default function CentralImportacao() {
  const [history, setHistory] = useState<Record<string, any[]>>({});

  const fetchHistory = useCallback(async () => {
    const { data } = await supabase
      .from("historico_importacoes" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (data) {
      const grouped: Record<string, any[]> = {};
      (data as any[]).forEach((h: any) => {
        if (!grouped[h.modulo]) grouped[h.modulo] = [];
        grouped[h.modulo].push(h);
      });
      setHistory(grouped);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Override the import logic for modules that need matricula -> profissional_id lookup
  const modulesWithLookup = ["faltas", "emprestimos", "exames_aso", "epis", "ferias", "afastamentos"];

  const getEnhancedConfig = (config: ImportModuleConfig): ImportModuleConfig => {
    if (!modulesWithLookup.includes(config.id)) return config;

    return {
      ...config,
      // We override tableName temporarily — the actual insert is handled by the card
      // but we need to resolve _matricula -> profissional_id before inserting
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Importação</h1>
          <p className="text-sm text-muted-foreground">
            Importe dados em massa via planilha Excel. Baixe os exemplos, preencha e faça upload.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {importModules.map((mod) => (
          <ImportModuleCard
            key={mod.id}
            config={getEnhancedConfig(mod)}
            history={history[mod.id] || []}
            onImportComplete={fetchHistory}
          />
        ))}
      </div>
    </div>
  );
}
