import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, Download, Calendar, Users, 
  DollarSign, AlertTriangle, CheckCircle, XCircle, Info
} from 'lucide-react';

const arredondarValor = (valor: number): number => {
  const centavos = valor % 1;
  return centavos >= 0.50 ? Math.ceil(valor) : Math.floor(valor);
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface ProfissionalAdiantamento {
  matricula: string;
  nome: string;
  loja: string;
  salario: number;
  dataAdmissao: string;
  status: 'ativo' | 'ferias' | 'afastado' | 'licenca_maternidade';
  faltas: number;
  elegivel: boolean;
  motivoInelegibilidade?: string;
  valorAdiantamento: number;
  percentual: number;
}

// Gerar dados mock
const gerarAdiantamentosMock = (competencia: string, percentualPadrao: number): ProfissionalAdiantamento[] => {
  const nomes = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima', 'Carlos Oliveira', 
    'Julia Souza', 'Lucas Ferreira', 'Fernanda Alves', 'Ricardo Rodrigues', 'Mariana Pereira',
    'Bruno Carvalho', 'Camila Gomes', 'Gabriel Martins'];
  const lojas = ['Loja 01', 'Loja 02', 'Loja 03', 'Loja 04', 'Loja 05'];
  const statusOptions: ProfissionalAdiantamento['status'][] = ['ativo', 'ativo', 'ativo', 'ativo', 'ativo', 'ativo', 'ferias', 'afastado', 'licenca_maternidade', 'ativo'];
  
  const [anoComp, mesComp] = competencia.split('-').map(Number);
  
  return Array.from({ length: 50 }, (_, i) => {
    const salario = 1800 + Math.floor(Math.random() * 1500);
    const status = statusOptions[i % statusOptions.length];
    const faltas = Math.floor(Math.random() * 15);
    
    // Data admissão aleatória
    const anoAdm = anoComp - Math.floor(Math.random() * 3);
    const mesAdm = Math.floor(Math.random() * 12) + 1;
    const diaAdm = Math.floor(Math.random() * 28) + 1;
    const dataAdmissao = `${anoAdm}-${String(mesAdm).padStart(2, '0')}-${String(diaAdm).padStart(2, '0')}`;
    
    // Verificar elegibilidade
    let elegivel = true;
    let motivoInelegibilidade: string | undefined;
    let percentual = percentualPadrao;
    
    // Regra: Em férias não recebe
    if (status === 'ferias') {
      elegivel = false;
      motivoInelegibilidade = 'Em férias';
    }
    // Regra: Afastado (exceto maternidade) não recebe
    else if (status === 'afastado') {
      elegivel = false;
      motivoInelegibilidade = 'Afastado';
    }
    // Regra: +10 faltas não recebe
    else if (faltas >= 10) {
      elegivel = false;
      motivoInelegibilidade = `${faltas} faltas (limite: 10)`;
    }
    // Regra: Admitido após dia 10 do mês recebe apenas 40%
    else if (anoAdm === anoComp && mesAdm === mesComp && diaAdm > 10) {
      elegivel = false;
      motivoInelegibilidade = `Admitido após dia 10 (${diaAdm}/${mesComp})`;
    }
    // Regra: Admitido no mês até dia 10 recebe 40%
    else if (anoAdm === anoComp && mesAdm === mesComp && diaAdm <= 10) {
      percentual = 40;
    }
    
    const valorAdiantamento = elegivel ? arredondarValor(salario * (percentual / 100)) : 0;
    
    return {
      matricula: String(i + 1).padStart(4, '0'),
      nome: nomes[i % nomes.length],
      loja: lojas[Math.floor(Math.random() * lojas.length)],
      salario,
      dataAdmissao,
      status,
      faltas,
      elegivel,
      motivoInelegibilidade,
      valorAdiantamento,
      percentual,
    };
  });
};

