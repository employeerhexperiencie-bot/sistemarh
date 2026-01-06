import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileUploader } from '@/components/FileUploader';
import { supabase } from '@/integrations/supabase/client';
import { Bus, Download, Eye, Plus, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ValeTransporte {
  id: string;
  mes_referencia: string;
  dias_trabalhados: number;
  valor_diario: number;
  valor_total_bruto: number;
  dias_falta: number;
  dias_atestado: number;
  dias_ferias: number;
  valor_liquido: number;
  observacoes: string | null;
}

interface ValeTransporteManagerProps {
  profissionalId: string | null;
  valorRotaDiaria: number;
}

export function ValeTransporteManager({ profissionalId, valorRotaDiaria }: ValeTransporteManagerProps) {
  const [vales, setVales] = useState<ValeTransporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    mes_referencia: '',
    diasTrabalhados: '22',
    diasFalta: '0',
    diasAtestado: '0',
    diasFerias: '0',
    observacao: ''
  });

  useEffect(() => {
    if (profissionalId) {
      loadVales();
    } else {
      setVales([]);
      setLoading(false);
    }
  }, [profissionalId]);

  const loadVales = async () => {
    if (!profissionalId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vale_transporte_detalhado')
        .select('*')
        .eq('profissional_id', profissionalId)
        .order('mes_referencia', { ascending: false });

      if (error) throw error;

      setVales(data || []);
    } catch (error) {
      console.error('Erro ao carregar VT:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profissionalId) return;

    const diasTrabalhados = parseInt(formData.diasTrabalhados) || 0;
    const diasFalta = parseInt(formData.diasFalta) || 0;
    const diasAtestado = parseInt(formData.diasAtestado) || 0;
    const diasFerias = parseInt(formData.diasFerias) || 0;
    const totalDiasDesconto = diasFalta + diasAtestado + diasFerias;
    const valorTotalBruto = valorRotaDiaria * diasTrabalhados;
    const valorDesconto = valorRotaDiaria * totalDiasDesconto;
    const valorLiquido = valorTotalBruto - valorDesconto;

    try {
      const { error } = await supabase
        .from('vale_transporte_detalhado')
        .insert({
          profissional_id: profissionalId,
          mes_referencia: `${formData.mes_referencia}-01`,
          dias_trabalhados: diasTrabalhados,
          valor_diario: valorRotaDiaria,
          valor_total_bruto: valorTotalBruto,
          dias_falta: diasFalta,
          dias_atestado: diasAtestado,
          dias_ferias: diasFerias,
          total_dias_desconto: totalDiasDesconto,
          valor_desconto: valorDesconto,
          valor_liquido: valorLiquido,
          observacoes: formData.observacao || null
        });

      if (error) throw error;

      toast({
        title: 'Vale Transporte registrado',
        description: `VT de ${formData.mes_referencia} registrado com sucesso`
      });

      setIsDialogOpen(false);
      setFormData({
        mes_referencia: '',
        diasTrabalhados: '22',
        diasFalta: '0',
        diasAtestado: '0',
        diasFerias: '0',
        observacao: ''
      });
      loadVales();
    } catch (error) {
      console.error('Erro ao registrar VT:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao registrar vale transporte',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' }).split('/').reverse().join('-');
  };

  const totalValorRecebido = vales.reduce((acc, vale) => acc + vale.valor_liquido, 0);

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Vale Transporte
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Valor diário configurado: <span className="font-semibold text-foreground">{formatCurrency(valorRotaDiaria)}</span>
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Vale
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total recebido (todos os períodos):</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(totalValorRecebido)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competência</TableHead>
                <TableHead className="text-right">Valor Diário</TableHead>
                <TableHead className="text-center">Dias Trab.</TableHead>
                <TableHead className="text-center">Descontos</TableHead>
                <TableHead className="text-right">Total Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum vale-transporte registrado ainda
                  </TableCell>
                </TableRow>
              ) : (
                vales.map((vale) => (
                  <TableRow key={vale.id}>
                    <TableCell className="font-medium">{formatMonth(vale.mes_referencia)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(vale.valor_diario)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{vale.dias_trabalhados}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {(vale.dias_falta + vale.dias_atestado + vale.dias_ferias) > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          -{vale.dias_falta + vale.dias_atestado + vale.dias_ferias} dias
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">-</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(vale.valor_liquido)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Vale Transporte</DialogTitle>
            <DialogDescription>
              Preencha os dados do vale transporte para o profissional
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mes_referencia">Competência (Mês/Ano)</Label>
                <Input
                  id="mes_referencia"
                  type="month"
                  value={formData.mes_referencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, mes_referencia: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasTrabalhados">Dias Trabalhados</Label>
                <Input
                  id="diasTrabalhados"
                  type="number"
                  placeholder="22"
                  value={formData.diasTrabalhados}
                  onChange={(e) => setFormData(prev => ({ ...prev, diasTrabalhados: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diasFalta">Dias Falta</Label>
                <Input
                  id="diasFalta"
                  type="number"
                  value={formData.diasFalta}
                  onChange={(e) => setFormData(prev => ({ ...prev, diasFalta: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasAtestado">Dias Atestado</Label>
                <Input
                  id="diasAtestado"
                  type="number"
                  value={formData.diasAtestado}
                  onChange={(e) => setFormData(prev => ({ ...prev, diasAtestado: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasFerias">Dias Férias</Label>
                <Input
                  id="diasFerias"
                  type="number"
                  value={formData.diasFerias}
                  onChange={(e) => setFormData(prev => ({ ...prev, diasFerias: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total a receber:</span>
                <span className="text-lg font-bold text-primary">
                  {formData.diasTrabalhados ? 
                    formatCurrency(valorRotaDiaria * (parseInt(formData.diasTrabalhados) - parseInt(formData.diasFalta || '0') - parseInt(formData.diasAtestado || '0') - parseInt(formData.diasFerias || '0'))) : 
                    'R$ 0,00'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Input
                id="observacao"
                placeholder="Observações adicionais"
                value={formData.observacao}
                onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Vale
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}