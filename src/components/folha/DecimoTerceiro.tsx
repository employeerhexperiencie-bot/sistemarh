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
  Gift, Download, Calculator, Calendar, Users, 
  DollarSign, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Função de arredondamento
const arredondarValor = (valor: number): number => {
  const centavos = valor % 1;
  return centavos >= 0.50 ? Math.ceil(valor) : Math.floor(valor);
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface DecimoTerceiroCalculo {
  matricula: string;
  nome: string;
  loja: string;
  dataAdmissao: string;
  salarioBase: number;
  avosCompletos: number;
  afastamentos: number;
  avosDescontados: number;
  avosFinais: number;
  valorBruto: number;
  inss: number;
  irrf: number;
  pensao: number;
  adiantamentos: number;
  valorLiquido: number;
  primeiraParcela: number;
  segundaParcela: number;
  status: 'pendente' | 'primeira_paga' | 'quitado';
}

// Gerar dados mock
const gerarDecimoTerceiroMock = (ano: number): DecimoTerceiroCalculo[] => {
  const nomes = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima', 'Carlos Oliveira', 
    'Julia Souza', 'Lucas Ferreira', 'Fernanda Alves', 'Ricardo Rodrigues', 'Mariana Pereira'];
  const lojas = ['Loja 01', 'Loja 02', 'Loja 03', 'Loja 04', 'Loja 05'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const salarioBase = 1800 + Math.floor(Math.random() * 1500);
    const mesAdmissao = Math.floor(Math.random() * 12) + 1;
    const diaAdmissao = Math.floor(Math.random() * 28) + 1;
    const anoAdmissao = ano - Math.floor(Math.random() * 3);
    const dataAdmissao = `${anoAdmissao}-${String(mesAdmissao).padStart(2, '0')}-${String(diaAdmissao).padStart(2, '0')}`;
    
    // Calcular avos
    let avosCompletos = 12;
    if (anoAdmissao === ano) {
      // Admissão no ano corrente - conta avos proporcionais
      avosCompletos = 12 - mesAdmissao + 1;
      // Se admitido depois do dia 15, não conta o mês
      if (diaAdmissao > 15) avosCompletos--;
    }
    
    // Afastamentos (descontam avos)
    const afastamentos = Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0;
    const avosDescontados = afastamentos;
    const avosFinais = Math.max(0, avosCompletos - avosDescontados);
    
    // Cálculos
    const valorBruto = arredondarValor((salarioBase / 12) * avosFinais);
    const inss = arredondarValor(valorBruto * 0.08);
    const irrf = valorBruto > 2500 ? arredondarValor(valorBruto * 0.05) : 0;
    const pensao = Math.random() > 0.95 ? arredondarValor(valorBruto * 0.15) : 0;
    const adiantamentos = Math.random() > 0.7 ? arredondarValor(valorBruto * 0.5) : 0;
    
    const valorLiquido = arredondarValor(valorBruto - inss - irrf - pensao);
    const primeiraParcela = arredondarValor(valorBruto * 0.5);
    const segundaParcela = arredondarValor(valorLiquido - adiantamentos);
    
    // Status aleatório
    const statusOptions: DecimoTerceiroCalculo['status'][] = ['pendente', 'primeira_paga', 'primeira_paga', 'quitado'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    return {
      matricula: String(i + 1).padStart(4, '0'),
      nome: nomes[i % nomes.length],
      loja: lojas[Math.floor(Math.random() * lojas.length)],
      dataAdmissao,
      salarioBase,
      avosCompletos,
      afastamentos,
      avosDescontados,
      avosFinais,
      valorBruto,
      inss,
      irrf,
      pensao,
      adiantamentos,
      valorLiquido,
      primeiraParcela,
      segundaParcela,
      status,
    };
  });
};

interface DetalheDecimoProps {
  calculo: DecimoTerceiroCalculo;
  ano: number;
}