export function AdiantamentoSalario() {
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [percentualPadrao, setPercentualPadrao] = useState(40);
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [mostrarInelegiveis, setMostrarInelegiveis] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const profissionais = useMemo(() => 
    gerarAdiantamentosMock(competencia, percentualPadrao), 
    [competencia, percentualPadrao]
  );
  
  const profissionaisFiltrados = useMemo(() => {
    return profissionais.filter(p => {
      if (lojaFiltro !== 'todas' && p.loja !== lojaFiltro) return false;
      if (!mostrarInelegiveis && !p.elegivel) return false;
      if (searchTerm && !p.nome.toLowerCase().includes(searchTerm.toLowerCase()) && !p.matricula.includes(searchTerm)) return false;
      return true;
    });
  }, [profissionais, lojaFiltro, mostrarInelegiveis, searchTerm]);
  
  const totais = useMemo(() => {
    const elegiveis = profissionais.filter(p => p.elegivel);
    const inelegiveis = profissionais.filter(p => !p.elegivel);
    
    return {
      total: profissionais.length,
      elegiveis: elegiveis.length,
      inelegiveis: inelegiveis.length,
      valorTotal: elegiveis.reduce((s, p) => s + p.valorAdiantamento, 0),
      emFerias: inelegiveis.filter(p => p.motivoInelegibilidade === 'Em férias').length,
      afastados: inelegiveis.filter(p => p.motivoInelegibilidade === 'Afastado').length,
      muitasFaltas: inelegiveis.filter(p => p.motivoInelegibilidade?.includes('faltas')).length,
      admissaoTardia: inelegiveis.filter(p => p.motivoInelegibilidade?.includes('Admitido após')).length,
    };
  }, [profissionais]);
  
  const lojas = useMemo(() => [...new Set(profissionais.map(p => p.loja))], [profissionais]);
  
  const getStatusBadge = (p: ProfissionalAdiantamento) => {
    if (p.elegivel) {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Elegível ({p.percentual}%)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
        <XCircle className="h-3 w-3 mr-1" />
        Inelegível
      </Badge>
    );
  };
  
  const exportarCSV = () => {
    const headers = ['Matrícula', 'Nome', 'Loja', 'Salário', 'Status', 'Faltas', 'Elegível', 'Motivo', '%', 'Valor Adiant.'];
    const rows = profissionaisFiltrados.map(p => [
      p.matricula, p.nome, p.loja, p.salario, p.status, p.faltas,
      p.elegivel ? 'Sim' : 'Não', p.motivoInelegibilidade || '-', p.percentual, p.valorAdiantamento
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `adiantamento_${competencia}.csv`;
    link.click();
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Adiantamento de Salário (Dia 20)
          </h2>
          <p className="text-sm text-muted-foreground">
            Elegibilidade automática conforme regras trabalhistas
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportarCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>
      
      {/* Regras Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Regras de Elegibilidade:</strong> Não recebem adiantamento: funcionários em férias, 
          afastados (exceto maternidade), com +10 faltas, ou admitidos após dia 10. 
          Admitidos até dia 10 no mês recebem apenas 40%.
        </AlertDescription>
      </Alert>
      
      {/* Cards Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Elegíveis</p>
                <p className="text-lg font-bold text-success">{totais.elegiveis}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inelegíveis</p>
                <p className="text-lg font-bold text-destructive">{totais.inelegiveis}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total a Pagar</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totais.valorTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Funcionários</p>
                <p className="text-lg font-bold">{totais.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Motivos de Inelegibilidade */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-info">{totais.emFerias}</p>
            <p className="text-xs text-muted-foreground">Em Férias</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-warning">{totais.afastados}</p>
            <p className="text-xs text-muted-foreground">Afastados</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-destructive">{totais.muitasFaltas}</p>
            <p className="text-xs text-muted-foreground">+10 Faltas</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-accent">{totais.admissaoTardia}</p>
            <p className="text-xs text-muted-foreground">Admissão Tardia</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Competência</Label>
              <Input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">% Padrão</Label>
              <Select value={String(percentualPadrao)} onValueChange={(v) => setPercentualPadrao(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30%</SelectItem>
                  <SelectItem value="40">40%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loja</Label>
              <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {lojas.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
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
            <div className="flex items-center gap-2">
              <Switch
                checked={mostrarInelegiveis}
                onCheckedChange={setMostrarInelegiveis}
              />
              <Label className="text-xs">Mostrar inelegíveis</Label>
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
                  <TableHead className="text-right">Salário</TableHead>
                  <TableHead className="text-center">Faltas</TableHead>
                  <TableHead>Elegibilidade</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Adiantamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profissionaisFiltrados.map((p) => (
                  <TableRow key={p.matricula} className={!p.elegivel ? 'opacity-60' : ''}>
                    <TableCell className="font-mono text-sm">{p.matricula}</TableCell>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{p.loja}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(p.salario)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={p.faltas >= 10 ? 'destructive' : 'secondary'} className="text-xs">
                        {p.faltas}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(p)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.motivoInelegibilidade || '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {p.elegivel ? (
                        <span className="text-success">{formatCurrency(p.valorAdiantamento)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
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
