import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileUploader } from '@/components/FileUploader';
import { Heart, AlertTriangle, Calendar, Upload, FileText, Plus, Eye } from 'lucide-react';
import { useN8NAction } from '@/hooks/useN8NAction';
import { useMockData } from '@/hooks/useMockData';

interface ASOExam {
  matricula: string;
  nome: string;
  loja: string;
  dataEmissao: string;
  dataValidade: string;
  tipo: 'SEMESTRAL' | 'ANUAL';
  status: 'VALIDO' | 'VENCIDO' | 'VENCE_30_DIAS';
  fileId: string | null;
  observacao?: string;
}

export default function GestaoASO() {
  const mockData = useMockData();
  const [exams, setExams] = useState<ASOExam[]>([]);

  useEffect(() => {
    if (mockData.hasMockData) {
      const examesData = mockData.getExamesASO();
      const examesFormatados: ASOExam[] = examesData.map((e) => ({
        matricula: e.matricula,
        nome: e.nome,
        loja: e.loja,
        dataEmissao: e.ultimoExame,
        dataValidade: e.proximoExame,
        tipo: e.tipoExame === 'Periódico' ? 'SEMESTRAL' : 'ANUAL',
        status: e.status === 'vencido' ? 'VENCIDO' : e.status === 'vencendo' ? 'VENCE_30_DIAS' : 'VALIDO',
        fileId: null,
      }));
      setExams(examesFormatados);
    } else {
      // Dados de fallback
      setExams([
        {
          matricula: '001',
          nome: 'João Silva',
          loja: 'CENTRO',
          dataEmissao: '2025-02-15',
          dataValidade: '2025-08-15',
          tipo: 'SEMESTRAL',
          status: 'VALIDO',
          fileId: null,
        },
        {
          matricula: '002',
          nome: 'Maria Santos',
          loja: 'BROOKLIN',
          dataEmissao: '2024-12-10',
          dataValidade: '2025-06-10',
          tipo: 'ANUAL',
          status: 'VENCE_30_DIAS',
          fileId: null,
        }
      ]);
    }
  }, [mockData.hasMockData]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ASOExam>>({
    tipo: 'SEMESTRAL'
  });

  const { execute, loading } = useN8NAction();

  const calculateStatus = (dataValidade: string): ASOExam['status'] => {
    const today = new Date();
    const validadeDate = new Date(dataValidade);
    const diffTime = validadeDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'VENCIDO';
    if (diffDays <= 30) return 'VENCE_30_DIAS';
    return 'VALIDO';
  };

  const handleSave = async () => {
    if (!formData.matricula || !formData.dataEmissao || !formData.dataValidade || !formData.fileId) return;

    const payload = {
      ...formData,
      status: calculateStatus(formData.dataValidade!),
    };

    await execute('aso_cadastrar', payload, {
      successMessage: 'Exame ASO cadastrado com sucesso!',
    });

    setExams(prev => [...prev, payload as ASOExam]);
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({ tipo: 'SEMESTRAL' });
  };

  const getStatusBadge = (status: ASOExam['status']) => {
    switch (status) {
      case 'VALIDO':
        return <Badge className="bg-success/10 text-success border-success/20">Válido</Badge>;
      case 'VENCE_30_DIAS':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Vence em 30 dias</Badge>;
      case 'VENCIDO':
        return <Badge variant="destructive">Vencido</Badge>;
    }
  };

  const getTipoBadge = (tipo: ASOExam['tipo']) => {
    return tipo === 'SEMESTRAL' 
      ? <Badge variant="outline">6 meses</Badge>
      : <Badge variant="secondary">Anual</Badge>;
  };

  const vencendoEm30Dias = exams.filter(e => e.status === 'VENCE_30_DIAS').length;
  const vencidos = exams.filter(e => e.status === 'VENCIDO').length;
  const validos = exams.filter(e => e.status === 'VALIDO').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Exames</h1>
          <p className="text-muted-foreground">Controle de exames ocupacionais e periódicos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar ASO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo ASO</DialogTitle>
              <DialogDescription>
                Cadastre um novo exame de saúde ocupacional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    placeholder="001"
                    value={formData.matricula || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    placeholder="Nome do funcionário"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataEmissao">Data de Emissão</Label>
                  <Input
                    id="dataEmissao"
                    type="date"
                    value={formData.dataEmissao || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataEmissao: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataValidade">Data de Validade</Label>
                  <Input
                    id="dataValidade"
                    type="date"
                    value={formData.dataValidade || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataValidade: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Exame</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.tipo === 'SEMESTRAL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, tipo: 'SEMESTRAL' }))}
                  >
                    Semestral
                  </Button>
                  <Button
                    type="button"
                    variant={formData.tipo === 'ANUAL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, tipo: 'ANUAL' }))}
                  >
                    Anual
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload do Exame ASO</Label>
                <FileUploader
                  onFileUploaded={(fileId) => setFormData(prev => ({ ...prev, fileId }))}
                />
                {formData.fileId && (
                  <p className="text-sm text-success">✓ Arquivo enviado</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Input
                  id="observacao"
                  placeholder="Informações adicionais"
                  value={formData.observacao || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCloseDialog} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading || !formData.fileId} className="flex-1">
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{validos}</p>
                <p className="text-sm text-muted-foreground">Válidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{vencendoEm30Dias}</p>
                <p className="text-sm text-muted-foreground">Vencem em 30 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{vencidos}</p>
                <p className="text-sm text-muted-foreground">Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">{exams.length}</p>
                <p className="text-sm text-muted-foreground">Total de exames</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controle de Exames ASO</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono">{exam.matricula}</TableCell>
                  <TableCell className="font-medium">{exam.nome}</TableCell>
                  <TableCell>{exam.loja}</TableCell>
                  <TableCell>{getTipoBadge(exam.tipo)}</TableCell>
                  <TableCell>{new Date(exam.dataEmissao).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{new Date(exam.dataValidade).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{getStatusBadge(exam.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(vencendoEm30Dias > 0 || vencidos > 0) && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Vencimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vencidos > 0 && (
                <p className="text-destructive">⚠️ {vencidos} exame(s) vencido(s) - Renovação urgente necessária</p>
              )}
              {vencendoEm30Dias > 0 && (
                <p className="text-warning">🔔 {vencendoEm30Dias} exame(s) vencem nos próximos 30 dias</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}