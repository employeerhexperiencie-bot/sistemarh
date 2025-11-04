import { useState } from 'react';
import { FileText, Mail, CheckCircle, Download, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileUploader } from '@/components/FileUploader';
import { useN8NAction } from '@/hooks/useN8NAction';

const mockHolerites = [
  { loja: 'BROOKLIN', matricula: '123', colaborador: 'João Silva', status: 'GERADO', hid: 'HID-001', link: '#' },
  { loja: 'BROOKLIN', matricula: '124', colaborador: 'Maria Santos', status: 'ENVIADO', hid: 'HID-002', link: '#' },
  { loja: 'TATUAPÉ', matricula: '125', colaborador: 'Pedro Costa', status: 'ASSINADO', hid: 'HID-003', link: '#' },
];

export default function Holerites() {
  const [competencia, setCompetencia] = useState('');
  const [selectedHolerite, setSelectedHolerite] = useState<any>(null);
  const [uploadFileId, setUploadFileId] = useState<string | null>(null);
  
  const { execute, loading } = useN8NAction();

  const handleGerar = async () => {
    if (!competencia) return;
    
    await execute('holerite_gerar', { competencia }, {
      successMessage: 'Holerites gerados com sucesso',
    });
  };

  const handleEnviar = async () => {
    if (!competencia) return;
    
    await execute('holerite_enviar', { competencia }, {
      successMessage: 'Holerites enviados por e-mail',
    });
  };

  const handleMarcarAssinado = async () => {
    if (!selectedHolerite || !uploadFileId) return;
    
    await execute('holerite_assinado', {
      competencia,
      hid: selectedHolerite.hid,
      matricula: selectedHolerite.matricula,
      fileId: uploadFileId,
    }, {
      successMessage: 'Holerite marcado como assinado',
    });
    
    setSelectedHolerite(null);
    setUploadFileId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GERADO':
        return <Badge variant="secondary">Gerado</Badge>;
      case 'ENVIADO':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Enviado</Badge>;
      case 'ASSINADO':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Assinado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Holerites</h1>
        <Badge variant="outline" className="bg-accent/10">
          <FileText className="h-4 w-4 mr-2" />
          PDF + E-mail + Drive
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Competência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="competencia">Mês/Ano</Label>
                <Input
                  id="competencia"
                  placeholder="2025-08"
                  value={competencia}
                  onChange={(e) => setCompetencia(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleGerar} 
                  disabled={!competencia || loading}
                  className="w-full"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar PDFs
                </Button>

                <Button 
                  onClick={handleEnviar} 
                  disabled={!competencia || loading}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar por E-mail
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Status dos Holerites</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loja</TableHead>
                    <TableHead>Matr.</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HID</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHolerites.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.loja}</TableCell>
                      <TableCell>{item.matricula}</TableCell>
                      <TableCell>{item.colaborador}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="font-mono text-sm">{item.hid}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          {item.status !== 'ASSINADO' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setSelectedHolerite(item)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Marcar como Assinado</DialogTitle>
                                  <DialogDescription>
                                    Confirme a assinatura do holerite pelo profissional
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="text-sm text-muted-foreground">
                                    <p><strong>Colaborador:</strong> {item.colaborador}</p>
                                    <p><strong>Matrícula:</strong> {item.matricula}</p>
                                    <p><strong>HID:</strong> {item.hid}</p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>Upload do Holerite Assinado</Label>
                                    <FileUploader
                                      onFileUploaded={setUploadFileId}
                                    />
                                  </div>

                                  <Button 
                                    onClick={handleMarcarAssinado}
                                    disabled={!uploadFileId || loading}
                                    className="w-full"
                                  >
                                    Confirmar Assinatura
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-emerald-400">12</p>
                <p className="text-sm text-muted-foreground">Gerados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Mail className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">8</p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">3</p>
                <p className="text-sm text-muted-foreground">Assinados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}