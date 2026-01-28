import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, UserPlus, AlertTriangle, Clock, Send, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUsuariosTenant } from '@/hooks/useUsuariosTenant';
import { cn } from '@/lib/utils';
import { Alerta, NivelAlerta } from './AlertasAutomaticos';
import { OcorrenciaPrioridade } from '@/hooks/useOcorrencias';

interface DelegarAlertaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerta: Alerta | null;
  onDelegar: (data: DelegarAlertaData) => Promise<void>;
}

export interface DelegarAlertaData {
  alerta: Alerta;
  executor_id: string;
  prioridade: OcorrenciaPrioridade;
  data_prazo: string;
  observacoes: string;
}

const nivelToPrioridade: Record<NivelAlerta, OcorrenciaPrioridade> = {
  critico: 'critica',
  urgente: 'alta',
  atencao: 'media',
  info: 'baixa',
};

const prioridadeConfig: Record<OcorrenciaPrioridade, { label: string; color: string }> = {
  critica: { label: 'Crítica', color: 'bg-destructive text-destructive-foreground' },
  alta: { label: 'Alta', color: 'bg-accent text-accent-foreground' },
  media: { label: 'Média', color: 'bg-warning text-warning-foreground' },
  baixa: { label: 'Baixa', color: 'bg-muted text-muted-foreground' },
};

export function DelegarAlertaModal({ open, onOpenChange, alerta, onDelegar }: DelegarAlertaModalProps) {
  const { usuarios, loading: loadingUsuarios } = useUsuariosTenant();
  const [executorId, setExecutorId] = useState<string>('');
  const [prioridade, setPrioridade] = useState<OcorrenciaPrioridade>(
    alerta ? nivelToPrioridade[alerta.nivel] || 'media' : 'media'
  );
  const [dataPrazo, setDataPrazo] = useState<Date | undefined>(
    alerta && alerta.diasRestantes > 0 
      ? addDays(new Date(), Math.min(alerta.diasRestantes, 7)) 
      : addDays(new Date(), 3)
  );
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!alerta || !executorId || !dataPrazo) return;

    setSubmitting(true);
    try {
      await onDelegar({
        alerta,
        executor_id: executorId,
        prioridade,
        data_prazo: dataPrazo.toISOString(),
        observacoes,
      });
      onOpenChange(false);
      // Reset form
      setExecutorId('');
      setObservacoes('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!alerta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Delegar Alerta para Ocorrência
          </DialogTitle>
          <DialogDescription>
            Transforme este alerta em uma tarefa atribuída a um membro da equipe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info do Alerta */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={cn(
                "h-4 w-4",
                alerta.nivel === 'critico' && "text-destructive",
                alerta.nivel === 'urgente' && "text-accent",
                alerta.nivel === 'atencao' && "text-warning",
                alerta.nivel === 'info' && "text-muted-foreground"
              )} />
              <span className="font-medium text-sm">{alerta.titulo}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{alerta.descricao}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{alerta.loja}</Badge>
              {alerta.profissional && (
                <Badge variant="secondary" className="text-[10px]">{alerta.profissional}</Badge>
              )}
              <Badge className={cn("text-[10px]", prioridadeConfig[nivelToPrioridade[alerta.nivel]].color)}>
                {alerta.diasRestantes <= 0 ? 'Vencido' : `${alerta.diasRestantes}d restantes`}
              </Badge>
            </div>
          </div>

          {/* Executor */}
          <div className="space-y-2">
            <Label>Atribuir para *</Label>
            <Select value={executorId} onValueChange={setExecutorId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingUsuarios ? "Carregando..." : "Selecione o responsável"} />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.user_id} value={usuario.user_id}>
                    <div className="flex items-center gap-2">
                      <span>{usuario.nome || usuario.email}</span>
                      <Badge variant="outline" className="text-[10px]">{usuario.role}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={prioridade} onValueChange={(v) => setPrioridade(v as OcorrenciaPrioridade)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(prioridadeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", config.color)}>{config.label}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Prazo */}
          <div className="space-y-2">
            <Label>Prazo para resolução *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataPrazo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataPrazo ? format(dataPrazo, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataPrazo}
                  onSelect={setDataPrazo}
                  disabled={(date) => date < new Date()}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações / Instruções</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva o que precisa ser feito..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!executorId || !dataPrazo || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Delegar Tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
