import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type OcorrenciaStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
export type OcorrenciaPrioridade = 'baixa' | 'media' | 'alta' | 'critica';

export interface Ocorrencia {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  prioridade: OcorrenciaPrioridade;
  status: OcorrenciaStatus;
  profissional_id: string | null;
  responsavel: string | null;
  executor_id: string | null;
  criado_por: string | null;
  data_vencimento: string | null;
  data_prazo: string | null;
  data_inicio_execucao: string | null;
  data_conclusao: string | null;
  data_resolucao: string | null;
  sla_horas: number;
  alerta_enviado: boolean;
  alerta_critico_enviado: boolean;
  observacoes: string | null;
  historico: any[];
  created_at: string;
  updated_at: string;
  tenant_id: string;
  // Relacionamentos
  profissional?: {
    nome: string;
    matricula: string;
  };
}

export interface CreateOcorrenciaData {
  tipo: string;
  titulo: string;
  descricao?: string;
  prioridade?: OcorrenciaPrioridade;
  profissional_id?: string;
  responsavel?: string;
  executor_id?: string;
  data_prazo?: string;
  sla_horas?: number;
  observacoes?: string;
}

export interface UpdateOcorrenciaData {
  titulo?: string;
  descricao?: string;
  prioridade?: OcorrenciaPrioridade;
  status?: OcorrenciaStatus;
  responsavel?: string;
  executor_id?: string;
  data_prazo?: string;
  observacoes?: string;
}

export function useOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchOcorrencias = useCallback(async (filters?: {
    status?: OcorrenciaStatus;
    prioridade?: OcorrenciaPrioridade;
    tipo?: string;
    profissional_id?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('pendencias')
        .select(`
          *,
          profissional:profissionais(nome, matricula)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.prioridade) {
        query = query.eq('prioridade', filters.prioridade);
      }
      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.profissional_id) {
        query = query.eq('profissional_id', filters.profissional_id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setOcorrencias((data || []) as unknown as Ocorrencia[]);
    } catch (err: any) {
      console.error('Erro ao buscar ocorrências:', err);
      setError(err.message);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar ocorrências',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createOcorrencia = useCallback(async (data: CreateOcorrenciaData) => {
    try {
      const { data: newOcorrencia, error: createError } = await supabase
        .from('pendencias')
        .insert({
          ...data,
          status: 'pendente',
          criado_por: user?.id,
          historico: [{
            acao: 'criada',
            usuario: user?.name || user?.email,
            data: new Date().toISOString(),
          }],
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      toast({
        title: 'Sucesso',
        description: 'Ocorrência criada com sucesso',
      });

      await fetchOcorrencias();
      return newOcorrencia;
    } catch (err: any) {
      console.error('Erro ao criar ocorrência:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao criar ocorrência',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, fetchOcorrencias]);

  const updateOcorrencia = useCallback(async (id: string, data: UpdateOcorrenciaData) => {
    try {
      // Buscar ocorrência atual para histórico
      const { data: current } = await supabase
        .from('pendencias')
        .select('historico, status')
        .eq('id', id)
        .single();

      const historico = Array.isArray(current?.historico) ? current.historico : [];
      
      // Adicionar entrada no histórico
      const novaEntrada = {
        acao: data.status ? `status_alterado_para_${data.status}` : 'atualizada',
        usuario: user?.name || user?.email,
        data: new Date().toISOString(),
        alteracoes: Object.keys(data),
      };

      const updatePayload: any = {
        ...data,
        historico: [...historico, novaEntrada],
      };

      // Se mudando para em_andamento, registrar início
      if (data.status === 'em_andamento' && current?.status !== 'em_andamento') {
        updatePayload.data_inicio_execucao = new Date().toISOString();
      }

      // Se mudando para concluída, registrar conclusão
      if (data.status === 'concluida') {
        updatePayload.data_conclusao = new Date().toISOString();
        updatePayload.data_resolucao = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('pendencias')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Sucesso',
        description: 'Ocorrência atualizada com sucesso',
      });

      await fetchOcorrencias();
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar ocorrência:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar ocorrência',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, fetchOcorrencias]);

  const deleteOcorrencia = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('pendencias')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      toast({
        title: 'Sucesso',
        description: 'Ocorrência removida com sucesso',
      });

      await fetchOcorrencias();
      return true;
    } catch (err: any) {
      console.error('Erro ao remover ocorrência:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao remover ocorrência',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchOcorrencias]);

  const getEstatisticas = useCallback(() => {
    const total = ocorrencias.length;
    const pendentes = ocorrencias.filter(o => o.status === 'pendente').length;
    const emAndamento = ocorrencias.filter(o => o.status === 'em_andamento').length;
    const concluidas = ocorrencias.filter(o => o.status === 'concluida').length;
    const criticas = ocorrencias.filter(o => o.prioridade === 'critica' && o.status !== 'concluida').length;
    const vencidas = ocorrencias.filter(o => {
      if (!o.data_prazo || o.status === 'concluida') return false;
      return new Date(o.data_prazo) < new Date();
    }).length;

    return { total, pendentes, emAndamento, concluidas, criticas, vencidas };
  }, [ocorrencias]);

  useEffect(() => {
    fetchOcorrencias();
  }, [fetchOcorrencias]);

  return {
    ocorrencias,
    loading,
    error,
    fetchOcorrencias,
    createOcorrencia,
    updateOcorrencia,
    deleteOcorrencia,
    getEstatisticas,
  };
}
