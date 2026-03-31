import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Banknote, Download, Plus, Calendar, Users, 
  DollarSign, CheckCircle, Clock, Building2, Loader2, Pause, Play, AlertCircle, 
  CreditCard, FileText, TrendingDown, CalendarClock, Pencil, Save, X, History
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllPaginated } from '@/lib/supabasePagination';
import { toast } from 'sonner';
import { HistoricoEmprestimos, registrarHistoricoEmprestimo } from './HistoricoEmprestimos';
import { NovoEmprestimoForm } from './NovoEmprestimoForm';

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

// Calcula quantos meses se passaram desde a data de início até agora
const calcularMesesDesdeInicio = (dataInicio: string): number => {
  if (!dataInicio) return 0;
  const inicio = new Date(dataInicio);
  const hoje = new Date();
  const meses = (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
  // Se ainda não chegou o dia de vencimento deste mês, subtrai 1
  if (hoje.getDate() < inicio.getDate()) {
    return Math.max(0, meses);
  }
  return Math.max(0, meses + 1); // +1 porque o mês inicial também conta
};

interface Emprestimo {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  lojaId: string;
  tipo: 'empresa' | 'clt';
  valorTotal: number | null;
  parcelasTotal: number | null;
  parcelasPagas: number;
  parcelasCalculadas: number; // Parcelas calculadas baseado no tempo
  valorParcela: number;
  dataInicio: string;
  dataFim: string | null;
  status: 'ativo' | 'quitado' | 'pausado';
  observacao?: string;
  saldoDevedor: number;
  totalDescontado: number;
}

interface DetalheEmprestimoEmpresaProps {
  emprestimo: Emprestimo;
  onRegistrarParcela: (id: string) => void;
  registrando: boolean;
}

// Componente para detalhes do empréstimo EMPRESA
function DetalheEmprestimoEmpresa({ emprestimo, onRegistrarParcela, registrando }: DetalheEmprestimoEmpresaProps) {
  const valorPago = emprestimo.valorParcela * emprestimo.parcelasPagas;
  const parcelasRestantes = (emprestimo.parcelasTotal || 0) - emprestimo.parcelasPagas;
  const progresso = emprestimo.parcelasTotal ? (emprestimo.parcelasPagas / emprestimo.parcelasTotal) * 100 : 0;
  
  // Gerar histórico de parcelas
  const parcelas = Array.from({ length: emprestimo.parcelasTotal || 0 }, (_, i) => {
    const data = new Date(emprestimo.dataInicio);
    data.setMonth(data.getMonth() + i);
    return {
      numero: i + 1,
      data: data.toISOString().split('T')[0],
      valor: emprestimo.valorParcela,
      pago: i < emprestimo.parcelasPagas,
    };
  });
  
  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">Empréstimo com a Empresa</span>
          </div>
          <p className="text-sm text-muted-foreground">
            O funcionário pegou um empréstimo com a empresa. O valor é descontado mensalmente na folha de pagamento até a quitação total.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Funcionário</p>
              <p className="font-semibold">{emprestimo.nome}</p>
              <p className="text-sm text-muted-foreground">Mat: {emprestimo.matricula}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Loja</p>
              <Badge variant="outline">{emprestimo.loja}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data de início destacada */}
      <Card className="border-info/20 bg-info/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-info" />
            <div>
              <p className="text-xs text-muted-foreground">Início da Cobrança</p>
              <p className="text-lg font-bold text-info">{formatDate(emprestimo.dataInicio)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Valor Total do Empréstimo</p>
            <p className="text-xl font-bold">{formatCurrency(emprestimo.valorTotal || 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Valor da Parcela</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(emprestimo.valorParcela)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Progresso do Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Parcelas pagas</span>
            <span className="font-semibold">{emprestimo.parcelasPagas} de {emprestimo.parcelasTotal}</span>
          </div>
          <Progress value={progresso} className="h-3" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center p-2 bg-success/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Pago</p>
              <p className="font-bold text-success">{formatCurrency(valorPago)}</p>
            </div>
            <div className="text-center p-2 bg-warning/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Saldo Devedor</p>
              <p className="font-bold text-warning">{formatCurrency(emprestimo.saldoDevedor)}</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Parcelas Restantes</p>
              <p className="font-bold">{parcelasRestantes}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ação de registrar pagamento */}
      {emprestimo.status === 'ativo' && parcelasRestantes > 0 && (
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-success">Registrar Pagamento</p>
                <p className="text-sm text-muted-foreground">
                  Parcela {emprestimo.parcelasPagas + 1} de {emprestimo.parcelasTotal} - {formatCurrency(emprestimo.valorParcela)}
                </p>
              </div>
              <Button 
                onClick={() => onRegistrarParcela(emprestimo.id)}
                disabled={registrando}
                className="bg-success hover:bg-success/90"
              >
                {registrando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Registrar Parcela
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Parcelas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Histórico de Parcelas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-48">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcelas.map((p) => (
                  <TableRow key={p.numero} className={p.pago ? 'bg-success/5' : ''}>
                    <TableCell className="font-mono">{String(p.numero).padStart(2, '0')}</TableCell>
                    <TableCell>{formatDate(p.data)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.valor)}</TableCell>
                    <TableCell className="text-center">
                      {p.pago ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pago
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

interface DetalheEmprestimoCLTProps {
  emprestimo: Emprestimo;
  onStatusChange: () => void;
}

// Componente para detalhes do empréstimo CLT (consignado)
function DetalheEmprestimoCLT({ emprestimo, onStatusChange }: DetalheEmprestimoCLTProps) {
  const [atualizando, setAtualizando] = useState(false);

  const handleToggleStatus = async () => {
    setAtualizando(true);
    const novoStatus = emprestimo.status === 'ativo' ? 'pausado' : 'ativo';
    
    const { error } = await supabase
      .from('emprestimos')
      .update({ status: novoStatus })
      .eq('id', emprestimo.id);
    
    if (error) {
      toast.error('Erro ao atualizar status do empréstimo');
    } else {
      toast.success(novoStatus === 'pausado' ? 'Desconto pausado com sucesso' : 'Desconto reativado com sucesso');
      onStatusChange();
    }
    setAtualizando(false);
  };

  const handleQuitar = async () => {
    setAtualizando(true);
    
    const { error } = await supabase
      .from('emprestimos')
      .update({ status: 'quitado' })
      .eq('id', emprestimo.id);
    
    if (error) {
      toast.error('Erro ao quitar empréstimo');
    } else {
      toast.success('Empréstimo marcado como quitado');
      onStatusChange();
    }
    setAtualizando(false);
  };
  
  return (
    <div className="space-y-4">
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Banknote className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-blue-500">Empréstimo Consignado (CLT)</span>
          </div>
          <p className="text-sm text-muted-foreground">
            O funcionário possui um empréstimo consignado com o governo/banco. A empresa desconta o valor fixo mensal até que seja solicitada a pausa do desconto.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Funcionário</p>
              <p className="font-semibold">{emprestimo.nome}</p>
              <p className="text-sm text-muted-foreground">Mat: {emprestimo.matricula}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Status do Desconto</p>
              <Badge 
                variant="outline" 
                className={
                  emprestimo.status === 'ativo' 
                    ? 'bg-success/10 text-success border-success/20' 
                    : emprestimo.status === 'quitado'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-warning/10 text-warning border-warning/20'
                }
              >
                {emprestimo.status === 'ativo' ? 'Descontando' : emprestimo.status === 'quitado' ? 'Quitado' : 'Pausado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data de início destacada */}
      <Card className="border-info/20 bg-info/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-info" />
            <div>
              <p className="text-xs text-muted-foreground">Início da Cobrança</p>
              <p className="text-lg font-bold text-info">{formatDate(emprestimo.dataInicio)}</p>
              <p className="text-xs text-muted-foreground">
                {emprestimo.parcelasCalculadas} {emprestimo.parcelasCalculadas === 1 ? 'mês' : 'meses'} desde o início
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info importante */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-700">Valor total não disponível</p>
              <p className="text-muted-foreground">
                Por ser um empréstimo consignado, a empresa não tem acesso ao valor total do contrato. Apenas o valor da parcela mensal é informado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Valor da Parcela Mensal</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(emprestimo.valorParcela)}</p>
          </CardContent>
        </Card>
        <Card className="bg-success/10">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Já Descontado</p>
            <p className="text-xl font-bold text-success">{formatCurrency(emprestimo.totalDescontado)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Parcelas Descontadas</p>
              <p className="text-2xl font-bold">{emprestimo.parcelasCalculadas}</p>
              <p className="text-xs text-muted-foreground">(calculado)</p>
            </div>
            <div className="text-center p-3 bg-info/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Desde</p>
              <p className="text-lg font-bold text-info">{formatDate(emprestimo.dataInicio)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações de controle */}
      {emprestimo.status !== 'quitado' && (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Controle do Desconto</p>
                <p className="text-sm text-muted-foreground">
                  {emprestimo.status === 'ativo' 
                    ? 'Pause temporariamente ou quite o empréstimo' 
                    : 'Reative o desconto se necessário'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={emprestimo.status === 'ativo' ? 'outline' : 'default'}
                onClick={handleToggleStatus}
                disabled={atualizando}
                className="flex-1"
              >
                {atualizando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : emprestimo.status === 'ativo' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar Desconto
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Reativar Desconto
                  </>
                )}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleQuitar}
                disabled={atualizando}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Quitar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente de Relatório por Loja
interface RelatorioLojaProps {
  emprestimos: Emprestimo[];
  lojas: string[];
}

function RelatorioLoja({ emprestimos, lojas }: RelatorioLojaProps) {
  const relatorioData = useMemo(() => {
    return lojas.map(loja => {
      const emprestimosLoja = emprestimos.filter(e => e.loja === loja);
      const ativos = emprestimosLoja.filter(e => e.status === 'ativo');
      const pausados = emprestimosLoja.filter(e => e.status === 'pausado');
      const quitados = emprestimosLoja.filter(e => e.status === 'quitado');
      
      const empresaAtivos = ativos.filter(e => e.tipo === 'empresa');
      const cltAtivos = ativos.filter(e => e.tipo === 'clt');
      
      return {
        loja,
        total: emprestimosLoja.length,
        ativos: ativos.length,
        pausados: pausados.length,
        quitados: quitados.length,
        saldoEmpresa: empresaAtivos.reduce((s, e) => s + e.saldoDevedor, 0),
        descontoMensalEmpresa: empresaAtivos.reduce((s, e) => s + e.valorParcela, 0),
        descontoMensalCLT: cltAtivos.reduce((s, e) => s + e.valorParcela, 0),
        descontoMensalTotal: ativos.reduce((s, e) => s + e.valorParcela, 0),
      };
    }).sort((a, b) => b.descontoMensalTotal - a.descontoMensalTotal);
  }, [emprestimos, lojas]);

  const totaisGerais = useMemo(() => {
    return relatorioData.reduce((acc, r) => ({
      total: acc.total + r.total,
      ativos: acc.ativos + r.ativos,
      pausados: acc.pausados + r.pausados,
      quitados: acc.quitados + r.quitados,
      saldoEmpresa: acc.saldoEmpresa + r.saldoEmpresa,
      descontoMensalTotal: acc.descontoMensalTotal + r.descontoMensalTotal,
    }), { total: 0, ativos: 0, pausados: 0, quitados: 0, saldoEmpresa: 0, descontoMensalTotal: 0 });
  }, [relatorioData]);

  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resumo Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-2 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground">Total Empréstimos</p>
              <p className="text-2xl font-bold">{totaisGerais.total}</p>
            </div>
            <div className="text-center p-2 bg-success/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold text-success">{totaisGerais.ativos}</p>
            </div>
            <div className="text-center p-2 bg-warning/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Saldo Devedor (Empresa)</p>
              <p className="text-lg font-bold text-warning">{formatCurrency(totaisGerais.saldoEmpresa)}</p>
            </div>
            <div className="text-center p-2 bg-primary/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Desconto Mensal Total</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totaisGerais.descontoMensalTotal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Ativos</TableHead>
                  <TableHead className="text-center">Pausados</TableHead>
                  <TableHead className="text-center">Quitados</TableHead>
                  <TableHead className="text-right">Saldo Empresa</TableHead>
                  <TableHead className="text-right">Desc. Mensal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorioData.map((r) => (
                  <TableRow key={r.loja}>
                    <TableCell className="font-medium">{r.loja}</TableCell>
                    <TableCell className="text-center">{r.total}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {r.ativos}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {r.pausados > 0 ? (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                          {r.pausados}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.quitados > 0 ? (
                        <Badge variant="outline" className="bg-muted">
                          {r.quitados}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-warning font-medium">
                      {formatCurrency(r.saldoEmpresa)}
                    </TableCell>
                    <TableCell className="text-right text-primary font-bold">
                      {formatCurrency(r.descontoMensalTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export function GestaoEmprestimos() {
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('ativo'); // Default para ativos
  const [searchTerm, setSearchTerm] = useState('');
  const [novoEmprestimoOpen, setNovoEmprestimoOpen] = useState(false);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [lojas, setLojas] = useState<string[]>([]);
  
  // Estado para edição
  const [editandoEmprestimo, setEditandoEmprestimo] = useState<Emprestimo | null>(null);
  const [editForm, setEditForm] = useState({
    parcelasPagas: 0,
    saldoDevedor: 0,
    status: 'ativo' as 'ativo' | 'quitado' | 'pausado',
    observacoes: ''
  });
  const [salvando, setSalvando] = useState(false);

  const abrirEdicao = (emp: Emprestimo) => {
    setEditandoEmprestimo(emp);
    setEditForm({
      parcelasPagas: emp.parcelasPagas,
      saldoDevedor: emp.saldoDevedor,
      status: emp.status,
      observacoes: emp.observacao || ''
    });
  };

  const salvarEdicao = async () => {
    if (!editandoEmprestimo) return;
    setSalvando(true);

    const { error } = await supabase
      .from('emprestimos')
      .update({
        parcelas_pagas: editForm.parcelasPagas,
        saldo_devedor: editForm.saldoDevedor,
        status: editForm.status,
        observacoes: editForm.observacoes || null
      })
      .eq('id', editandoEmprestimo.id);

    if (error) {
      toast.error('Erro ao salvar alterações');
    } else {
      // Registrar alterações no histórico
      const alteracoes: string[] = [];
      
      if (editForm.parcelasPagas !== editandoEmprestimo.parcelasPagas) {
        await registrarHistoricoEmprestimo({
          emprestimoId: editandoEmprestimo.id,
          acao: 'edicao',
          campoAlterado: 'parcelas_pagas',
          valorAnterior: editandoEmprestimo.parcelasPagas,
          valorNovo: editForm.parcelasPagas
        });
        alteracoes.push('parcelas');
      }
      
      if (editForm.saldoDevedor !== editandoEmprestimo.saldoDevedor) {
        await registrarHistoricoEmprestimo({
          emprestimoId: editandoEmprestimo.id,
          acao: 'edicao',
          campoAlterado: 'saldo_devedor',
          valorAnterior: editandoEmprestimo.saldoDevedor,
          valorNovo: editForm.saldoDevedor
        });
        alteracoes.push('saldo');
      }
      
      if (editForm.status !== editandoEmprestimo.status) {
        const acaoTipo = editForm.status === 'quitado' ? 'quitar' 
          : editForm.status === 'pausado' ? 'pausar' 
          : 'reativar';
        await registrarHistoricoEmprestimo({
          emprestimoId: editandoEmprestimo.id,
          acao: acaoTipo,
          campoAlterado: 'status',
          valorAnterior: editandoEmprestimo.status,
          valorNovo: editForm.status
        });
        alteracoes.push('status');
      }
      
      toast.success('Empréstimo atualizado com sucesso');
      setEditandoEmprestimo(null);
      fetchData();
    }
    setSalvando(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empResult, profData, lojasResult] = await Promise.all([
        supabase.from('emprestimos').select('*'),
        fetchAllPaginated(() =>
          supabase.from('profissionais').select('id, nome, matricula, loja_id')
        ),
        supabase.from('lojas').select('id, nome')
      ]);

      if (empResult.error) throw empResult.error;

      const lojasMap: Record<string, string> = {};
      (lojasResult.data || []).forEach((l: any) => {
        lojasMap[l.id] = l.nome;
      });

      const profissionaisMap: Record<string, { nome: string; matricula: string; loja: string; lojaId: string }> = {};
      (profResult.data || []).forEach((p: any) => {
        profissionaisMap[p.id] = {
          nome: p.nome,
          matricula: p.matricula,
          loja: p.loja_id ? (lojasMap[p.loja_id] || 'Sem Loja') : 'Sem Loja',
          lojaId: p.loja_id || ''
        };
      });

      const emprestimosFormatados: Emprestimo[] = (empResult.data || []).map(e => {
        const prof = profissionaisMap[e.profissional_id || ''];
        const tipo = e.tipo === 'empresa' ? 'empresa' : 'clt';
        
        // Calcular parcelas baseado no tempo desde o início (apenas para exibição CLT)
        const parcelasCalculadas = calcularMesesDesdeInicio(e.data_inicio);
        
        // Usar valores do banco diretamente - sem cálculo automático
        const parcelasPagas = e.parcelas_pagas || 0;
        const saldoDevedor = Number(e.saldo_devedor) || 0;

        // Total descontado (calculado para exibição)
        const totalDescontado = tipo === 'clt' 
          ? parcelasCalculadas * Number(e.valor_parcela)
          : parcelasPagas * Number(e.valor_parcela);

        // Status direto do banco
        const status = e.status as 'ativo' | 'quitado' | 'pausado';
        
        return {
          id: e.id,
          matricula: prof?.matricula || '',
          nome: prof?.nome || 'Sem Nome',
          loja: prof?.loja || 'Sem Loja',
          lojaId: prof?.lojaId || '',
          tipo,
          valorTotal: tipo === 'empresa' ? Number(e.valor_total) || 0 : null,
          parcelasTotal: tipo === 'empresa' ? e.numero_parcelas || 0 : null,
          parcelasPagas,
          parcelasCalculadas,
          valorParcela: Number(e.valor_parcela) || 0,
          dataInicio: e.data_inicio || '',
          dataFim: e.data_previsao_termino || null,
          status,
          observacao: e.observacoes || undefined,
          saldoDevedor,
          totalDescontado,
        };
      });

      // Ordenar: ativos primeiro, depois por data de início mais recente
      emprestimosFormatados.sort((a, b) => {
        if (a.status === 'ativo' && b.status !== 'ativo') return -1;
        if (a.status !== 'ativo' && b.status === 'ativo') return 1;
        return new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime();
      });

      setEmprestimos(emprestimosFormatados);
      
      const lojasUnicas = [...new Set(emprestimosFormatados.map(e => e.loja))].filter(l => l !== 'Sem Loja').sort();
      setLojas(lojasUnicas);
    } catch (error) {
      console.error('Erro ao buscar empréstimos:', error);
      toast.error('Erro ao carregar empréstimos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegistrarParcela = async (id: string) => {
    setRegistrando(true);
    
    const emprestimo = emprestimos.find(e => e.id === id);
    if (!emprestimo) {
      setRegistrando(false);
      return;
    }

    const novasParcelasPagas = emprestimo.parcelasPagas + 1;
    const novoSaldoDevedor = Math.max(0, (emprestimo.valorTotal || 0) - (novasParcelasPagas * emprestimo.valorParcela));
    const novoStatus = emprestimo.parcelasTotal && novasParcelasPagas >= emprestimo.parcelasTotal ? 'quitado' : 'ativo';

    const { error } = await supabase
      .from('emprestimos')
      .update({ 
        parcelas_pagas: novasParcelasPagas,
        saldo_devedor: novoSaldoDevedor,
        status: novoStatus
      })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao registrar pagamento');
    } else {
      // Registrar no histórico
      await registrarHistoricoEmprestimo({
        emprestimoId: id,
        acao: 'pagamento',
        campoAlterado: 'parcela',
        valorAnterior: emprestimo.parcelasPagas,
        valorNovo: novasParcelasPagas,
        observacao: `Parcela ${novasParcelasPagas} de ${emprestimo.parcelasTotal} - R$ ${emprestimo.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      });
      
      if (novoStatus === 'quitado') {
        await registrarHistoricoEmprestimo({
          emprestimoId: id,
          acao: 'quitar',
          campoAlterado: 'status',
          valorAnterior: 'ativo',
          valorNovo: 'quitado',
          observacao: 'Empréstimo quitado automaticamente após última parcela'
        });
      }
      
      toast.success(`Parcela ${novasParcelasPagas} registrada com sucesso!`);
      if (novoStatus === 'quitado') {
        toast.success('🎉 Empréstimo quitado!');
      }
      fetchData();
    }
    setRegistrando(false);
  };
  
  const emprestimosFiltrados = useMemo(() => {
    return emprestimos.filter(e => {
      if (tipoFiltro !== 'todos' && e.tipo !== tipoFiltro) return false;
      if (lojaFiltro !== 'todas' && e.loja !== lojaFiltro) return false;
      if (statusFiltro !== 'todos' && e.status !== statusFiltro) return false;
      if (searchTerm && !e.nome.toLowerCase().includes(searchTerm.toLowerCase()) && !e.matricula.includes(searchTerm)) return false;
      return true;
    });
  }, [emprestimos, tipoFiltro, lojaFiltro, statusFiltro, searchTerm]);

  const emprestimosEmpresa = useMemo(() => emprestimosFiltrados.filter(e => e.tipo === 'empresa'), [emprestimosFiltrados]);
  const emprestimosCLT = useMemo(() => emprestimosFiltrados.filter(e => e.tipo === 'clt'), [emprestimosFiltrados]);
  
  const totais = useMemo(() => {
    const empresaAtivos = emprestimosEmpresa.filter(e => e.status === 'ativo');
    const cltAtivos = emprestimosCLT.filter(e => e.status === 'ativo');
    
    return {
      totalEmprestimos: emprestimosFiltrados.length,
      empresaTotal: emprestimosEmpresa.length,
      empresaAtivos: empresaAtivos.length,
      empresaValorTotal: emprestimosEmpresa.reduce((s, e) => s + (e.valorTotal || 0), 0),
      empresaSaldoDevedor: emprestimosEmpresa.reduce((s, e) => s + e.saldoDevedor, 0),
      empresaDescontoMensal: empresaAtivos.reduce((s, e) => s + e.valorParcela, 0),
      cltTotal: emprestimosCLT.length,
      cltAtivos: cltAtivos.length,
      cltDescontoMensal: cltAtivos.reduce((s, e) => s + e.valorParcela, 0),
      descontoMensalTotal: empresaAtivos.reduce((s, e) => s + e.valorParcela, 0) + cltAtivos.reduce((s, e) => s + e.valorParcela, 0),
    };
  }, [emprestimosFiltrados, emprestimosEmpresa, emprestimosCLT]);
  
  const getStatusBadge = (status: Emprestimo['status'], tipo: Emprestimo['tipo']) => {
    if (tipo === 'clt') {
      const config = {
        ativo: { label: 'Descontando', className: 'bg-success/10 text-success border-success/20' },
        pausado: { label: 'Pausado', className: 'bg-warning/10 text-warning border-warning/20' },
        quitado: { label: 'Quitado', className: 'bg-muted text-muted-foreground' },
      };
      const c = config[status];
      return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
    }
    
    const config = {
      ativo: { label: 'Em Andamento', className: 'bg-info/10 text-info border-info/20' },
      quitado: { label: 'Quitado', className: 'bg-success/10 text-success border-success/20' },
      pausado: { label: 'Pausado', className: 'bg-warning/10 text-warning border-warning/20' },
    };
    const c = config[status];
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };
  
  const exportarCSV = () => {
    const headers = ['Matrícula', 'Nome', 'Loja', 'Tipo', 'Início Cobrança', 'Valor Total', 'Parcelas', 'Pagas', 'Valor Parcela', 'Saldo Devedor', 'Total Descontado', 'Status'];
    const rows = emprestimosFiltrados.map(e => [
      e.matricula, e.nome, e.loja, e.tipo === 'empresa' ? 'Empresa' : 'CLT', 
      formatDate(e.dataInicio),
      e.valorTotal || 'N/A', e.parcelasTotal || 'N/A', e.parcelasPagas,
      e.valorParcela, e.saldoDevedor, e.totalDescontado, e.status
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `emprestimos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando empréstimos...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Gestão de Empréstimos
          </h2>
          <p className="text-sm text-muted-foreground">
            Controle de empréstimos empresa e CLT ({emprestimos.length} registros)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRelatorioOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Relatório por Loja
          </Button>
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" onClick={() => setNovoEmprestimoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Empréstimo
          </Button>
        </div>
      </div>

      {/* Alerta de empréstimos em aberto */}
      {emprestimos.filter(e => e.status === 'ativo').length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <p className="font-medium text-warning">
                  {emprestimos.filter(e => e.status === 'ativo').length} empréstimos em aberto
                </p>
                <p className="text-sm text-muted-foreground">
                  Desconto mensal total: {formatCurrency(totais.descontoMensalTotal)}
                </p>
              </div>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-lg px-3 py-1">
                {formatCurrency(totais.descontoMensalTotal)}/mês
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {emprestimos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum empréstimo cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Ainda não há empréstimos registrados no sistema.
            </p>
            <Button onClick={() => setNovoEmprestimoOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Empréstimo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabs por Tipo */}
          <Tabs defaultValue="todos" onValueChange={setTipoFiltro}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="todos" className="gap-2">
                Todos
                <Badge variant="secondary" className="ml-1">{emprestimos.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="empresa" className="gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
                <Badge variant="secondary" className="ml-1">{totais.empresaTotal}</Badge>
              </TabsTrigger>
              <TabsTrigger value="clt" className="gap-2">
                <Banknote className="h-4 w-4" />
                CLT
                <Badge variant="secondary" className="ml-1">{totais.cltTotal}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Cards Resumo */}
            <div className="mt-4">
              {tipoFiltro === 'todos' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Ativos</p>
                          <p className="text-lg font-bold">{totais.empresaAtivos + totais.cltAtivos}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-info/10">
                          <Building2 className="h-4 w-4 text-info" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Saldo Empresa</p>
                          <p className="text-lg font-bold text-info">{formatCurrency(totais.empresaSaldoDevedor)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Banknote className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">CLT Ativos</p>
                          <p className="text-lg font-bold text-blue-500">{totais.cltAtivos}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Desconto Mensal</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(totais.descontoMensalTotal)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {tipoFiltro === 'empresa' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Empréstimos Ativos</p>
                          <p className="text-lg font-bold">{totais.empresaAtivos}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-info/10">
                          <DollarSign className="h-4 w-4 text-info" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Valor Total Emprestado</p>
                          <p className="text-lg font-bold text-info">{formatCurrency(totais.empresaValorTotal)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10">
                          <TrendingDown className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Saldo Devedor Total</p>
                          <p className="text-lg font-bold text-warning">{formatCurrency(totais.empresaSaldoDevedor)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Desconto Mensal</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(totais.empresaDescontoMensal)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {tipoFiltro === 'clt' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/10">
                          <CheckCircle className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Descontando</p>
                          <p className="text-lg font-bold">{totais.cltAtivos}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10">
                          <Pause className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pausados</p>
                          <p className="text-lg font-bold">{emprestimosCLT.filter(e => e.status === 'pausado').length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Calendar className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Desconto Mensal CLT</p>
                          <p className="text-lg font-bold text-blue-500">{formatCurrency(totais.cltDescontoMensal)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </Tabs>
          
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Loja</Label>
                  <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Lojas</SelectItem>
                      {lojas.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativo">🟢 Ativo / Em Aberto</SelectItem>
                      <SelectItem value="pausado">🟡 Pausado</SelectItem>
                      <SelectItem value="quitado">⚪ Quitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Buscar</Label>
                  <Input
                    placeholder="Nome ou matrícula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table className="table-zebra">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-20">Mat.</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead className="text-center">Tipo</TableHead>
                      <TableHead className="text-center">Início</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-center">Parcelas</TableHead>
                      <TableHead className="text-right">Valor Parcela</TableHead>
                      <TableHead className="text-right">Saldo/Desc.</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-16">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emprestimosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          Nenhum empréstimo encontrado com os filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      emprestimosFiltrados.map((e) => (
                        <TableRow key={e.id} className={e.status === 'ativo' ? 'bg-warning/5' : ''}>
                          <TableCell className="font-mono text-sm">{e.matricula}</TableCell>
                          <TableCell className="font-medium">{e.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{e.loja}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={e.tipo === 'empresa' ? 'default' : 'secondary'} className="text-xs">
                              {e.tipo === 'empresa' ? 'Empresa' : 'CLT'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {formatDate(e.dataInicio)}
                          </TableCell>
                          <TableCell className="text-right">
                            {e.tipo === 'empresa' ? formatCurrency(e.valorTotal || 0) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {e.tipo === 'empresa' ? (
                              <span className="font-mono text-sm">{e.parcelasPagas}/{e.parcelasTotal}</span>
                            ) : (
                              <span className="font-mono text-sm">{e.parcelasCalculadas} pagas</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatCurrency(e.valorParcela)}
                          </TableCell>
                          <TableCell className="text-right">
                            {e.tipo === 'empresa' ? (
                              <span className="font-semibold text-warning">{formatCurrency(e.saldoDevedor)}</span>
                            ) : (
                              <span className="font-semibold text-success">{formatCurrency(e.totalDescontado)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge(e.status, e.tipo)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Ver detalhes">
                                    <DollarSign className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Detalhes do Empréstimo - {e.nome}</DialogTitle>
                                  </DialogHeader>
                                  {e.tipo === 'empresa' ? (
                                    <DetalheEmprestimoEmpresa 
                                      emprestimo={e} 
                                      onRegistrarParcela={handleRegistrarParcela}
                                      registrando={registrando}
                                    />
                                  ) : (
                                    <DetalheEmprestimoCLT emprestimo={e} onStatusChange={fetchData} />
                                  )}
                                  
                                  {/* Histórico de alterações */}
                                  <div className="mt-4 pt-4 border-t">
                                    <HistoricoEmprestimos emprestimoId={e.id} limit={20} />
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Editar"
                                onClick={() => abrirEdicao(e)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Dialog Novo Empréstimo */}
      <Dialog open={novoEmprestimoOpen} onOpenChange={setNovoEmprestimoOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Empréstimo
            </DialogTitle>
          </DialogHeader>
          <NovoEmprestimoForm 
            onSuccess={() => {
              setNovoEmprestimoOpen(false);
              fetchData();
            }}
            onCancel={() => setNovoEmprestimoOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Relatório por Loja */}
      <Dialog open={relatorioOpen} onOpenChange={setRelatorioOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatório de Empréstimos por Loja
            </DialogTitle>
          </DialogHeader>
          <RelatorioLoja emprestimos={emprestimos} lojas={lojas} />
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Empréstimo */}
      <Dialog open={!!editandoEmprestimo} onOpenChange={(open) => !open && setEditandoEmprestimo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Empréstimo
            </DialogTitle>
          </DialogHeader>
          {editandoEmprestimo && (
            <div className="space-y-4 py-2">
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{editandoEmprestimo.nome}</p>
                      <p className="text-sm text-muted-foreground">Mat: {editandoEmprestimo.matricula}</p>
                    </div>
                    <Badge variant={editandoEmprestimo.tipo === 'empresa' ? 'default' : 'secondary'}>
                      {editandoEmprestimo.tipo === 'empresa' ? 'Empresa' : 'CLT'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {editandoEmprestimo.tipo === 'empresa' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Parcelas Pagas</Label>
                      <Input
                        type="number"
                        min={0}
                        max={editandoEmprestimo.parcelasTotal || 999}
                        value={editForm.parcelasPagas}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          parcelasPagas: parseInt(e.target.value) || 0
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        de {editandoEmprestimo.parcelasTotal} parcelas
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Saldo Devedor (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={editForm.saldoDevedor}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          saldoDevedor: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editForm.status} 
                  onValueChange={(v) => setEditForm(prev => ({ ...prev, status: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">🟢 Ativo</SelectItem>
                    <SelectItem value="pausado">🟡 Pausado</SelectItem>
                    <SelectItem value="quitado">⚪ Quitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Adicione observações sobre este empréstimo..."
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditandoEmprestimo(null)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={salvarEdicao} disabled={salvando}>
              {salvando ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
