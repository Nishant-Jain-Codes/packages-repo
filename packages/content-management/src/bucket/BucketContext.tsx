import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BucketState {
  currentStep: string;
  isSidebarCollapsed: boolean;
  lob: string | null;
  [key: string]: any;
}

interface BucketContextType {
  state: BucketState;
  setCurrentStep: (step: string) => void;
  toggleSidebar: () => void;
  setLob: (lob: string) => void;
  nextStep: (steps: any[]) => void;
  resetContext: () => void;
}

const BucketContext = createContext<BucketContextType | undefined>(undefined);

export const useBucket = () => {
  const context = useContext(BucketContext);
  if (!context) {
    throw new Error('useBucket must be used within a BucketProvider');
  }
  return context;
};

interface BucketProviderProps {
  children: ReactNode;
}

export const BucketProvider: React.FC<BucketProviderProps> = ({ children }) => {
  const [state, setState] = useState<BucketState>({
    currentStep: 'manage-bucket',
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
      currentStep: 'manage-bucket',
      isSidebarCollapsed: false,
      lob: null,
    });
  };

  return (
    <BucketContext.Provider
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
    </BucketContext.Provider>
  );
};













