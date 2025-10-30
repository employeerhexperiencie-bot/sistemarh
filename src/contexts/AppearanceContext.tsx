import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppearanceConfig {
  backgroundType: 'color' | 'image';
  backgroundColor: string;
  backgroundImage: string;
}

interface AppearanceContextType {
  config: AppearanceConfig;
  updateBackground: (type: 'color' | 'image', value: string) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const defaultConfig: AppearanceConfig = {
  backgroundType: 'color',
  backgroundColor: 'hsl(var(--background))',
  backgroundImage: '',
};

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppearanceConfig>(() => {
    const saved = localStorage.getItem('appearance-config');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem('appearance-config', JSON.stringify(config));
  }, [config]);

  const updateBackground = (type: 'color' | 'image', value: string) => {
    setConfig(prev => ({
      ...prev,
      backgroundType: type,
      ...(type === 'color' ? { backgroundColor: value } : { backgroundImage: value }),
    }));
  };

  return (
    <AppearanceContext.Provider value={{ config, updateBackground }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within AppearanceProvider');
  }
  return context;
}
