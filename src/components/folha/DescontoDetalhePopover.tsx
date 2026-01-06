import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Banknote, ShoppingCart, FileEdit, Info } from 'lucide-react';

interface DescontoDetalheProps {
  emprestimo: number;
  vales: number;
  pensao: number;
  faltas: number;
  outros?: number;
  children: React.ReactNode;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function DescontoDetalhePopover({ 
  emprestimo, 
  vales, 
  pensao, 
  faltas, 
  outros = 0,
  children 
}: DescontoDetalheProps) {
  const total = emprestimo + vales + pensao + faltas + outros;

  if (total === 0) {
    return <>{children}</>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-1">
          {children}
          <Info className="h-3 w-3 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="top" align="center">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Composição dos Descontos
            </span>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            {emprestimo > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm">Empréstimo (Parcela)</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {formatCurrency(emprestimo)}
                </Badge>
              </div>
            )}
            
            {vales > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-3.5 w-3.5 text-warning" />
                  <span className="text-sm">Compras/Vales</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {formatCurrency(vales)}
                </Badge>
              </div>
            )}
            
            {pensao > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-sm">Pensão Alimentícia</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {formatCurrency(pensao)}
                </Badge>
              </div>
            )}
            
            {faltas > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">Desconto Faltas</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {formatCurrency(faltas)}
                </Badge>
              </div>
            )}
            
            {outros > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">Outros</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {formatCurrency(outros)}
                </Badge>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold">Total Descontos</span>
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-mono">
              {formatCurrency(total)}
            </Badge>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
