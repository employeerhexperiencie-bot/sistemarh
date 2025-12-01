import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserX, DollarSign, TrendingUp, Building2 } from 'lucide-react';
import { useMockData } from '@/hooks/useMockData';
import { useNavigate } from 'react-router-dom';

export function LojaComparison() {
  const mockData = useMockData();
  const navigate = useNavigate();

  if (!mockData.hasMockData) {
    return null;
  }

  // Agrupar afastamentos por loja
  const afastamentos = mockData.getAfastamentos();
  const afastamentosPorLoja: Record<string, any[]> = {};
  afastamentos.forEach((a: any) => {
    if (a.status === 'ATIVO') {
      if (!afastamentosPorLoja[a.loja]) {
        afastamentosPorLoja[a.loja] = [];
      }
      afastamentosPorLoja[a.loja].push(a);
    }
  });

  const rankingAfastamentos = Object.entries(afastamentosPorLoja)
    .map(([loja, afasts]) => ({
      loja,
      total: afasts.length,
      maternidade: afasts.filter((a: any) => a.motivo === 'LICENCA_MATERNIDADE').length,
      acidente: afasts.filter((a: any) => a.motivo === 'ACIDENTE_TRABALHO' || a.motivo === 'ACIDENTE_TRAJETO').length,
      outros: afasts.filter((a: any) => !['LICENCA_MATERNIDADE', 'ACIDENTE_TRABALHO', 'ACIDENTE_TRAJETO'].includes(a.motivo)).length,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Agrupar benefícios por loja
  const beneficios = mockData.getBeneficios();
  const beneficiosPorLoja: Record<string, { vt: number; vr: number; cesta: number; total: number; profissionais: number }> = {};
  
  beneficios.forEach((b: any) => {
    if (!beneficiosPorLoja[b.loja]) {
      beneficiosPorLoja[b.loja] = { vt: 0, vr: 0, cesta: 0, total: 0, profissionais: 0 };
    }
    beneficiosPorLoja[b.loja].vt += b.valorVT;
    beneficiosPorLoja[b.loja].vr += b.valorVR;
    beneficiosPorLoja[b.loja].cesta += b.cestaBasica;
    beneficiosPorLoja[b.loja].total += b.valorVT + b.valorVR + b.cestaBasica;
    beneficiosPorLoja[b.loja].profissionais += 1;
  });

  const rankingBeneficios = Object.entries(beneficiosPorLoja)
    .map(([loja, dados]) => ({
      loja,
      ...dados,
      mediaPorProfissional: dados.total / dados.profissionais,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getPositionColor = (index: number) => {
    if (index === 0) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (index === 1) return 'bg-slate-400/10 text-slate-400 border-slate-400/20';
    if (index === 2) return 'bg-orange-600/10 text-orange-600 border-orange-600/20';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="card-interactive">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-accent/10">
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          Ranking de Lojas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="afastamentos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="afastamentos" className="text-xs sm:text-sm">
              <UserX className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Afastamentos
            </TabsTrigger>
            <TabsTrigger value="beneficios" className="text-xs sm:text-sm">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Benefícios
            </TabsTrigger>
          </TabsList>

          {/* Ranking de Afastamentos */}
          <TabsContent value="afastamentos" className="space-y-2">
            {rankingAfastamentos.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhum afastamento ativo registrado
              </div>
            ) : (
              rankingAfastamentos.map((item, index) => (
                <div
                  key={item.loja}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/painel-loja?loja=${encodeURIComponent(item.loja)}`)}
                >
                  <Badge 
                    variant="outline" 
                    className={`h-7 w-7 rounded-full flex items-center justify-center font-bold ${getPositionColor(index)}`}
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium text-sm truncate">{item.loja}</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {item.maternidade > 0 && (
                        <span className="text-xs text-pink-400">
                          {item.maternidade} maternidade
                        </span>
                      )}
                      {item.acidente > 0 && (
                        <span className="text-xs text-destructive">
                          {item.acidente} acidente
                        </span>
                      )}
                      {item.outros > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {item.outros} outros
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-warning">{item.total}</p>
                    <p className="text-xs text-muted-foreground">afastados</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Ranking de Benefícios */}
          <TabsContent value="beneficios" className="space-y-2">
            {rankingBeneficios.map((item, index) => (
              <div
                key={item.loja}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/painel-loja?loja=${encodeURIComponent(item.loja)}`)}
              >
                <Badge 
                  variant="outline" 
                  className={`h-7 w-7 rounded-full flex items-center justify-center font-bold ${getPositionColor(index)}`}
                >
                  {index + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium text-sm truncate">{item.loja}</p>
                  </div>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-primary">VT: {formatCurrency(item.vt)}</span>
                    <span className="text-orange-500">VR: {formatCurrency(item.vr)}</span>
                    <span className="text-green-600">Cesta: {formatCurrency(item.cesta)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success">{formatCurrency(item.total)}</p>
                  <p className="text-xs text-muted-foreground">{item.profissionais} prof.</p>
                </div>
              </div>
            ))}
            
            {rankingBeneficios.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Total geral:</span>
                  <span className="font-bold text-sm text-success">
                    {formatCurrency(rankingBeneficios.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
