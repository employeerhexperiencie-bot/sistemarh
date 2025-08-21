import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface OptimizedFinancialCardProps {
  title: string;
  value: string;
  count: number;
  trend: string;
  icon: LucideIcon;
  colorClass: string;
  onNavigate: () => void;
}

const OptimizedFinancialCard = memo(({
  title,
  value,
  count,
  trend,
  icon: Icon,
  colorClass,
  onNavigate,
}: OptimizedFinancialCardProps) => {
  const trendColor = useMemo(() => {
    return trend.startsWith('+') ? 'text-success' : 'text-destructive';
  }, [trend]);

  return (
    <Card className="card-shadow smooth-transition hover:shadow-financial cursor-pointer" onClick={onNavigate}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-xl sm:text-2xl font-bold ${colorClass}`}>{value}</div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {count} {title === 'Holerites' ? 'gerados' : 'lançamentos'}
          </p>
          <Badge variant="outline" className={trendColor}>
            {trend}
          </Badge>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-2">
          Ver por loja
        </Button>
      </CardContent>
    </Card>
  );
});

OptimizedFinancialCard.displayName = 'OptimizedFinancialCard';

export { OptimizedFinancialCard };