import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, MapPin, Calendar, DollarSign, Building2 } from 'lucide-react';
import { useN8NAction } from '@/hooks/useN8NAction';
import { formatCurrency, parseCurrencyToCentavos } from '@/lib/utils';

interface Professional {
  matricula: string;
  nome: string;
  loja: string;
  salario: string;
  valeTransporte: string;
  dataAdmissao: string;
  dataInicioLoja: string;
  status: 'ATIVO' | 'DEMITIDO';
  cpf: string;
  telefone: string;
  email: string;
}

export default function CadastroProfissionais() {
  const [professionals, setProfessionals] = useState<Professional[]>([
    {
      matricula: '001',
      nome: 'João Silva',
      loja: 'CENTRO',
      salario: 'R$ 2.500,00',
      valeTransporte: 'R$ 220,00',
      dataAdmissao: '2023-01-15',
      dataInicioLoja: '2023-01-15',
      status: 'ATIVO',
      cpf: '123.456.789-00',
      telefone: '(11) 99999-9999',
      email: 'joao@email.com'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [formData, setFormData] = useState<Partial<Professional>>({
    status: 'ATIVO'
  });

  const { execute, loading } = useN8NAction();

  const lojas = ['CENTRO', 'BROOKLIN', 'TATUAPÉ', 'MORUMBI', 'VILA MADALENA', 'PERDIZES'];

  const handleSave = async () => {
    if (!formData.nome || !formData.matricula || !formData.loja) return;

    const payload = {
      ...formData,
      salarioCentavos: parseCurrencyToCentavos(formData.salario || '0'),
      valeTransporteCentavos: parseCurrencyToCentavos(formData.valeTransporte || '0'),
    };

    const action = editingProfessional ? 'profissional_atualizar' : 'profissional_cadastrar';
    
    await execute(action, payload, {
      successMessage: editingProfessional ? 'Profissional atualizado!' : 'Profissional cadastrado!',
    });

    if (editingProfessional) {
      setProfessionals(prev => 
        prev.map(p => p.matricula === editingProfessional.matricula ? { ...p, ...formData } as Professional : p)
      );
    } else {
      setProfessionals(prev => [...prev, formData as Professional]);
    }

    handleCloseDialog();
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormData(professional);
    setIsDialogOpen(true);
  };

  const handleDelete = async (matricula: string) => {
    await execute('profissional_deletar', { matricula }, {
      successMessage: 'Profissional removido!'
    });
    
    setProfessionals(prev => prev.filter(p => p.matricula !== matricula));
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfessional(null);
    setFormData({ status: 'ATIVO' });
  };

  const getStatusBadge = (status: string) => {
    return status === 'ATIVO' 
      ? <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>
      : <Badge variant="destructive">Demitido</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cadastro de Profissionais</h1>
          <p className="text-muted-foreground">Gerencie a base inicial de colaboradores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
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
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  placeholder="001"
                  value={formData.matricula || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                  disabled={!!editingProfessional}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  placeholder="João Silva"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="123.456.789-00"
                  value={formData.cpf || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@email.com"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loja">Loja</Label>
                <Select value={formData.loja || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, loja: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {lojas.map(loja => (
                      <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || 'ATIVO'} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'ATIVO' | 'DEMITIDO' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="DEMITIDO">Demitido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salario">Salário Base</Label>
                <Input
                  id="salario"
                  placeholder="R$ 0,00"
                  value={formData.salario || ''}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setFormData(prev => ({ ...prev, salario: formatted }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valeTransporte">Vale Transporte</Label>
                <Input
                  id="valeTransporte"
                  placeholder="R$ 0,00"
                  value={formData.valeTransporte || ''}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setFormData(prev => ({ ...prev, valeTransporte: formatted }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataAdmissao">Data de Admissão</Label>
                <Input
                  id="dataAdmissao"
                  type="date"
                  value={formData.dataAdmissao || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataAdmissao: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInicioLoja">Início na Loja</Label>
                <Input
                  id="dataInicioLoja"
                  type="date"
                  value={formData.dataInicioLoja || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataInicioLoja: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCloseDialog} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{professionals.filter(p => p.status === 'ATIVO').length}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{professionals.filter(p => p.status === 'DEMITIDO').length}</p>
                <p className="text-sm text-muted-foreground">Demitidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">{new Set(professionals.map(p => p.loja)).size}</p>
                <p className="text-sm text-muted-foreground">Lojas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{professionals.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profissionais Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Vale Transporte</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admissão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((professional) => (
                <TableRow key={professional.matricula}>
                  <TableCell className="font-mono">{professional.matricula}</TableCell>
                  <TableCell className="font-medium">{professional.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-accent/10">
                      <MapPin className="h-3 w-3 mr-1" />
                      {professional.loja}
                    </Badge>
                  </TableCell>
                  <TableCell>{professional.salario}</TableCell>
                  <TableCell>{professional.valeTransporte}</TableCell>
                  <TableCell>{getStatusBadge(professional.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(professional.dataAdmissao).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(professional)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(professional.matricula)}>
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
}