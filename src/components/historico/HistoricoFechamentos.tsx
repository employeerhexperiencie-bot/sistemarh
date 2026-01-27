import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  History, CheckCircle2, AlertTriangle, ChevronRight, User, Calendar, 
  FileText, Eye, ShieldAlert
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FechamentoHistorico {
  id: string;
  competencia: string;
  created_at: string;
  usuario: string;
  pendencias_ignoradas: any[];
  total_funcionarios: number;
  total_geral: number;
}

export function HistoricoFechamentos() {
  const [fechamentos, setFechamentos] = useState<FechamentoHistorico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFechamento, setSelectedFechamento] = useState<FechamentoHistorico | null>(null);

  useEffect(() => {
    const fetchFechamentos = async () => {
      const { data, error } = await supabase
        .from('historico_acoes')
        .select('*')
        .eq('acao', 'fechamento_folha_com_pendencias')
        .order('created_at', { ascending: false });

      if (data) {
        const formatted = data.map(d => {
          let dadosNovos: any = {};
          try {
            dadosNovos = typeof d.dados_novos === 'string' ? JSON.parse(d.dados_novos) : d.dados_novos || {};
          } catch (e) {
            dadosNovos = {};
          }
          
          return {
            id: d.id,
            competencia: d.entidade_id,
            created_at: d.created_at,
            usuario: d.usuario || 'Sistema',
            pendencias_ignoradas: dadosNovos.pendencias_ignoradas || [],
            total_funcionarios: dadosNovos.total_funcionarios || 0,
            total_geral: dadosNovos.total_geral || 0,
          };
        });
        setFechamentos(formatted);
      }
      setIsLoading(false);
    };

    fetchFechamentos();
  }, []);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando histórico...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Fechamentos
          </CardTitle>
          <CardDescription>
            Registro de todas as folhas fechadas e pendências assumidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fechamentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
              <p>Nenhum fechamento com pendências registrado</p>
              <p className="text-sm">Isso significa que todas as folhas foram fechadas sem pendências</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Autorizado por</TableHead>
                  <TableHead>Pendências</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fechamentos.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.competencia}</TableCell>
                    <TableCell>
                      {format(new Date(f.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {f.usuario}
                      </div>
                    </TableCell>
                    <TableCell>
                      {f.pendencias_ignoradas.length > 0 ? (
                        <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {f.pendencias_ignoradas.length} ignorada(s)
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sem pendências
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(f.total_geral)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedFechamento(f)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedFechamento} onOpenChange={() => setSelectedFechamento(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalhes do Fechamento
            </DialogTitle>
            <DialogDescription>
              Competência: {selectedFechamento?.competencia}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Autorizado por</p>
                  <p className="font-medium">{selectedFechamento?.usuario}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">
                    {selectedFechamento && format(new Date(selectedFechamento.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total da Folha</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedFechamento?.total_geral || 0)}</p>
                </div>
                <Badge variant="secondary">
                  {selectedFechamento?.total_funcionarios} funcionários
                </Badge>
              </CardContent>
            </Card>

            {/* Pendencies */}
            {selectedFechamento?.pendencias_ignoradas && selectedFechamento.pendencias_ignoradas.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  Pendências Assumidas
                </h4>
                <div className="space-y-2">
                  {selectedFechamento.pendencias_ignoradas.map((p: any, idx: number) => (
                    <Card key={idx} className="border-warning/30 bg-warning/5">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{p.tipo}</p>
                          <p className="text-xs text-muted-foreground">{p.descricao}</p>
                        </div>
                        <Badge variant={p.nivel === 'critico' ? 'destructive' : 'secondary'}>
                          {p.quantidade}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Este registro garante rastreabilidade de quem autorizou o fechamento 
              e quais pendências foram assumidas.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
