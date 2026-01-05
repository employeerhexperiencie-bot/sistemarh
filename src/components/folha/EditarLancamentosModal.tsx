import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, DollarSign, AlertTriangle, FileText, Loader2 } from 'lucide-react';

interface Falta {
  id: string;
  data_falta: string;
  tipo: string;
  motivo: string | null;
}

interface Vale {
  id: string;
  valor: number;
  data_lancamento: string;
  tipo: string;
  descricao: string | null;
  status: string | null;
}

interface EditarLancamentosModalProps {
  open: boolean;
  onClose: () => void;
  profissional: {
    id: string;
    nome: string;
    matricula: string;
  } | null;
  competencia: string;
  onDataUpdated: () => void;
}

export function EditarLancamentosModal({
  open,
  onClose,
  profissional,
  competencia,
  onDataUpdated,
}: EditarLancamentosModalProps) {
  const [activeTab, setActiveTab] = useState('faltas');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dados
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);
  
  // Novos lançamentos
  const [novaFalta, setNovaFalta] = useState({
    data_falta: '',
    tipo: 'injustificada',
    motivo: '',
  });
  const [novoVale, setNovoVale] = useState({
    valor: '',
    data_lancamento: '',
    tipo: 'adiantamento',
    descricao: '',
  });

  // Carregar dados do profissional
  useEffect(() => {
    if (open && profissional) {
      carregarDados();
    }
  }, [open, profissional, competencia]);

  const carregarDados = async () => {
    if (!profissional) return;
    
    setIsLoading(true);
    try {
      const [ano, mes] = competencia.split('-').map(Number);
      const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];

      const [faltasRes, valesRes] = await Promise.all([
        supabase
          .from('faltas')
          .select('*')
          .eq('profissional_id', profissional.id)
          .gte('data_falta', inicioMes)
          .lte('data_falta', fimMes)
          .order('data_falta', { ascending: false }),
        
        supabase
          .from('professional_vales')
          .select('*')
          .eq('profissional_id', profissional.id)
          .gte('data_lancamento', inicioMes)
          .lte('data_lancamento', fimMes)
          .order('data_lancamento', { ascending: false }),
      ]);

      if (faltasRes.data) setFaltas(faltasRes.data);
      if (valesRes.data) setVales(valesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const adicionarFalta = async () => {
    if (!profissional || !novaFalta.data_falta) {
      toast.error('Preencha a data da falta');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('faltas').insert({
        profissional_id: profissional.id,
        data_falta: novaFalta.data_falta,
        tipo: novaFalta.tipo,
        motivo: novaFalta.motivo || null,
      });

      if (error) throw error;

      toast.success('Falta registrada com sucesso');
      setNovaFalta({ data_falta: '', tipo: 'injustificada', motivo: '' });
      carregarDados();
      onDataUpdated();
    } catch (error) {
      console.error('Erro ao adicionar falta:', error);
      toast.error('Erro ao registrar falta');
    } finally {
      setIsSaving(false);
    }
  };

  const removerFalta = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('faltas').delete().eq('id', id);
      if (error) throw error;

      toast.success('Falta removida');
      carregarDados();
      onDataUpdated();
    } catch (error) {
      console.error('Erro ao remover falta:', error);
      toast.error('Erro ao remover falta');
    } finally {
      setIsSaving(false);
    }
  };

  const adicionarVale = async () => {
    if (!profissional || !novoVale.valor || !novoVale.data_lancamento) {
      toast.error('Preencha valor e data do vale');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('professional_vales').insert({
        profissional_id: profissional.id,
        valor: parseFloat(novoVale.valor),
        data_lancamento: novoVale.data_lancamento,
        tipo: novoVale.tipo,
        descricao: novoVale.descricao || null,
        status: 'pendente',
      });

      if (error) throw error;

      toast.success('Vale registrado com sucesso');
      setNovoVale({ valor: '', data_lancamento: '', tipo: 'adiantamento', descricao: '' });
      carregarDados();
      onDataUpdated();
    } catch (error) {
      console.error('Erro ao adicionar vale:', error);
      toast.error('Erro ao registrar vale');
    } finally {
      setIsSaving(false);
    }
  };

  const removerVale = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('professional_vales').delete().eq('id', id);
      if (error) throw error;

      toast.success('Vale removido');
      carregarDados();
      onDataUpdated();
    } catch (error) {
      console.error('Erro ao remover vale:', error);
      toast.error('Erro ao remover vale');
    } finally {
      setIsSaving(false);
    }
  };

  const atualizarStatusVale = async (id: string, novoStatus: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('professional_vales')
        .update({ status: novoStatus })
        .eq('id', id);
      
      if (error) throw error;

      toast.success('Status atualizado');
      carregarDados();
      onDataUpdated();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getTipoFaltaBadge = (tipo: string) => {
    if (tipo === 'justificada' || tipo === 'atestado') {
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Atestado</Badge>;
    }
    return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Injustificada</Badge>;
  };

  const getStatusValeBadge = (status: string | null) => {
    switch (status) {
      case 'pago':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Pago</Badge>;
      case 'descontado':
        return <Badge variant="outline" className="bg-info/10 text-info border-info/20">Descontado</Badge>;
      default:
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pendente</Badge>;
    }
  };

  if (!profissional) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Lançamentos - {profissional.nome}
          </DialogTitle>
          <DialogDescription>
            Matrícula: {profissional.matricula} • Competência: {competencia}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faltas" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Faltas ({faltas.length})
            </TabsTrigger>
            <TabsTrigger value="vales" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Vales ({vales.length})
            </TabsTrigger>
          </TabsList>

          {/* Faltas Tab */}
          <TabsContent value="faltas" className="flex-1 flex flex-col overflow-hidden space-y-4">
            {/* Formulário de Nova Falta */}
            <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Registrar Nova Falta
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Data</Label>
                  <Input
                    type="date"
                    value={novaFalta.data_falta}
                    onChange={(e) => setNovaFalta(prev => ({ ...prev, data_falta: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={novaFalta.tipo}
                    onValueChange={(v) => setNovaFalta(prev => ({ ...prev, tipo: v }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="injustificada">Injustificada</SelectItem>
                      <SelectItem value="justificada">Atestado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Motivo (opcional)</Label>
                  <Input
                    value={novaFalta.motivo}
                    onChange={(e) => setNovaFalta(prev => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Ex: consulta médica"
                    className="h-9"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={adicionarFalta} disabled={isSaving} className="w-full h-9">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="ml-2">Adicionar</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Faltas */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : faltas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma falta registrada nesta competência
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faltas.map((falta) => (
                      <TableRow key={falta.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(falta.data_falta)}
                        </TableCell>
                        <TableCell>{getTipoFaltaBadge(falta.tipo)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {falta.motivo || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removerFalta(falta.id)}
                            disabled={isSaving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Vales Tab */}
          <TabsContent value="vales" className="flex-1 flex flex-col overflow-hidden space-y-4">
            {/* Formulário de Novo Vale */}
            <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Registrar Novo Vale
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={novoVale.valor}
                    onChange={(e) => setNovoVale(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="100.00"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data</Label>
                  <Input
                    type="date"
                    value={novoVale.data_lancamento}
                    onChange={(e) => setNovoVale(prev => ({ ...prev, data_lancamento: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={novoVale.tipo}
                    onValueChange={(v) => setNovoVale(prev => ({ ...prev, tipo: v }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adiantamento">Adiantamento</SelectItem>
                      <SelectItem value="vale">Vale</SelectItem>
                      <SelectItem value="desconto">Desconto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    value={novoVale.descricao}
                    onChange={(e) => setNovoVale(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Ex: vale farmácia"
                    className="h-9"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={adicionarVale} disabled={isSaving} className="w-full h-9">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="ml-2">Adicionar</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Vales */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : vales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum vale registrado nesta competência
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vales.map((vale) => (
                      <TableRow key={vale.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(vale.data_lancamento)}
                        </TableCell>
                        <TableCell className="capitalize text-sm">{vale.tipo}</TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(vale.valor)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {vale.descricao || '-'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={vale.status || 'pendente'}
                            onValueChange={(v) => atualizarStatusVale(vale.id, v)}
                          >
                            <SelectTrigger className="h-7 w-28 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="descontado">Descontado</SelectItem>
                              <SelectItem value="pago">Pago</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removerVale(vale.id)}
                            disabled={isSaving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
