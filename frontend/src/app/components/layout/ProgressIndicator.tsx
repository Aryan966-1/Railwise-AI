import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useLocation } from 'react-router';

const steps = [
  { id: 1, label: 'Search', path: '/' },
  { id: 2, label: 'Select Train', path: '/trains' },
  { id: 3, label: 'Choose Seats', path: '/seats' },
  { id: 4, label: 'Passengers', path: '/passengers' },
  { id: 5, label: 'Payment', path: '/payment' },
  { id: 6, label: 'Confirmed', path: '/confirmation' }
];

export function ProgressIndicator() {
  const location = useLocation();
  
  const currentStepIndex = steps.findIndex(step => step.path === location.pathname);
  const currentStep = currentStepIndex === -1 ? 0 : currentStepIndex;

  if (location.pathname === '/') return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-muted/30 rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.2 : 1,
                    backgroundColor: isCompleted || isCurrent 
                      ? 'transparent' 
                      : 'var(--muted)'
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-lg shadow-lg z-10 border-2 transition-colors ${
                    isCompleted || isCurrent
                      ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-purple-600'
                      : 'border-muted bg-muted/30'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className={`text-sm ${isCurrent ? 'text-white' : 'text-muted-foreground'}`}>
                      {step.id}
                    </span>
                  )}
                </motion.div>
                <span className={`text-xs hidden sm:block ${
                  isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
