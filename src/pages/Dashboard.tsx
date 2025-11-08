import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, TrendingUp, Users, FileText, AlertTriangle, DollarSign, Building2, Calendar, Package, Clock, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OptimizedFinancialCard } from '@/components/OptimizedFinancialCard';

export function Dashboard() {
  const navigate = useNavigate();
  
  // Mock data para demonstração
  const kpis = {
    vales: { value: 'R$ 45.300', count: 23, trend: '+12%' },
    adiantamentos: { value: 'R$ 89.500', count: 15, trend: '+8%' },
    totalReceber: { value: 'R$ 328.700', count: 89, trend: '+7%' },
    holerites: { gerados: 45, enviados: 42, assinados: 38 },
    faltas: { total: 12, justificadas: 5, injustificadas: 7, lojas: 6, profissionais: 10 }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard RH</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Visão geral da gestão de pessoas e operações do mês atual
        </p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OptimizedFinancialCard
          title="Vales"
          value={kpis.vales.value}
          count={kpis.vales.count}
          trend={kpis.vales.trend}
          icon={CreditCard}
          colorClass="text-primary"
          onNavigate={() => navigate('/painel-loja?tipo=vales')}
        />

        <OptimizedFinancialCard
          title="Adiantamentos"
          value={kpis.adiantamentos.value}
          count={kpis.adiantamentos.count}
          trend={kpis.adiantamentos.trend}
          icon={TrendingUp}
          colorClass="text-accent"
          onNavigate={() => navigate('/painel-loja?tipo=adiantamentos')}
        />

        <OptimizedFinancialCard
          title="Total a Receber"
          value={kpis.totalReceber.value}
          count={kpis.totalReceber.count}
          trend={kpis.totalReceber.trend}
          icon={DollarSign}
          colorClass="text-primary"
          onNavigate={() => navigate('/painel-loja')}
        />

        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" onClick={() => navigate('/faltas')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faltas do Mês</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{kpis.faltas.total}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Justificadas</span>
                <Badge className="bg-success/10 text-success border-success/20">{kpis.faltas.justificadas}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Injustificadas</span>
                <Badge variant="destructive">{kpis.faltas.injustificadas}</Badge>
              </div>
              <div className="pt-1 border-t">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{kpis.faltas.lojas} lojas</span>
                  <span className="text-muted-foreground">{kpis.faltas.profissionais} profissionais</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver detalhes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Holerites e Status Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" onClick={() => navigate('/holerites')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holerites</CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gerados</span>
                <Badge variant="secondary">{kpis.holerites.gerados}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Enviados</span>
                <Badge variant="outline">{kpis.holerites.enviados}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Assinados</span>
                <Badge className="bg-success/10 text-success border-success/20">{kpis.holerites.assinados}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Ver detalhes
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 smooth-transition hover:shadow-financial cursor-pointer"
              onClick={() => navigate('/cadastro-lojas')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">13</p>
                <p className="text-xs text-muted-foreground">Lojas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 smooth-transition hover:shadow-financial cursor-pointer"
              onClick={() => navigate('/cadastro-profissionais')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">127</p>
                <p className="text-xs text-muted-foreground">Profissionais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 smooth-transition hover:shadow-financial cursor-pointer"
              onClick={() => navigate('/gestao-ferias')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning/10">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-muted-foreground">Férias Agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20 smooth-transition hover:shadow-financial cursor-pointer"
              onClick={() => navigate('/gestao-epi')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">95%</p>
                <p className="text-xs text-muted-foreground">EPIs OK</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Inteligentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-warning/50 bg-gradient-to-br from-warning/10 to-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Ações Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
              <Clock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">3 documentos vencendo em 7 dias</p>
                <p className="text-xs text-muted-foreground">Centro, Brooklin, Morumbi</p>
              </div>
              <Button size="sm" variant="outline">Ver</Button>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
              <Calendar className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">5 férias a vencer este mês</p>
                <p className="text-xs text-muted-foreground">Período aquisitivo encerrando</p>
              </div>
              <Button size="sm" variant="outline">Agendar</Button>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
              <Package className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">2 EPIs com estoque crítico</p>
                <p className="text-xs text-muted-foreground">Uniforme e Touca abaixo de 20%</p>
              </div>
              <Button size="sm" variant="outline">Repor</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Vale lançado - BROOKLIN</p>
                <p className="text-xs text-muted-foreground">Há 5 minutos</p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary">R$ 450</Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Holerite enviado - CENTRO</p>
                <p className="text-xs text-muted-foreground">Há 12 minutos</p>
              </div>
              <Badge variant="secondary">Agosto/2025</Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Férias agendadas - MORUMBI</p>
                <p className="text-xs text-muted-foreground">Há 18 minutos</p>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success">15 dias</Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-warning"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Falta registrada - TATUAPÉ</p>
                <p className="text-xs text-muted-foreground">Há 35 minutos</p>
              </div>
              <Badge variant="outline" className="bg-warning/10 text-warning">INJUST</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}