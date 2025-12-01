import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploader } from '@/components/FileUploader';
import { UserX, Calendar, AlertTriangle, Plus, Edit, FileText, Clock } from 'lucide-react';
import { useMockData } from '@/hooks/useMockData';

interface Afastamento {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  motivo: 'ACIDENTE_TRABALHO' | 'ACIDENTE_TRAJETO' | 'DOENCA' | 'LICENCA_MATERNIDADE' | 'LICENCA_PATERNIDADE' | 'OUTROS';
  dataInicio: string;
  dataPericia?: string;
  dataFim?: string;
  status: 'ATIVO' | 'FINALIZADO' | 'AGUARDANDO_PERICIA';
  documentoId?: string;
  observacao?: string;
}

const motivosAfastamento = [
  { value: 'ACIDENTE_TRABALHO', label: 'Acidente de Trabalho' },
  { value: 'ACIDENTE_TRAJETO', label: 'Acidente de Trajeto' },
  { value: 'DOENCA', label: 'Doença' },
  { value: 'LICENCA_MATERNIDADE', label: 'Licença Maternidade' },
  { value: 'LICENCA_PATERNIDADE', label: 'Licença Paternidade' },
  { value: 'OUTROS', label: 'Outros' },
];

export default function GestaoAfastamentos() {
  const mockData = useMockData();
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);

  useEffect(() => {
    if (mockData.hasMockData) {
      const afastamentosData = mockData.getAfastamentos();
      const afastamentosFormatados: Afastamento[] = afastamentosData.map((a: any) => ({
        id: a.id,
        matricula: a.matricula,
        nome: a.nome,
        loja: a.loja,
        motivo: a.motivo as Afastamento['motivo'],
        dataInicio: a.dataInicio,
        dataPericia: a.dataPericia,
        dataFim: a.dataFim,
        status: a.status as Afastamento['status'],
        observacao: a.observacao,
      }));
      setAfastamentos(afastamentosFormatados);
    } else {
      // Dados de fallback
      setAfastamentos([
        {
          id: '1',
          matricula: '001',
          nome: 'João Silva',
          loja: 'CENTRO',
          motivo: 'ACIDENTE_TRABALHO',
          dataInicio: '2025-01-10',
          dataPericia: '2025-02-10',
          status: 'ATIVO',
        },
        {
          id: '2',
          matricula: '003',
          nome: 'Ana Costa',
          loja: 'BROOKLIN',
          motivo: 'LICENCA_MATERNIDADE',
          dataInicio: '2025-01-15',
          status: 'ATIVO',
          observacao: 'Recebe 40% no dia 20',
        }
      ]);
    }
  }, [mockData.hasMockData]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAfastamento, setEditingAfastamento] = useState<Afastamento | null>(null);
  const [formData, setFormData] = useState<Partial<Afastamento>>({
    status: 'ATIVO'
  });

  const handleSave = () => {
    if (!formData.matricula || !formData.dataInicio || !formData.motivo) return;

    if (editingAfastamento) {
      setAfastamentos(prev =>
        prev.map(a => a.id === editingAfastamento.id ? { ...a, ...formData } as Afastamento : a)
      );
    } else {
      const newAfastamento: Afastamento = {
        ...formData,
        id: Date.now().toString(),
      } as Afastamento;
      setAfastamentos(prev => [...prev, newAfastamento]);
    }

    handleCloseDialog();
  };

  const handleEdit = (afastamento: Afastamento) => {
    setEditingAfastamento(afastamento);
    setFormData(afastamento);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAfastamento(null);
    setFormData({ status: 'ATIVO' });
  };

  const getStatusBadge = (status: Afastamento['status']) => {
    switch (status) {
      case 'ATIVO':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Afastado</Badge>;
      case 'FINALIZADO':
        return <Badge className="bg-success/10 text-success border-success/20">Finalizado</Badge>;
      case 'AGUARDANDO_PERICIA':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Aguardando Perícia</Badge>;
    }
  };

  const getMotivoBadge = (motivo: Afastamento['motivo']) => {
    const labels: Record<string, { label: string; className: string }> = {
      ACIDENTE_TRABALHO: { label: 'Ac. Trabalho', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      ACIDENTE_TRAJETO: { label: 'Ac. Trajeto', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      DOENCA: { label: 'Doença', className: 'bg-warning/10 text-warning border-warning/20' },
      LICENCA_MATERNIDADE: { label: 'Maternidade', className: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
      LICENCA_PATERNIDADE: { label: 'Paternidade', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      OUTROS: { label: 'Outros', className: '' },
    };
    const config = labels[motivo] || labels.OUTROS;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const ativos = afastamentos.filter(a => a.status === 'ATIVO').length;
  const aguardandoPericia = afastamentos.filter(a => a.status === 'AGUARDANDO_PERICIA').length;
  const finalizados = afastamentos.filter(a => a.status === 'FINALIZADO').length;
  const maternidade = afastamentos.filter(a => a.motivo === 'LICENCA_MATERNIDADE' && a.status === 'ATIVO').length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Afastamentos</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Controle de afastamentos e perícias</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Afastamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAfastamento ? 'Editar Afastamento' : 'Registrar Afastamento'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do afastamento
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  placeholder="001"
                  value={formData.matricula || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                  disabled={!!editingAfastamento}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="João Silva"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loja">Loja</Label>
                <Input
                  id="loja"
                  placeholder="CENTRO"
                  value={formData.loja || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, loja: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Motivo do Afastamento</Label>
                <Select
                  value={formData.motivo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, motivo: value as Afastamento['motivo'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {motivosAfastamento.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPericia">Data Perícia</Label>
                <Input
                  id="dataPericia"
                  type="date"
                  value={formData.dataPericia || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataPericia: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim (se finalizado)</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={formData.dataFim || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Afastamento['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Afastado</SelectItem>
                    <SelectItem value="AGUARDANDO_PERICIA">Aguardando Perícia</SelectItem>
                    <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Documentos</Label>
                <FileUploader
                  onFileUploaded={(fileId) => setFormData(prev => ({ ...prev, documentoId: fileId }))}
                />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  placeholder="Informações adicionais..."
                  value={formData.observacao || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCloseDialog} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-warning">{ativos}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Afastados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{aguardandoPericia}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Aguardando Perícia</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-pink-500/5 border-pink-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-pink-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-pink-400">{maternidade}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Maternidade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-success">{finalizados}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Finalizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regras de Pagamento */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg text-primary flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            Regras de Pagamento - Afastamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm space-y-2">
          <p><span className="font-semibold text-destructive">• Acidente de Trabalho/Trajeto:</span> Não recebe no dia 20. Pagar valor no mês seguinte.</p>
          <p><span className="font-semibold text-pink-400">• Licença Maternidade:</span> Recebe a % do dia 20 normalmente.</p>
          <p><span className="font-semibold text-warning">• Afastados (geral):</span> Não recebem adiantamento de salário (exceto maternidade).</p>
        </CardContent>
      </Card>

      {/* Tabela de Afastamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Afastamentos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Loja</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="hidden md:table-cell">Início</TableHead>
                <TableHead className="hidden lg:table-cell">Perícia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {afastamentos.map((afastamento) => (
                <TableRow key={afastamento.id}>
                  <TableCell className="font-mono">{afastamento.matricula}</TableCell>
                  <TableCell className="font-medium">{afastamento.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell">{afastamento.loja}</TableCell>
                  <TableCell>{getMotivoBadge(afastamento.motivo)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(afastamento.dataInicio).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {afastamento.dataPericia 
                      ? new Date(afastamento.dataPericia).toLocaleDateString('pt-BR')
                      : <span className="text-muted-foreground">-</span>
                    }
                  </TableCell>
                  <TableCell>{getStatusBadge(afastamento.status)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(afastamento)}>
                      <Edit className="h-4 w-4" />
                    </Button>
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
