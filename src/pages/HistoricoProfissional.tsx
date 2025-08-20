import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, FileText, Filter, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const mockHistorico = [
  {
    data: '2025-08-20',
    tipo: 'VALE',
    valor: 45000,
    descricao: 'Vale alimentação',
    status: 'APROVADO',
  },
  {
    data: '2025-08-15',
    tipo: 'ADIANTAMENTO', 
    valor: 35000,
    descricao: 'Adiantamento salário',
    status: 'APROVADO',
  },
  {
    data: '2025-08-10',
    tipo: 'FALTA',
    valor: -2150,
    descricao: 'Falta injustificada',
    status: 'DESCONTADO',
  },
  {
    data: '2025-08-05',
    tipo: 'VALE',
    valor: 25000,
    descricao: 'Vale transporte',
    status: 'APROVADO',
  },
  {
    data: '2025-07-28',
    tipo: 'ADIANTAMENTO',
    valor: 50000,
    descricao: 'Adiantamento 13º',
    status: 'APROVADO',
  },
];

export default function HistoricoProfissional() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [competencia, setCompetencia] = useState('2025-08');
  const [novoItem, setNovoItem] = useState({
    tipo: '',
    valor: '',
    descricao: '',
  });
  
  const profissional = searchParams.get('profissional') || '';
  const loja = searchParams.get('loja') || '';

  const formatCurrency = (centavos: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(centavos / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Valor', 'Descrição', 'Status'];
    const rows = mockHistorico.map(item => [
      formatDate(item.data),
      item.tipo,
      formatCurrency(item.valor),
      item.descricao,
      item.status,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_${profissional.replace(' ', '_')}_${competencia}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string, tipo: string) => {
    if (tipo === 'FALTA' || tipo === 'DSR') {
      return <Badge variant="destructive">Desconto</Badge>;
    }
    
    switch (status) {
      case 'APROVADO':
        return <Badge className="bg-success/10 text-success border-success/20">Aprovado</Badge>;
      case 'DESCONTADO':
        return <Badge variant="destructive">Descontado</Badge>;
      case 'PENDENTE':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'VALE':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Vale</Badge>;
      case 'ADIANTAMENTO':
        return <Badge className="bg-accent/10 text-accent border-accent/20">Adiantamento</Badge>;
      case 'FALTA':
        return <Badge variant="destructive">Falta</Badge>;
      case 'DSR':
        return <Badge variant="destructive">DSR</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const addItem = () => {
    // Aqui seria a lógica para adicionar um novo item
    console.log('Adicionando item:', novoItem);
    setNovoItem({ tipo: '', valor: '', descricao: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/painel-profissional?loja=${loja}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Histórico - {profissional}</h1>
            <p className="text-muted-foreground">
              Loja: <span className="font-medium">{loja}</span>
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-accent/10">
          <Calendar className="h-4 w-4 mr-2" />
          Histórico individual
        </Badge>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(mockHistorico
                    .filter(item => item.tipo === 'VALE' && item.valor > 0)
                    .reduce((acc, item) => acc + item.valor, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Total em Vales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-accent">
                  {formatCurrency(mockHistorico
                    .filter(item => item.tipo === 'ADIANTAMENTO')
                    .reduce((acc, item) => acc + item.valor, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Total Adiantamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-destructive" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-destructive">
                  {formatCurrency(Math.abs(mockHistorico
                    .filter(item => item.valor < 0)
                    .reduce((acc, item) => acc + item.valor, 0)))}
                </p>
                <p className="text-xs text-muted-foreground">Total Descontos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-success">
                  {formatCurrency(mockHistorico.reduce((acc, item) => acc + item.valor, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Saldo Líquido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="space-y-2">
              <Label htmlFor="competencia">Competência</Label>
              <Input
                id="competencia"
                placeholder="2025-08"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="w-32"
              />
            </div>
            <Button onClick={exportCSV} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Exportar Histórico
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Benefício
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Benefício</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={novoItem.tipo} onValueChange={(value) => setNovoItem({...novoItem, tipo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VALE">Vale</SelectItem>
                        <SelectItem value="ADIANTAMENTO">Adiantamento</SelectItem>
                        <SelectItem value="FALTA">Desconto Falta</SelectItem>
                        <SelectItem value="DSR">Desconto DSR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (em centavos)</Label>
                    <Input
                      placeholder="Ex: 45000 para R$ 450,00"
                      value={novoItem.valor}
                      onChange={(e) => setNovoItem({...novoItem, valor: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      placeholder="Descrição do benefício"
                      value={novoItem.descricao}
                      onChange={(e) => setNovoItem({...novoItem, descricao: e.target.value})}
                    />
                  </div>
                  <Button onClick={addItem} className="w-full">
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Tabela do histórico */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Histórico Detalhado - {competencia}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHistorico.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(item.data)}</TableCell>
                    <TableCell>{getTipoBadge(item.tipo)}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      item.valor > 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {item.valor > 0 ? '+' : ''}{formatCurrency(item.valor)}
                    </TableCell>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(item.status, item.tipo)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}