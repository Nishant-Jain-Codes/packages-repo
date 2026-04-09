import React, { useEffect } from 'react';
import { useBucket } from './BucketContext';
import { BucketSidebar } from './BucketSidebar';
import { BUCKET_STEPS } from './constants';
import { useLocation } from 'react-router-dom';

const BucketPageInner: React.FC = () => {
  const { state, setLob, setCurrentStep } = useBucket();
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
    if (stateStep && BUCKET_STEPS.find(s => s.id === stateStep)) {
      setCurrentStep(stateStep);
    }
  }, [location.state, setCurrentStep]);

  const activeStep = BUCKET_STEPS.find(s => s.id === state.currentStep);
  const ActiveStepComponent = activeStep?.component || BUCKET_STEPS[0].component;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex w-full h-full" style={{ backgroundColor: '#f8fafc' }}>
        <BucketSidebar steps={BUCKET_STEPS} />
        <main className="flex-1 h-full overflow-auto">
          <ActiveStepComponent />
        </main>
      </div>
    </div>
  );
};

export const BucketPage: React.FC = () => {
  return <BucketPageInner />;
};













