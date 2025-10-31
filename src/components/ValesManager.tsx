import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, DollarSign, Download, Trash2, Eye, Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, parseCurrencyToCentavos } from '@/lib/utils';

interface ValesManagerProps {
  professionalId: string;
  professionalName: string;
}

interface Vale {
  id: string;
  tipo: 'vale' | 'adiantamento' | 'desconto';
  valor: number;
  descricao?: string;
  data_lancamento: string;
  documento_id?: string;
  status: 'pendente' | 'aprovado' | 'pago';
  created_at: string;
}

interface ValeDocument {
  id: string;
  nome: string;
  file_path: string;
}

export const ValesManager: React.FC<ValesManagerProps> = ({ 
  professionalId, 
  professionalName 
}) => {
  const [vales, setVales] = useState<Vale[]>([]);
  const [valeDocuments, setValeDocuments] = useState<Record<string, ValeDocument>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'vale' as 'vale' | 'adiantamento' | 'desconto',
    valor: '',
    descricao: '',
    data_lancamento: new Date().toISOString().split('T')[0],
    status: 'pendente' as 'pendente' | 'aprovado' | 'pago'
  });
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { toast } = useToast();

  const loadVales = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_vales')
        .select('*')
        .eq('professional_id', professionalId)
        .order('data_lancamento', { ascending: false });

      if (error) throw error;
      
      const valesData = (data || []) as Vale[];
      setVales(valesData);

      // Load documents for vales that have documento_id
      const documentIds = valesData
        .map(v => v.documento_id)
        .filter((id): id is string => !!id);

      if (documentIds.length > 0) {
        const { data: docsData } = await supabase
          .from('professional_documents')
          .select('id, nome, file_path')
          .in('id', documentIds);

        if (docsData) {
          const docsMap: Record<string, ValeDocument> = {};
          docsData.forEach(doc => {
            docsMap[doc.id] = doc as ValeDocument;
          });
          setValeDocuments(docsMap);
        }
      }
    } catch (error) {
      console.error('Load vales error:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vales",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast({
        title: "Erro",
        description: "Valor é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      let documentoId = null;

      // Upload comprovante if exists
      if (uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `profissionais/${professionalId}/vales/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('professional-documents')
          .upload(fileName, uploadFile);

        if (uploadError) throw uploadError;

        // Create document record
        const { data: docData, error: docError } = await supabase
          .from('professional_documents')
          .insert([{
            professional_id: professionalId,
            nome: uploadFile.name,
            file_path: fileName,
            file_size: uploadFile.size,
            mime_type: uploadFile.type,
            categoria: 'vales'
          }])
          .select()
          .single();

        if (docError) throw docError;
        documentoId = docData.id;
      }

      const valeData = {
        professional_id: professionalId,
        tipo: formData.tipo,
        valor: parseCurrencyToCentavos(formData.valor),
        descricao: formData.descricao || null,
        data_lancamento: formData.data_lancamento,
        status: formData.status,
        documento_id: documentoId
      };

      const { error } = await supabase
        .from('professional_vales')
        .insert([valeData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lançamento cadastrado com sucesso"
      });

      handleCloseDialog();
      loadVales();
    } catch (error) {
      console.error('Save vale error:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar lançamento",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, documentoId?: string) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;

    try {
      // Delete vale first (due to foreign key)
      const { error: valeError } = await supabase
        .from('professional_vales')
        .delete()
        .eq('id', id);

      if (valeError) throw valeError;

      // Delete document if exists
      if (documentoId) {
        const doc = valeDocuments[documentoId];
        if (doc) {
          // Delete from storage
          await supabase.storage
            .from('professional-documents')
            .remove([doc.file_path]);

          // Delete from database
          await supabase
            .from('professional_documents')
            .delete()
            .eq('id', documentoId);
        }
      }

      toast({
        title: "Sucesso",
        description: "Lançamento excluído com sucesso"
      });

      loadVales();
    } catch (error) {
      console.error('Delete vale error:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir lançamento",
        variant: "destructive"
      });
    }
  };

  const downloadComprovante = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('professional-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erro",
        description: "Erro ao baixar comprovante",
        variant: "destructive"
      });
    }
  };

  const viewComprovante = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('professional-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (error) {
      console.error('View error:', error);
      toast({
        title: "Erro",
        description: "Erro ao visualizar comprovante",
        variant: "destructive"
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      tipo: 'vale',
      valor: '',
      descricao: '',
      data_lancamento: new Date().toISOString().split('T')[0],
      status: 'pendente'
    });
    setUploadFile(null);
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'vale':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Vale</Badge>;
      case 'adiantamento':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Adiantamento</Badge>;
      case 'desconto':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Desconto</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'aprovado':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Aprovado</Badge>;
      case 'pago':
        return <Badge className="bg-success/10 text-success border-success/20">Pago</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    loadVales();
  }, [professionalId]);

  const totais = vales.reduce((acc, vale) => {
    if (vale.tipo === 'vale') acc.vales += vale.valor;
    if (vale.tipo === 'adiantamento') acc.adiantamentos += vale.valor;
    if (vale.tipo === 'desconto') acc.descontos += vale.valor;
    return acc;
  }, { vales: 0, adiantamentos: 0, descontos: 0 });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vales</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totais.vales.toString())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Adiantamentos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totais.adiantamentos.toString())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Descontos</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totais.descontos.toString())}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Vales e Adiantamentos</CardTitle>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {vales.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum lançamento encontrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vales.map((vale) => {
                  const doc = vale.documento_id ? valeDocuments[vale.documento_id] : null;
                  return (
                    <TableRow key={vale.id}>
                      <TableCell>{new Date(vale.data_lancamento).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{getTipoBadge(vale.tipo)}</TableCell>
                      <TableCell>{vale.descricao || '-'}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(vale.valor.toString())}
                      </TableCell>
                      <TableCell>{getStatusBadge(vale.status || 'pendente')}</TableCell>
                      <TableCell>
                        {doc ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewComprovante(doc.file_path)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadComprovante(doc.file_path, doc.nome)}
                              title="Baixar"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(vale.id, vale.documento_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog for New Vale */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vale">Vale</SelectItem>
                  <SelectItem value="adiantamento">Adiantamento</SelectItem>
                  <SelectItem value="desconto">Desconto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                value={formData.valor}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  setFormData({ ...formData, valor: formatted });
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <Label htmlFor="data_lancamento">Data *</Label>
              <Input
                id="data_lancamento"
                type="date"
                value={formData.data_lancamento}
                onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comprovante">Comprovante</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="comprovante"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setUploadFile(file);
                  }}
                />
                {uploadFile && (
                  <Badge variant="secondary" className="shrink-0">
                    <FileText className="h-3 w-3 mr-1" />
                    {uploadFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, JPG, JPEG, PNG
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={uploading}>
                {uploading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
