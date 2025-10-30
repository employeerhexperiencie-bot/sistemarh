import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Users, UserCheck, UserX, Building2, FileText, Folder } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DocumentUploader } from '@/components/DocumentUploader';
import { formatCurrency, parseCurrencyToCentavos } from '@/lib/utils';

interface Professional {
  id: string;
  matricula: string;
  nome: string;
  cpf?: string;
  rg?: string;
  loja_id?: string;
  loja?: { nome: string };
  cargo?: string;
  salario: number; // em centavos
  status: 'ativo' | 'demitido' | 'afastado';
  data_admissao?: string;
  data_demissao?: string;
  created_at: string;
}

interface Loja {
  id: string;
  nome: string;
}

export const CadastroProfissionais: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dados');
  const [formData, setFormData] = useState({
    matricula: '',
    nome: '',
    cpf: '',
    rg: '',
    loja_id: '',
    cargo: '',
    salario: '',
    status: 'ativo' as 'ativo' | 'demitido' | 'afastado',
    data_admissao: '',
    data_demissao: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select(`
          *,
          loja:lojas(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfessionals((data || []) as Professional[]);
    } catch (error) {
      console.error('Load professionals error:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar profissionais",
        variant: "destructive"
      });
    }
  };

  const loadLojas = async () => {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setLojas(data || []);
    } catch (error) {
      console.error('Load lojas error:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.matricula) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const professionalData = {
        ...formData,
        salario: parseCurrencyToCentavos(formData.salario),
        loja_id: formData.loja_id || null
      };

      if (editingProfessional) {
        // Update existing professional
        const { error } = await supabase
          .from('profissionais')
          .update(professionalData)
          .eq('id', editingProfessional.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Profissional atualizado com sucesso"
        });
      } else {
        // Create new professional
        const { error } = await supabase
          .from('profissionais')
          .insert([professionalData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Profissional cadastrado com sucesso"
        });
      }

      handleCloseDialog();
      loadProfessionals();
    } catch (error) {
      console.error('Save professional error:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar profissional",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormData({
      matricula: professional.matricula,
      nome: professional.nome,
      cpf: professional.cpf || '',
      rg: professional.rg || '',
      loja_id: professional.loja_id || '',
      cargo: professional.cargo || '',
      salario: formatCurrency((professional.salario || 0).toString()),
      status: professional.status as 'ativo' | 'demitido' | 'afastado',
      data_admissao: professional.data_admissao || '',
      data_demissao: professional.data_demissao || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;

    try {
      const { error } = await supabase
        .from('profissionais')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Profissional excluído com sucesso"
      });

      loadProfessionals();
    } catch (error) {
      console.error('Delete professional error:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir profissional",
        variant: "destructive"
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfessional(null);
    setFormData({
      matricula: '',
      nome: '',
      cpf: '',
      rg: '',
      loja_id: '',
      cargo: '',
      salario: '',
      status: 'ativo',
      data_admissao: '',
      data_demissao: ''
    });
  };

  const handleViewDocuments = (professionalId: string) => {
    setSelectedProfessionalId(professionalId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>;
      case 'demitido':
        return <Badge variant="destructive">Demitido</Badge>;
      case 'afastado':
        return <Badge variant="secondary">Afastado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    loadProfessionals();
    loadLojas();
  }, []);

  const activeProfessionals = professionals.filter(p => p.status === 'ativo');
  const dismissedProfessionals = professionals.filter(p => p.status === 'demitido');
  const uniqueStores = new Set(professionals.map(p => p.loja?.nome).filter(Boolean)).size;

  if (selectedProfessionalId) {
    const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId);
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pasta do Profissional</h1>
            <p className="text-muted-foreground">
              {selectedProfessional?.nome} - {selectedProfessional?.matricula}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedProfessionalId(null)}>
            Voltar à Lista
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="vales">Vales & Adiantamentos</TabsTrigger>
            <TabsTrigger value="epi">Controle EPI</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  <p className="font-medium">{selectedProfessional?.nome}</p>
                </div>
                <div>
                  <Label>Matrícula</Label>
                  <p className="font-medium font-mono">{selectedProfessional?.matricula}</p>
                </div>
                <div>
                  <Label>CPF</Label>
                  <p className="font-medium">{selectedProfessional?.cpf || '-'}</p>
                </div>
                <div>
                  <Label>RG</Label>
                  <p className="font-medium">{selectedProfessional?.rg || '-'}</p>
                </div>
                <div>
                  <Label>Loja</Label>
                  <p className="font-medium">{selectedProfessional?.loja?.nome || '-'}</p>
                </div>
                <div>
                  <Label>Cargo</Label>
                  <p className="font-medium">{selectedProfessional?.cargo || '-'}</p>
                </div>
                <div>
                  <Label>Salário</Label>
                  <p className="font-medium">
                    {formatCurrency((selectedProfessional?.salario || 0).toString())}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedProfessional?.status || '')}</div>
                </div>
                <div>
                  <Label>Data de Admissão</Label>
                  <p className="font-medium">
                    {selectedProfessional?.data_admissao 
                      ? new Date(selectedProfessional.data_admissao).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <DocumentUploader
              bucket="professional-documents"
              folder="profissionais"
              entityId={selectedProfessionalId}
              entityType="professional"
            />
          </TabsContent>

          <TabsContent value="vales">
            <Card>
              <CardHeader>
                <CardTitle>Vales e Adiantamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sistema de controle de vales em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="epi">
            <Card>
              <CardHeader>
                <CardTitle>Controle de EPI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sistema de controle de EPI em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cadastro de Profissionais</h1>
          <p className="text-muted-foreground">Gerencie colaboradores e seus documentos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProfessional(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Profissional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="matricula">Matrícula *</Label>
                <Input
                  id="matricula"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  placeholder="001"
                  disabled={!!editingProfessional}
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="João Silva"
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  placeholder="00.000.000-0"
                />
              </div>
              <div>
                <Label htmlFor="loja">Loja</Label>
                <Select value={formData.loja_id} onValueChange={(value) => setFormData({ ...formData, loja_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {lojas.map((loja) => (
                      <SelectItem key={loja.id} value={loja.id}>
                        {loja.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Vendedor, Gerente, etc."
                />
              </div>
              <div>
                <Label htmlFor="salario">Salário</Label>
                <Input
                  id="salario"
                  value={formData.salario}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setFormData({ ...formData, salario: formatted });
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="demitido">Demitido</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="data_admissao">Data de Admissão</Label>
                <Input
                  id="data_admissao"
                  type="date"
                  value={formData.data_admissao}
                  onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                />
              </div>
              {formData.status === 'demitido' && (
                <div className="col-span-2">
                  <Label htmlFor="data_demissao">Data de Demissão</Label>
                  <Input
                    id="data_demissao"
                    type="date"
                    value={formData.data_demissao}
                    onChange={(e) => setFormData({ ...formData, data_demissao: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profissionais Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeProfessionals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demitidos</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dismissedProfessionals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Profissionais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{professionals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojas Únicas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueStores}</div>
          </CardContent>
        </Card>
      </div>

      {/* Professionals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Profissionais</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Admissão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell className="font-mono">{professional.matricula}</TableCell>
                  <TableCell className="font-medium">{professional.nome}</TableCell>
                  <TableCell>{professional.loja?.nome || '-'}</TableCell>
                  <TableCell>{professional.cargo || '-'}</TableCell>
                  <TableCell>
                    {formatCurrency((professional.salario || 0).toString())}
                  </TableCell>
                  <TableCell>{getStatusBadge(professional.status)}</TableCell>
                  <TableCell>
                    {professional.data_admissao 
                      ? new Date(professional.data_admissao).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocuments(professional.id)}
                        title="Ver pasta do profissional"
                      >
                        <Folder className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(professional)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(professional.id)}
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
    </div>
  );
};