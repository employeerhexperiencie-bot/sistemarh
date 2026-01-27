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
      adiantamentos: {
        Row: {
          created_at: string | null
          data_pagamento: string | null
          elegivel: boolean | null
          id: string
          mes_referencia: string
          motivo_inelegibilidade: string | null
          observacoes: string | null
          pago: boolean | null
          percentual_adiantamento: number
          profissional_id: string | null
          salario_base: number
          updated_at: string | null
          valor_adiantamento: number
        }
        Insert: {
          created_at?: string | null
          data_pagamento?: string | null
          elegivel?: boolean | null
          id?: string
          mes_referencia: string
          motivo_inelegibilidade?: string | null
          observacoes?: string | null
          pago?: boolean | null
          percentual_adiantamento: number
          profissional_id?: string | null
          salario_base: number
          updated_at?: string | null
          valor_adiantamento: number
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string | null
          elegivel?: boolean | null
          id?: string
          mes_referencia?: string
          motivo_inelegibilidade?: string | null
          observacoes?: string | null
          pago?: boolean | null
          percentual_adiantamento?: number
          profissional_id?: string | null
          salario_base?: number
          updated_at?: string | null
          valor_adiantamento?: number
        }
        Relationships: [
          {
            foreignKeyName: "adiantamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      advertencias: {
        Row: {
          created_at: string | null
          data_ocorrencia: string
          descricao: string | null
          documento_id: string | null
          id: string
          motivo: string
          profissional_id: string | null
          status: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_ocorrencia: string
          descricao?: string | null
          documento_id?: string | null
          id?: string
          motivo: string
          profissional_id?: string | null
          status?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_ocorrencia?: string
          descricao?: string | null
          documento_id?: string | null
          id?: string
          motivo?: string
          profissional_id?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertencias_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "professional_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertencias_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
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
      alertas_sistema: {
        Row: {
          acao_url: string | null
          created_at: string | null
          data_leitura: string | null
          data_vencimento: string | null
          dias_ate_vencimento: number | null
          entidade_relacionada_id: string | null
          entidade_relacionada_tipo: string | null
          id: string
          lido: boolean | null
          loja_id: string | null
          mensagem: string
          prioridade: string | null
          profissional_id: string | null
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          acao_url?: string | null
          created_at?: string | null
          data_leitura?: string | null
          data_vencimento?: string | null
          dias_ate_vencimento?: number | null
          entidade_relacionada_id?: string | null
          entidade_relacionada_tipo?: string | null
          id?: string
          lido?: boolean | null
          loja_id?: string | null
          mensagem: string
          prioridade?: string | null
          profissional_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          acao_url?: string | null
          created_at?: string | null
          data_leitura?: string | null
          data_vencimento?: string | null
          dias_ate_vencimento?: number | null
          entidade_relacionada_id?: string | null
          entidade_relacionada_tipo?: string | null
          id?: string
          lido?: boolean | null
          loja_id?: string | null
          mensagem?: string
          prioridade?: string | null
          profissional_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_sistema_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_sistema_profissional_id_fkey"
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
          valor_bem_mais: number | null
          valor_cesta: number | null
          valor_diario_vr: number | null
          valor_diario_vt: number | null
          valor_liquido_vr: number | null
          valor_liquido_vt: number | null
          valor_odonto: number | null
          valor_pensao: number | null
          valor_seguro_vida: number | null
          valor_total_vr: number | null
          valor_total_vt: number | null
          valor_vale_alimentacao: number | null
          valor_vale_carne: number | null
          valor_vale_dinheiro: number | null
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
          valor_bem_mais?: number | null
          valor_cesta?: number | null
          valor_diario_vr?: number | null
          valor_diario_vt?: number | null
          valor_liquido_vr?: number | null
          valor_liquido_vt?: number | null
          valor_odonto?: number | null
          valor_pensao?: number | null
          valor_seguro_vida?: number | null
          valor_total_vr?: number | null
          valor_total_vt?: number | null
          valor_vale_alimentacao?: number | null
          valor_vale_carne?: number | null
          valor_vale_dinheiro?: number | null
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
          valor_bem_mais?: number | null
          valor_cesta?: number | null
          valor_diario_vr?: number | null
          valor_diario_vt?: number | null
          valor_liquido_vr?: number | null
          valor_liquido_vt?: number | null
          valor_odonto?: number | null
          valor_pensao?: number | null
          valor_seguro_vida?: number | null
          valor_total_vr?: number | null
          valor_total_vt?: number | null
          valor_vale_alimentacao?: number | null
          valor_vale_carne?: number | null
          valor_vale_dinheiro?: number | null
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
      configuracoes_sistema: {
        Row: {
          categoria: string | null
          chave: string
          created_at: string | null
          descricao: string | null
          editavel: boolean | null
          id: string
          tipo: string
          updated_at: string | null
          valor: string
        }
        Insert: {
          categoria?: string | null
          chave: string
          created_at?: string | null
          descricao?: string | null
          editavel?: boolean | null
          id?: string
          tipo: string
          updated_at?: string | null
          valor: string
        }
        Update: {
          categoria?: string | null
          chave?: string
          created_at?: string | null
          descricao?: string | null
          editavel?: boolean | null
          id?: string
          tipo?: string
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      decimo_terceiro: {
        Row: {
          ano: number
          avos_descontados: number | null
          avos_liquidos: number
          avos_trabalhados: number
          created_at: string | null
          id: string
          observacoes: string | null
          primeira_parcela_data: string | null
          primeira_parcela_paga: boolean | null
          primeira_parcela_valor: number | null
          profissional_id: string | null
          segunda_parcela_data: string | null
          segunda_parcela_inss: number | null
          segunda_parcela_irrf: number | null
          segunda_parcela_liquido: number | null
          segunda_parcela_paga: boolean | null
          segunda_parcela_pensao: number | null
          segunda_parcela_valor: number | null
          updated_at: string | null
          valor_base: number
        }
        Insert: {
          ano: number
          avos_descontados?: number | null
          avos_liquidos: number
          avos_trabalhados: number
          created_at?: string | null
          id?: string
          observacoes?: string | null
          primeira_parcela_data?: string | null
          primeira_parcela_paga?: boolean | null
          primeira_parcela_valor?: number | null
          profissional_id?: string | null
          segunda_parcela_data?: string | null
          segunda_parcela_inss?: number | null
          segunda_parcela_irrf?: number | null
          segunda_parcela_liquido?: number | null
          segunda_parcela_paga?: boolean | null
          segunda_parcela_pensao?: number | null
          segunda_parcela_valor?: number | null
          updated_at?: string | null
          valor_base: number
        }
        Update: {
          ano?: number
          avos_descontados?: number | null
          avos_liquidos?: number
          avos_trabalhados?: number
          created_at?: string | null
          id?: string
          observacoes?: string | null
          primeira_parcela_data?: string | null
          primeira_parcela_paga?: boolean | null
          primeira_parcela_valor?: number | null
          profissional_id?: string | null
          segunda_parcela_data?: string | null
          segunda_parcela_inss?: number | null
          segunda_parcela_irrf?: number | null
          segunda_parcela_liquido?: number | null
          segunda_parcela_paga?: boolean | null
          segunda_parcela_pensao?: number | null
          segunda_parcela_valor?: number | null
          updated_at?: string | null
          valor_base?: number
        }
        Relationships: [
          {
            foreignKeyName: "decimo_terceiro_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      emprestimos: {
        Row: {
          created_at: string | null
          data_inicio: string
          data_previsao_termino: string | null
          id: string
          numero_parcelas: number | null
          observacoes: string | null
          parcelas_pagas: number | null
          profissional_id: string | null
          saldo_devedor: number
          status: string | null
          taxa_juros: number | null
          tipo: string
          updated_at: string | null
          valor_parcela: number
          valor_total: number | null
        }
        Insert: {
          created_at?: string | null
          data_inicio: string
          data_previsao_termino?: string | null
          id?: string
          numero_parcelas?: number | null
          observacoes?: string | null
          parcelas_pagas?: number | null
          profissional_id?: string | null
          saldo_devedor: number
          status?: string | null
          taxa_juros?: number | null
          tipo: string
          updated_at?: string | null
          valor_parcela: number
          valor_total?: number | null
        }
        Update: {
          created_at?: string | null
          data_inicio?: string
          data_previsao_termino?: string | null
          id?: string
          numero_parcelas?: number | null
          observacoes?: string | null
          parcelas_pagas?: number | null
          profissional_id?: string | null
          saldo_devedor?: number
          status?: string | null
          taxa_juros?: number | null
          tipo?: string
          updated_at?: string | null
          valor_parcela?: number
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "emprestimos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      epis: {
        Row: {
          categoria: string | null
          created_at: string | null
          data_entrega: string
          data_validade: string | null
          documento_id: string | null
          id: string
          nome_epi: string
          numero_ca: string | null
          observacoes: string | null
          profissional_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          data_entrega: string
          data_validade?: string | null
          documento_id?: string | null
          id?: string
          nome_epi: string
          numero_ca?: string | null
          observacoes?: string | null
          profissional_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          data_entrega?: string
          data_validade?: string | null
          documento_id?: string | null
          id?: string
          nome_epi?: string
          numero_ca?: string | null
          observacoes?: string | null
          profissional_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epis_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "professional_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epis_profissional_id_fkey"
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
      folha_pagamento: {
        Row: {
          adicional_noturno: number | null
          atestados: number | null
          bonus: number | null
          competencia: string
          created_at: string
          desconto_faltas: number | null
          desconto_inss: number | null
          desconto_ir: number | null
          desconto_pensao: number | null
          desconto_sindicato: number | null
          desconto_vr: number | null
          desconto_vt: number | null
          dias_ferias: number | null
          dias_trabalhados: number | null
          elegivel_dia20: boolean | null
          faltas: number | null
          horas_extras: number | null
          id: string
          loja_id: string | null
          motivo_dia20: string | null
          outras_adicoes: number | null
          outros_descontos: number | null
          profissional_id: string
          salario_base: number
          status: string | null
          total_descontos: number | null
          total_proventos: number | null
          updated_at: string
          valor_cesta_basica: number | null
          valor_dia20: number | null
          valor_dia5: number | null
          valor_liquido: number | null
          valor_vr: number | null
          valor_vt: number | null
        }
        Insert: {
          adicional_noturno?: number | null
          atestados?: number | null
          bonus?: number | null
          competencia: string
          created_at?: string
          desconto_faltas?: number | null
          desconto_inss?: number | null
          desconto_ir?: number | null
          desconto_pensao?: number | null
          desconto_sindicato?: number | null
          desconto_vr?: number | null
          desconto_vt?: number | null
          dias_ferias?: number | null
          dias_trabalhados?: number | null
          elegivel_dia20?: boolean | null
          faltas?: number | null
          horas_extras?: number | null
          id?: string
          loja_id?: string | null
          motivo_dia20?: string | null
          outras_adicoes?: number | null
          outros_descontos?: number | null
          profissional_id: string
          salario_base?: number
          status?: string | null
          total_descontos?: number | null
          total_proventos?: number | null
          updated_at?: string
          valor_cesta_basica?: number | null
          valor_dia20?: number | null
          valor_dia5?: number | null
          valor_liquido?: number | null
          valor_vr?: number | null
          valor_vt?: number | null
        }
        Update: {
          adicional_noturno?: number | null
          atestados?: number | null
          bonus?: number | null
          competencia?: string
          created_at?: string
          desconto_faltas?: number | null
          desconto_inss?: number | null
          desconto_ir?: number | null
          desconto_pensao?: number | null
          desconto_sindicato?: number | null
          desconto_vr?: number | null
          desconto_vt?: number | null
          dias_ferias?: number | null
          dias_trabalhados?: number | null
          elegivel_dia20?: boolean | null
          faltas?: number | null
          horas_extras?: number | null
          id?: string
          loja_id?: string | null
          motivo_dia20?: string | null
          outras_adicoes?: number | null
          outros_descontos?: number | null
          profissional_id?: string
          salario_base?: number
          status?: string | null
          total_descontos?: number | null
          total_proventos?: number | null
          updated_at?: string
          valor_cesta_basica?: number | null
          valor_dia20?: number | null
          valor_dia5?: number | null
          valor_liquido?: number | null
          valor_vr?: number | null
          valor_vt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "folha_pagamento_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folha_pagamento_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_acoes: {
        Row: {
          acao: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string
          entidade_id: string
          entidade_nome: string | null
          entidade_tipo: string
          id: string
          ip_address: string | null
          modulo: string
          user_agent: string | null
          usuario: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao: string
          entidade_id: string
          entidade_nome?: string | null
          entidade_tipo: string
          id?: string
          ip_address?: string | null
          modulo: string
          user_agent?: string | null
          usuario?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string
          entidade_id?: string
          entidade_nome?: string | null
          entidade_tipo?: string
          id?: string
          ip_address?: string | null
          modulo?: string
          user_agent?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      historico_emprestimos: {
        Row: {
          acao: string
          campo_alterado: string | null
          created_at: string
          emprestimo_id: string
          id: string
          observacao: string | null
          profissional_id: string | null
          usuario: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          acao: string
          campo_alterado?: string | null
          created_at?: string
          emprestimo_id: string
          id?: string
          observacao?: string | null
          profissional_id?: string | null
          usuario?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          acao?: string
          campo_alterado?: string | null
          created_at?: string
          emprestimo_id?: string
          id?: string
          observacao?: string | null
          profissional_id?: string | null
          usuario?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_emprestimos_emprestimo_id_fkey"
            columns: ["emprestimo_id"]
            isOneToOne: false
            referencedRelation: "emprestimos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_emprestimos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_salarios: {
        Row: {
          created_at: string | null
          data_alteracao: string
          id: string
          motivo: string | null
          percentual_alteracao: number | null
          profissional_id: string | null
          salario_anterior: number | null
          salario_novo: number
          tipo_alteracao: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_alteracao: string
          id?: string
          motivo?: string | null
          percentual_alteracao?: number | null
          profissional_id?: string | null
          salario_anterior?: number | null
          salario_novo: number
          tipo_alteracao: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_alteracao?: string
          id?: string
          motivo?: string | null
          percentual_alteracao?: number | null
          profissional_id?: string | null
          salario_anterior?: number | null
          salario_novo?: number
          tipo_alteracao?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_salarios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      holerites: {
        Row: {
          adiantamento: number | null
          adicional_insalubridade: number | null
          adicional_noturno: number | null
          adicional_periculosidade: number | null
          base_fgts: number | null
          base_inss: number | null
          base_irrf: number | null
          created_at: string | null
          data_geracao: string | null
          emprestimo: number | null
          faltas: number | null
          fgts: number | null
          horas_extras: number | null
          id: string
          inss: number | null
          irrf: number | null
          mes_referencia: string
          outros_descontos: number | null
          outros_proventos: number | null
          pdf_path: string | null
          pensao_alimenticia: number | null
          profissional_id: string | null
          salario_base: number
          salario_liquido: number
          status: string | null
          total_descontos: number
          total_proventos: number
          updated_at: string | null
          vale_refeicao: number | null
          vale_transporte: number | null
        }
        Insert: {
          adiantamento?: number | null
          adicional_insalubridade?: number | null
          adicional_noturno?: number | null
          adicional_periculosidade?: number | null
          base_fgts?: number | null
          base_inss?: number | null
          base_irrf?: number | null
          created_at?: string | null
          data_geracao?: string | null
          emprestimo?: number | null
          faltas?: number | null
          fgts?: number | null
          horas_extras?: number | null
          id?: string
          inss?: number | null
          irrf?: number | null
          mes_referencia: string
          outros_descontos?: number | null
          outros_proventos?: number | null
          pdf_path?: string | null
          pensao_alimenticia?: number | null
          profissional_id?: string | null
          salario_base: number
          salario_liquido: number
          status?: string | null
          total_descontos: number
          total_proventos: number
          updated_at?: string | null
          vale_refeicao?: number | null
          vale_transporte?: number | null
        }
        Update: {
          adiantamento?: number | null
          adicional_insalubridade?: number | null
          adicional_noturno?: number | null
          adicional_periculosidade?: number | null
          base_fgts?: number | null
          base_inss?: number | null
          base_irrf?: number | null
          created_at?: string | null
          data_geracao?: string | null
          emprestimo?: number | null
          faltas?: number | null
          fgts?: number | null
          horas_extras?: number | null
          id?: string
          inss?: number | null
          irrf?: number | null
          mes_referencia?: string
          outros_descontos?: number | null
          outros_proventos?: number | null
          pdf_path?: string | null
          pensao_alimenticia?: number | null
          profissional_id?: string | null
          salario_base?: number
          salario_liquido?: number
          status?: string | null
          total_descontos?: number
          total_proventos?: number
          updated_at?: string | null
          vale_refeicao?: number | null
          vale_transporte?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "holerites_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_financeiros: {
        Row: {
          categoria: string
          created_at: string | null
          descricao: string
          id: string
          mes_referencia: string
          observacoes: string | null
          profissional_id: string | null
          referencia: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descricao: string
          id?: string
          mes_referencia: string
          observacoes?: string | null
          profissional_id?: string | null
          referencia?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descricao?: string
          id?: string
          mes_referencia?: string
          observacoes?: string | null
          profissional_id?: string | null
          referencia?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_documents: {
        Row: {
          created_at: string | null
          data_validade: string | null
          data_vencimento: string | null
          file_path: string
          file_type: string | null
          id: string
          loja_id: string | null
          nome: string
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_validade?: string | null
          data_vencimento?: string | null
          file_path: string
          file_type?: string | null
          id?: string
          loja_id?: string | null
          nome: string
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_validade?: string | null
          data_vencimento?: string | null
          file_path?: string
          file_type?: string | null
          id?: string
          loja_id?: string | null
          nome?: string
          tipo?: string | null
          updated_at?: string | null
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
      pendencias: {
        Row: {
          created_at: string | null
          data_resolucao: string | null
          data_vencimento: string | null
          descricao: string | null
          id: string
          observacoes: string | null
          prioridade: string | null
          profissional_id: string | null
          responsavel: string | null
          status: string | null
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_resolucao?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          observacoes?: string | null
          prioridade?: string | null
          profissional_id?: string | null
          responsavel?: string | null
          status?: string | null
          tipo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_resolucao?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          observacoes?: string | null
          prioridade?: string | null
          profissional_id?: string | null
          responsavel?: string | null
          status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pendencias_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      pensoes_alimenticias: {
        Row: {
          agencia: string | null
          ativo: boolean | null
          banco: string | null
          base_calculo: string | null
          chave_pix: string | null
          conta: string | null
          cpf_beneficiario: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          data_nascimento_filho: string | null
          id: string
          nome_beneficiario: string
          nome_filho: string | null
          observacoes: string | null
          operacao: string | null
          percentual: number | null
          profissional_id: string | null
          tipo_calculo: string
          tipo_conta: string | null
          updated_at: string | null
          valor_fixo: number | null
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean | null
          banco?: string | null
          base_calculo?: string | null
          chave_pix?: string | null
          conta?: string | null
          cpf_beneficiario?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          data_nascimento_filho?: string | null
          id?: string
          nome_beneficiario: string
          nome_filho?: string | null
          observacoes?: string | null
          operacao?: string | null
          percentual?: number | null
          profissional_id?: string | null
          tipo_calculo?: string
          tipo_conta?: string | null
          updated_at?: string | null
          valor_fixo?: number | null
        }
        Update: {
          agencia?: string | null
          ativo?: boolean | null
          banco?: string | null
          base_calculo?: string | null
          chave_pix?: string | null
          conta?: string | null
          cpf_beneficiario?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          data_nascimento_filho?: string | null
          id?: string
          nome_beneficiario?: string
          nome_filho?: string | null
          observacoes?: string | null
          operacao?: string | null
          percentual?: number | null
          profissional_id?: string | null
          tipo_calculo?: string
          tipo_conta?: string | null
          updated_at?: string | null
          valor_fixo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pensoes_alimenticias_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_documents: {
        Row: {
          categoria: string | null
          created_at: string | null
          data_validade: string | null
          data_vencimento: string | null
          file_path: string
          file_type: string | null
          id: string
          nome: string
          profissional_id: string | null
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          data_validade?: string | null
          data_vencimento?: string | null
          file_path: string
          file_type?: string | null
          id?: string
          nome: string
          profissional_id?: string | null
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          data_validade?: string | null
          data_vencimento?: string | null
          file_path?: string
          file_type?: string | null
          id?: string
          nome?: string
          profissional_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_documents_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_vales: {
        Row: {
          created_at: string | null
          data_lancamento: string
          descricao: string | null
          documento_id: string | null
          id: string
          profissional_id: string | null
          status: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_lancamento: string
          descricao?: string | null
          documento_id?: string | null
          id?: string
          profissional_id?: string | null
          status?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          data_lancamento?: string
          descricao?: string | null
          documento_id?: string | null
          id?: string
          profissional_id?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
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
            foreignKeyName: "professional_vales_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          aviso_trabalhado: boolean | null
          bairro: string | null
          bem_mais: boolean | null
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
          loja_registro_id: string | null
          matricula: string
          motivo_demissao: string | null
          nome: string
          odonto: boolean | null
          pensao_alimenticia: number | null
          pis: string | null
          primeiro_salario: number | null
          rg: string | null
          salario_nominal: number | null
          seguro_vida: boolean | null
          setor: string | null
          sexo: string | null
          sindicato: string | null
          status: string | null
          telefone: string | null
          ultimo_salario: number | null
          updated_at: string | null
          vale_alimentacao: boolean | null
          vale_carne: boolean | null
          vale_refeicao: boolean | null
          vale_transporte: boolean | null
          validade_cnh: string | null
          valor_bem_mais: number | null
          valor_diario_rota: number | null
          valor_odonto: number | null
          valor_seguro_vida: number | null
          valor_vale_alimentacao: number | null
          valor_vale_carne: number | null
        }
        Insert: {
          aviso_trabalhado?: boolean | null
          bairro?: string | null
          bem_mais?: boolean | null
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
          loja_registro_id?: string | null
          matricula: string
          motivo_demissao?: string | null
          nome: string
          odonto?: boolean | null
          pensao_alimenticia?: number | null
          pis?: string | null
          primeiro_salario?: number | null
          rg?: string | null
          salario_nominal?: number | null
          seguro_vida?: boolean | null
          setor?: string | null
          sexo?: string | null
          sindicato?: string | null
          status?: string | null
          telefone?: string | null
          ultimo_salario?: number | null
          updated_at?: string | null
          vale_alimentacao?: boolean | null
          vale_carne?: boolean | null
          vale_refeicao?: boolean | null
          vale_transporte?: boolean | null
          validade_cnh?: string | null
          valor_bem_mais?: number | null
          valor_diario_rota?: number | null
          valor_odonto?: number | null
          valor_seguro_vida?: number | null
          valor_vale_alimentacao?: number | null
          valor_vale_carne?: number | null
        }
        Update: {
          aviso_trabalhado?: boolean | null
          bairro?: string | null
          bem_mais?: boolean | null
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
          loja_registro_id?: string | null
          matricula?: string
          motivo_demissao?: string | null
          nome?: string
          odonto?: boolean | null
          pensao_alimenticia?: number | null
          pis?: string | null
          primeiro_salario?: number | null
          rg?: string | null
          salario_nominal?: number | null
          seguro_vida?: boolean | null
          setor?: string | null
          sexo?: string | null
          sindicato?: string | null
          status?: string | null
          telefone?: string | null
          ultimo_salario?: number | null
          updated_at?: string | null
          vale_alimentacao?: boolean | null
          vale_carne?: boolean | null
          vale_refeicao?: boolean | null
          vale_transporte?: boolean | null
          validade_cnh?: string | null
          valor_bem_mais?: number | null
          valor_diario_rota?: number | null
          valor_odonto?: number | null
          valor_seguro_vida?: number | null
          valor_vale_alimentacao?: number | null
          valor_vale_carne?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissionais_loja_registro_id_fkey"
            columns: ["loja_registro_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          loja_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          loja_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          loja_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          id: string
          modulo: string
          pode_deletar: boolean | null
          pode_editar: boolean | null
          pode_visualizar: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          modulo: string
          pode_deletar?: boolean | null
          pode_editar?: boolean | null
          pode_visualizar?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          modulo?: string
          pode_deletar?: boolean | null
          pode_editar?: boolean | null
          pode_visualizar?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          loja_id: string | null
          nome: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          loja_id?: string | null
          nome?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          loja_id?: string | null
          nome?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      vale_transporte_detalhado: {
        Row: {
          created_at: string | null
          dias_afastamento: number | null
          dias_atestado: number | null
          dias_falta: number | null
          dias_ferias: number | null
          dias_trabalhados: number
          escala: string | null
          id: string
          mes_referencia: string
          observacoes: string | null
          percentual_desconto_folha: number | null
          profissional_id: string | null
          total_dias_desconto: number | null
          updated_at: string | null
          valor_desconto: number | null
          valor_desconto_folha: number | null
          valor_diario: number
          valor_liquido: number
          valor_total_bruto: number
        }
        Insert: {
          created_at?: string | null
          dias_afastamento?: number | null
          dias_atestado?: number | null
          dias_falta?: number | null
          dias_ferias?: number | null
          dias_trabalhados: number
          escala?: string | null
          id?: string
          mes_referencia: string
          observacoes?: string | null
          percentual_desconto_folha?: number | null
          profissional_id?: string | null
          total_dias_desconto?: number | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_desconto_folha?: number | null
          valor_diario: number
          valor_liquido: number
          valor_total_bruto: number
        }
        Update: {
          created_at?: string | null
          dias_afastamento?: number | null
          dias_atestado?: number | null
          dias_falta?: number | null
          dias_ferias?: number | null
          dias_trabalhados?: number
          escala?: string | null
          id?: string
          mes_referencia?: string
          observacoes?: string | null
          percentual_desconto_folha?: number | null
          profissional_id?: string | null
          total_dias_desconto?: number | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_desconto_folha?: number | null
          valor_diario?: number
          valor_liquido?: number
          valor_total_bruto?: number
        }
        Relationships: [
          {
            foreignKeyName: "vale_transporte_detalhado_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_min_role: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_first_user: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "gerente" | "operador"
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
    Enums: {
      app_role: ["admin", "gerente", "operador"],
    },
  },
} as const
