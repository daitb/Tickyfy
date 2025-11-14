import { Check } from 'lucide-react';

interface Step {
  number: number;
  label: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step.number < currentStep
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : step.number === currentStep
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-white border-neutral-300 text-neutral-400'
              }`}>
                {step.number < currentStep ? (
                  <Check size={20} />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span className={`mt-2 text-sm absolute top-12 whitespace-nowrap ${
                step.number <= currentStep ? 'text-neutral-900' : 'text-neutral-400'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                step.number < currentStep ? 'bg-orange-500' : 'bg-neutral-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
