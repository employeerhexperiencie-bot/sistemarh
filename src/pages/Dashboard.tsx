import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingUp, Users, FileText, AlertTriangle, DollarSign } from 'lucide-react';

export function Dashboard() {
  // Mock data para demonstração
  const kpis = {
    vales: { value: 'R$ 45.300', count: 23, trend: '+12%' },
    adiantamentos: { value: 'R$ 89.500', count: 15, trend: '+8%' },
    descFaltas: { value: 'R$ 12.400', count: 8, trend: '-5%' },
    descDSR: { value: 'R$ 3.200', count: 4, trend: '-15%' },
    totalReceber: { value: 'R$ 328.700', count: 89, trend: '+7%' },
    holerites: { gerados: 45, enviados: 42, assinados: 38 }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das operações financeiras do mês atual
        </p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="card-shadow smooth-transition hover:shadow-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vales</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{kpis.vales.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {kpis.vales.count} lançamentos
              </p>
              <Badge variant="outline" className="text-success">
                {kpis.vales.trend}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adiantamentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{kpis.adiantamentos.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {kpis.adiantamentos.count} lançamentos
              </p>
              <Badge variant="outline" className="text-success">
                {kpis.adiantamentos.trend}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desc. Faltas</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{kpis.descFaltas.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {kpis.descFaltas.count} ocorrências
              </p>
              <Badge variant="outline" className="text-success">
                {kpis.descFaltas.trend}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desc. DSR</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{kpis.descDSR.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {kpis.descDSR.count} descontos
              </p>
              <Badge variant="outline" className="text-success">
                {kpis.descDSR.trend}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{kpis.totalReceber.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {kpis.totalReceber.count} colaboradores
              </p>
              <Badge variant="outline" className="text-success">
                {kpis.totalReceber.trend}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow smooth-transition hover:shadow-financial">
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
                <Badge className="bg-success text-success-foreground">{kpis.holerites.assinados}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de tendências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
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