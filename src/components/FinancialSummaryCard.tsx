import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface FinancialSummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const FinancialSummaryCard = memo(({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  borderClass,
}: FinancialSummaryCardProps) => {
  return (
    <Card className={`${bgClass} ${borderClass}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${colorClass}`} />
          <div className="min-w-0 flex-1">
            <p className={`text-lg sm:text-2xl font-bold ${colorClass} truncate`}>
              {value}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FinancialSummaryCard.displayName = 'FinancialSummaryCard';

export { FinancialSummaryCard };