function DetalheDecimo({ calculo, ano }: DetalheDecimoProps) {
  return (
    <div className="space-y-4">
      {/* Info Funcionário */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Funcionário</p>
              <p className="font-semibold">{calculo.nome}</p>
              <p className="text-sm text-muted-foreground">Mat: {calculo.matricula}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Loja</p>
              <p className="font-semibold">{calculo.loja}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Cálculo de Avos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cálculo de Avos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Data de Admissão</span>
            <Badge variant="outline">{new Date(calculo.dataAdmissao).toLocaleDateString('pt-BR')}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Avos Completos</span>
            <span className="font-semibold">{calculo.avosCompletos}/12</span>
          </div>
          {calculo.afastamentos > 0 && (
            <div className="flex justify-between items-center text-warning">
              <span className="text-sm">Afastamentos (desconto)</span>
              <span className="font-semibold">-{calculo.avosDescontados}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t pt-2">
            <span className="text-sm font-semibold">Avos Finais</span>
            <span className="font-bold text-primary">{calculo.avosFinais}/12</span>
          </div>
          <Progress value={(calculo.avosFinais / 12) * 100} className="h-2" />
        </CardContent>
      </Card>
      
      {/* Valores */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Demonstrativo de Valores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Salário Base</TableCell>
                <TableCell className="text-right">{formatCurrency(calculo.salarioBase)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>13º Bruto ({calculo.avosFinais}/12)</TableCell>
                <TableCell className="text-right font-semibold text-success">{formatCurrency(calculo.valorBruto)}</TableCell>
              </TableRow>
              <TableRow className="text-destructive">
                <TableCell>(-) INSS</TableCell>
                <TableCell className="text-right">{formatCurrency(calculo.inss)}</TableCell>
              </TableRow>
              {calculo.irrf > 0 && (
                <TableRow className="text-destructive">
                  <TableCell>(-) IRRF</TableCell>
                  <TableCell className="text-right">{formatCurrency(calculo.irrf)}</TableCell>
                </TableRow>
              )}
              {calculo.pensao > 0 && (
                <TableRow className="text-destructive">
                  <TableCell>(-) Pensão Alimentícia</TableCell>
                  <TableCell className="text-right">{formatCurrency(calculo.pensao)}</TableCell>
                </TableRow>
              )}
              <TableRow className="bg-primary/5 font-semibold">
                <TableCell>13º Líquido</TableCell>
                <TableCell className="text-right text-primary">{formatCurrency(calculo.valorLiquido)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Parcelas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Parcelas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {calculo.status !== 'pendente' ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">1ª Parcela</p>
                <p className="text-xs text-muted-foreground">Até 30/11/{ano}</p>
              </div>
            </div>
            <span className="font-semibold">{formatCurrency(calculo.primeiraParcela)}</span>
          </div>
          
          {calculo.adiantamentos > 0 && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div>
                <p className="text-sm font-medium text-warning">Adiantamento já pago</p>
              </div>
              <span className="font-semibold text-warning">-{formatCurrency(calculo.adiantamentos)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {calculo.status === 'quitado' ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">2ª Parcela</p>
                <p className="text-xs text-muted-foreground">Até 20/12/{ano}</p>
              </div>
            </div>
            <span className="font-semibold">{formatCurrency(Math.max(0, calculo.segundaParcela))}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DecimoTerceiro() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  const calculos = useMemo(() => gerarDecimoTerceiroMock(ano), [ano]);
  
  const calculosFiltrados = useMemo(() => {
    return calculos.filter(c => {
      if (lojaFiltro !== 'todas' && c.loja !== lojaFiltro) return false;
      if (statusFiltro !== 'todos' && c.status !== statusFiltro) return false;
      if (searchTerm && !c.nome.toLowerCase().includes(searchTerm.toLowerCase()) && !c.matricula.includes(searchTerm)) return false;
      return true;
    });
  }, [calculos, lojaFiltro, statusFiltro, searchTerm]);
  
  const totais = useMemo(() => {
    return calculosFiltrados.reduce((acc, c) => ({
      bruto: acc.bruto + c.valorBruto,
      liquido: acc.liquido + c.valorLiquido,
      primeiraParcela: acc.primeiraParcela + c.primeiraParcela,
      segundaParcela: acc.segundaParcela + c.segundaParcela,
      pendentes: acc.pendentes + (c.status === 'pendente' ? 1 : 0),
      primeiraPaga: acc.primeiraPaga + (c.status === 'primeira_paga' ? 1 : 0),
      quitados: acc.quitados + (c.status === 'quitado' ? 1 : 0),
    }), { bruto: 0, liquido: 0, primeiraParcela: 0, segundaParcela: 0, pendentes: 0, primeiraPaga: 0, quitados: 0 });
  }, [calculosFiltrados]);
  
  const lojas = useMemo(() => [...new Set(calculos.map(c => c.loja))], [calculos]);
  
  const getStatusBadge = (status: DecimoTerceiroCalculo['status']) => {
    const config = {
      pendente: { label: 'Pendente', className: 'bg-muted text-muted-foreground' },
      primeira_paga: { label: '1ª Paga', className: 'bg-info/10 text-info border-info/20' },
      quitado: { label: 'Quitado', className: 'bg-success/10 text-success border-success/20' },
    };
    const c = config[status];
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };
  
  const exportarCSV = () => {
    const headers = ['Matrícula', 'Nome', 'Loja', 'Salário', 'Avos', '13º Bruto', '13º Líquido', '1ª Parcela', '2ª Parcela', 'Status'];
    const rows = calculosFiltrados.map(c => [
      c.matricula, c.nome, c.loja, c.salarioBase, `${c.avosFinais}/12`,
      c.valorBruto, c.valorLiquido, c.primeiraParcela, c.segundaParcela, c.status
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `decimo_terceiro_${ano}.csv`;
    link.click();
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            13º Salário - {ano}
          </h2>
          <p className="text-sm text-muted-foreground">
            Cálculo e controle de décimo terceiro
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(new Date().getFullYear())}>{new Date().getFullYear()}</SelectItem>
              <SelectItem value={String(new Date().getFullYear() - 1)}>{new Date().getFullYear() - 1}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Cards Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Bruto</p>
                <p className="text-lg font-bold">{formatCurrency(totais.bruto)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Líquido</p>
                <p className="text-lg font-bold text-success">{formatCurrency(totais.liquido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Calendar className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">1ª Parcela</p>
                <p className="text-lg font-bold text-info">{formatCurrency(totais.primeiraParcela)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Calendar className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">2ª Parcela</p>
                <p className="text-lg font-bold text-warning">{formatCurrency(totais.segundaParcela)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totais.pendentes}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="bg-info/5 border-info/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-info">{totais.primeiraPaga}</p>
            <p className="text-xs text-muted-foreground">1ª Parcela Paga</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{totais.quitados}</p>
            <p className="text-xs text-muted-foreground">Quitados</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="primeira_paga">1ª Paga</SelectItem>
                  <SelectItem value="quitado">Quitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
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
                  <TableHead className="text-center">Avos</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-20 text-center">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculosFiltrados.map((c) => (
                  <TableRow key={c.matricula}>
                    <TableCell className="font-mono text-sm">{c.matricula}</TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{c.loja}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{c.avosFinais}</span>
                      <span className="text-muted-foreground">/12</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(c.valorBruto)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-success">
                      {formatCurrency(c.valorLiquido)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(c.status)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Calculator className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>13º Salário - {c.nome}</DialogTitle>
                          </DialogHeader>
                          <DetalheDecimo calculo={c} ano={ano} />
                        </DialogContent>
                      </Dialog>
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
