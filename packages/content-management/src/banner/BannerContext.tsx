import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BannerState {
  currentStep: string;
  isSidebarCollapsed: boolean;
  lob: string | null;
  [key: string]: any;
}

interface BannerContextType {
  state: BannerState;
  setCurrentStep: (step: string) => void;
  toggleSidebar: () => void;
  setLob: (lob: string) => void;
  nextStep: (steps: any[]) => void;
  resetContext: () => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export const useBanner = () => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
};

interface BannerProviderProps {
  children: ReactNode;
}

export const BannerProvider: React.FC<BannerProviderProps> = ({ children }) => {
  const [state, setState] = useState<BannerState>({
    currentStep: 'manage-banner',
    isSidebarCollapsed: false,
    lob: null,
  });

  const setCurrentStep = (step: string) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, isSidebarCollapsed: !prev.isSidebarCollapsed }));
  };

  const setLob = (lob: string) => {
    setState(prev => ({ ...prev, lob }));
  };

  const nextStep = (steps: any[]) => {
    const currentIndex = steps.findIndex(s => s.id === state.currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const resetContext = () => {
    setState({
      currentStep: 'manage-banner',
      isSidebarCollapsed: false,
      lob: null,
    });
  };

  return (
    <BannerContext.Provider
      value={{
        state,
        setCurrentStep,
        toggleSidebar,
        setLob,
        nextStep,
        resetContext,
      }}
    >
      {children}
    </BannerContext.Provider>
  );
};













