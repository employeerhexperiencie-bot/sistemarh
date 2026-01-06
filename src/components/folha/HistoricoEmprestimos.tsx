import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { History, Loader2, ArrowRight, Edit, CheckCircle, Pause, Play, Plus } from 'lucide-react';

interface HistoricoItem {
  id: string;
  acao: string;
  campoAlterado: string | null;
  valorAnterior: string | null;
  valorNovo: string | null;
  observacao: string | null;
  usuario: string | null;
  createdAt: string;
  profissional?: string;
}

interface HistoricoEmprestimosProps {
  emprestimoId?: string; // Se fornecido, filtra por empréstimo específico
  limit?: number;
}

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getAcaoConfig = (acao: string) => {
  const configs: Record<string, { label: string; icon: typeof Edit; className: string }> = {
    criacao: { label: 'Criação', icon: Plus, className: 'bg-success/10 text-success' },
    edicao: { label: 'Edição', icon: Edit, className: 'bg-info/10 text-info' },
    pagamento: { label: 'Pagamento', icon: CheckCircle, className: 'bg-success/10 text-success' },
    pausar: { label: 'Pausado', icon: Pause, className: 'bg-warning/10 text-warning' },
    reativar: { label: 'Reativado', icon: Play, className: 'bg-success/10 text-success' },
    quitar: { label: 'Quitado', icon: CheckCircle, className: 'bg-primary/10 text-primary' },
  };
  return configs[acao] || { label: acao, icon: Edit, className: 'bg-muted text-muted-foreground' };
};

export function HistoricoEmprestimos({ emprestimoId, limit = 50 }: HistoricoEmprestimosProps) {
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  useEffect(() => {
    loadHistorico();
  }, [emprestimoId]);

  const loadHistorico = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('historico_emprestimos')
        .select(`
          id,
          acao,
          campo_alterado,
          valor_anterior,
          valor_novo,
          observacao,
          usuario,
          created_at,
          profissionais:profissional_id (nome)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (emprestimoId) {
        query = query.eq('emprestimo_id', emprestimoId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const items: HistoricoItem[] = (data || []).map((h: any) => ({
        id: h.id,
        acao: h.acao,
        campoAlterado: h.campo_alterado,
        valorAnterior: h.valor_anterior,
        valorNovo: h.valor_novo,
        observacao: h.observacao,
        usuario: h.usuario,
        createdAt: h.created_at,
        profissional: h.profissionais?.nome
      }));

      setHistorico(items);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum histórico de alterações registrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4" />
          Histórico de Alterações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Alteração</TableHead>
                {!emprestimoId && <TableHead>Profissional</TableHead>}
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historico.map((h) => {
                const config = getAcaoConfig(h.acao);
                const Icon = config.icon;
                return (
                  <TableRow key={h.id} className="text-xs">
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(h.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${config.className}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {h.campoAlterado && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="font-medium text-foreground">{h.campoAlterado}:</span>
                          {h.valorAnterior && (
                            <>
                              <span className="text-destructive line-through">{h.valorAnterior}</span>
                              <ArrowRight className="h-3 w-3" />
                            </>
                          )}
                          <span className="text-success">{h.valorNovo}</span>
                        </div>
                      )}
                    </TableCell>
                    {!emprestimoId && (
                      <TableCell className="text-muted-foreground">
                        {h.profissional || '-'}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground max-w-32 truncate">
                      {h.observacao || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Função utilitária para registrar histórico
export async function registrarHistoricoEmprestimo(params: {
  emprestimoId: string;
  profissionalId?: string;
  acao: 'criacao' | 'edicao' | 'pagamento' | 'pausar' | 'reativar' | 'quitar';
  campoAlterado?: string;
  valorAnterior?: string | number | null;
  valorNovo?: string | number | null;
  observacao?: string;
}) {
  try {
    await supabase.from('historico_emprestimos').insert({
      emprestimo_id: params.emprestimoId,
      profissional_id: params.profissionalId || null,
      acao: params.acao,
      campo_alterado: params.campoAlterado || null,
      valor_anterior: params.valorAnterior?.toString() || null,
      valor_novo: params.valorNovo?.toString() || null,
      observacao: params.observacao || null,
      usuario: 'Sistema'
    });
  } catch (error) {
    console.error('Erro ao registrar histórico:', error);
  }
}
