import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface OnboardingContextType {
  showTour: boolean;
  showWelcome: boolean;
  hasSeenTour: boolean;
  startTour: () => void;
  completeTour: () => void;
  skipTour: () => void;
  resetTour: () => void;
  dismissWelcome: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showTour, setShowTour] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return localStorage.getItem('rh_onboarding_completed') === 'true';
  });

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setShowTour(true);
  }, []);

  const completeTour = useCallback(() => {
    setShowTour(false);
    setHasSeenTour(true);
    localStorage.setItem('rh_onboarding_completed', 'true');
  }, []);

  const skipTour = useCallback(() => {
    setShowTour(false);
    setShowWelcome(false);
    setHasSeenTour(true);
    localStorage.setItem('rh_onboarding_completed', 'true');
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem('rh_onboarding_completed');
    setHasSeenTour(false);
    setShowWelcome(true);
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    setHasSeenTour(true);
    localStorage.setItem('rh_onboarding_completed', 'true');
  }, []);

  // Auto-show welcome for new users
  useEffect(() => {
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour]);

  return (
    <OnboardingContext.Provider value={{
      showTour,
      showWelcome,
      hasSeenTour,
      startTour,
      completeTour,
      skipTour,
      resetTour,
      dismissWelcome
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
