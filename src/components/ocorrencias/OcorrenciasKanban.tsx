import { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ocorrencia, OcorrenciaStatus, OcorrenciaPrioridade } from '@/hooks/useOcorrencias';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OcorrenciasKanbanProps {
  ocorrencias: Ocorrencia[];
  onStatusChange: (id: string, newStatus: OcorrenciaStatus) => void;
  onViewDetails: (ocorrencia: Ocorrencia) => void;
}

const statusConfig: Record<OcorrenciaStatus, { label: string; icon: any; color: string }> = {
  pendente: { label: 'Pendentes', icon: Clock, color: 'bg-amber-500/10 border-amber-500/30' },
  em_andamento: { label: 'Em Andamento', icon: AlertTriangle, color: 'bg-blue-500/10 border-blue-500/30' },
  concluida: { label: 'Concluídas', icon: CheckCircle, color: 'bg-emerald-500/10 border-emerald-500/30' },
  cancelada: { label: 'Canceladas', icon: XCircle, color: 'bg-gray-500/10 border-gray-500/30' },
};

const prioridadeConfig: Record<OcorrenciaPrioridade, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  baixa: { label: 'Baixa', variant: 'secondary' },
  media: { label: 'Média', variant: 'outline' },
  alta: { label: 'Alta', variant: 'default' },
  critica: { label: 'Crítica', variant: 'destructive' },
};

function OcorrenciaCard({ 
  ocorrencia, 
  onStatusChange, 
  onViewDetails 
}: { 
  ocorrencia: Ocorrencia; 
  onStatusChange: (id: string, status: OcorrenciaStatus) => void;
  onViewDetails: (ocorrencia: Ocorrencia) => void;
}) {
  const prioridade = prioridadeConfig[ocorrencia.prioridade] || prioridadeConfig.media;
  const isVencida = ocorrencia.data_prazo && 
    new Date(ocorrencia.data_prazo) < new Date() && 
    ocorrencia.status !== 'concluida';

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${isVencida ? 'border-red-500/50' : ''}`}
      onClick={() => onViewDetails(ocorrencia)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2">{ocorrencia.titulo}</h4>
          <Badge variant={prioridade.variant} className="shrink-0 text-xs">
            {prioridade.label}
          </Badge>
        </div>

        {ocorrencia.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {ocorrencia.descricao}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {ocorrencia.profissional && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{ocorrencia.profissional.nome}</span>
            </div>
          )}
          
          {ocorrencia.data_prazo && (
            <div className={`flex items-center gap-1 ${isVencida ? 'text-red-500' : ''}`}>
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(ocorrencia.data_prazo), 'dd/MM', { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <div className="flex gap-1 pt-2">
          {ocorrencia.status === 'pendente' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(ocorrencia.id, 'em_andamento');
              }}
            >
              Iniciar
            </Button>
          )}
          {ocorrencia.status === 'em_andamento' && (
            <Button 
              size="sm" 
              variant="default" 
              className="flex-1 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(ocorrencia.id, 'concluida');
              }}
            >
              Concluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OcorrenciasKanban({ ocorrencias, onStatusChange, onViewDetails }: OcorrenciasKanbanProps) {
  const columns: OcorrenciaStatus[] = ['pendente', 'em_andamento', 'concluida'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((status) => {
        const config = statusConfig[status];
        const Icon = config.icon;
        const columnOcorrencias = ocorrencias.filter(o => o.status === status);

        return (
          <Card key={status} className={`${config.color}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4" />
                {config.label}
                <Badge variant="secondary" className="ml-auto">
                  {columnOcorrencias.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                <div className="space-y-3">
                  {columnOcorrencias.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma ocorrência
                    </p>
                  ) : (
                    columnOcorrencias.map((ocorrencia) => (
                      <OcorrenciaCard
                        key={ocorrencia.id}
                        ocorrencia={ocorrencia}
                        onStatusChange={onStatusChange}
                        onViewDetails={onViewDetails}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
