import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  X, ChevronRight, ChevronLeft, LayoutDashboard, Users, Calculator, 
  Bell, Plane, Heart, Banknote, FileText, Settings, Sparkles, CheckCircle2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  highlight?: string; // CSS selector to highlight
  position: 'center' | 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Sistema RH! 🎉',
    description: 'Este tour vai te apresentar as principais funcionalidades do sistema de gestão de pessoas. Vamos começar!',
    icon: Sparkles,
    route: '/',
    position: 'center'
  },
  {
    id: 'dashboard',
    title: 'Dashboard Principal',
    description: 'Aqui você tem uma visão geral de toda a operação: total de funcionários, folha de pagamento, benefícios e alertas importantes.',
    icon: LayoutDashboard,
    route: '/',
    position: 'center'
  },
  {
    id: 'alertas',
    title: 'Central de Alertas',
    description: 'Monitore vencimentos de ASO, férias, EPIs e empréstimos. Clique nos contadores para filtrar e resolver pendências rapidamente.',
    icon: Bell,
    route: '/alertas',
    position: 'center'
  },
  {
    id: 'fechamentos',
    title: 'Fechamentos de Folha',
    description: 'Visualize, edite e feche a folha de pagamento por loja com cálculos automáticos de VT, VR, descontos e adiantamentos.',
    icon: Calculator,
    route: '/fechamentos',
    position: 'center'
  },
  {
    id: 'profissionais',
    title: 'Cadastro de Profissionais',
    description: 'Gerencie todos os funcionários, seus dados pessoais, contratuais e benefícios. Importe dados do Excel ou cadastre manualmente.',
    icon: Users,
    route: '/cadastro-profissionais',
    position: 'center'
  },
  {
    id: 'ferias',
    title: 'Gestão de Férias',
    description: 'Controle períodos aquisitivos, programe férias e acompanhe quem está próximo de vencer o período.',
    icon: Plane,
    route: '/gestao-ferias',
    position: 'center'
  },
  {
    id: 'aso',
    title: 'Exames Ocupacionais (ASO)',
    description: 'Acompanhe vencimentos de exames admissionais, periódicos e demissionais. Receba alertas automáticos.',
    icon: Heart,
    route: '/gestao-aso',
    position: 'center'
  },
  {
    id: 'emprestimos',
    title: 'Gestão de Empréstimos',
    description: 'Controle empréstimos da empresa e consignados (CLT). Registre pagamentos, pause descontos e acompanhe histórico.',
    icon: Banknote,
    route: '/gestao-emprestimos',
    position: 'center'
  },
  {
    id: 'holerites',
    title: 'Holerites',
    description: 'Gere e visualize holerites de todos os funcionários. Exporte em PDF para envio ou arquivamento.',
    icon: FileText,
    route: '/holerites',
    position: 'center'
  },
  {
    id: 'final',
    title: 'Pronto para começar! ✨',
    description: 'Você conheceu as principais funcionalidades. Explore o menu lateral para acessar todos os módulos. Bom trabalho!',
    icon: CheckCircle2,
    route: '/fechamentos',
    position: 'center'
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  // Navigate to step's route when step changes
  useEffect(() => {
    if (step.route && location.pathname !== step.route) {
      setIsNavigating(true);
      navigate(step.route);
      // Small delay to let the page render
      setTimeout(() => setIsNavigating(false), 300);
    }
  }, [currentStep, step.route, navigate, location.pathname]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLast, onComplete]);

  const handlePrev = useCallback(() => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirst]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onSkip();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    }
  }, [handleNext, handlePrev, onSkip]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const Icon = step.icon;

  const getPositionClasses = () => {
    switch (step.position) {
      case 'top-right':
        return 'top-24 right-8';
      case 'bottom-right':
        return 'bottom-24 right-8';
      case 'top-left':
        return 'top-24 left-72';
      case 'bottom-left':
        return 'bottom-24 left-72';
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onSkip}
      />
      
      {/* Tour Card */}
      <Card 
        className={cn(
          "fixed z-[101] w-[420px] max-w-[90vw] shadow-2xl border-primary/20 animate-scale-in",
          getPositionClasses()
        )}
      >
        {/* Header with progress */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="text-xs">
              Passo {currentStep + 1} de {tourSteps.length}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        <CardContent className="p-6 pt-4">
          {/* Icon */}
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all",
            isLast ? "bg-success/10" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-7 w-7",
              isLast ? "text-success" : "text-primary"
            )} />
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold mb-2">{step.title}</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Navigation dots */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {tourSteps.map((_, i) => (
              <button
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentStep 
                    ? "w-6 bg-primary" 
                    : i < currentStep 
                      ? "bg-primary/50" 
                      : "bg-muted-foreground/30"
                )}
                onClick={() => setCurrentStep(i)}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={isFirst || isNavigating}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Pular tour
            </Button>

            <Button
              onClick={handleNext}
              disabled={isNavigating}
              className={cn(
                "gap-2",
                isLast && "bg-success hover:bg-success/90"
              )}
            >
              {isLast ? (
                <>
                  Começar
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

          {/* Keyboard shortcuts hint */}
          <p className="text-[10px] text-muted-foreground text-center mt-4">
            Use as setas ← → ou Enter para navegar • Esc para sair
          </p>
        </CardContent>
      </Card>
    </>
  );
}

// Hook to manage tour state
export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return localStorage.getItem('rh_onboarding_completed') === 'true';
  });

  const startTour = useCallback(() => {
    setShowTour(true);
  }, []);

  const completeTour = useCallback(() => {
    setShowTour(false);
    setHasSeenTour(true);
    localStorage.setItem('rh_onboarding_completed', 'true');
  }, []);

  const skipTour = useCallback(() => {
    setShowTour(false);
    setHasSeenTour(true);
    localStorage.setItem('rh_onboarding_completed', 'true');
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem('rh_onboarding_completed');
    setHasSeenTour(false);
  }, []);

  // Auto-start tour for new users
  useEffect(() => {
    if (!hasSeenTour) {
      // Small delay to let the app load
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour]);

  return {
    showTour,
    hasSeenTour,
    startTour,
    completeTour,
    skipTour,
    resetTour
  };
}
