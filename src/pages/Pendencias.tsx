import { useState } from 'react';
import { AlertCircle, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useN8NAction } from '@/hooks/useN8NAction';

const mockPendencias = [
  {
    pid: 'PID-8C2F',
    loja: 'BROOKLIN',
    motivo: 'Formato inválido',
    mensagem: 'Vale de R$ 120,50 para matrícula 123 em 14/08/2025',
    criadoEm: '2025-08-14 14:30',
    status: 'PENDENTE',
    abaLinha: null,
  },
  {
    pid: 'PID-7A1B',
    loja: 'TATUAPÉ',
    motivo: 'Matrícula não encontrada',
    mensagem: 'Adiantamento de R$ 350,00 para matrícula 999',
    criadoEm: '2025-08-14 15:15',
    status: 'PENDENTE',
    abaLinha: null,
  },
  {
    pid: 'PID-5F3E',
    loja: 'BROOKLIN',
    motivo: 'Valor inválido',
    mensagem: 'Vale de R$ abc para matrícula 456',
    criadoEm: '2025-08-14 10:20',
    status: 'RESOLVIDO',
    abaLinha: 'VALES LOJAS!A128',
  },
];

export default function Pendencias() {
  const [selectedPendencia, setSelectedPendencia] = useState<any>(null);
  const [correcaoData, setCorrecaoData] = useState({
    action: '',
    matricula: '',
    valorCentavos: '',
    dataISO: '',
    competencia: '',
    observacao: '',
  });
  
  const { execute, loading } = useN8NAction();

  const handleOpenCorrection = (pendencia: any) => {
    setSelectedPendencia(pendencia);
    
    // Parse da mensagem para preencher campos automaticamente
    const mensagem = pendencia.mensagem.toLowerCase();
    
    if (mensagem.includes('vale')) {
      setCorrecaoData(prev => ({ ...prev, action: 'vale' }));
    } else if (mensagem.includes('adiantamento')) {
      setCorrecaoData(prev => ({ ...prev, action: 'adiantamento' }));
    } else if (mensagem.includes('pagamento') || mensagem.includes('pagto')) {
      setCorrecaoData(prev => ({ ...prev, action: 'pagto' }));
    }
    
    // Tentar extrair matrícula
    const matriculaMatch = mensagem.match(/matrícula (\d+)/);
    if (matriculaMatch) {
      setCorrecaoData(prev => ({ ...prev, matricula: matriculaMatch[1] }));
    }
    
    // Tentar extrair valor
    const valorMatch = mensagem.match(/r\$?\s*(\d+[.,]\d+)/);
    if (valorMatch) {
      const valor = valorMatch[1].replace(',', '.');
      const centavos = Math.round(parseFloat(valor) * 100);
      setCorrecaoData(prev => ({ ...prev, valorCentavos: centavos.toString() }));
    }
  };

  const handleCorrigir = async () => {
    if (!selectedPendencia) return;
    
    const normalized = {
      action: correcaoData.action,
      matricula: correcaoData.matricula,
      valorCentavos: parseInt(correcaoData.valorCentavos),
      ...(correcaoData.dataISO && { dataISO: correcaoData.dataISO }),
      ...(correcaoData.competencia && { competencia: correcaoData.competencia }),
      ...(correcaoData.observacao && { observacao: correcaoData.observacao }),
    };

    await execute('pendencia_resolve', {
      pid: selectedPendencia.pid,
      normalized,
    }, {
      successMessage: 'Pendência corrigida e relançada com sucesso',
    });

    setSelectedPendencia(null);
    setCorrecaoData({
      action: '',
      matricula: '',
      valorCentavos: '',
      dataISO: '',
      competencia: '',
      observacao: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'RESOLVIDO':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Resolvido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Pendências</h1>
        <Badge variant="outline" className="bg-accent/10">
          <AlertCircle className="h-4 w-4 mr-2" />
          Sistema PID
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-400">2</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-emerald-400">1</p>
                <p className="text-sm text-muted-foreground">Resolvidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">3</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Lista de Pendências</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PID</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Mensagem Original</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aba!Linha</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPendencias.map((pendencia, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{pendencia.pid}</TableCell>
                  <TableCell className="font-medium">{pendencia.loja}</TableCell>
                  <TableCell>{pendencia.motivo}</TableCell>
                  <TableCell className="max-w-xs truncate">{pendencia.mensagem}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{pendencia.criadoEm}</TableCell>
                  <TableCell>{getStatusBadge(pendencia.status)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {pendencia.abaLinha || '-'}
                  </TableCell>
                  <TableCell>
                    {pendencia.status === 'PENDENTE' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenCorrection(pendencia)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Corrigir
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Corrigir Pendência - {pendencia.pid}</DialogTitle>
                            <DialogDescription>
                              Corrija as informações da pendência e reenvie
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <p className="text-sm"><strong>Motivo:</strong> {pendencia.motivo}</p>
                              <p className="text-sm"><strong>Mensagem original:</strong> {pendencia.mensagem}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Ação</Label>
                                <Input
                                  placeholder="vale, adiantamento, pagto"
                                  value={correcaoData.action}
                                  onChange={(e) => setCorrecaoData(prev => ({ ...prev, action: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Matrícula</Label>
                                <Input
                                  placeholder="123"
                                  value={correcaoData.matricula}
                                  onChange={(e) => setCorrecaoData(prev => ({ ...prev, matricula: e.target.value }))}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Valor (centavos)</Label>
                                <Input
                                  placeholder="12050"
                                  value={correcaoData.valorCentavos}
                                  onChange={(e) => setCorrecaoData(prev => ({ ...prev, valorCentavos: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Data (ISO)</Label>
                                <Input
                                  type="date"
                                  value={correcaoData.dataISO}
                                  onChange={(e) => setCorrecaoData(prev => ({ ...prev, dataISO: e.target.value }))}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Competência (opcional)</Label>
                              <Input
                                placeholder="2025-08"
                                value={correcaoData.competencia}
                                onChange={(e) => setCorrecaoData(prev => ({ ...prev, competencia: e.target.value }))}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Observação</Label>
                              <Textarea
                                placeholder="Detalhes da correção"
                                value={correcaoData.observacao}
                                onChange={(e) => setCorrecaoData(prev => ({ ...prev, observacao: e.target.value }))}
                                rows={3}
                              />
                            </div>

                            <Button 
                              onClick={handleCorrigir}
                              disabled={loading || !correcaoData.action || !correcaoData.matricula}
                              className="w-full"
                            >
                              Corrigir e Relançar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
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