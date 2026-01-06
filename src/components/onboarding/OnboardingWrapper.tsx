import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingTour } from './OnboardingTour';
import { WelcomeModal } from './WelcomeModal';

export function OnboardingWrapper() {
  const { showTour, showWelcome, startTour, completeTour, skipTour, dismissWelcome } = useOnboarding();

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
