import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileUploader } from '@/components/FileUploader';
import { Bus, Download, Eye, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ValeTransporte {
  id: string;
  data: string;
  valorDiario: number;
  diasTrabalhados: number;
  valorTotal: number;
  reciboAssinado: boolean;
  documentoId?: string;
  observacao?: string;
}

interface ValeTransporteManagerProps {
  profissionalId: string;
  valorRotaDiaria: number;
}

export function ValeTransporteManager({ profissionalId, valorRotaDiaria }: ValeTransporteManagerProps) {
  const [vales, setVales] = useState<ValeTransporte[]>([
    {
      id: '1',
      data: '2025-08',
      valorDiario: valorRotaDiaria,
      diasTrabalhados: 22,
      valorTotal: valorRotaDiaria * 22,
      reciboAssinado: true,
      documentoId: 'doc123'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    data: '',
    diasTrabalhados: '',
    observacao: '',
    documentoId: null as string | null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const novoVale: ValeTransporte = {
      id: Date.now().toString(),
      data: formData.data,
      valorDiario: valorRotaDiaria,
      diasTrabalhados: parseInt(formData.diasTrabalhados),
      valorTotal: valorRotaDiaria * parseInt(formData.diasTrabalhados),
      reciboAssinado: !!formData.documentoId,
      documentoId: formData.documentoId || undefined,
      observacao: formData.observacao || undefined
    };

    setVales([novoVale, ...vales]);
    setIsDialogOpen(false);
    setFormData({ data: '', diasTrabalhados: '', observacao: '', documentoId: null });
  };

  const formatCurrency = (centavos: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(centavos / 100);
  };

  const totalValorRecebido = vales.reduce((acc, vale) => acc + vale.valorTotal, 0);

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
                <TableHead className="text-center">Dias</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Recibo</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum vale-transporte registrado ainda
                  </TableCell>
                </TableRow>
              ) : (
                vales.map((vale) => (
                  <TableRow key={vale.id}>
                    <TableCell className="font-medium">{vale.data}</TableCell>
                    <TableCell className="text-right">{formatCurrency(vale.valorDiario)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{vale.diasTrabalhados}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(vale.valorTotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      {vale.reciboAssinado ? (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Assinado
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {vale.documentoId && (
                          <>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
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
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Competência (Mês/Ano)</Label>
                <Input
                  id="data"
                  type="month"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
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

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total a receber:</span>
                <span className="text-lg font-bold text-primary">
                  {formData.diasTrabalhados ? 
                    formatCurrency(valorRotaDiaria * parseInt(formData.diasTrabalhados)) : 
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

            <div className="space-y-2">
              <Label>Recibo Assinado</Label>
              <FileUploader
                onFileUploaded={(fileId) => setFormData(prev => ({ ...prev, documentoId: fileId }))}
              />
              <p className="text-xs text-muted-foreground">
                Faça upload do recibo de vale-transporte assinado pelo profissional
              </p>
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
