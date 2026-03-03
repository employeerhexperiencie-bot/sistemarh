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
    optionalColumns: ["cpf", "rg", "cargo", "data_admissao", "salario_nominal", "status"],
    templateData: [
      { matricula: "MAT001", nome: "Profissional 1", cpf: "000.000.000-00", rg: "00.000.000-0", cargo: "Vendedor", data_admissao: "2024-01-01", salario_nominal: "3000.00", status: "ativo" },
      { matricula: "MAT002", nome: "Profissional 2", cpf: "000.000.000-01", rg: "00.000.000-1", cargo: "Gerente", data_admissao: "2024-01-01", salario_nominal: "5000.00", status: "ativo" },
    ],
    mapRow: (row) => ({
      matricula: String(row.matricula),
      nome: row.nome,
      cpf: row.cpf || null,
      rg: row.rg || null,
      cargo: row.cargo || null,
      data_admissao: row.data_admissao || null,
      salario_nominal: row.salario_nominal ? parseFloat(row.salario_nominal) : null,
      status: row.status || "ativo",
    }),
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
