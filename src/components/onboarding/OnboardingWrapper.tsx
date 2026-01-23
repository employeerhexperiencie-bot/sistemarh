import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingTour } from './OnboardingTour';
import { WelcomeModal } from './WelcomeModal';

export function OnboardingWrapper() {
  const { showTour, showWelcome, startTour, completeTour, skipTour, dismissWelcome } = useOnboarding();
  const { isAuthenticated, isLoading } = useAuth();

  // Não mostrar onboarding se não estiver autenticado ou ainda carregando
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Welcome Modal */}
      <WelcomeModal 
        open={showWelcome} 
        onStartTour={startTour} 
        onSkip={dismissWelcome} 
      />

      {/* Tour Overlay */}
      {showTour && (
        <OnboardingTour 
          onComplete={completeTour} 
          onSkip={skipTour} 
        />
      )}
    </>
  );
}
