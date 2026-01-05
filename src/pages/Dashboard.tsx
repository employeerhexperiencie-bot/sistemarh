import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, TrendingUp, Users, FileText, AlertTriangle, 
  DollarSign, Building2, Calendar, Package, Clock, UserX,
  ChevronRight, Bus, Utensils, ShoppingBasket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlertasResumo } from '@/components/alertas/AlertasAutomaticos';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { LojaComparison } from '@/components/LojaComparison';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DataValidationAlert } from '@/components/DataValidationAlert';

// Interface para atividades recentes
interface AtividadeRecente {
  id: string;
  acao: string;
  modulo: string;
  descricao: string;
  entidade_nome: string | null;
  created_at: string;
}

// Interface para EPIs
interface EpisStats {
  total: number;
  emUso: number;
  vencidos: number;
  percentualOk: number;
}

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  onClick?: () => void;
}

function KPICard({ title, value, subtitle, icon: Icon, iconColor, onClick }: KPICardProps) {
  return (
    <Card 
      className="card-interactive cursor-pointer group" 
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconColor} transition-transform group-hover:scale-110`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  onClick?: () => void;
}

function StatCard({ title, value, icon: Icon, gradient, onClick }: StatCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${gradient} border-0`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-background/20 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-inherit" />
          </div>
          <div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs opacity-80">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const data = useSupabaseData();
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);
  const [episStats, setEpisStats] = useState<EpisStats>({ total: 0, emUso: 0, vencidos: 0, percentualOk: 0 });
  const [loadingExtras, setLoadingExtras] = useState(true);

  // Buscar dados extras (atividades e EPIs)
  useEffect(() => {
    const fetchExtras = async () => {
      try {
        // Buscar atividades recentes
        const { data: atividadesData } = await supabase
          .from('historico_acoes')
          .select('id, acao, modulo, descricao, entidade_nome, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (atividadesData) {
          setAtividades(atividadesData);
        }

        // Buscar estatísticas de EPIs
        const { data: episData } = await supabase
          .from('epis')
          .select('id, status, data_validade');

        if (episData) {
          const total = episData.length;
          const hoje = new Date();
          const vencidos = episData.filter(e => 
            e.status === 'vencido' || 
            (e.data_validade && new Date(e.data_validade) < hoje)
          ).length;
          const emUso = episData.filter(e => e.status === 'em_uso').length;
          const percentualOk = total > 0 ? Math.round(((total - vencidos) / total) * 100) : 100;
          
          setEpisStats({ total, emUso, vencidos, percentualOk });
        }
      } catch (error) {
        console.error('Erro ao carregar dados extras:', error);
      } finally {
        setLoadingExtras(false);
      }
    };

    fetchExtras();
  }, []);
  
  // Loading state
  if (data.isLoading) {
    return (
      <div className="space-y-8 max-w-[1600px] mx-auto">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // Calcular KPIs baseados nos dados do Supabase
  const totalSalarios = data.totalSalarios;
  const adiantamento20 = totalSalarios * 0.4; // 40% para adiantamento dia 20
  
  // Calcular afastamentos
  const afastamentos = data.getAfastamentos();
  const afastamentosAtivos = afastamentos.filter((a: any) => a.status === 'ATIVO');
  const afastamentosMaternidade = afastamentosAtivos.filter((a: any) => a.motivo === 'LICENCA_MATERNIDADE');
  const afastamentosAcidente = afastamentosAtivos.filter((a: any) => 
    a.motivo === 'ACIDENTE_TRABALHO' || a.motivo === 'ACIDENTE_TRAJETO'
  );
  
  // Calcular benefícios com valores reais
  const beneficios = data.getBeneficios();
  const totalVT = beneficios.reduce((sum: number, b: any) => sum + b.valorVT, 0);
  const totalVR = beneficios.reduce((sum: number, b: any) => sum + b.valorVR, 0);
  const totalCesta = beneficios.reduce((sum: number, b: any) => sum + b.cestaBasica, 0);
  const totalBeneficios = totalVT + totalVR + totalCesta;
  
  // Vales usando valor real calculado dos benefícios
  const valesEstimados = totalBeneficios;

  // Calcular faltas
  const faltasData = data.getFaltas();
  const totalFaltas = faltasData.reduce((sum: number, f: any) => sum + f.totalFaltas, 0);
  const faltasJustificadas = faltasData.reduce((sum: number, f: any) => sum + f.faltasJustificadas, 0);
  const faltasInjustificadas = faltasData.reduce((sum: number, f: any) => sum + f.faltasInjustificadas, 0);
  
  // KPIs com valores reais
  const kpis = {
    vales: { 
      value: `R$ ${(valesEstimados / 1000).toFixed(1)}k`, 
      count: beneficios.length
    },
    adiantamentos: { 
      value: `R$ ${(adiantamento20 / 1000).toFixed(1)}k`, 
      count: data.totalProfissionais
    },
    totalReceber: { 
      value: `R$ ${(totalSalarios / 1000).toFixed(1)}k`, 
      count: data.totalProfissionais
    },
    holerites: { 
      gerados: data.totalProfissionais, 
      enviados: 0, 
      assinados: 0 
    },
    faltas: { 
      total: totalFaltas, 
      justificadas: faltasJustificadas, 
      injustificadas: faltasInjustificadas, 
      lojas: data.totalLojas, 
      profissionais: faltasData.filter((f: any) => f.totalFaltas > 0).length 
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da gestão de pessoas e operações
        </p>
      </div>

      {/* 🔴 VALIDAÇÃO DE DADOS - Alerta automático de inconsistências */}
      <DataValidationAlert showOnlyIfProblems={true} maxItems={3} />

      {/* 🔴 ALERTAS URGENTES - Movidos para o topo para visibilidade imediata */}
      <AlertasResumo />

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <KPICard
          title="Vales"
          value={kpis.vales.value}
          subtitle={`${kpis.vales.count} lançamentos`}
          icon={CreditCard}
          iconColor="bg-primary/10 text-primary"
          onClick={() => navigate('/painel-loja?tipo=vales')}
        />

        <KPICard
          title="Adiantamentos"
          value={kpis.adiantamentos.value}
          subtitle={`${kpis.adiantamentos.count} lançamentos`}
          icon={TrendingUp}
          iconColor="bg-accent/10 text-accent"
          onClick={() => navigate('/painel-loja?tipo=adiantamentos')}
        />

        <KPICard
          title="Total a Receber"
          value={kpis.totalReceber.value}
          subtitle={`${kpis.totalReceber.count} funcionários`}
          icon={DollarSign}
          iconColor="bg-success/10 text-success"
          onClick={() => navigate('/painel-loja')}
        />

        {/* Absences Card - Special layout */}
        <Card 
          className="card-interactive cursor-pointer" 
          onClick={() => navigate('/faltas')}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">Faltas do Mês</p>
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                <UserX className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight mb-3">{kpis.faltas.total}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Justificadas</span>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-medium">
                  {kpis.faltas.justificadas}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Injustificadas</span>
                <Badge variant="destructive" className="font-medium">
                  {kpis.faltas.injustificadas}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Holerites Card */}
        <Card 
          className="col-span-2 sm:col-span-1 card-interactive cursor-pointer"
          onClick={() => navigate('/holerites')}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-info" />
              <span className="text-sm font-medium">Holerites</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Gerados</span>
                <Badge variant="secondary" className="font-mono">{kpis.holerites.gerados}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Enviados</span>
                <Badge variant="outline" className="font-mono">{kpis.holerites.enviados}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Assinados</span>
                <Badge className="bg-success/10 text-success border-success/20 font-mono">{kpis.holerites.assinados}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <StatCard
          title="Lojas Ativas"
          value={data.totalLojas}
          icon={Building2}
          gradient="bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
          onClick={() => navigate('/cadastro-lojas')}
        />

        <StatCard
          title="Profissionais"
          value={data.totalProfissionais}
          icon={Users}
          gradient="bg-gradient-to-br from-accent/20 to-accent/5 text-accent"
          onClick={() => navigate('/cadastro-profissionais')}
        />

        <StatCard
          title="Férias Agendadas"
          value={data.getFerias().filter((f: any) => f.status === 'agendada').length}
          icon={Calendar}
          gradient="bg-gradient-to-br from-warning/20 to-warning/5 text-warning"
          onClick={() => navigate('/gestao-ferias')}
        />

        <StatCard
          title="EPIs OK"
          value={episStats.total > 0 ? `${episStats.percentualOk}%` : '-'}
          icon={Package}
          gradient={episStats.vencidos > 0 
            ? "bg-gradient-to-br from-warning/20 to-warning/5 text-warning"
            : "bg-gradient-to-br from-success/20 to-success/5 text-success"
          }
          onClick={() => navigate('/gestao-epi')}
        />
      </div>

      {/* Afastamentos e Benefícios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Afastamentos */}
        <Card 
          className="card-interactive cursor-pointer"
          onClick={() => navigate('/gestao-afastamentos')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-warning/10">
                <UserX className="h-4 w-4 text-warning" />
              </div>
              Afastamentos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{afastamentosAtivos.length}</span>
                <span className="text-sm text-muted-foreground">profissionais afastados</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-pink-500/5 rounded-lg border border-pink-500/20">
                  <p className="text-xs text-muted-foreground mb-1">Maternidade</p>
                  <p className="text-xl font-bold text-pink-400">{afastamentosMaternidade.length}</p>
                </div>
                <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                  <p className="text-xs text-muted-foreground mb-1">Acidentes</p>
                  <p className="text-xl font-bold text-destructive">{afastamentosAcidente.length}</p>
                </div>
              </div>
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <p>• Maternidade: recebe 40% no dia 20</p>
                <p>• Acidentes: pagamento no mês seguinte</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Benefícios */}
        <Card
          className="card-interactive cursor-pointer"
          onClick={() => navigate('/gestao-beneficios-detalhado')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-success/10">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              Benefícios do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-success">
                  {(totalBeneficios / 1000).toFixed(1)}k
                </span>
                <span className="text-sm text-muted-foreground">total em benefícios</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-primary/5 rounded">
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Vale Transporte</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    R$ {(totalVT / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-500/5 rounded">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Vale Refeição</span>
                  </div>
                  <span className="text-sm font-bold text-orange-500">
                    R$ {(totalVR / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-600/5 rounded">
                  <div className="flex items-center gap-2">
                    <ShoppingBasket className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Cesta Básica</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    R$ {(totalCesta / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Lojas */}
      <LojaComparison />

      {/* Recent Activities */}
      <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingExtras ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : atividades.length > 0 ? (
              atividades.map((atividade) => {
                const getColor = () => {
                  switch (atividade.modulo) {
                    case 'profissionais': return 'bg-primary';
                    case 'lojas': return 'bg-info';
                    case 'beneficios': return 'bg-success';
                    case 'faltas': return 'bg-warning';
                    case 'ferias': return 'bg-accent';
                    default: return 'bg-muted-foreground';
                  }
                };
                const getVariant = (): 'primary' | 'secondary' | 'success' | 'warning' => {
                  switch (atividade.acao) {
                    case 'criacao': return 'success';
                    case 'atualizacao': return 'primary';
                    case 'exclusao': return 'warning';
                    default: return 'secondary';
                  }
                };
                return (
                  <ActivityItem
                    key={atividade.id}
                    color={getColor()}
                    title={atividade.descricao}
                    time={formatDistanceToNow(new Date(atividade.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                    badge={{ 
                      text: atividade.acao.toUpperCase(), 
                      variant: getVariant()
                    }}
                  />
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma atividade registrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

// Alert Item Component
function AlertItem({ icon: Icon, title, subtitle, action }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  action: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
      <Icon className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        {action}
        <ChevronRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}

// Activity Item Component  
function ActivityItem({ color, title, time, badge }: {
  color: string;
  title: string;
  time: string;
  badge: { text: string; variant: 'primary' | 'secondary' | 'success' | 'warning' };
}) {
  const badgeStyles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
  };

  return (
    <div className="flex items-center gap-3 group">
      <div className={`h-2 w-2 rounded-full ${color} ${color === 'bg-primary' ? 'animate-pulse-soft' : ''}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <Badge variant="outline" className={`text-xs ${badgeStyles[badge.variant]}`}>
        {badge.text}
      </Badge>
    </div>
  );
}