import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BlockState {
  currentStep: string;
  isSidebarCollapsed: boolean;
  lob: string | null;
  [key: string]: any;
}

interface BlockContextType {
  state: BlockState;
  setCurrentStep: (step: string) => void;
  toggleSidebar: () => void;
  setLob: (lob: string) => void;
  nextStep: (steps: any[]) => void;
  resetContext: () => void;
}

const BlockContext = createContext<BlockContextType | undefined>(undefined);

export const useBlock = () => {
  const context = useContext(BlockContext);
  if (!context) {
    throw new Error('useBlock must be used within a BlockProvider');
  }
  return context;
};

interface BlockProviderProps {
  children: ReactNode;
}

export const BlockProvider: React.FC<BlockProviderProps> = ({ children }) => {
  const [state, setState] = useState<BlockState>({
    currentStep: 'manage-blocks',
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
      currentStep: 'manage-blocks',
      isSidebarCollapsed: false,
      lob: null,
    });
  };

  return (
    <BlockContext.Provider
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
    </BlockContext.Provider>
  );
};













