import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, AlertTriangle, DollarSign, FileText, Loader2, X } from 'lucide-react';

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

interface EditarLancamentosDrawerProps {
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

export function EditarLancamentosDrawer({
  open,
  onClose,
  profissional,
  competencia,
  onDataUpdated,
}: EditarLancamentosDrawerProps) {
  const [activeTab, setActiveTab] = useState('faltas');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);
  
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

      toast.success('Falta registrada');
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

      toast.success('Vale registrado');
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
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Atestado</Badge>;
    }
    return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Falta</Badge>;
  };

  const getStatusValeBadge = (status: string | null) => {
    switch (status) {
      case 'pago':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">Pago</Badge>;
      case 'descontado':
        return <Badge variant="outline" className="bg-info/10 text-info border-info/20 text-xs">Descontado</Badge>;
      default:
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Pendente</Badge>;
    }
  };

  if (!profissional) return null;

  // Resumo dos lançamentos
  const totalFaltasInjust = faltas.filter(f => f.tipo === 'injustificada').length;
  const totalAtestados = faltas.filter(f => f.tipo !== 'injustificada').length;
  const totalVales = vales.reduce((acc, v) => acc + Number(v.valor), 0);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b bg-muted/30">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Lançamentos
              </SheetTitle>
              <SheetDescription className="mt-1">
                <span className="font-medium text-foreground">{profissional.nome}</span>
                <span className="mx-2">•</span>
                <span className="font-mono text-xs">{profissional.matricula}</span>
              </SheetDescription>
            </div>
          </div>
          
          {/* Resumo Rápido */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-background rounded-lg p-3 text-center border">
              <p className="text-2xl font-bold text-destructive">{totalFaltasInjust}</p>
              <p className="text-xs text-muted-foreground">Faltas</p>
            </div>
            <div className="flex-1 bg-background rounded-lg p-3 text-center border">
              <p className="text-2xl font-bold text-warning">{totalAtestados}</p>
              <p className="text-xs text-muted-foreground">Atestados</p>
            </div>
            <div className="flex-1 bg-background rounded-lg p-3 text-center border">
              <p className="text-lg font-bold font-mono">{formatCurrency(totalVales)}</p>
              <p className="text-xs text-muted-foreground">Vales</p>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-4" style={{ width: 'calc(100% - 48px)' }}>
            <TabsTrigger value="faltas" className="gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Faltas ({faltas.length})
            </TabsTrigger>
            <TabsTrigger value="vales" className="gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              Vales ({vales.length})
            </TabsTrigger>
          </TabsList>

          {/* Faltas Tab */}
          <TabsContent value="faltas" className="flex-1 flex flex-col overflow-hidden mt-0 px-6 pb-6">
            {/* Form Nova Falta */}
            <div className="py-4 space-y-3 border-b">
              <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                <Plus className="h-4 w-4" />
                Nova Falta
              </h4>
              <div className="grid grid-cols-2 gap-3">
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
                      <SelectItem value="injustificada">Falta</SelectItem>
                      <SelectItem value="justificada">Atestado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={novaFalta.motivo}
                  onChange={(e) => setNovaFalta(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Motivo (opcional)"
                  className="h-9 flex-1"
                />
                <Button onClick={adicionarFalta} disabled={isSaving} size="sm" className="h-9">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Lista de Faltas */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : faltas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma falta registrada
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  {faltas.map((falta) => (
                    <div key={falta.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm">{formatDate(falta.data_falta)}</span>
                        {getTipoFaltaBadge(falta.tipo)}
                      </div>
                      <div className="flex items-center gap-2">
                        {falta.motivo && (
                          <span className="text-xs text-muted-foreground max-w-[100px] truncate">
                            {falta.motivo}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removerFalta(falta.id)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Vales Tab */}
          <TabsContent value="vales" className="flex-1 flex flex-col overflow-hidden mt-0 px-6 pb-6">
            {/* Form Novo Vale */}
            <div className="py-4 space-y-3 border-b">
              <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                <Plus className="h-4 w-4" />
                Novo Vale
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={novoVale.valor}
                    onChange={(e) => setNovoVale(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="100.00"
                    className="h-9 font-mono"
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
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                    placeholder="Ex: farmácia"
                    className="h-9"
                  />
                </div>
              </div>
              <Button onClick={adicionarVale} disabled={isSaving} size="sm" className="w-full h-9">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Adicionar Vale
              </Button>
            </div>

            {/* Lista de Vales */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : vales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum vale registrado
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  {vales.map((vale) => (
                    <div key={vale.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{formatCurrency(vale.valor)}</span>
                          {getStatusValeBadge(vale.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{formatDate(vale.data_lancamento)}</span>
                          {vale.descricao && <span>• {vale.descricao}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={vale.status || 'pendente'}
                          onValueChange={(v) => atualizarStatusVale(vale.id, v)}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="descontado">Descontado</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removerVale(vale.id)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
