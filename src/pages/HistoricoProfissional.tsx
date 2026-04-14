import { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, FileText, Filter, ArrowLeft, Loader2, History, DollarSign, Bus, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCompetenciaAtual, getCompetenciasDisponiveis, formatCompetencia } from '@/lib/competencia';
import { formatCurrency } from '@/lib/payrollCalculator';

interface FechamentoHistorico {
  id: string;
  competencia: string;
  tipo: string;
  status: string;
  versao: number;
  fechado_em: string | null;
  loja_nome: string;
  dados: {
    salarioBase: number;
    valorDia20: number;
    recebeDia20: boolean;
    motivoDia20: string;
    salarioLiquido: number;
    totalDescontos: number;
    valorVT: number;
    valorVR: number;
    valorCesta: number;
    recebeCesta: boolean;
    totalMes: number;
    diasTrabalhados: number;
    detalhesCalculo: string[];
  } | null;
}

export default function HistoricoProfissional() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profissionalInfo, setProfissionalInfo] = useState<{ id: string; nome: string; loja: string; salario: number } | null>(null);
  const [fechamentosHistorico, setFechamentosHistorico] = useState<FechamentoHistorico[]>([]);
  const [vales, setVales] = useState<any[]>([]);
  const [emprestimos, setEmprestimos] = useState<any[]>([]);
  const [faltas, setFaltas] = useState<any[]>([]);
  const [historicoSalarios, setHistoricoSalarios] = useState<any[]>([]);
  
  const matricula = searchParams.get('matricula') || '';
  const profissional = searchParams.get('profissional') || '';
  const loja = searchParams.get('loja') || '';

  useEffect(() => {
    if (matricula) loadData();
    else setLoading(false);
  }, [matricula]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar profissional
      const { data: prof } = await supabase
        .from('profissionais')
        .select(`id, nome, salario_nominal, ultimo_salario, primeiro_salario, lojas:lojas!profissionais_loja_id_fkey(nome)`)
        .eq('matricula', matricula)
        .maybeSingle();

      if (!prof) {
        setProfissionalInfo({ id: '', nome: profissional || 'Não encontrado', loja: loja || '', salario: 0 });
        setLoading(false);
        return;
      }

      const salario = prof.salario_nominal || prof.ultimo_salario || prof.primeiro_salario || 0;
      setProfissionalInfo({
        id: prof.id,
        nome: prof.nome,
        loja: (prof.lojas as any)?.nome || loja || '',
        salario,
      });

      // Buscar todos os fechamentos que contêm este profissional nos snapshots
      const { data: fechamentos } = await supabase
        .from('fechamentos_folha')
        .select('id, competencia, tipo, status, versao, fechado_em, loja_id, snapshot')
        .eq('status', 'fechado')
        .order('competencia', { ascending: false })
        .limit(50);

      // Buscar nomes das lojas
      const { data: lojasData } = await supabase.from('lojas').select('id, nome');
      const lojasMap = new Map((lojasData || []).map(l => [l.id, l.nome]));

      // Filtrar fechamentos que contêm o profissional no snapshot
      const historicoFechamentos: FechamentoHistorico[] = [];
      (fechamentos || []).forEach((f: any) => {
        const resultados = f.snapshot?.resultados || [];
        const profData = resultados.find((r: any) => r.profissionalId === prof.id);
        if (profData) {
          historicoFechamentos.push({
            id: f.id,
            competencia: f.competencia,
            tipo: f.tipo,
            status: f.status,
            versao: f.versao,
            fechado_em: f.fechado_em,
            loja_nome: lojasMap.get(f.loja_id) || '',
            dados: profData,
          });
        }
      });
      setFechamentosHistorico(historicoFechamentos);

      // Buscar vales, empréstimos e faltas
      const [valesRes, empRes, faltasRes, salarioRes] = await Promise.all([
        supabase.from('professional_vales').select('*').eq('profissional_id', prof.id).order('data_lancamento', { ascending: false }).limit(20),
        supabase.from('emprestimos').select('*').eq('profissional_id', prof.id).order('data_inicio', { ascending: false }),
        supabase.from('faltas').select('*').eq('profissional_id', prof.id).order('data_falta', { ascending: false }).limit(30),
        supabase.from('historico_salarios').select('*').eq('profissional_id', prof.id).order('data_alteracao', { ascending: true }),
      ]);

      setVales(valesRes.data || []);
      setEmprestimos(empRes.data || []);
      setFaltas(faltasRes.data || []);
      setHistoricoSalarios(salarioRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'dia_20': return <Calendar className="h-4 w-4 text-warning" />;
      case 'dia_5': return <DollarSign className="h-4 w-4 text-success" />;
      case 'vt': return <Bus className="h-4 w-4 text-primary" />;
      case 'beneficios': return <Package className="h-4 w-4 text-accent" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'dia_20': return 'Dia 20';
      case 'dia_5': return 'Dia 5';
      case 'vt': return 'VT';
      case 'beneficios': return 'Benefícios';
      default: return tipo;
    }
  };

  const getValorPrincipal = (item: FechamentoHistorico): number => {
    if (!item.dados) return 0;
    switch (item.tipo) {
      case 'dia_20': return item.dados.valorDia20;
      case 'dia_5': return item.dados.salarioLiquido;
      case 'vt': return item.dados.valorVT;
      case 'beneficios': return item.dados.valorVR + item.dados.valorCesta;
      default: return item.dados.totalMes;
    }
  };

  // Resumos
  const totais = useMemo(() => {
    const pagamentos = fechamentosHistorico.reduce((sum, f) => sum + getValorPrincipal(f), 0);
    const totalVales = vales.reduce((sum, v) => sum + Number(v.valor), 0);
    const totalEmprestimos = emprestimos.filter(e => e.status === 'ativo').reduce((sum, e) => sum + Number(e.saldo_devedor), 0);
    const totalFaltas = faltas.filter(f => f.tipo === 'injustificada').length;
    return { pagamentos, totalVales, totalEmprestimos, totalFaltas };
  }, [fechamentosHistorico, vales, emprestimos, faltas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Histórico — {profissionalInfo?.nome || profissional}</h1>
            <p className="text-sm text-muted-foreground">
              Loja: <span className="font-medium">{profissionalInfo?.loja || loja}</span>
              {profissionalInfo?.salario ? ` • Salário: ${formatCurrency(profissionalInfo.salario)}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              <div>
                <p className="text-lg font-bold text-success">{formatCurrency(totais.pagamentos)}</p>
                <p className="text-xs text-muted-foreground">Total Recebido</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-primary">{formatCurrency(totais.totalVales)}</p>
                <p className="text-xs text-muted-foreground">Total Vales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-warning" />
              <div>
                <p className="text-lg font-bold text-warning">{formatCurrency(totais.totalEmprestimos)}</p>
                <p className="text-xs text-muted-foreground">Saldo Empréstimos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-lg font-bold text-destructive">{totais.totalFaltas}</p>
                <p className="text-xs text-muted-foreground">Faltas Injustificadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Fechamentos (dados oficiais) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Pagamentos (Fechamentos Oficiais)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fechamentosHistorico.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum fechamento registrado para este profissional</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Salário Base</TableHead>
                  <TableHead className="text-right">Valor Pago</TableHead>
                  <TableHead className="text-right">Descontos</TableHead>
                  <TableHead className="text-right">Dias Trab.</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Data Fechamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fechamentosHistorico.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {formatCompetencia(item.competencia.substring(0, 7))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {getTipoIcon(item.tipo)}
                        {getTipoLabel(item.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.loja_nome}</TableCell>
                    <TableCell className="text-right">{item.dados ? formatCurrency(item.dados.salarioBase) : '—'}</TableCell>
                    <TableCell className="text-right font-bold text-success">
                      {formatCurrency(getValorPrincipal(item))}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {item.dados && item.dados.totalDescontos > 0 ? `-${formatCurrency(item.dados.totalDescontos)}` : '—'}
                    </TableCell>
                    <TableCell className="text-right">{item.dados?.diasTrabalhados ?? '—'}</TableCell>
                    <TableCell><Badge variant="secondary">v{item.versao}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.fechado_em ? new Date(item.fechado_em).toLocaleDateString('pt-BR') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Vales e Empréstimos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Vales Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vales.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground text-sm">Nenhum vale</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vales.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm">{formatDate(v.data_lancamento)}</TableCell>
                      <TableCell className="text-sm">{v.descricao || v.tipo}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(v.valor))}</TableCell>
                      <TableCell>
                        <Badge variant={v.status === 'pendente' ? 'outline' : 'default'} className="text-xs">
                          {v.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Empréstimos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Empréstimos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emprestimos.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground text-sm">Nenhum empréstimo</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Parcela</TableHead>
                    <TableHead className="text-right">Progresso</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emprestimos.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{e.tipo === 'clt' ? 'CLT' : 'Empresa'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(e.valor_parcela))}</TableCell>
                      <TableCell className="text-right text-sm">
                        {e.parcelas_pagas || 0}/{e.numero_parcelas || '∞'}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(e.saldo_devedor))}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                          {e.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evolução Salarial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Evolução Salarial
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historicoSalarios.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground text-sm">Nenhuma alteração salarial registrada</p>
          ) : (
            <>
              {/* Mini gráfico visual de evolução */}
              <div className="flex items-end gap-1 mb-4 h-20 px-2">
                {historicoSalarios.map((h, i) => {
                  const maxVal = Math.max(...historicoSalarios.map(s => Number(s.salario_novo)));
                  const height = maxVal > 0 ? (Number(h.salario_novo) / maxVal) * 100 : 50;
                  return (
                    <div key={h.id} className="flex-1 flex flex-col items-center gap-1" title={`${formatDate(h.data_alteracao)}: ${formatCurrency(h.salario_novo)}`}>
                      <div
                        className="w-full rounded-t bg-primary/70 min-h-[4px] transition-all"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                        {new Date(h.data_alteracao).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Anterior</TableHead>
                    <TableHead className="text-right">Novo</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...historicoSalarios].reverse().map((h: any) => {
                    const pct = h.percentual_alteracao || 0;
                    const tipoLabel: Record<string, string> = {
                      ajuste_combinado: 'Combinado',
                      ajuste_ctps: 'CTPS',
                      ajuste_cadastro: 'Cadastro',
                      reajuste: 'Reajuste',
                      dissidio: 'Dissídio',
                      promocao: 'Promoção',
                      merito: 'Mérito',
                    };
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="text-sm">{formatDate(h.data_alteracao)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{tipoLabel[h.tipo_alteracao] || h.tipo_alteracao}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(h.salario_anterior)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(h.salario_novo)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`flex items-center justify-end gap-1 text-sm font-medium ${pct > 0 ? 'text-green-600' : pct < 0 ? 'text-destructive' : ''}`}>
                            {pct > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : pct < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
                            {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{h.motivo || '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Faltas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Faltas Registradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {faltas.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground text-sm">Nenhuma falta registrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faltas.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell>{formatDate(f.data_falta)}</TableCell>
                    <TableCell>
                      <Badge variant={f.tipo === 'injustificada' ? 'destructive' : 'outline'} className="text-xs">
                        {f.tipo === 'injustificada' ? 'Injustificada' : 'Justificada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.motivo || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
