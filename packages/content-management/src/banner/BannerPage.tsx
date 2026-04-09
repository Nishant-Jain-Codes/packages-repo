import React, { useEffect } from 'react';
import { useBanner } from './BannerContext';
import { BannerSidebar } from './BannerSidebar';
import { BANNER_STEPS } from './constants';
import { useLocation } from 'react-router-dom';

const BannerPageInner: React.FC = () => {
  const { state, setLob, setCurrentStep } = useBanner();
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
    if (stateStep && BANNER_STEPS.find(s => s.id === stateStep)) {
      setCurrentStep(stateStep);
    }
  }, [location.state, setCurrentStep]);

  const activeStep = BANNER_STEPS.find(s => s.id === state.currentStep);
  const ActiveStepComponent = activeStep?.component || BANNER_STEPS[0].component;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex w-full h-full" style={{ backgroundColor: '#f8fafc' }}>
        <BannerSidebar steps={BANNER_STEPS} />
        <main className="flex-1 h-full overflow-auto">
          <ActiveStepComponent />
        </main>
      </div>
    </div>
  );
};

export const BannerPage: React.FC = () => {
  return <BannerPageInner />;
};







