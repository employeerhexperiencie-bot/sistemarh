import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  competenciaAtual: string;
  totalDia20: number;
  totalDia5: number;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return `R$ ${value.toFixed(0)}`;
};

// Gera dados simulados dos últimos 6 meses para demonstração
// Em produção, isso viria do Supabase
const gerarDadosHistoricos = (competenciaAtual: string, totalDia20Atual: number, totalDia5Atual: number) => {
  const [anoAtual, mesAtual] = competenciaAtual.split('-').map(Number);
  const meses: { mes: string; label: string; dia20: number; dia5: number; total: number }[] = [];
  
  const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  for (let i = 5; i >= 0; i--) {
    let mes = mesAtual - i;
    let ano = anoAtual;
    
    if (mes <= 0) {
      mes += 12;
      ano -= 1;
    }
    
    const competencia = `${ano}-${String(mes).padStart(2, '0')}`;
    const label = `${nomesMeses[mes - 1]}/${String(ano).slice(2)}`;
    
    // Se for o mês atual, usa os valores reais
    if (i === 0) {
      meses.push({
        mes: competencia,
        label,
        dia20: totalDia20Atual,
        dia5: totalDia5Atual,
        total: totalDia20Atual + totalDia5Atual,
      });
    } else {
      // Gera variação aleatória para meses anteriores (simulação)
      const variacao = 0.85 + Math.random() * 0.25; // -15% a +10%
      const dia20 = Math.round(totalDia20Atual * variacao);
      const dia5 = Math.round(totalDia5Atual * variacao);
      meses.push({
        mes: competencia,
        label,
        dia20,
        dia5,
        total: dia20 + dia5,
      });
    }
  }
  
  return meses;
};

const chartConfig = {
  dia20: {
    label: 'Dia 20 (Adiantamento)',
    color: 'hsl(var(--chart-1))',
  },
  dia5: {
    label: 'Dia 5 (Salário)',
    color: 'hsl(var(--chart-2))',
  },
};

export function GraficoTendenciaFolha({ competenciaAtual, totalDia20, totalDia5 }: Props) {
  const dados = useMemo(() => {
    return gerarDadosHistoricos(competenciaAtual, totalDia20, totalDia5);
  }, [competenciaAtual, totalDia20, totalDia5]);
  
  // Calcular variação mês a mês
  const variacao = useMemo(() => {
    if (dados.length < 2) return { percentual: 0, tipo: 'neutro' as const };
    
    const mesAtual = dados[dados.length - 1].total;
    const mesAnterior = dados[dados.length - 2].total;
    
    if (mesAnterior === 0) return { percentual: 0, tipo: 'neutro' as const };
    
    const diff = ((mesAtual - mesAnterior) / mesAnterior) * 100;
    
    return {
      percentual: Math.abs(diff).toFixed(1),
      tipo: diff > 0.5 ? 'alta' : diff < -0.5 ? 'baixa' : 'neutro',
    };
  }, [dados]);
  
  const mediaHistorica = useMemo(() => {
    const soma = dados.reduce((acc, d) => acc + d.total, 0);
    return soma / dados.length;
  }, [dados]);

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tendência da Folha (Últimos 6 meses)
            </CardTitle>
            <CardDescription>
              Comparativo do custo total da folha (Dia 5 + Dia 20)
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Média histórica</p>
              <p className="font-semibold">{formatCurrency(mediaHistorica)}</p>
            </div>
            <Badge 
              variant="outline" 
              className={`gap-1 ${
                variacao.tipo === 'alta' 
                  ? 'bg-destructive/10 text-destructive border-destructive/20' 
                  : variacao.tipo === 'baixa'
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {variacao.tipo === 'alta' && <TrendingUp className="h-3 w-3" />}
              {variacao.tipo === 'baixa' && <TrendingDown className="h-3 w-3" />}
              {variacao.tipo === 'neutro' && <Minus className="h-3 w-3" />}
              {variacao.percentual}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={dados} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="label" 
              tickLine={false} 
              axisLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              tickFormatter={formatCurrencyCompact}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="font-medium">{formatCurrency(Number(value))}</span>
                  )}
                />
              }
            />
            <Bar 
              dataKey="dia20" 
              stackId="a" 
              fill="hsl(var(--chart-1))" 
              radius={[0, 0, 0, 0]}
              name="Dia 20"
            />
            <Bar 
              dataKey="dia5" 
              stackId="a" 
              fill="hsl(var(--chart-2))" 
              radius={[4, 4, 0, 0]}
              name="Dia 5"
            />
          </BarChart>
        </ChartContainer>
        
        {/* Legenda customizada */}
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
            <span className="text-xs text-muted-foreground">Dia 20 (Adiantamento)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            <span className="text-xs text-muted-foreground">Dia 5 (Salário)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
