import React, { useEffect } from 'react';
import { useBlock } from './BlockContext';
import { BlockSidebar } from './BlockSidebar';
import { BLOCK_STEPS } from './constants';
import { useLocation } from 'react-router-dom';

const BlockPageInner: React.FC = () => {
  const { state, setLob, setCurrentStep } = useBlock();
  const location = useLocation();

  useEffect(() => {
    // Set a default LOB for now
    if (!state.lob) {
      setLob('Default LOB');
    }
  }, []);

  useEffect(() => {
    // Check if navigation state contains a step to navigate to
    const stateStep = (location.state as any)?.step;
    if (stateStep && BLOCK_STEPS.find(s => s.id === stateStep)) {
      setCurrentStep(stateStep);
    }
  }, [location.state, setCurrentStep]);

  const activeStep = BLOCK_STEPS.find(s => s.id === state.currentStep);
  const ActiveStepComponent = activeStep?.component || BLOCK_STEPS[0].component;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex w-full h-full" style={{ backgroundColor: '#f8fafc' }}>
        <BlockSidebar steps={BLOCK_STEPS} />
        <main className="flex-1 h-full overflow-auto">
          <ActiveStepComponent />
        </main>
      </div>
    </div>
  );
};

export const BlockPage: React.FC = () => {
  return <BlockPageInner />;
};













