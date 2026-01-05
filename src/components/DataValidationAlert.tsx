import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDataValidation, DataInconsistency } from '@/hooks/useDataValidation';
import { cn } from '@/lib/utils';

interface DataValidationAlertProps {
  showOnlyIfProblems?: boolean;
  compact?: boolean;
  className?: string;
  maxItems?: number;
}

export const DataValidationAlert = ({
  showOnlyIfProblems = true,
  compact = false,
  className,
  maxItems = 5,
}: DataValidationAlertProps) => {
  const { isLoading, validationResult, validarDados, hasInconsistencias } = useDataValidation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Auto-dismiss depois de 30 segundos se compacto
  useEffect(() => {
    if (compact && hasInconsistencias) {
      const timer = setTimeout(() => setIsDismissed(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [compact, hasInconsistencias]);

  if (isDismissed) return null;
  if (showOnlyIfProblems && !hasInconsistencias) return null;
  if (isLoading) return null;

  const { inconsistencias, totalProfissionais, profissionaisComProblemas, ultimaValidacao } = validationResult;

  const getSeveridadeColor = (severidade: DataInconsistency['severidade']) => {
    switch (severidade) {
      case 'alta': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'media': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'baixa': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    }
  };

  const getTipoLabel = (tipo: DataInconsistency['tipo']) => {
    switch (tipo) {
      case 'cargo_ausente': return 'Cargo';
      case 'salario_divergente': return 'Salário';
      case 'loja_divergente': return 'Loja';
      case 'vt_inconsistente': return 'VT';
      case 'dados_incompletos': return 'Incompleto';
      case 'duplicado': return 'Duplicado';
    }
  };

  const inconsistenciasAlta = inconsistencias.filter(i => i.severidade === 'alta');
  const inconsistenciasMedia = inconsistencias.filter(i => i.severidade === 'media');
  const inconsistenciasBaixa = inconsistencias.filter(i => i.severidade === 'baixa');

  const displayInconsistencias = isExpanded 
    ? inconsistencias 
    : inconsistencias.slice(0, maxItems);

  if (compact) {
    return (
      <div className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4",
        className
      )}>
        <Alert variant={hasInconsistencias ? "destructive" : "default"} className="shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {hasInconsistencias ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <div>
                <AlertTitle className="text-sm">
                  {hasInconsistencias 
                    ? `${inconsistencias.length} inconsistência(s)` 
                    : 'Dados validados'}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {hasInconsistencias 
                    ? `${profissionaisComProblemas} profissional(is) afetado(s)`
                    : 'Todos os dados estão consistentes'}
                </AlertDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <Alert 
      variant={hasInconsistencias ? "destructive" : "default"} 
      className={cn("mb-4", className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {hasInconsistencias ? (
            <AlertTriangle className="h-5 w-5 mt-0.5" />
          ) : (
            <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />
          )}
          
          <div className="space-y-2">
            <AlertTitle className="text-base">
              {hasInconsistencias 
                ? 'Inconsistências Detectadas nos Dados' 
                : 'Dados Validados com Sucesso'}
            </AlertTitle>
            
            <AlertDescription>
              {hasInconsistencias ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {inconsistenciasAlta.length > 0 && (
                      <Badge variant="destructive">
                        {inconsistenciasAlta.length} Alta
                      </Badge>
                    )}
                    {inconsistenciasMedia.length > 0 && (
                      <Badge variant="default" className="bg-orange-600">
                        {inconsistenciasMedia.length} Média
                      </Badge>
                    )}
                    {inconsistenciasBaixa.length > 0 && (
                      <Badge variant="secondary">
                        {inconsistenciasBaixa.length} Baixa
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">
                      {profissionaisComProblemas} de {totalProfissionais} profissionais afetados
                    </span>
                  </div>

                  <div className="space-y-1">
                    {displayInconsistencias.map((inc) => (
                      <div 
                        key={inc.id}
                        className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-background/50"
                      >
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getSeveridadeColor(inc.severidade))}
                        >
                          {getTipoLabel(inc.tipo)}
                        </Badge>
                        <span className="font-mono text-xs">{inc.matricula}</span>
                        <span className="truncate">{inc.nome}</span>
                        <span className="text-muted-foreground text-xs truncate flex-1">
                          {inc.mensagem}
                        </span>
                      </div>
                    ))}
                  </div>

                  {inconsistencias.length > maxItems && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="h-6 text-xs"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Mostrar menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Ver mais {inconsistencias.length - maxItems} inconsistências
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <span>
                  Todos os {totalProfissionais} profissionais ativos estão com dados consistentes.
                </span>
              )}
            </AlertDescription>

            {ultimaValidacao && (
              <p className="text-xs text-muted-foreground">
                Última validação: {ultimaValidacao.toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => validarDados()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>
    </Alert>
  );
};

// Componente para validação inline de um profissional específico
interface ProfissionalValidationBadgeProps {
  matricula: string;
  showDetails?: boolean;
}

export const ProfissionalValidationBadge = ({ 
  matricula, 
  showDetails = false 
}: ProfissionalValidationBadgeProps) => {
  const { validarProfissional } = useDataValidation();
  const [inconsistencias, setInconsistencias] = useState<DataInconsistency[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validar = async () => {
      setIsLoading(true);
      const result = await validarProfissional(matricula);
      setInconsistencias(result);
      setIsLoading(false);
    };
    validar();
  }, [matricula, validarProfissional]);

  if (isLoading) return null;
  if (inconsistencias.length === 0) return null;

  const severidadeMax = inconsistencias.some(i => i.severidade === 'alta') 
    ? 'alta' 
    : inconsistencias.some(i => i.severidade === 'media') 
      ? 'media' 
      : 'baixa';

  const variant = severidadeMax === 'alta' 
    ? 'destructive' 
    : severidadeMax === 'media' 
      ? 'default' 
      : 'secondary';

  return (
    <div className="flex items-center gap-1">
      <Badge variant={variant} className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {inconsistencias.length} {inconsistencias.length === 1 ? 'problema' : 'problemas'}
      </Badge>
      {showDetails && (
        <span className="text-xs text-muted-foreground">
          {inconsistencias.map(i => i.campo).join(', ')}
        </span>
      )}
    </div>
  );
};
