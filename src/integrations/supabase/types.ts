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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      loja_documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          loja_id: string
          mime_type: string | null
          nome: string
          tipo: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          loja_id: string
          mime_type?: string | null
          nome: string
          tipo: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          loja_id?: string
          mime_type?: string | null
          nome?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "loja_documents_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          responsavel: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          responsavel?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      professional_documents: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          nome: string
          professional_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          nome: string
          professional_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          nome?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_epi: {
        Row: {
          ca: string | null
          created_at: string
          data_entrega: string
          data_vencimento: string | null
          documento_id: string | null
          id: string
          item_epi: string
          observacoes: string | null
          professional_id: string
          status: string | null
        }
        Insert: {
          ca?: string | null
          created_at?: string
          data_entrega?: string
          data_vencimento?: string | null
          documento_id?: string | null
          id?: string
          item_epi: string
          observacoes?: string | null
          professional_id: string
          status?: string | null
        }
        Update: {
          ca?: string | null
          created_at?: string
          data_entrega?: string
          data_vencimento?: string | null
          documento_id?: string | null
          id?: string
          item_epi?: string
          observacoes?: string | null
          professional_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_epi_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "professional_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_epi_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_vales: {
        Row: {
          created_at: string
          data_lancamento: string
          descricao: string | null
          documento_id: string | null
          id: string
          professional_id: string
          status: string | null
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_lancamento?: string
          descricao?: string | null
          documento_id?: string | null
          id?: string
          professional_id: string
          status?: string | null
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string
          data_lancamento?: string
          descricao?: string | null
          documento_id?: string | null
          id?: string
          professional_id?: string
          status?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_vales_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "professional_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_vales_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          cargo: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_demissao: string | null
          id: string
          loja_id: string | null
          matricula: string
          nome: string
          rg: string | null
          salario: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          id?: string
          loja_id?: string | null
          matricula: string
          nome: string
          rg?: string | null
          salario?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          id?: string
          loja_id?: string | null
          matricula?: string
          nome?: string
          rg?: string | null
          salario?: number | null
          status?: string | null
          updated_at?: string
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
