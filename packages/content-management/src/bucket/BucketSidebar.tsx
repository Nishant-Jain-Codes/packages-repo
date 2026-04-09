import React from 'react';
import { useBucket } from './BucketContext';
import { BucketStep } from './types';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import salescodeLogo from '../../../assets/salescode.png';

interface BucketSidebarProps {
  steps: BucketStep[];
}

export const BucketSidebar: React.FC<BucketSidebarProps> = ({ steps }) => {
  const { state, setCurrentStep, toggleSidebar, nextStep } = useBucket();

  const currentStepIndex = steps.findIndex(s => s.id === state.currentStep);
  const isOnLastStep = currentStepIndex === steps.length - 1;
  const isOnFirstStep = currentStepIndex === 0;

  const handleNext = () => {
    nextStep(steps);
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  return (
    <aside className={`h-screen border-r border-slate-200 bg-white transition-all duration-300 flex flex-col relative z-50 ${state.isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
      <div className="p-5 flex items-center justify-between">
        {!state.isSidebarCollapsed && <span className="font-bold text-slate-800">Bucket Management</span>}
        <div className="flex gap-1">
          <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            {state.isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      <div className="px-5 mb-6">
        {state.isSidebarCollapsed ? (
          <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src={salescodeLogo} 
              alt="Salescode" 
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LOB Profile</label>
            <div className="w-full p-2 text-xs font-bold border border-slate-200 bg-transparent rounded-lg flex items-center justify-between">
              <span className="truncate flex-1">{state.lob || 'Not selected'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2 scrollbar-hide">
        {steps.map((step, idx) => {
          const isActive = state.currentStep === step.id;
          const isDone = idx < currentStepIndex;
          const isLastStepInList = idx === steps.length - 1;
          
          return (
            <div key={step.id} onClick={() => setCurrentStep(step.id)} className="relative flex items-start cursor-pointer mb-8 group">
              {!isLastStepInList && (
                <div 
                  className="absolute left-4 top-8 w-[2px]"
                  style={{
                    height: 'calc(100% + 2rem)',
                    borderLeft: `2px dotted ${isDone ? '#3b82f6' : '#e2e8f0'}`,
                  }}
                />
              )}
              <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110' : isDone ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-400'}`}>
                {isDone ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{idx + 1}</span>}
              </div>
              {!state.isSidebarCollapsed && (
                <div className="ml-4 overflow-hidden">
                  <p className={`text-xs font-bold ${isActive ? 'text-blue-500' : 'text-slate-600'}`}>{step.title}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{step.subtitle}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-5 space-y-2 border-t border-slate-100">
        {state.isSidebarCollapsed ? (
          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={handleNext}
              disabled={isOnLastStep}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 text-white hover:bg-blue-600 disabled:hover:bg-blue-500"
              title="Continue"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={handlePrevious}
              disabled={isOnFirstStep}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:hover:bg-white"
              title="Back"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        ) : (
          <>
            <button 
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center justify-center" 
              disabled={isOnLastStep} 
              onClick={handleNext}
            >
              Continue <ChevronRight size={14} className="ml-2" />
            </button>
            <button 
              className="w-full py-2 px-4 border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm" 
              disabled={isOnFirstStep} 
              onClick={handlePrevious}
            >
              Back
            </button>
          </>
        )}
      </div>
    </aside>
  );
};