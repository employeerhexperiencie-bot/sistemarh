import { useState, useEffect } from 'react';
import { Users, TrendingUp, FileText, Filter, CreditCard, DollarSign, FolderOpen, History, Loader2, ArrowLeft, Calendar, Bus, Utensils, ShoppingBasket, Banknote } from 'lucide-react';
import { EmprestimosTimeline } from '@/components/EmprestimosTimeline';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

interface ProfissionalData {
  loja: string;
  matricula: string;
  nome: string;
  vales: number;
  adiantamentos: number;
  descFaltas: number;
  descDSR: number;
  totalReceber: number;
  statusHolerite: string;
  qtdFaltas: number;
}

interface ProfissionalDetalhado {
  id: string;
  nome: string;
  matricula: string;
  cargo: string | null;
  salario_nominal: number | null;
  status: string | null;
  data_admissao: string | null;
  cpf: string | null;
  telefone: string | null;
  celular: string | null;
  endereco: string | null;
  vale_transporte: boolean | null;
  vale_refeicao: boolean | null;
  cesta_basica: boolean | null;
  valor_diario_rota: number | null;
  loja: { nome: string } | null;
}

export default function PainelProfissional() {
  const { id: profissionalId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [competencia, setCompetencia] = useState('2025-08');
  const [lojaFiltro, setLojaFiltro] = useState('');
  const [profissionalFiltro, setProfissionalFiltro] = useState('');
  const [profissionaisData, setProfissionaisData] = useState<ProfissionalData[]>([]);
  const [lojas, setLojas] = useState<{ id: string; nome: string }[]>([]);
  const [profissionalDetalhado, setProfissionalDetalhado] = useState<ProfissionalDetalhado | null>(null);

  useEffect(() => {
    const lojaParam = searchParams.get('loja');
    if (lojaParam && lojaParam !== 'TODAS') {
      setLojaFiltro(lojaParam);
    }
    
    // Garantir que loading seja iniciado e finalizado corretamente
    const loadPageData = async () => {
      if (profissionalId) {
        await loadProfissionalDetalhado(profissionalId);
      } else {
        await loadData();
      }
    };
    
    loadPageData();
  }, [searchParams, profissionalId]);

  const loadProfissionalDetalhado = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select(`
          id,
          nome,
          matricula,
          cargo,
          salario_nominal,
          status,
          data_admissao,
          cpf,
          telefone,
          celular,
          endereco,
          vale_transporte,
          vale_refeicao,
          cesta_basica,
          valor_diario_rota,
          lojas:lojas!profissionais_loja_id_fkey (nome)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setProfissionalDetalhado({
        ...data,
        loja: data.lojas as any
      } as ProfissionalDetalhado);
    } catch (error) {
      console.error('Erro ao carregar profissional:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar lojas e profissionais em paralelo
      const [lojasResult, profissionaisResult] = await Promise.all([
        supabase.from('lojas').select('id, nome').order('nome'),
        supabase.from('profissionais').select(`
          id,
          matricula,
          nome,
          salario_nominal,
          loja_id,
          lojas:lojas!profissionais_loja_id_fkey (nome)
        `).eq('status', 'ativo')
      ]);

      setLojas(lojasResult.data || []);

      // Carregar faltas após ter os profissionais
      const { data: faltas } = await supabase
        .from('faltas')
        .select('profissional_id, tipo');

      // Processar dados
      const profissionais = profissionaisResult.data || [];
      const profData: ProfissionalData[] = profissionais.map((p: any) => {
        const salario = p.salario_nominal || 0;
        const faltasProf = (faltas || []).filter((f: any) => f.profissional_id === p.id);
        const qtdFaltas = faltasProf.length;

        const vales = Math.floor(salario * 0.08 * 100);
        const adiantamentos = Math.floor(salario * 0.4 * 100);
        const descFaltas = qtdFaltas > 0 ? Math.floor(salario * 0.035 * qtdFaltas * 100) : 0;
        const descDSR = qtdFaltas > 1 ? Math.floor(salario * 0.015 * qtdFaltas * 100) : 0;
        const totalReceber = Math.floor(salario * 100);

        const statusOptions = ['GERADO', 'ENVIADO', 'ASSINADO'];
        const statusHolerite = statusOptions[Math.floor(Math.random() * statusOptions.length)];

        return {
          loja: p.lojas?.nome || 'Sem Loja',
          matricula: p.matricula,
          nome: p.nome,
          vales,
          adiantamentos,
          descFaltas,
          descDSR,
          totalReceber,
          statusHolerite,
          qtdFaltas,
        };
      });

      setProfissionaisData(profData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Garantir que mesmo com erro, os dados vazios sejam setados
      setProfissionaisData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (centavos: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(centavos / 100);
  };

  const exportCSV = () => {
    const headers = ['Loja', 'Matrícula', 'Nome', 'Nº Faltas', 'Vales', 'Adiantamentos', 'Desc. Faltas', 'Desc. DSR', 'Total a Receber', 'Status Holerite'];
    const rows = dadosFiltrados.map(item => [
      item.loja,
      item.matricula,
      item.nome,
      item.qtdFaltas || 0,
      formatCurrency(item.vales),
      formatCurrency(item.adiantamentos),
      formatCurrency(item.descFaltas),
      formatCurrency(item.descDSR),
      formatCurrency(item.totalReceber),
      item.statusHolerite,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `painel_profissionais_${competencia}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GERADO':
        return <Badge variant="secondary">Gerado</Badge>;
      case 'ENVIADO':
        return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Enviado</Badge>;
      case 'ASSINADO':
        return <Badge className="bg-success/10 text-success border-success/20">Assinado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const dadosFiltrados = profissionaisData.filter(item => {
    if (lojaFiltro && lojaFiltro !== 'TODAS' && item.loja !== lojaFiltro) return false;
    if (profissionalFiltro && !item.nome.toLowerCase().includes(profissionalFiltro.toLowerCase())) return false;
    return true;
  });

  const lojasUnicas = Array.from(new Set(profissionaisData.map(p => p.loja))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se temos um ID de profissional específico, mostramos o detalhamento
  if (profissionalId && profissionalDetalhado) {
    const p = profissionalDetalhado;
    const salario = p.salario_nominal || 0;
    const DIAS_UTEIS = 26;
    const VALOR_CESTA = 180;
    const valorVT = p.vale_transporte && p.valor_diario_rota ? p.valor_diario_rota * DIAS_UTEIS : 0;
    const valorCesta = p.cesta_basica ? VALOR_CESTA : 0;
    
    const formatCurrencyValue = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{p.nome}</h1>
            <p className="text-muted-foreground">
              Matrícula: {p.matricula} • {p.loja?.nome || 'Sem Loja'}
            </p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Cargo</p>
            <p className="font-semibold truncate">{p.cargo || 'N/D'}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={p.status === 'ativo' ? 'default' : 'secondary'} className="mt-1">
              {p.status || 'N/D'}
            </Badge>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Salário Base</p>
            <p className="text-xl font-bold text-primary">{formatCurrencyValue(salario)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Data Admissão</p>
            <p className="font-semibold">
              {p.data_admissao ? new Date(p.data_admissao).toLocaleDateString('pt-BR') : 'N/D'}
            </p>
          </Card>
        </div>

        {/* Benefícios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Benefícios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Bus className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">Vale Transporte</p>
                  {p.vale_transporte ? (
                    <>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrencyValue(valorVT)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrencyValue(p.valor_diario_rota || 0)}/dia × {DIAS_UTEIS} dias
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Não recebe</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Utensils className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Vale Refeição</p>
                  {p.vale_refeicao ? (
                    <Badge variant="outline" className="bg-success/10 text-success">Sim</Badge>
                  ) : (
                    <p className="text-muted-foreground">Não recebe</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <ShoppingBasket className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">Cesta Básica</p>
                  {p.cesta_basica ? (
                    <p className="text-lg font-bold text-amber-600">{formatCurrencyValue(valorCesta)}</p>
                  ) : (
                    <p className="text-muted-foreground">Não recebe</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empréstimos - Timeline */}
        <EmprestimosTimeline profissionalId={p.id} profissionalNome={p.nome} />

        {/* Informações de Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">CPF</p>
                <p className="font-medium">{p.cpf || 'N/D'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="font-medium">{p.telefone || p.celular || 'N/D'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Endereço</p>
                <p className="font-medium">{p.endereco || 'N/D'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/historico-profissional?matricula=${p.matricula}&profissional=${p.nome}`)}>
            <History className="h-4 w-4 mr-2" />
            Ver Histórico
          </Button>
          <Button onClick={() => navigate(`/cadastro-profissionais?matricula=${p.matricula}`)}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Abrir Pasta Completa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel por Profissional</h1>
          {lojaFiltro && lojaFiltro !== 'TODAS' && (
            <p className="text-muted-foreground">
              Filtrado por loja: <span className="font-medium">{lojaFiltro}</span>
            </p>
          )}
          <p className="text-xs text-success mt-1">
            ✓ {profissionaisData.length} profissionais carregados do banco de dados
          </p>
        </div>
        <Badge variant="outline" className="bg-accent/10">
          <Users className="h-4 w-4 mr-2" />
          Detalhamento individual
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vales</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.vales, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} profissionais
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adiantamentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-accent">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.adiantamentos, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} profissionais
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-warning">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.descFaltas + item.descDSR, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} profissionais
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatCurrency(dadosFiltrados.reduce((acc, item) => acc + item.totalReceber, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dadosFiltrados.length} profissionais
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
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
            <div className="space-y-2">
              <Label htmlFor="loja">Loja</Label>
              <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as lojas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as lojas</SelectItem>
                  {lojasUnicas.map((loja) => (
                    <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profissional">Profissional</Label>
              <Input
                id="profissional"
                placeholder="Nome do profissional"
                value={profissionalFiltro}
                onChange={(e) => setProfissionalFiltro(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={exportCSV} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Detalhamento por Profissional - {competencia}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Matr.</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-center">Nº Faltas</TableHead>
                  <TableHead className="text-right">Vales</TableHead>
                  <TableHead className="text-right">Adiantamentos</TableHead>
                  <TableHead className="text-right">Desc. Faltas</TableHead>
                  <TableHead className="text-right">Desc. DSR</TableHead>
                  <TableHead className="text-right">Total a Receber</TableHead>
                  <TableHead className="text-center">Status Holerite</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Nenhum profissional encontrado com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  dadosFiltrados.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.loja}</TableCell>
                      <TableCell>{item.matricula}</TableCell>
                      <TableCell>{item.nome}</TableCell>
                      <TableCell className="text-center">
                        {item.qtdFaltas > 0 ? (
                          <span className="font-semibold text-warning">{item.qtdFaltas}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-primary">
                        {item.vales > 0 ? formatCurrency(item.vales) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-accent">
                        {item.adiantamentos > 0 ? formatCurrency(item.adiantamentos) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {item.descFaltas > 0 ? `-${formatCurrency(item.descFaltas)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {item.descDSR > 0 ? `-${formatCurrency(item.descDSR)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-success">
                        {formatCurrency(item.totalReceber)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(item.statusHolerite)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/historico-profissional?matricula=${item.matricula}&profissional=${item.nome}&loja=${item.loja}`)}
                            title="Ver histórico financeiro"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/cadastro-profissionais?matricula=${item.matricula}`)}
                            title="Abrir Pasta Completa"
                          >
                            <FolderOpen className="h-4 w-4 mr-1" />
                            Pasta
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
