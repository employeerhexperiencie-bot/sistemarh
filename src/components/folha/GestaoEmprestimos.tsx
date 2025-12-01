import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DollarSign, AlertTriangle, CheckCircle, Clock, Building2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

const arredondarValor = (valor: number): number => {
  const centavos = valor % 1;
  return centavos >= 0.50 ? Math.ceil(valor) : Math.floor(valor);
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface Emprestimo {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  tipo: 'empresa' | 'clt';
  valorTotal: number;
  parcelasTotal: number;
  parcelasPagas: number;
  valorParcela: number;
  dataInicio: string;
  dataFim: string;
  status: 'ativo' | 'quitado' | 'atrasado';
  observacao?: string;
}

// Gerar dados mock
const gerarEmprestimosMock = (): Emprestimo[] => {
  const nomes = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima', 'Carlos Oliveira', 
    'Julia Souza', 'Lucas Ferreira', 'Fernanda Alves', 'Ricardo Rodrigues', 'Mariana Pereira'];
  const lojas = ['Loja 01', 'Loja 02', 'Loja 03', 'Loja 04', 'Loja 05'];
  
  return Array.from({ length: 30 }, (_, i) => {
    const valorTotal = (Math.floor(Math.random() * 30) + 5) * 100; // 500 a 3500
    const parcelasTotal = Math.floor(Math.random() * 10) + 3; // 3 a 12 parcelas
    const parcelasPagas = Math.floor(Math.random() * parcelasTotal);
    const valorParcela = arredondarValor(valorTotal / parcelasTotal);
    
    const dataInicio = new Date();
    dataInicio.setMonth(dataInicio.getMonth() - parcelasPagas);
    
    const dataFim = new Date(dataInicio);
    dataFim.setMonth(dataFim.getMonth() + parcelasTotal);
    
    let status: Emprestimo['status'] = 'ativo';
    if (parcelasPagas >= parcelasTotal) status = 'quitado';
    else if (Math.random() > 0.9) status = 'atrasado';
    
    return {
      id: `emp-${i + 1}`,
      matricula: String(i + 1).padStart(4, '0'),
      nome: nomes[i % nomes.length],
      loja: lojas[Math.floor(Math.random() * lojas.length)],
      tipo: Math.random() > 0.4 ? 'empresa' : 'clt',
      valorTotal,
      parcelasTotal,
      parcelasPagas,
      valorParcela,
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: dataFim.toISOString().split('T')[0],
      status,
    };
  });
};

interface DetalheEmprestimoProps {
  emprestimo: Emprestimo;
}

