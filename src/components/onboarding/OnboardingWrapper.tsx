import { useState, useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingTour } from './OnboardingTour';
import { WelcomeModal } from './WelcomeModal';
import { InitialSetupWizard } from './InitialSetupWizard';

export function OnboardingWrapper() {
  const { showTour, showWelcome, startTour, completeTour, skipTour, dismissWelcome } = useOnboarding();
  const { isAuthenticated, isLoading } = useAuth();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [hasSeenSetup, setHasSeenSetup] = useState(() => {
    return localStorage.getItem('rh_initial_setup_completed') === 'true';
  });

  // Show setup wizard after welcome modal for new users
  useEffect(() => {
    if (!hasSeenSetup && !showWelcome && !showTour && isAuthenticated && !isLoading) {
      // Small delay after welcome modal is dismissed
      const timer = setTimeout(() => {
        setShowSetupWizard(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenSetup, showWelcome, showTour, isAuthenticated, isLoading]);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    setHasSeenSetup(true);
    localStorage.setItem('rh_initial_setup_completed', 'true');
  };

  const handleSetupSkip = () => {
    setShowSetupWizard(false);
    setHasSeenSetup(true);
    localStorage.setItem('rh_initial_setup_completed', 'true');
  };

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

      {/* Initial Setup Wizard - shown after tour or when skipped */}
      <InitialSetupWizard
        open={showSetupWizard && !showWelcome && !showTour}
        onComplete={handleSetupComplete}
        onSkip={handleSetupSkip}
      />
    </>
  );
}
