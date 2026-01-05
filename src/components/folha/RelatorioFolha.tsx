import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, Filter, DollarSign, Calendar,
  TrendingDown, Users, Building2, Printer, Eye, CheckCircle2, ShoppingBasket, Bus, Utensils
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupabaseData } from '@/hooks/useSupabaseData';

// Tipos
interface EventoFolha {
  codigo: string;
  descricao: string;
  tipo: 'provento' | 'desconto';
  valor: number;
  referencia?: string;
}

interface FolhaProfissional {
  id: string;
  matricula: string;
  nome: string;
  cargo: string;
  loja: string;
  salarioBase: number;
  eventos: EventoFolha[];
  totalProventos: number;
  totalDescontos: number;
  liquido: number;
  valorVT: number;
  valorVR: number;
  valorCesta: number;
}

// Constantes de benefícios
const VALOR_VR_DIARIO = 25;
const VALOR_CESTA_BASICA = 180;
const DIAS_UTEIS = 22;

// Função de arredondamento
const arredondarValor = (valor: number): number => {
  const centavos = valor % 1;
  return centavos >= 0.50 ? Math.ceil(valor) : Math.floor(valor);
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface DetalheHoleriteProps {
  folha: FolhaProfissional;
  competencia: string;
}

function DetalheHolerite({ folha, competencia }: DetalheHoleriteProps) {
  const proventos = folha.eventos.filter(e => e.tipo === 'provento');
  const descontos = folha.eventos.filter(e => e.tipo === 'desconto');
  
  return (
    <div className="space-y-4 print:text-black">
      {/* Cabeçalho */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">FUNCIONÁRIO</p>
            <p className="font-semibold">{folha.nome}</p>
            <p className="text-sm text-muted-foreground">Mat: {folha.matricula}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">COMPETÊNCIA</p>
            <p className="font-semibold">{competencia}</p>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Cargo</p>
            <p>{folha.cargo}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Loja</p>
            <p>{folha.loja}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Salário Base</p>
            <p>{formatCurrency(folha.salarioBase)}</p>
          </div>
        </div>
      </div>
      
      {/* Proventos */}
      <div>
        <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 rotate-180" />
          Proventos
        </h4>
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-16">Cód.</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-16 text-center">Ref.</TableHead>
              <TableHead className="w-24 text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proventos.map((e, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-mono text-xs">{e.codigo}</TableCell>
                <TableCell>{e.descricao}</TableCell>
                <TableCell className="text-center text-xs">{e.referencia || '-'}</TableCell>
                <TableCell className="text-right font-medium text-success">{formatCurrency(e.valor)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-success/5 font-semibold">
              <TableCell colSpan={3}>Total Proventos</TableCell>
              <TableCell className="text-right text-success">{formatCurrency(folha.totalProventos)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      {/* Descontos */}
      <div>
        <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          Descontos
        </h4>
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-16">Cód.</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-16 text-center">Ref.</TableHead>
              <TableHead className="w-24 text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {descontos.map((e, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-mono text-xs">{e.codigo}</TableCell>
                <TableCell>{e.descricao}</TableCell>
                <TableCell className="text-center text-xs">{e.referencia || '-'}</TableCell>
                <TableCell className="text-right font-medium text-destructive">{formatCurrency(e.valor)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-destructive/5 font-semibold">
              <TableCell colSpan={3}>Total Descontos</TableCell>
              <TableCell className="text-right text-destructive">{formatCurrency(folha.totalDescontos)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      {/* Líquido */}
      <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">LÍQUIDO A RECEBER</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(folha.liquido)}</span>
        </div>
      </div>
    </div>
  );
}

export function RelatorioFolha() {
  const supabaseData = useSupabaseData();
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const folhaCompleta = useMemo((): FolhaProfissional[] => {
    if (supabaseData.isLoading || supabaseData.totalProfissionais === 0) {
      return [];
    }

    return supabaseData.profissionais.map((p: any) => {
      const salarioBase = p.salario_nominal || p.ultimo_salario || p.primeiro_salario || 0;
      const loja = supabaseData.lojas.find((l: any) => l.id === p.loja_id);
      const eventos: EventoFolha[] = [
        { codigo: '001', descricao: 'Salário Base', tipo: 'provento', valor: salarioBase },
      ];
      
      // Vale Transporte (provento - crédito ao funcionário)
      const valorVT = p.vale_transporte ? arredondarValor((p.valor_diario_rota || 4.40) * DIAS_UTEIS) : 0;
      if (valorVT > 0) {
        eventos.push({ codigo: '020', descricao: 'Vale Transporte', tipo: 'provento', valor: valorVT });
      }

      // Vale Refeição (provento)
      const valorVR = p.vale_refeicao ? arredondarValor(VALOR_VR_DIARIO * DIAS_UTEIS) : 0;
      if (valorVR > 0) {
        eventos.push({ codigo: '021', descricao: 'Vale Refeição', tipo: 'provento', valor: valorVR });
      }

      // Cesta Básica (provento)
      const valorCesta = p.cesta_basica ? VALOR_CESTA_BASICA : 0;
      if (valorCesta > 0) {
        eventos.push({ codigo: '022', descricao: 'Cesta Básica', tipo: 'provento', valor: valorCesta });
      }
      
      // INSS (desconto)
      const inss = arredondarValor(salarioBase * 0.08);
      eventos.push({ codigo: '101', descricao: 'INSS', tipo: 'desconto', valor: inss });
      
      // Vale Transporte (desconto 6%)
      if (p.vale_transporte) {
        const descontoVT = arredondarValor(salarioBase * 0.06);
        eventos.push({ codigo: '103', descricao: 'Desconto VT (6%)', tipo: 'desconto', valor: descontoVT });
      }
      
      // Pensão Alimentícia
      if (p.pensao_alimenticia && p.pensao_alimenticia > 0) {
        eventos.push({ codigo: '109', descricao: 'Pensão Alimentícia', tipo: 'desconto', valor: p.pensao_alimenticia });
      }
      
      const totalProventos = eventos.filter(e => e.tipo === 'provento').reduce((s, e) => s + e.valor, 0);
      const totalDescontos = eventos.filter(e => e.tipo === 'desconto').reduce((s, e) => s + e.valor, 0);
      
      return {
        id: p.id,
        matricula: p.matricula,
        nome: p.nome,
        cargo: p.cargo || 'Não informado',
        loja: loja?.nome || 'Sem loja',
        salarioBase,
        eventos,
        totalProventos,
        totalDescontos,
        liquido: arredondarValor(totalProventos - totalDescontos),
        valorVT,
        valorVR,
        valorCesta,
      };
    });
  }, [supabaseData]);
  
  const folhaFiltrada = useMemo(() => {
    return folhaCompleta.filter(f => {
      if (lojaFiltro !== 'todas' && f.loja !== lojaFiltro) return false;
      if (searchTerm && !f.nome.toLowerCase().includes(searchTerm.toLowerCase()) && !f.matricula.includes(searchTerm)) return false;
      return true;
    });
  }, [folhaCompleta, lojaFiltro, searchTerm]);
  
  const totais = useMemo(() => {
    return folhaFiltrada.reduce((acc, f) => ({
      proventos: acc.proventos + f.totalProventos,
      descontos: acc.descontos + f.totalDescontos,
      liquido: acc.liquido + f.liquido,
      vt: acc.vt + f.valorVT,
      vr: acc.vr + f.valorVR,
      cesta: acc.cesta + f.valorCesta,
    }), { proventos: 0, descontos: 0, liquido: 0, vt: 0, vr: 0, cesta: 0 });
  }, [folhaFiltrada]);
  
  const lojas = useMemo(() => [...new Set(folhaCompleta.map(f => f.loja))].sort(), [folhaCompleta]);
  
  const exportarCSV = () => {
    const headers = ['Matrícula', 'Nome', 'Cargo', 'Loja', 'Salário Base', 'VT', 'VR', 'Cesta', 'Total Proventos', 'Total Descontos', 'Líquido'];
    const rows = folhaFiltrada.map(f => [
      f.matricula, f.nome, f.cargo, f.loja, f.salarioBase, f.valorVT, f.valorVR, f.valorCesta, f.totalProventos, f.totalDescontos, f.liquido
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `folha_geral_${competencia}.csv`;
    link.click();
  };

  if (supabaseData.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Relatório Geral de Folha
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 ml-2">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Dados Reais
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Consolidação de todos os eventos de pagamento • {supabaseData.totalProfissionais} profissionais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Competência</Label>
              <Input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loja</Label>
              <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Lojas</SelectItem>
                  {lojas.map((l, idx) => (
                    <SelectItem key={`${l}-${idx}`} value={l}>{l}</SelectItem>
                  ))}
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
      
      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <Card className="min-w-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted shrink-0">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Funcionários</p>
                <p className="text-base font-bold tabular-nums">{folhaFiltrada.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10 shrink-0">
                <TrendingDown className="h-4 w-4 text-success rotate-180" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Proventos</p>
                <p className="text-base font-bold text-success tabular-nums truncate">{formatCurrency(totais.proventos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Descontos</p>
                <p className="text-base font-bold text-destructive tabular-nums truncate">{formatCurrency(totais.descontos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-info/10 shrink-0">
                <Bus className="h-4 w-4 text-info" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Total VT</p>
                <p className="text-base font-bold text-info tabular-nums truncate">{formatCurrency(totais.vt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-warning/10 shrink-0">
                <Utensils className="h-4 w-4 text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Total VR</p>
                <p className="text-base font-bold text-warning tabular-nums truncate">{formatCurrency(totais.vr)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10 shrink-0">
                <ShoppingBasket className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Cesta Básica</p>
                <p className="text-base font-bold text-orange-500 tabular-nums truncate">{formatCurrency(totais.cesta)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Líquido Total</p>
                <p className="text-base font-bold text-primary tabular-nums truncate">{formatCurrency(totais.liquido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabela */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalhamento por Funcionário</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full max-h-[600px]">
            <div className="overflow-x-auto">
              <Table className="table-zebra w-full min-w-[900px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-20 font-semibold whitespace-nowrap">Mat.</TableHead>
                    <TableHead className="font-semibold whitespace-nowrap min-w-[150px]">Nome</TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">Cargo</TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">Loja</TableHead>
                    <TableHead className="text-right font-semibold whitespace-nowrap">Salário</TableHead>
                    <TableHead className="text-right font-semibold whitespace-nowrap">VT</TableHead>
                    <TableHead className="text-right font-semibold whitespace-nowrap">VR</TableHead>
                    <TableHead className="text-right font-semibold whitespace-nowrap">Cesta</TableHead>
                    <TableHead className="text-right font-semibold text-success whitespace-nowrap">Proventos</TableHead>
                    <TableHead className="text-right font-semibold text-destructive whitespace-nowrap">Descontos</TableHead>
                    <TableHead className="text-right font-semibold text-primary whitespace-nowrap">Líquido</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folhaFiltrada.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{f.matricula}</TableCell>
                      <TableCell className="font-medium max-w-[180px] truncate">{f.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{f.cargo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">{f.loja}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">{formatCurrency(f.salarioBase)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-info whitespace-nowrap">{formatCurrency(f.valorVT)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-warning whitespace-nowrap">{formatCurrency(f.valorVR)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-orange-500 whitespace-nowrap">{formatCurrency(f.valorCesta)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-success font-medium whitespace-nowrap">{formatCurrency(f.totalProventos)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-destructive font-medium whitespace-nowrap">{formatCurrency(f.totalDescontos)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-primary font-bold whitespace-nowrap">{formatCurrency(f.liquido)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>Demonstrativo de Pagamento</DialogTitle>
                            </DialogHeader>
                            <DetalheHolerite folha={f} competencia={competencia} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
