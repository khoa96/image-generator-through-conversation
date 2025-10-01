import React from 'react';
import { Step } from '../types';

interface StepIndicatorProps {
    currentStep: Step;
}

const StepItem: React.FC<{ step: number; label: string; isActive: boolean; isCompleted: boolean }> = ({ step, label, isActive, isCompleted }) => {
    const baseClasses = "w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all duration-300";
    const activeClasses = "bg-purple-600 text-white shadow-lg shadow-purple-600/50";
    const completedClasses = "bg-green-600 text-white";
    const inactiveClasses = "bg-gray-700 text-gray-400";

    const getStepClasses = () => {
        if (isActive) return activeClasses;
        if (isCompleted) return completedClasses;
        return inactiveClasses;
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`${baseClasses} ${getStepClasses()}`}>
                {isCompleted && !isActive ? '✔' : step}
            </div>
            <p className={`mt-2 text-sm font-medium ${isActive ? 'text-purple-400' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>{label}</p>
        </div>
    );
};

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    const steps = [
        { id: Step.DialogueInput, label: "Nhập Hội thoại" },
        { id: Step.SetupReview, label: "Thiết Lập & Phân Cảnh" },
        { id: Step.ReviewSelection, label: "Duyệt & Chọn Ảnh" },
    ];

    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <StepItem
                            step={step.id}
                            label={step.label}
                            isActive={currentStep === step.id}
                            isCompleted={currentStep > step.id}
                        />
                        {index < steps.length - 1 && (
                             <div className={`flex-1 h-1 mx-2 rounded ${currentStep > step.id + 1 ? 'bg-green-600' : 'bg-gray-700'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default StepIndicator;
