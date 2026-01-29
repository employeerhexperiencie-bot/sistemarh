import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateOcorrenciaData, OcorrenciaPrioridade } from '@/hooks/useOcorrencias';
import { supabase } from '@/integrations/supabase/client';
import { useUsuariosTenant } from '@/hooks/useUsuariosTenant';
import { useAuth } from '@/contexts/AuthContext';

interface NovaOcorrenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateOcorrenciaData) => Promise<any>;
}

const tiposOcorrencia = [
  { value: 'documento_pendente', label: 'Documento Pendente' },
  { value: 'exame_vencendo', label: 'Exame Vencendo' },
  { value: 'ferias_pendente', label: 'Férias Pendentes' },
  { value: 'advertencia', label: 'Advertência' },
  { value: 'afastamento', label: 'Afastamento' },
  { value: 'integracao', label: 'Erro de Integração' },
  { value: 'outros', label: 'Outros' },
];

export function NovaOcorrenciaModal({ open, onOpenChange, onSubmit }: NovaOcorrenciaModalProps) {
  const [loading, setLoading] = useState(false);
  const [profissionais, setProfissionais] = useState<{ id: string; nome: string; matricula: string }[]>([]);
  const { usuarios } = useUsuariosTenant();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [formData, setFormData] = useState<CreateOcorrenciaData>({
    tipo: '',
    titulo: '',
    descricao: '',
    prioridade: 'media',
    profissional_id: undefined,
    executor_id: undefined,
    data_prazo: '',
    sla_horas: 48,
    observacoes: '',
  });

  useEffect(() => {
    async function fetchProfissionais() {
      const { data } = await supabase
        .from('profissionais')
        .select('id, nome, matricula')
        .eq('status', 'ativo')
        .order('nome');
      
      if (data) {
        setProfissionais(data);
      }
    }

    if (open) {
      fetchProfissionais();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tipo || !formData.titulo) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        tipo: '',
        titulo: '',
        descricao: '',
        prioridade: 'media',
        profissional_id: undefined,
        executor_id: undefined,
        data_prazo: '',
        sla_horas: 48,
        observacoes: '',
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Ocorrência</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposOcorrencia.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => setFormData(prev => ({ ...prev, prioridade: value as OcorrenciaPrioridade }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              placeholder="Título da ocorrência"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descrição detalhada da ocorrência"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profissional Relacionado</Label>
              <Select
                value={formData.profissional_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, profissional_id: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.matricula} - {prof.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <Label>Atribuir a Usuário</Label>
                <Select
                  value={formData.executor_id || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, executor_id: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um executor" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.user_id} value={usuario.user_id}>
                        {usuario.nome || usuario.email} ({usuario.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Prazo</Label>
              <Input
                type="datetime-local"
                value={formData.data_prazo}
                onChange={(e) => setFormData(prev => ({ ...prev, data_prazo: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>SLA (horas)</Label>
              <Input
                type="number"
                min={1}
                value={formData.sla_horas}
                onChange={(e) => setFormData(prev => ({ ...prev, sla_horas: parseInt(e.target.value) || 48 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações adicionais"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.tipo || !formData.titulo}>
              {loading ? 'Criando...' : 'Criar Ocorrência'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
