import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertTriangle, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuditLog } from '@/contexts/AuditLogContext';

interface AdvertenciasManagerProps {
  professionalId: string;
  professionalName: string;
}

interface Advertencia {
  id: string;
  profissional_id: string;
  data_ocorrencia: string;
  tipo: 'verbal' | 'escrita' | 'suspensao';
  motivo: string;
  descricao: string;
  documento_id?: string;
  created_at: string;
}

export const AdvertenciasManager: React.FC<AdvertenciasManagerProps> = ({
  professionalId,
  professionalName
}) => {
  const [advertencias, setAdvertencias] = useState<Advertencia[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: 'verbal' as 'verbal' | 'escrita' | 'suspensao',
    motivo: '',
    descricao: '',
  });
  const { toast } = useToast();
  const { addLog } = useAuditLog();

  const loadAdvertencias = async () => {
    try {
      const { data, error } = await supabase
        .from('advertencias')
        .select('*')
        .eq('profissional_id', professionalId)
        .order('data_ocorrencia', { ascending: false });

      if (error) throw error;
      setAdvertencias(data || []);
    } catch (error) {
      console.error('Load advertencias error:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.data || !formData.tipo || !formData.motivo || !formData.descricao) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const advertenciaData = {
        profissional_id: professionalId,
        data_ocorrencia: formData.data,
        tipo: formData.tipo,
        motivo: formData.motivo,
        descricao: formData.descricao,
      };

      const { data: inserted, error } = await supabase
        .from('advertencias')
        .insert([advertenciaData])
        .select()
        .single();

      if (error) throw error;
      loadAdvertencias();

      addLog({
        usuario: 'Sistema',
        acao: 'CRIAR',
        modulo: 'ADVERTENCIAS',
        entidade: professionalName,
        detalhes: `Advertência ${formData.tipo} registrada: ${formData.motivo}`,
        metadata: { tipo: formData.tipo, motivo: formData.motivo }
      });

      toast({
        title: "Sucesso",
        description: "Advertência registrada com sucesso"
      });

      handleCloseDialog();
    } catch (error) {
      console.error('Save advertencia error:', error);
      toast({
        title: "Erro ao salvar advertência",
        description: String((error as { message?: string })?.message || 'Erro desconhecido'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta advertência?')) return;

    try {
      const { error } = await supabase
        .from('advertencias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadAdvertencias();

      addLog({
        usuario: 'Sistema',
        acao: 'EXCLUIR',
        modulo: 'ADVERTENCIAS',
        entidade: professionalName,
        detalhes: `Advertência excluída`,
        metadata: { advertenciaId: id }
      });

      toast({
        title: "Sucesso",
        description: "Advertência excluída com sucesso"
      });
    } catch (error) {
      console.error('Delete advertencia error:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir advertência",
        variant: "destructive"
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      data: new Date().toISOString().split('T')[0],
      tipo: 'verbal',
      motivo: '',
      descricao: '',
    });
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'verbal':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Verbal</Badge>;
      case 'escrita':
        return <Badge variant="default" className="bg-accent/10 text-accent border-accent/20">Escrita</Badge>;
      case 'suspensao':
        return <Badge variant="destructive">Suspensão</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const getSeveridadeColor = (tipo: string) => {
    switch (tipo) {
      case 'verbal':
        return 'text-warning';
      case 'escrita':
        return 'text-accent';
      case 'suspensao':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  useEffect(() => {
    loadAdvertencias();
  }, [professionalId]);

  const advertenciasVerbais = advertencias.filter(a => a.tipo === 'verbal').length;
  const advertenciasEscritas = advertencias.filter(a => a.tipo === 'escrita').length;
  const suspensoes = advertencias.filter(a => a.tipo === 'suspensao').length;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold">{advertencias.length}</p>
                <p className="text-xs text-muted-foreground">Total Advertências</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-warning">{advertenciasVerbais}</p>
                <p className="text-xs text-muted-foreground">Verbais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-accent">{advertenciasEscritas}</p>
                <p className="text-xs text-muted-foreground">Escritas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-destructive">{suspensoes}</p>
                <p className="text-xs text-muted-foreground">Suspensões</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Histórico de Advertências</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Advertência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nova Advertência</DialogTitle>
              <DialogDescription>
                Registre uma advertência para {professionalName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verbal">Verbal</SelectItem>
                      <SelectItem value="escrita">Escrita</SelectItem>
                      <SelectItem value="suspensao">Suspensão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Input
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ex: Atraso, Falta injustificada, Conduta inadequada..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição Detalhada *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva detalhadamente o ocorrido..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Salvando...' : 'Registrar Advertência'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de Advertências */}
      <Card>
        <CardContent className="p-0">
          {advertencias.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma advertência registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advertencias.map((adv) => (
                    <TableRow key={adv.id}>
                      <TableCell>
                        {new Date(adv.data_ocorrencia).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{getTipoBadge(adv.tipo)}</TableCell>
                      <TableCell className="font-medium">{adv.motivo}</TableCell>
                      <TableCell className="max-w-xs truncate" title={adv.descricao}>
                        {adv.descricao}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(adv.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
