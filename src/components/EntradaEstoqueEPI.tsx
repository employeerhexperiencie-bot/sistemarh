import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileUploader } from '@/components/FileUploader';
import { Package, Download, Eye, Plus, FileText, Truck } from 'lucide-react';

interface EntradaEstoque {
  id: string;
  dataEntrada: string;
  numeroNota: string;
  fornecedor: string;
  item: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  lote?: string;
  dataValidade?: string;
  notaFiscalId?: string;
}

export function EntradaEstoqueEPI() {
  const [entradas, setEntradas] = useState<EntradaEstoque[]>([
    {
      id: '1',
      dataEntrada: '2025-08-20',
      numeroNota: 'NF-12345',
      fornecedor: 'Fornecedor A',
      item: 'Uniforme Completo',
      quantidade: 50,
      valorUnitario: 8500,
      valorTotal: 425000,
      lote: 'L2025-08',
      dataValidade: '2027-08-20',
      notaFiscalId: 'doc456'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    dataEntrada: '',
    numeroNota: '',
    fornecedor: '',
    item: '',
    quantidade: '',
    valorUnitario: '',
    lote: '',
    dataValidade: '',
    notaFiscalId: null as string | null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantidade = parseInt(formData.quantidade);
    const valorUnitario = parseCurrencyToCentavos(formData.valorUnitario);
    
    const novaEntrada: EntradaEstoque = {
      id: Date.now().toString(),
      dataEntrada: formData.dataEntrada,
      numeroNota: formData.numeroNota,
      fornecedor: formData.fornecedor,
      item: formData.item,
      quantidade,
      valorUnitario,
      valorTotal: quantidade * valorUnitario,
      lote: formData.lote || undefined,
      dataValidade: formData.dataValidade || undefined,
      notaFiscalId: formData.notaFiscalId || undefined
    };

    setEntradas([novaEntrada, ...entradas]);
    setIsDialogOpen(false);
    setFormData({
      dataEntrada: '',
      numeroNota: '',
      fornecedor: '',
      item: '',
      quantidade: '',
      valorUnitario: '',
      lote: '',
      dataValidade: '',
      notaFiscalId: null
    });
  };

  const formatCurrency = (centavos: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(centavos / 100);
  };

  const parseCurrencyToCentavos = (value: string): number => {
    const numbers = value.replace(/[^\d]/g, '');
    return parseInt(numbers) || 0;
  };

  const totalEntradas = entradas.reduce((acc, entrada) => acc + entrada.valorTotal, 0);
  const totalItens = entradas.reduce((acc, entrada) => acc + entrada.quantidade, 0);

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Entrada de Produtos EPI
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Controle de chegada de produtos com notas fiscais
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Entrada
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de Entradas:</span>
              <span className="text-lg font-bold text-primary">{entradas.length}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Itens Recebidos:</span>
              <span className="text-lg font-bold text-success">{totalItens}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor Total:</span>
              <span className="text-lg font-bold text-accent">{formatCurrency(totalEntradas)}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nº Nota</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Valor Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Nenhuma entrada registrada ainda
                  </TableCell>
                </TableRow>
              ) : (
                entradas.map((entrada) => (
                  <TableRow key={entrada.id}>
                    <TableCell>{new Date(entrada.dataEntrada).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-mono text-sm">{entrada.numeroNota}</TableCell>
                    <TableCell>{entrada.fornecedor}</TableCell>
                    <TableCell className="font-medium">{entrada.item}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{entrada.quantidade}</Badge>
                    </TableCell>
                    <TableCell>
                      {entrada.lote ? (
                        <Badge variant="secondary" className="text-xs">{entrada.lote}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {entrada.dataValidade ? (
                        <span className="text-sm">{new Date(entrada.dataValidade).toLocaleDateString('pt-BR')}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(entrada.valorUnitario)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(entrada.valorTotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {entrada.notaFiscalId && (
                          <>
                            <Button size="sm" variant="ghost" title="Visualizar nota">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Baixar nota">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Entrada de Produtos</DialogTitle>
            <DialogDescription>
              Preencha as informações da nota fiscal e produtos recebidos
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataEntrada">Data de Entrada *</Label>
                <Input
                  id="dataEntrada"
                  type="date"
                  value={formData.dataEntrada}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataEntrada: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroNota">Número da Nota Fiscal *</Label>
                <Input
                  id="numeroNota"
                  placeholder="NF-12345"
                  value={formData.numeroNota}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroNota: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor">Nome do Fornecedor *</Label>
              <Input
                id="fornecedor"
                placeholder="Nome do fornecedor"
                value={formData.fornecedor}
                onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item">Item/Produto *</Label>
              <Input
                id="item"
                placeholder="Ex: Uniforme Completo, Touca, Luvas"
                value={formData.item}
                onChange={(e) => setFormData(prev => ({ ...prev, item: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  placeholder="50"
                  value={formData.quantidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorUnitario">Valor Unitário *</Label>
                <Input
                  id="valorUnitario"
                  placeholder="R$ 0,00"
                  value={formData.valorUnitario}
                  onChange={(e) => {
                    const formatted = formatCurrency(parseCurrencyToCentavos(e.target.value));
                    setFormData(prev => ({ ...prev, valorUnitario: formatted }));
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Total</Label>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center">
                  <span className="text-sm font-semibold">
                    {formData.quantidade && formData.valorUnitario
                      ? formatCurrency(
                          parseInt(formData.quantidade) * 
                          parseCurrencyToCentavos(formData.valorUnitario)
                        )
                      : 'R$ 0,00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lote">Lote (opcional)</Label>
                <Input
                  id="lote"
                  placeholder="L2025-08"
                  value={formData.lote}
                  onChange={(e) => setFormData(prev => ({ ...prev, lote: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataValidade">Data de Validade (opcional)</Label>
                <Input
                  id="dataValidade"
                  type="date"
                  value={formData.dataValidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataValidade: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nota Fiscal (PDF)</Label>
              <FileUploader
                onFileUploaded={(fileId) => setFormData(prev => ({ ...prev, notaFiscalId: fileId }))}
              />
              <p className="text-xs text-muted-foreground">
                Faça upload da nota fiscal em PDF para registro
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Entrada
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
