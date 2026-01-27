import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Store, Users, Settings, Bell, Calculator, 
  ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
  Sparkles, SkipForward
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  checkComplete: () => Promise<{ complete: boolean; count: number; message: string }>;
  actionLabel: string;
  skipLabel?: string;
}

const setupSteps: SetupStep[] = [
  {
    id: 'lojas',
    title: 'Cadastrar Lojas',
    description: 'Comece cadastrando as lojas/unidades da empresa. Cada profissional será vinculado a uma loja.',
    icon: Store,
    route: '/cadastro-lojas',
    actionLabel: 'Cadastrar Lojas',
    skipLabel: 'Já tenho lojas cadastradas',
    checkComplete: async () => {
      const { count } = await supabase.from('lojas').select('*', { count: 'exact', head: true });
      return {
        complete: (count || 0) > 0,
        count: count || 0,
        message: (count || 0) > 0 ? `${count} loja(s) cadastrada(s)` : 'Nenhuma loja cadastrada'
      };
    }
  },
  {
    id: 'profissionais',
    title: 'Cadastrar Profissionais',
    description: 'Cadastre os funcionários manualmente ou importe de uma planilha Excel.',
    icon: Users,
    route: '/cadastro-profissionais',
    actionLabel: 'Cadastrar Profissionais',
    skipLabel: 'Já tenho profissionais',
    checkComplete: async () => {
      const { count } = await supabase.from('profissionais').select('*', { count: 'exact', head: true }).eq('status', 'ativo');
      return {
        complete: (count || 0) > 0,
        count: count || 0,
        message: (count || 0) > 0 ? `${count} profissional(is) ativo(s)` : 'Nenhum profissional cadastrado'
      };
    }
  },
  {
    id: 'configuracoes',
    title: 'Configurar RH',
    description: 'Defina datas de pagamento, escalas, valores de benefícios e políticas da empresa.',
    icon: Settings,
    route: '/configuracoes',
    actionLabel: 'Configurar',
    skipLabel: 'Usar padrões',
    checkComplete: async () => {
      const { count } = await supabase.from('configuracoes_sistema').select('*', { count: 'exact', head: true });
      return {
        complete: (count || 0) > 0,
        count: count || 0,
        message: (count || 0) > 0 ? 'Configurado' : 'Usando valores padrão'
      };
    }
  },
  {
    id: 'pendencias',
    title: 'Revisar Pendências',
    description: 'Verifique alertas de ASO, férias vencidas, CPFs ausentes e outras pendências.',
    icon: Bell,
    route: '/alertas',
    actionLabel: 'Ver Alertas',
    skipLabel: 'Ver depois',
    checkComplete: async () => {
      const { count } = await supabase.from('alertas_sistema').select('*', { count: 'exact', head: true }).eq('lido', false);
      return {
        complete: (count || 0) === 0,
        count: count || 0,
        message: (count || 0) === 0 ? 'Sem pendências' : `${count} alerta(s) ativo(s)`
      };
    }
  },
  {
    id: 'simulacao',
    title: 'Simular Primeira Folha',
    description: 'Faça uma simulação da folha de pagamento para validar se tudo está correto.',
    icon: Calculator,
    route: '/simulador-folha',
    actionLabel: 'Simular Folha',
    skipLabel: 'Fazer depois',
    checkComplete: async () => {
      return {
        complete: false, // Always show as pending until they actually simulate
        count: 0,
        message: 'Simulação pendente'
      };
    }
  }
];

interface InitialSetupWizardProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function InitialSetupWizard({ open, onComplete, onSkip }: InitialSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState<Record<string, { complete: boolean; count: number; message: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const step = setupSteps[currentStep];
  const progress = ((currentStep + 1) / setupSteps.length) * 100;
  const isFirst = currentStep === 0;
  const isLast = currentStep === setupSteps.length - 1;

  // Check status of all steps
  useEffect(() => {
    const checkAllSteps = async () => {
      setIsLoading(true);
      const status: Record<string, { complete: boolean; count: number; message: string }> = {};
      
      for (const s of setupSteps) {
        try {
          status[s.id] = await s.checkComplete();
        } catch (error) {
          status[s.id] = { complete: false, count: 0, message: 'Erro ao verificar' };
        }
      }
      
      setStepStatus(status);
      setIsLoading(false);
    };

    if (open) {
      checkAllSteps();
    }
  }, [open]);

  const handleGoToStep = () => {
    navigate(step.route);
    onSkip(); // Close wizard when navigating
  };

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completedSteps = Object.values(stepStatus).filter(s => s.complete).length;
  const Icon = step.icon;
  const currentStatus = stepStatus[step.id];

  return (
    <Dialog open={open} onOpenChange={() => onSkip()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-background/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Configuração Inicial</h2>
              <p className="text-sm opacity-80">Prepare seu sistema de RH</p>
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-background/20" />
          <div className="flex justify-between mt-2 text-xs opacity-80">
            <span>Passo {currentStep + 1} de {setupSteps.length}</span>
            <span>{completedSteps}/{setupSteps.length} concluídos</span>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex border-b">
          {setupSteps.map((s, i) => {
            const StepIcon = s.icon;
            const status = stepStatus[s.id];
            const isActive = i === currentStep;
            const isPast = i < currentStep;
            
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "flex-1 py-3 px-2 text-center transition-all border-b-2",
                  isActive ? "border-primary bg-primary/5" : "border-transparent",
                  status?.complete ? "text-success" : "text-muted-foreground"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  {status?.complete ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <StepIcon className={cn("h-4 w-4", isActive && "text-primary")} />
                  )}
                  <span className={cn(
                    "text-[10px] font-medium truncate max-w-full",
                    isActive && "text-primary"
                  )}>
                    {s.title.split(' ')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Verificando status...
            </div>
          ) : (
            <div className="space-y-5">
              {/* Step Icon & Title */}
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  currentStatus?.complete ? "bg-success/10" : "bg-primary/10"
                )}>
                  <Icon className={cn(
                    "h-6 w-6",
                    currentStatus?.complete ? "text-success" : "text-primary"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    {currentStatus?.complete && (
                      <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>

              {/* Status Card */}
              <Card className={cn(
                "border",
                currentStatus?.complete ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
              )}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentStatus?.complete ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                    <span className="text-sm font-medium">{currentStatus?.message}</span>
                  </div>
                  {currentStatus?.count > 0 && !currentStatus?.complete && (
                    <Badge variant="secondary">{currentStatus.count}</Badge>
                  )}
                </CardContent>
              </Card>

              {/* Skip Info */}
              {!currentStatus?.complete && (
                <Alert className="border-muted bg-muted/30">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Você pode pular esta etapa. O sistema funcionará normalmente, 
                    mas você verá alertas informativos até que ela seja concluída.
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleGoToStep} 
                  className="flex-1 gap-2"
                  variant={currentStatus?.complete ? "outline" : "default"}
                >
                  {step.actionLabel}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="border-t p-4 flex items-center justify-between bg-muted/30">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirst}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground gap-1"
          >
            <SkipForward className="h-4 w-4" />
            Pular configuração
          </Button>

          <Button
            onClick={handleNext}
            className={cn(
              "gap-2",
              isLast && "bg-success hover:bg-success/90"
            )}
          >
            {isLast ? (
              <>
                Concluir
                <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
