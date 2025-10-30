import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, TrendingUp, Users, FileText, AlertTriangle, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OptimizedFinancialCard } from '@/components/OptimizedFinancialCard';

export function Dashboard() {
  const navigate = useNavigate();
  
  // Mock data para demonstração
  const kpis = {
    vales: { value: 'R$ 45.300', count: 23, trend: '+12%' },
    adiantamentos: { value: 'R$ 89.500', count: 15, trend: '+8%' },
    totalReceber: { value: 'R$ 328.700', count: 89, trend: '+7%' },
    holerites: { gerados: 45, enviados: 42, assinados: 38 }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard RH</h1>
        <p className="text-muted-foreground">
          Visão geral da gestão de pessoas e operações do mês atual
        </p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
      </div>

      {/* Gráfico de tendências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
              Gráfico de evolução será implementado aqui
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Ações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Vale lançado - BROOKLIN</p>
                  <p className="text-xs text-muted-foreground">Há 5 minutos</p>
                </div>
                <Badge variant="outline">R$ 450</Badge>
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
                <div className="h-2 w-2 rounded-full bg-warning"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Falta registrada - MORUMBI</p>
                  <p className="text-xs text-muted-foreground">Há 25 minutos</p>
                </div>
                <Badge variant="outline">INJUST</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}