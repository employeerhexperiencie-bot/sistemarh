import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building2, Edit, Trash2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DocumentUploader } from '@/components/DocumentUploader';

interface Loja {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  responsavel?: string;
  created_at: string;
}

export const CadastroLojas: React.FC = () => {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
  const [selectedLojaId, setSelectedLojaId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    responsavel: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadLojas = async () => {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLojas(data || []);
    } catch (error) {
      console.error('Load lojas error:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lojas",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast({
        title: "Erro",
        description: "Nome da loja é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (editingLoja) {
        // Update existing loja
        const { error } = await supabase
          .from('lojas')
          .update(formData)
          .eq('id', editingLoja.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Loja atualizada com sucesso"
        });
      } else {
        // Create new loja
        const { error } = await supabase
          .from('lojas')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Loja cadastrada com sucesso"
        });
      }

      handleCloseDialog();
      loadLojas();
    } catch (error) {
      console.error('Save loja error:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar loja",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (loja: Loja) => {
    setEditingLoja(loja);
    setFormData({
      nome: loja.nome,
      cnpj: loja.cnpj || '',
      endereco: loja.endereco || '',
      telefone: loja.telefone || '',
      email: loja.email || '',
      responsavel: loja.responsavel || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta loja?')) return;

    try {
      const { error } = await supabase
        .from('lojas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Loja excluída com sucesso"
      });

      loadLojas();
    } catch (error) {
      console.error('Delete loja error:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir loja",
        variant: "destructive"
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLoja(null);
    setFormData({
      nome: '',
      cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      responsavel: ''
    });
  };

  const handleViewDocuments = (lojaId: string) => {
    setSelectedLojaId(lojaId);
  };

  useEffect(() => {
    loadLojas();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cadastro de Lojas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLoja(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Loja
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLoja ? 'Editar Loja' : 'Nova Loja'}
              </DialogTitle>
              <DialogDescription>
                {editingLoja ? 'Atualize as informações da loja' : 'Cadastre uma nova loja no sistema'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Loja *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite o nome da loja"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Digite o endereço"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedLojaId ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos da Loja
              </CardTitle>
              <Button variant="outline" onClick={() => setSelectedLojaId(null)}>
                Voltar à Lista
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DocumentUploader
              bucket="loja-documents"
              folder="lojas"
              entityId={selectedLojaId}
              entityType="loja"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Lojas</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lojas.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lojas Ativas</CardTitle>
                <Badge variant="default" className="h-4">Ativo</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lojas.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cadastros Recentes</CardTitle>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {lojas.filter(loja => {
                    const created = new Date(loja.created_at);
                    const today = new Date();
                    const daysDiff = (today.getTime() - created.getTime()) / (1000 * 3600 * 24);
                    return daysDiff <= 30;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </CardContent>
            </Card>
          </div>

          {/* Lojas Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Lojas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lojas.map((loja) => (
                    <TableRow key={loja.id}>
                      <TableCell className="font-medium">{loja.nome}</TableCell>
                      <TableCell>{loja.cnpj || '-'}</TableCell>
                      <TableCell>{loja.telefone || '-'}</TableCell>
                      <TableCell>{loja.responsavel || '-'}</TableCell>
                      <TableCell>
                        {new Date(loja.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocuments(loja.id)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(loja)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(loja.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};