export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      afastamentos: {
        Row: {
          created_at: string | null
          data_inicio: string
          data_prevista_retorno: string | null
          data_retorno_efetivo: string | null
          documento_comprovante: string | null
          id: string
          motivo: string | null
          profissional_id: string | null
          status: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_inicio: string
          data_prevista_retorno?: string | null
          data_retorno_efetivo?: string | null
          documento_comprovante?: string | null
          id?: string
          motivo?: string | null
          profissional_id?: string | null
          status?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_inicio?: string
          data_prevista_retorno?: string | null
          data_retorno_efetivo?: string | null
          documento_comprovante?: string | null
          id?: string
          motivo?: string | null
          profissional_id?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "afastamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficios: {
        Row: {
          created_at: string | null
          descontos_vr: number | null
          descontos_vt: number | null
          dias_trabalhados_vr: number | null
          dias_trabalhados_vt: number | null
          elegivel_cesta: boolean | null
          id: string
          mes_referencia: string
          profissional_id: string | null
          updated_at: string | null
          valor_cesta: number | null
          valor_diario_vr: number | null
          valor_diario_vt: number | null
          valor_liquido_vr: number | null
          valor_liquido_vt: number | null
          valor_total_vr: number | null
          valor_total_vt: number | null
        }
        Insert: {
          created_at?: string | null
          descontos_vr?: number | null
          descontos_vt?: number | null
          dias_trabalhados_vr?: number | null
          dias_trabalhados_vt?: number | null
          elegivel_cesta?: boolean | null
          id?: string
          mes_referencia: string
          profissional_id?: string | null
          updated_at?: string | null
          valor_cesta?: number | null
          valor_diario_vr?: number | null
          valor_diario_vt?: number | null
          valor_liquido_vr?: number | null
          valor_liquido_vt?: number | null
          valor_total_vr?: number | null
          valor_total_vt?: number | null
        }
        Update: {
          created_at?: string | null
          descontos_vr?: number | null
          descontos_vt?: number | null
          dias_trabalhados_vr?: number | null
          dias_trabalhados_vt?: number | null
          elegivel_cesta?: boolean | null
          id?: string
          mes_referencia?: string
          profissional_id?: string | null
          updated_at?: string | null
          valor_cesta?: number | null
          valor_diario_vr?: number | null
          valor_diario_vt?: number | null
          valor_liquido_vr?: number | null
          valor_liquido_vt?: number | null
          valor_total_vr?: number | null
          valor_total_vt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "beneficios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      exames_aso: {
        Row: {
          clinica: string | null
          created_at: string | null
          data_proximo_exame: string | null
          data_ultimo_exame: string | null
          id: string
          observacoes: string | null
          periodicidade: string | null
          profissional_id: string | null
          status: string | null
          tipo_exame: string
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          clinica?: string | null
          created_at?: string | null
          data_proximo_exame?: string | null
          data_ultimo_exame?: string | null
          id?: string
          observacoes?: string | null
          periodicidade?: string | null
          profissional_id?: string | null
          status?: string | null
          tipo_exame: string
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          clinica?: string | null
          created_at?: string | null
          data_proximo_exame?: string | null
          data_ultimo_exame?: string | null
          id?: string
          observacoes?: string | null
          periodicidade?: string | null
          profissional_id?: string | null
          status?: string | null
          tipo_exame?: string
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exames_aso_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      faltas: {
        Row: {
          created_at: string | null
          data_falta: string
          documento_comprovante: string | null
          id: string
          motivo: string | null
          profissional_id: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_falta: string
          documento_comprovante?: string | null
          id?: string
          motivo?: string | null
          profissional_id?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_falta?: string
          documento_comprovante?: string | null
          id?: string
          motivo?: string | null
          profissional_id?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faltas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      ferias: {
        Row: {
          created_at: string | null
          dias_direito: number | null
          dias_gozados: number | null
          dias_vendidos: number | null
          id: string
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          periodo_gozo_fim: string | null
          periodo_gozo_inicio: string | null
          profissional_id: string | null
          status: string | null
          updated_at: string | null
          valor_ferias: number | null
          valor_terco_constitucional: number | null
        }
        Insert: {
          created_at?: string | null
          dias_direito?: number | null
          dias_gozados?: number | null
          dias_vendidos?: number | null
          id?: string
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          periodo_gozo_fim?: string | null
          periodo_gozo_inicio?: string | null
          profissional_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor_ferias?: number | null
          valor_terco_constitucional?: number | null
        }
        Update: {
          created_at?: string | null
          dias_direito?: number | null
          dias_gozados?: number | null
          dias_vendidos?: number | null
          id?: string
          periodo_aquisitivo_fim?: string
          periodo_aquisitivo_inicio?: string
          periodo_gozo_fim?: string | null
          periodo_gozo_inicio?: string | null
          profissional_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor_ferias?: number | null
          valor_terco_constitucional?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ferias_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          cnpj: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          gerente: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          gerente?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          gerente?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          aviso_trabalhado: boolean | null
          bairro: string | null
          cargo: string | null
          categoria_cnh: string | null
          cbo: string | null
          celular: string | null
          cep: string | null
          cesta_basica: boolean | null
          cidade: string | null
          cnh: string | null
          cpf: string | null
          cracha: string | null
          created_at: string | null
          ctps: string | null
          data_admissao: string | null
          data_cumprir_aviso: string | null
          data_demissao: string | null
          data_homologacao: string | null
          data_nascimento: string | null
          departamento: string | null
          endereco: string | null
          escolaridade: string | null
          estado: string | null
          estado_civil: string | null
          id: string
          local_homologacao: string | null
          loja_id: string | null
          matricula: string
          motivo_demissao: string | null
          nome: string
          pensao_alimenticia: number | null
          pis: string | null
          primeiro_salario: number | null
          rg: string | null
          salario_nominal: number | null
          setor: string | null
          sexo: string | null
          sindicato: string | null
          status: string | null
          telefone: string | null
          ultimo_salario: number | null
          updated_at: string | null
          vale_refeicao: boolean | null
          vale_transporte: boolean | null
          validade_cnh: string | null
          valor_diario_rota: number | null
        }
        Insert: {
          aviso_trabalhado?: boolean | null
          bairro?: string | null
          cargo?: string | null
          categoria_cnh?: string | null
          cbo?: string | null
          celular?: string | null
          cep?: string | null
          cesta_basica?: boolean | null
          cidade?: string | null
          cnh?: string | null
          cpf?: string | null
          cracha?: string | null
          created_at?: string | null
          ctps?: string | null
          data_admissao?: string | null
          data_cumprir_aviso?: string | null
          data_demissao?: string | null
          data_homologacao?: string | null
          data_nascimento?: string | null
          departamento?: string | null
          endereco?: string | null
          escolaridade?: string | null
          estado?: string | null
          estado_civil?: string | null
          id?: string
          local_homologacao?: string | null
          loja_id?: string | null
          matricula: string
          motivo_demissao?: string | null
          nome: string
          pensao_alimenticia?: number | null
          pis?: string | null
          primeiro_salario?: number | null
          rg?: string | null
          salario_nominal?: number | null
          setor?: string | null
          sexo?: string | null
          sindicato?: string | null
          status?: string | null
          telefone?: string | null
          ultimo_salario?: number | null
          updated_at?: string | null
          vale_refeicao?: boolean | null
          vale_transporte?: boolean | null
          validade_cnh?: string | null
          valor_diario_rota?: number | null
        }
        Update: {
          aviso_trabalhado?: boolean | null
          bairro?: string | null
          cargo?: string | null
          categoria_cnh?: string | null
          cbo?: string | null
          celular?: string | null
          cep?: string | null
          cesta_basica?: boolean | null
          cidade?: string | null
          cnh?: string | null
          cpf?: string | null
          cracha?: string | null
          created_at?: string | null
          ctps?: string | null
          data_admissao?: string | null
          data_cumprir_aviso?: string | null
          data_demissao?: string | null
          data_homologacao?: string | null
          data_nascimento?: string | null
          departamento?: string | null
          endereco?: string | null
          escolaridade?: string | null
          estado?: string | null
          estado_civil?: string | null
          id?: string
          local_homologacao?: string | null
          loja_id?: string | null
          matricula?: string
          motivo_demissao?: string | null
          nome?: string
          pensao_alimenticia?: number | null
          pis?: string | null
          primeiro_salario?: number | null
          rg?: string | null
          salario_nominal?: number | null
          setor?: string | null
          sexo?: string | null
          sindicato?: string | null
          status?: string | null
          telefone?: string | null
          ultimo_salario?: number | null
          updated_at?: string | null
          vale_refeicao?: boolean | null
          vale_transporte?: boolean | null
          validade_cnh?: string | null
          valor_diario_rota?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
