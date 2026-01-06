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
  DollarSign, CheckCircle, Clock, Building2, Loader2, Pause, Play, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

interface Emprestimo {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  tipo: 'empresa' | 'clt';
  valorTotal: number | null; // null para CLT
  parcelasTotal: number | null; // null para CLT
  parcelasPagas: number;
  valorParcela: number;
  dataInicio: string;
  dataFim: string | null;
  status: 'ativo' | 'quitado' | 'pausado';
  observacao?: string;
  saldoDevedor: number;
}

interface DetalheEmprestimoEmpresaProps {
  emprestimo: Emprestimo;
}

// Componente para detalhes do empréstimo EMPRESA
function DetalheEmprestimoEmpresa({ emprestimo }: DetalheEmprestimoEmpresaProps) {
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
                  <TableRow key={p.numero}>
                    <TableCell className="font-mono">{String(p.numero).padStart(2, '0')}</TableCell>
                    <TableCell>{formatDate(p.data)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.valor)}</TableCell>
                    <TableCell className="text-center">
                      {p.pago ? (
                        <CheckCircle className="h-4 w-4 text-success mx-auto" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground mx-auto" />
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

  const totalDescontado = emprestimo.valorParcela * emprestimo.parcelasPagas;
  
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
                className={emprestimo.status === 'ativo' 
                  ? 'bg-success/10 text-success border-success/20' 
                  : 'bg-warning/10 text-warning border-warning/20'
                }
              >
                {emprestimo.status === 'ativo' ? 'Descontando' : 'Pausado'}
              </Badge>
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
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Início do Desconto</p>
            <p className="text-lg font-bold">{formatDate(emprestimo.dataInicio)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Valor da Parcela Mensal</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(emprestimo.valorParcela)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Parcelas Descontadas</p>
              <p className="text-2xl font-bold">{emprestimo.parcelasPagas}</p>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Já Descontado</p>
              <p className="text-xl font-bold text-success">{formatCurrency(totalDescontado)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ação de pausar/reativar */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Controle do Desconto</p>
              <p className="text-sm text-muted-foreground">
                {emprestimo.status === 'ativo' 
                  ? 'Pause o desconto quando o empréstimo for quitado' 
                  : 'Reative o desconto se necessário'}
              </p>
            </div>
            <Button 
              variant={emprestimo.status === 'ativo' ? 'destructive' : 'default'}
              onClick={handleToggleStatus}
              disabled={atualizando}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function GestaoEmprestimos() {
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [novoEmprestimoOpen, setNovoEmprestimoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [lojas, setLojas] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar empréstimos, profissionais e lojas em paralelo
      const [empResult, profResult, lojasResult] = await Promise.all([
        supabase.from('emprestimos').select('*'),
        supabase.from('profissionais').select('id, nome, matricula, loja_id'),
        supabase.from('lojas').select('id, nome')
      ]);

      if (empResult.error) throw empResult.error;

      // Criar mapa de lojas
      const lojasMap: Record<string, string> = {};
      (lojasResult.data || []).forEach((l: any) => {
        lojasMap[l.id] = l.nome;
      });

      // Criar mapa de profissionais
      const profissionaisMap: Record<string, { nome: string; matricula: string; loja: string }> = {};
      (profResult.data || []).forEach((p: any) => {
        profissionaisMap[p.id] = {
          nome: p.nome,
          matricula: p.matricula,
          loja: p.loja_id ? (lojasMap[p.loja_id] || 'Sem Loja') : 'Sem Loja'
        };
      });

      const emprestimosFormatados: Emprestimo[] = (empResult.data || []).map(e => {
        const prof = profissionaisMap[e.profissional_id || ''];
        const tipo = e.tipo === 'empresa' ? 'empresa' : 'clt';
        
        return {
          id: e.id,
          matricula: prof?.matricula || '',
          nome: prof?.nome || 'Sem Nome',
          loja: prof?.loja || 'Sem Loja',
          tipo,
          valorTotal: tipo === 'empresa' ? Number(e.valor_total) || 0 : null,
          parcelasTotal: tipo === 'empresa' ? e.numero_parcelas || 0 : null,
          parcelasPagas: e.parcelas_pagas || 0,
          valorParcela: Number(e.valor_parcela) || 0,
          dataInicio: e.data_inicio || '',
          dataFim: e.data_previsao_termino || null,
          status: (e.status === 'pausado' ? 'pausado' : e.status === 'quitado' ? 'quitado' : 'ativo') as Emprestimo['status'],
          observacao: e.observacoes || undefined,
          saldoDevedor: Number(e.saldo_devedor) || 0,
        };
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
      // Empresa
      empresaTotal: emprestimosEmpresa.length,
      empresaAtivos: empresaAtivos.length,
      empresaValorTotal: emprestimosEmpresa.reduce((s, e) => s + (e.valorTotal || 0), 0),
      empresaSaldoDevedor: emprestimosEmpresa.reduce((s, e) => s + e.saldoDevedor, 0),
      empresaDescontoMensal: empresaAtivos.reduce((s, e) => s + e.valorParcela, 0),
      // CLT
      cltTotal: emprestimosCLT.length,
      cltAtivos: cltAtivos.length,
      cltDescontoMensal: cltAtivos.reduce((s, e) => s + e.valorParcela, 0),
      // Geral
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
    const headers = ['Matrícula', 'Nome', 'Loja', 'Tipo', 'Valor Total', 'Parcelas', 'Pagas', 'Valor Parcela', 'Saldo Devedor', 'Status'];
    const rows = emprestimosFiltrados.map(e => [
      e.matricula, e.nome, e.loja, e.tipo === 'empresa' ? 'Empresa' : 'CLT', 
      e.valorTotal || 'N/A', e.parcelasTotal || 'N/A', e.parcelasPagas,
      e.valorParcela, e.saldoDevedor, e.status
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

            {/* Cards Resumo - Diferenciado por tipo */}
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
                          <Banknote className="h-4 w-4 text-warning" />
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
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="pausado">Pausado</SelectItem>
                      <SelectItem value="quitado">Quitado</SelectItem>
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
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-center">Parcelas</TableHead>
                      <TableHead className="text-right">Valor Parcela</TableHead>
                      <TableHead className="text-right">Saldo/Restante</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-16">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emprestimosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          Nenhum empréstimo encontrado com os filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      emprestimosFiltrados.map((e) => (
                        <TableRow key={e.id}>
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
                          <TableCell className="text-right">
                            {e.tipo === 'empresa' ? formatCurrency(e.valorTotal || 0) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {e.tipo === 'empresa' ? (
                              <span className="font-mono text-sm">{e.parcelasPagas}/{e.parcelasTotal}</span>
                            ) : (
                              <span className="font-mono text-sm">{e.parcelasPagas} pagas</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatCurrency(e.valorParcela)}
                          </TableCell>
                          <TableCell className="text-right">
                            {e.tipo === 'empresa' ? (
                              <span className="font-semibold text-warning">{formatCurrency(e.saldoDevedor)}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge(e.status, e.tipo)}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Detalhes do Empréstimo - {e.nome}</DialogTitle>
                                </DialogHeader>
                                {e.tipo === 'empresa' ? (
                                  <DetalheEmprestimoEmpresa emprestimo={e} />
                                ) : (
                                  <DetalheEmprestimoCLT emprestimo={e} onStatusChange={fetchData} />
                                )}
                              </DialogContent>
                            </Dialog>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Empréstimo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Para cadastrar um novo empréstimo, acesse o cadastro do profissional e adicione os dados do empréstimo na aba correspondente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoEmprestimoOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
