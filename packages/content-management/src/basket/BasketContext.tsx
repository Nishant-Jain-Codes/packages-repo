import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BasketState {
  currentStep: string;
  isSidebarCollapsed: boolean;
  lob: string | null;
  [key: string]: any;
}

interface BasketContextType {
  state: BasketState;
  setCurrentStep: (step: string) => void;
  toggleSidebar: () => void;
  setLob: (lob: string) => void;
  nextStep: (steps: any[]) => void;
  resetContext: () => void;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
};

interface BasketProviderProps {
  children: ReactNode;
}

export const BasketProvider: React.FC<BasketProviderProps> = ({ children }) => {
  const [state, setState] = useState<BasketState>({
    currentStep: 'manage-basket',
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
      currentStep: 'manage-basket',
      isSidebarCollapsed: false,
      lob: null,
    });
  };

  return (
    <BasketContext.Provider
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
    </BasketContext.Provider>
  );
};



