import React, { useEffect } from 'react';
import { useBasket } from './BasketContext';
import { BasketSidebar } from './BasketSidebar';
import { BASKET_STEPS } from './constants';
import { useLocation } from 'react-router-dom';

const BasketPageInner: React.FC = () => {
  const { state, setLob, setCurrentStep } = useBasket();
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
    if (stateStep && BASKET_STEPS.find(s => s.id === stateStep)) {
      setCurrentStep(stateStep);
    }
  }, [location.state, setCurrentStep]);

  const activeStep = BASKET_STEPS.find(s => s.id === state.currentStep);
  const ActiveStepComponent = activeStep?.component || BASKET_STEPS[0].component;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex w-full h-full" style={{ backgroundColor: '#f8fafc' }}>
        <BasketSidebar steps={BASKET_STEPS} />
        <main className="flex-1 h-full overflow-auto">
          <ActiveStepComponent />
        </main>
      </div>
    </div>
  );
};

export const BasketPage: React.FC = () => {
  return <BasketPageInner />;
};













