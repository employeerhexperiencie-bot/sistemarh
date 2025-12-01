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
  TrendingDown, Users, Building2, Printer, Eye, CheckCircle2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMockData } from '@/hooks/useMockData';

// Tipos
interface EventoFolha {
  codigo: string;
  descricao: string;
  tipo: 'provento' | 'desconto';
  valor: number;
  referencia?: string;
}

interface FolhaProfissional {
  matricula: string;
  nome: string;
  cargo: string;
  loja: string;
  salarioBase: number;
  eventos: EventoFolha[];
  totalProventos: number;
  totalDescontos: number;
  liquido: number;
}

// Função de arredondamento
const arredondarValor = (valor: number): number => {
  const centavos = valor % 1;
  return centavos >= 0.50 ? Math.ceil(valor) : Math.floor(valor);
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Mock de eventos padrão
const codigosEventos = {
  '001': { descricao: 'Salário Base', tipo: 'provento' as const },
  '002': { descricao: 'Horas Extras 50%', tipo: 'provento' as const },
  '003': { descricao: 'Horas Extras 100%', tipo: 'provento' as const },
  '004': { descricao: 'Adicional Noturno', tipo: 'provento' as const },
  '005': { descricao: 'Comissões', tipo: 'provento' as const },
  '006': { descricao: 'Gratificação', tipo: 'provento' as const },
  '007': { descricao: 'DSR', tipo: 'provento' as const },
  '008': { descricao: 'Férias', tipo: 'provento' as const },
  '009': { descricao: '1/3 Férias', tipo: 'provento' as const },
  '010': { descricao: '13º Salário', tipo: 'provento' as const },
  '101': { descricao: 'INSS', tipo: 'desconto' as const },
  '102': { descricao: 'IRRF', tipo: 'desconto' as const },
  '103': { descricao: 'Vale Transporte', tipo: 'desconto' as const },
  '104': { descricao: 'Vale Refeição', tipo: 'desconto' as const },
  '105': { descricao: 'Faltas', tipo: 'desconto' as const },
  '106': { descricao: 'Adiantamento', tipo: 'desconto' as const },
  '107': { descricao: 'Empréstimo', tipo: 'desconto' as const },
  '108': { descricao: 'Empréstimo CLT', tipo: 'desconto' as const },
  '109': { descricao: 'Pensão Alimentícia', tipo: 'desconto' as const },
  '110': { descricao: 'Sindicato', tipo: 'desconto' as const },
  '111': { descricao: 'Plano de Saúde', tipo: 'desconto' as const },
  '112': { descricao: 'Seguro de Vida', tipo: 'desconto' as const },
};

// Gerar dados mock
const gerarFolhaMock = (): FolhaProfissional[] => {
  const nomes = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima', 'Carlos Oliveira', 
    'Julia Souza', 'Lucas Ferreira', 'Fernanda Alves', 'Ricardo Rodrigues', 'Mariana Pereira',
    'Bruno Carvalho', 'Camila Gomes', 'Gabriel Martins'];
  const lojas = ['Loja 01', 'Loja 02', 'Loja 03', 'Loja 04', 'Loja 05'];
  const cargos = ['Vendedor', 'Caixa', 'Repositor', 'Supervisor', 'Gerente'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const salarioBase = 1800 + Math.floor(Math.random() * 1500);
    const eventos: EventoFolha[] = [
      { codigo: '001', descricao: 'Salário Base', tipo: 'provento', valor: salarioBase },
    ];
    
    // Adicionar eventos aleatórios
    if (Math.random() > 0.7) {
      eventos.push({ codigo: '002', descricao: 'Horas Extras 50%', tipo: 'provento', valor: arredondarValor(salarioBase * 0.05), referencia: '5h' });
    }
    if (Math.random() > 0.8) {
      eventos.push({ codigo: '004', descricao: 'Adicional Noturno', tipo: 'provento', valor: arredondarValor(salarioBase * 0.03) });
    }
    
    // Descontos obrigatórios
    const inss = arredondarValor(salarioBase * 0.08);
    eventos.push({ codigo: '101', descricao: 'INSS', tipo: 'desconto', valor: inss });
    
    if (salarioBase > 2500) {
      eventos.push({ codigo: '102', descricao: 'IRRF', tipo: 'desconto', valor: arredondarValor(salarioBase * 0.03) });
    }
    
    // VT (6% do salário)
    eventos.push({ codigo: '103', descricao: 'Vale Transporte', tipo: 'desconto', valor: arredondarValor(salarioBase * 0.06) });
    
    // Adiantamento
    if (Math.random() > 0.3) {
      eventos.push({ codigo: '106', descricao: 'Adiantamento', tipo: 'desconto', valor: arredondarValor(salarioBase * 0.4) });
    }
    
    // Empréstimo
    if (Math.random() > 0.8) {
      eventos.push({ codigo: '107', descricao: 'Empréstimo', tipo: 'desconto', valor: Math.floor(Math.random() * 300) + 100 });
    }
    
    // Faltas
    if (Math.random() > 0.85) {
      const diasFalta = Math.floor(Math.random() * 2) + 1;
      eventos.push({ codigo: '105', descricao: 'Faltas', tipo: 'desconto', valor: arredondarValor((salarioBase / 30) * diasFalta), referencia: `${diasFalta}d` });
    }
    
    const totalProventos = eventos.filter(e => e.tipo === 'provento').reduce((s, e) => s + e.valor, 0);
    const totalDescontos = eventos.filter(e => e.tipo === 'desconto').reduce((s, e) => s + e.valor, 0);
    
    return {
      matricula: String(i + 1).padStart(4, '0'),
      nome: nomes[i % nomes.length],
      cargo: cargos[Math.floor(Math.random() * cargos.length)],
      loja: lojas[Math.floor(Math.random() * lojas.length)],
      salarioBase,
      eventos,
      totalProventos,
      totalDescontos,
      liquido: arredondarValor(totalProventos - totalDescontos),
    };
  });
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
  const mockData = useMockData();
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Verificar se temos dados das planilhas BASE
  const dadosASOStr = localStorage.getItem('dadosASO');
  const dadosBeneficiosStr = localStorage.getItem('dadosBeneficios');
  const dadosCompletos = mockData.hasMockData && dadosASOStr && dadosBeneficiosStr;
  
  const folhaCompleta = useMemo(() => {
    if (mockData.hasMockData) {
      // Usar dados reais da planilha
      return mockData.profissionais.map(p => {
        const salarioBase = mockData.parseSalario(p.salarioReceber || p.salarioCTPS);
        const eventos: EventoFolha[] = [
          { codigo: '001', descricao: 'Salário Base', tipo: 'provento', valor: salarioBase },
        ];
        
        // INSS
        const inss = arredondarValor(salarioBase * 0.08);
        eventos.push({ codigo: '101', descricao: 'INSS', tipo: 'desconto', valor: inss });
        
        // Vale Transporte
        const vt = arredondarValor(salarioBase * 0.06);
        eventos.push({ codigo: '103', descricao: 'Vale Transporte', tipo: 'desconto', valor: vt });
        
        // Pensão Alimentícia
        if (p.pensao === 'SIM') {
          const pensao = arredondarValor(salarioBase * 0.30);
          eventos.push({ codigo: '109', descricao: 'Pensão Alimentícia', tipo: 'desconto', valor: pensao });
        }
        
        const totalProventos = eventos.filter(e => e.tipo === 'provento').reduce((s, e) => s + e.valor, 0);
        const totalDescontos = eventos.filter(e => e.tipo === 'desconto').reduce((s, e) => s + e.valor, 0);
        
        return {
          matricula: p.matricula,
          nome: p.nome,
          cargo: p.cargo,
          loja: p.localTrabalho,
          salarioBase,
          eventos,
          totalProventos,
          totalDescontos,
          liquido: arredondarValor(totalProventos - totalDescontos),
        };
      });
    }
    return gerarFolhaMock();
  }, [mockData]);
  
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
    }), { proventos: 0, descontos: 0, liquido: 0 });
  }, [folhaFiltrada]);
  
  const lojas = useMemo(() => [...new Set(folhaCompleta.map(f => f.loja))], [folhaCompleta]);
  
  const exportarCSV = () => {
    const headers = ['Matrícula', 'Nome', 'Cargo', 'Loja', 'Salário Base', 'Total Proventos', 'Total Descontos', 'Líquido'];
    const rows = folhaFiltrada.map(f => [
      f.matricula, f.nome, f.cargo, f.loja, f.salarioBase, f.totalProventos, f.totalDescontos, f.liquido
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `folha_geral_${competencia}.csv`;
    link.click();
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Relatório Geral de Folha
            {dadosCompletos && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 ml-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Dados Validados
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {dadosCompletos 
              ? `Usando dados reais de ${mockData.totalProfissionais} profissionais`
              : 'Consolidação de todos os eventos de pagamento (dados simulados)'
            }
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Funcionários</p>
                <p className="text-lg font-bold">{folhaFiltrada.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingDown className="h-4 w-4 text-success rotate-180" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Proventos</p>
                <p className="text-lg font-bold text-success">{formatCurrency(totais.proventos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Descontos</p>
                <p className="text-lg font-bold text-destructive">{formatCurrency(totais.descontos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Líquido</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totais.liquido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table className="table-zebra">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-20">Mat.</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Proventos</TableHead>
                  <TableHead className="text-right">Descontos</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead className="w-20 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folhaFiltrada.map((f, index) => (
                  <TableRow key={`${f.matricula}-${index}`}>
                    <TableCell className="font-mono text-sm">{f.matricula}</TableCell>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{f.cargo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{f.loja}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-success font-medium">
                      {formatCurrency(f.totalProventos)}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {formatCurrency(f.totalDescontos)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(f.liquido)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Holerite - {f.nome}</DialogTitle>
                          </DialogHeader>
                          <DetalheHolerite folha={f} competencia={competencia} />
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
