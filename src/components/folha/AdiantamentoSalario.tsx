import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { useSupabaseData } from '@/hooks/useSupabaseData';

const arredondarValor = (valor: number): number => {
  const centavos = valor % 1;
  return centavos >= 0.50 ? Math.ceil(valor) : Math.floor(valor);
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface ProfissionalAdiantamento {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  salario: number;
  dataAdmissao: string | null;
  status: 'ativo' | 'ferias' | 'afastado' | 'licenca_maternidade';
  faltas: number;
  elegivel: boolean;
  motivoInelegibilidade?: string;
  valorAdiantamento: number;
  percentual: number;
}

export function AdiantamentoSalario() {
  const supabaseData = useSupabaseData();
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [percentualPadrao, setPercentualPadrao] = useState(40);
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [mostrarInelegiveis, setMostrarInelegiveis] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Carrega o percentual configurado no banco (configuracoes_sistema.percentual_adiantamento)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('configuracoes_sistema')
        .select('valor')
        .eq('chave', 'percentual_adiantamento')
        .maybeSingle();
      const valor = Number(data?.valor);
      if (!isNaN(valor) && valor > 0) setPercentualPadrao(valor);
    })();
  }, []);
  
  const profissionais = useMemo(() => {
    if (supabaseData.isLoading || supabaseData.totalProfissionais === 0) {
      return [];
    }

    const [anoComp, mesComp] = competencia.split('-').map(Number);

    return supabaseData.profissionais.map((p: any): ProfissionalAdiantamento => {
      const salario = p.salario_nominal || p.ultimo_salario || p.primeiro_salario || 0;
      const loja = supabaseData.lojas.find((l: any) => l.id === p.loja_id);
      const status = p.status === 'ativo' ? 'ativo' : 'afastado';
      const faltas = 0; // TODO: buscar da tabela de faltas

      // Verificar elegibilidade
      let elegivel = true;
      let motivoInelegibilidade: string | undefined;
      let percentual = percentualPadrao;

      // Verificar data de admissão
      const dataAdmissao = p.data_admissao ? new Date(p.data_admissao) : null;
      const anoAdm = dataAdmissao?.getFullYear();
      const mesAdm = dataAdmissao ? dataAdmissao.getMonth() + 1 : 0;
      const diaAdm = dataAdmissao?.getDate() || 0;

      // Regra: Afastado não recebe (baseado no status original do profissional)
      if (p.status === 'inativo') {
        elegivel = false;
        motivoInelegibilidade = 'Inativo';
      }
      // Regra: +10 faltas não recebe
      else if (faltas >= 10) {
        elegivel = false;
        motivoInelegibilidade = `${faltas} faltas (limite: 10)`;
      }
      // Regra: Admitido após dia 10 do mês não recebe
      else if (dataAdmissao && anoAdm === anoComp && mesAdm === mesComp && diaAdm > 10) {
        elegivel = false;
        motivoInelegibilidade = `Admitido após dia 10 (${diaAdm}/${mesComp})`;
      }
      // Regra: Admitido no mês até dia 10 recebe 40%
      else if (dataAdmissao && anoAdm === anoComp && mesAdm === mesComp && diaAdm <= 10) {
        percentual = 40;
      }
      // Regra: Sem salário definido
      else if (salario === 0) {
        elegivel = false;
        motivoInelegibilidade = 'Salário não definido';
      }

      const valorAdiantamento = elegivel ? arredondarValor(salario * (percentual / 100)) : 0;

      return {
        id: p.id,
        matricula: p.matricula,
        nome: p.nome,
        loja: loja?.nome || 'Sem loja',
        salario,
        dataAdmissao: p.data_admissao,
        status: status as 'ativo' | 'ferias' | 'afastado' | 'licenca_maternidade',
        faltas,
        elegivel,
        motivoInelegibilidade,
        valorAdiantamento,
        percentual,
      };
    });
  }, [supabaseData, competencia, percentualPadrao]);
  
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
      semSalario: inelegiveis.filter(p => p.motivoInelegibilidade?.includes('Salário não definido')).length,
    };
  }, [profissionais]);
  
  const lojas = useMemo(() => [...new Set(profissionais.map(p => p.loja))].sort(), [profissionais]);
  
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
            <TrendingUp className="h-5 w-5 text-primary" />
            Adiantamento de Salário (Dia 20)
          </h2>
          <p className="text-sm text-muted-foreground">
            Elegibilidade automática conforme regras trabalhistas • {supabaseData.totalProfissionais} profissionais
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-orange-500">{totais.semSalario}</p>
            <p className="text-xs text-muted-foreground">Sem Salário</p>
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
          <ScrollArea className="w-full max-h-[600px]">
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
                  <TableRow key={p.id} className={!p.elegivel ? 'opacity-60' : ''}>
                    <TableCell className="font-mono text-sm">{p.matricula}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{p.nome}</TableCell>
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