function DetalheEmprestimo({ emprestimo }: DetalheEmprestimoProps) {
  const valorPago = emprestimo.valorParcela * emprestimo.parcelasPagas;
  const valorRestante = emprestimo.valorTotal - valorPago;
  const progresso = (emprestimo.parcelasPagas / emprestimo.parcelasTotal) * 100;
  
  // Gerar histórico de parcelas
  const parcelas = Array.from({ length: emprestimo.parcelasTotal }, (_, i) => {
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
      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Funcionário</p>
              <p className="font-semibold">{emprestimo.nome}</p>
              <p className="text-sm text-muted-foreground">Mat: {emprestimo.matricula}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Tipo</p>
              <Badge variant={emprestimo.tipo === 'empresa' ? 'default' : 'secondary'}>
                {emprestimo.tipo === 'empresa' ? 'Empresa' : 'CLT'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="font-semibold">{formatCurrency(emprestimo.valorTotal)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Pago</p>
              <p className="font-semibold text-success">{formatCurrency(valorPago)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Restante</p>
              <p className="font-semibold text-warning">{formatCurrency(valorRestante)}</p>
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
                    <TableCell>{new Date(p.data).toLocaleDateString('pt-BR')}</TableCell>
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

export function GestaoEmprestimos() {
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [novoEmprestimoOpen, setNovoEmprestimoOpen] = useState(false);
  
  const emprestimos = useMemo(() => gerarEmprestimosMock(), []);
  
  const emprestimosFiltrados = useMemo(() => {
    return emprestimos.filter(e => {
      if (tipoFiltro !== 'todos' && e.tipo !== tipoFiltro) return false;
      if (lojaFiltro !== 'todas' && e.loja !== lojaFiltro) return false;
      if (statusFiltro !== 'todos' && e.status !== statusFiltro) return false;
      if (searchTerm && !e.nome.toLowerCase().includes(searchTerm.toLowerCase()) && !e.matricula.includes(searchTerm)) return false;
      return true;
    });
  }, [emprestimos, tipoFiltro, lojaFiltro, statusFiltro, searchTerm]);
  
  const totais = useMemo(() => {
    const ativos = emprestimosFiltrados.filter(e => e.status === 'ativo');
    return {
      totalEmprestimos: emprestimosFiltrados.length,
      totalAtivos: ativos.length,
      valorTotal: emprestimosFiltrados.reduce((s, e) => s + e.valorTotal, 0),
      valorRestante: emprestimosFiltrados.reduce((s, e) => s + (e.valorTotal - (e.valorParcela * e.parcelasPagas)), 0),
      parcelasMes: ativos.reduce((s, e) => s + e.valorParcela, 0),
      emprestimoEmpresa: emprestimosFiltrados.filter(e => e.tipo === 'empresa').length,
      emprestimoCLT: emprestimosFiltrados.filter(e => e.tipo === 'clt').length,
    };
  }, [emprestimosFiltrados]);
  
  const lojas = useMemo(() => [...new Set(emprestimos.map(e => e.loja))], [emprestimos]);
  
  const getStatusBadge = (status: Emprestimo['status']) => {
    const config = {
      ativo: { label: 'Ativo', className: 'bg-info/10 text-info border-info/20' },
      quitado: { label: 'Quitado', className: 'bg-success/10 text-success border-success/20' },
      atrasado: { label: 'Atrasado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    };
    const c = config[status];
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };
  
  const exportarCSV = () => {
    const headers = ['Matrícula', 'Nome', 'Loja', 'Tipo', 'Valor Total', 'Parcelas', 'Pagas', 'Valor Parcela', 'Restante', 'Status'];
    const rows = emprestimosFiltrados.map(e => [
      e.matricula, e.nome, e.loja, e.tipo, e.valorTotal, e.parcelasTotal, e.parcelasPagas,
      e.valorParcela, e.valorTotal - (e.valorParcela * e.parcelasPagas), e.status
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `emprestimos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  
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
            Controle de empréstimos empresa e CLT
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
      
      {/* Cards Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Empréstimos Ativos</p>
                <p className="text-lg font-bold">{totais.totalAtivos}</p>
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
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold text-info">{formatCurrency(totais.valorTotal)}</p>
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
                <p className="text-xs text-muted-foreground">Saldo Restante</p>
                <p className="text-lg font-bold text-warning">{formatCurrency(totais.valorRestante)}</p>
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
                <p className="text-lg font-bold text-primary">{formatCurrency(totais.parcelasMes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs por Tipo */}
      <Tabs defaultValue="todos" onValueChange={setTipoFiltro}>
        <TabsList>
          <TabsTrigger value="todos" className="gap-2">
            Todos
            <Badge variant="secondary" className="ml-1">{emprestimos.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="empresa" className="gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
            <Badge variant="secondary" className="ml-1">{totais.emprestimoEmpresa}</Badge>
          </TabsTrigger>
          <TabsTrigger value="clt" className="gap-2">
            <Banknote className="h-4 w-4" />
            CLT
            <Badge variant="secondary" className="ml-1">{totais.emprestimoCLT}</Badge>
          </TabsTrigger>
        </TabsList>
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
                  <SelectItem value="quitado">Quitado</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
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
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Parcelas</TableHead>
                  <TableHead className="text-right">Restante</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-16">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emprestimosFiltrados.map((e) => {
                  const restante = e.valorTotal - (e.valorParcela * e.parcelasPagas);
                  return (
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
                      <TableCell className="text-right font-medium">
                        {formatCurrency(e.valorTotal)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{e.parcelasPagas}</span>
                        <span className="text-muted-foreground">/{e.parcelasTotal}</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-warning">
                        {formatCurrency(restante)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(e.status)}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Banknote className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Empréstimo - {e.nome}</DialogTitle>
                            </DialogHeader>
                            <DetalheEmprestimo emprestimo={e} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Dialog Novo Empréstimo */}
      <Dialog open={novoEmprestimoOpen} onOpenChange={setNovoEmprestimoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Empréstimo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matrícula</Label>
                <Input placeholder="0000" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select defaultValue="empresa">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="clt">CLT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Total</Label>
                <Input placeholder="R$ 0,00" />
              </div>
              <div className="space-y-2">
                <Label>Nº Parcelas</Label>
                <Input type="number" placeholder="6" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoEmprestimoOpen(false)}>Cancelar</Button>
            <Button>Salvar Empréstimo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
