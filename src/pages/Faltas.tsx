import { useState, useEffect, useMemo } from 'react';
import { Calendar, Trash2, Eye, AlertCircle, Download, FileDown, Filter, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileUploader } from '@/components/FileUploader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Falta {
  id: string;
  matricula: string;
  nomeProfissional: string;
  loja: string;
  data: string;
  tipo: 'JUSTIFICADA' | 'INJUSTIFICADA';
  observacao?: string;
  atestadoFileId?: string;
  createdAt: string;
}

export default function Faltas() {
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    matricula: '',
    nomeProfissional: '',
    loja: '',
    data: '',
    tipo: '' as 'JUSTIFICADA' | 'INJUSTIFICADA' | '',
    observacao: '',
    atestadoFileId: null as string | null,
  });
  const [saving, setSaving] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    loja: 'todas',
    tipo: 'todos',
    busca: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('faltas')
        .select(`
          *,
          profissionais:profissional_id (
            matricula,
            nome,
            lojas:lojas!profissionais_loja_id_fkey (nome)
          )
        `)
        .order('data_falta', { ascending: false });

      if (error) throw error;

      const faltasData: Falta[] = (data || []).map((f: any) => ({
        id: f.id,
        matricula: f.profissionais?.matricula || '',
        nomeProfissional: f.profissionais?.nome || 'Profissional não encontrado',
        loja: f.profissionais?.lojas?.nome || 'Loja não definida',
        data: f.data_falta,
        tipo: (f.tipo?.toUpperCase() === 'JUSTIFICADA' ? 'JUSTIFICADA' : 'INJUSTIFICADA') as 'JUSTIFICADA' | 'INJUSTIFICADA',
        observacao: f.motivo || undefined,
        atestadoFileId: f.documento_comprovante || undefined,
        createdAt: f.created_at,
      }));

      setFaltas(faltasData);
    } catch (error) {
      console.error('Erro ao carregar faltas:', error);
      toast.error('Erro ao carregar dados de faltas');
    } finally {
      setLoading(false);
    }
  };

  const lojasUnicas = useMemo(() => {
    const lojas = new Set(faltas.map(f => f.loja));
    return Array.from(lojas).sort();
  }, [faltas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.matricula || !formData.data || !formData.tipo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const { data: prof } = await supabase
        .from('profissionais')
        .select('id')
        .eq('matricula', formData.matricula)
        .maybeSingle();

      if (!prof) {
        toast.error('Profissional não encontrado com essa matrícula');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('faltas')
        .insert({
          profissional_id: prof.id,
          data_falta: formData.data,
          tipo: formData.tipo.toLowerCase(),
          motivo: formData.observacao || null,
          documento_comprovante: formData.atestadoFileId || null,
        });

      if (error) throw error;

      toast.success('Falta registrada com sucesso');
      setIsDialogOpen(false);
      setFormData({
        matricula: '',
        nomeProfissional: '',
        loja: '',
        data: '',
        tipo: '',
        observacao: '',
        atestadoFileId: null,
      });
      loadData();
    } catch (error) {
      console.error('Erro ao registrar falta:', error);
      toast.error('Erro ao registrar falta');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta falta?')) return;
    
    // Note: DELETE não está permitido na tabela faltas pelas RLS policies
    toast.error('Exclusão de faltas não permitida pelo sistema');
  };

  const handleFileUploaded = (fileId: string) => {
    setFormData(prev => ({ ...prev, atestadoFileId: fileId }));
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'JUSTIFICADA' 
      ? 'bg-success/10 text-success border-success/20'
      : 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const faltasFiltradas = useMemo(() => {
    return faltas.filter(falta => {
      if (filtros.dataInicio && falta.data < filtros.dataInicio) return false;
      if (filtros.dataFim && falta.data > filtros.dataFim) return false;
      if (filtros.loja !== 'todas' && falta.loja !== filtros.loja) return false;
      if (filtros.tipo !== 'todos' && falta.tipo !== filtros.tipo) return false;
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        const nomeMatch = falta.nomeProfissional.toLowerCase().includes(busca);
        const matriculaMatch = falta.matricula.toLowerCase().includes(busca);
        if (!nomeMatch && !matriculaMatch) return false;
      }
      return true;
    });
  }, [faltas, filtros]);

  const faltasJustificadas = faltasFiltradas.filter(f => f.tipo === 'JUSTIFICADA').length;
  const faltasInjustificadas = faltasFiltradas.filter(f => f.tipo === 'INJUSTIFICADA').length;

  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      loja: 'todas',
      tipo: 'todos',
      busca: '',
    });
  };

  const exportarCSV = () => {
    const headers = ['Data', 'Matrícula', 'Profissional', 'Loja', 'Tipo', 'Observação'];
    const csvContent = [
      headers.join(','),
      ...faltasFiltradas.map(f => [
        new Date(f.data).toLocaleDateString('pt-BR'),
        f.matricula,
        `"${f.nomeProfissional}"`,
        `"${f.loja}"`,
        f.tipo === 'JUSTIFICADA' ? 'Justificada' : 'Injustificada',
        `"${f.observacao || '-'}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `faltas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV exportado com sucesso');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registro de Faltas</h1>
          <p className="text-muted-foreground">Controle de faltas e ausências dos profissionais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" onClick={exportarCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Registrar Falta
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filtros Avançados</h3>
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Loja</Label>
                <Select value={filtros.loja} onValueChange={(value) => setFiltros(prev => ({ ...prev, loja: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {lojasUnicas.map((loja) => (
                      <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filtros.tipo} onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="JUSTIFICADA">Justificada</SelectItem>
                    <SelectItem value="INJUSTIFICADA">Injustificada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Buscar</Label>
                <Input
                  placeholder="Nome ou matrícula"
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{faltasFiltradas.length}</p>
                <p className="text-sm text-muted-foreground">Total de Faltas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{faltasJustificadas}</p>
                <p className="text-sm text-muted-foreground">Justificadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{faltasInjustificadas}</p>
                <p className="text-sm text-muted-foreground">Injustificadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Faltas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="text-center">Atestado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faltasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {faltas.length === 0 ? 'Nenhuma falta registrada ainda' : 'Nenhuma falta encontrada com os filtros aplicados'}
                  </TableCell>
                </TableRow>
              ) : (
                faltasFiltradas.map((falta) => (
                  <TableRow key={falta.id}>
                    <TableCell>{new Date(falta.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-mono">{falta.matricula}</TableCell>
                    <TableCell className="font-medium">{falta.nomeProfissional}</TableCell>
                    <TableCell>{falta.loja}</TableCell>
                    <TableCell>
                      <Badge className={getTipoColor(falta.tipo)}>
                        {falta.tipo === 'JUSTIFICADA' ? 'Justificada' : 'Injustificada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{falta.observacao || '-'}</TableCell>
                    <TableCell className="text-center">
                      {falta.atestadoFileId ? (
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="ghost" title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Baixar">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Nova Falta</DialogTitle>
            <DialogDescription>
              Preencha as informações sobre a falta do profissional
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula *</Label>
                <Input
                  id="matricula"
                  placeholder="001"
                  value={formData.matricula}
                  onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data da Falta *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Falta *</Label>
              <Select value={formData.tipo} onValueChange={(value: 'JUSTIFICADA' | 'INJUSTIFICADA') => setFormData(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JUSTIFICADA">Justificada</SelectItem>
                  <SelectItem value="INJUSTIFICADA">Injustificada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                placeholder="Detalhes adicionais sobre a falta"
                value={formData.observacao}
                onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Atestado/Comprovante</Label>
              <FileUploader onFileUploaded={handleFileUploaded} />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? 'Salvando...' : 'Registrar Falta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
