/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';

interface TourStep {
  selector: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface FeatureTourProps {
  // FIX: Accept a readonly array to be compatible with `as const` types.
  steps: readonly TourStep[];
  onComplete: () => void;
}

const FeatureTour: React.FC<FeatureTourProps> = ({ steps, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  useLayoutEffect(() => {
    const targetElement = document.querySelector(currentStep.selector);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    } else {
        // If element not found, skip to next step
        handleNext();
    }
  }, [currentStepIndex, currentStep.selector]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!targetRect) {
    return null;
  }
  
  const tooltipStyle: React.CSSProperties = {};
  const tooltipMargin = 15;

  switch (currentStep.position) {
    case 'top':
      tooltipStyle.top = targetRect.top - tooltipMargin;
      tooltipStyle.left = targetRect.left + targetRect.width / 2;
      tooltipStyle.transform = 'translate(-50%, -100%)';
      break;
    case 'bottom':
      tooltipStyle.top = targetRect.bottom + tooltipMargin;
      tooltipStyle.left = targetRect.left + targetRect.width / 2;
      tooltipStyle.transform = 'translateX(-50%)';
      break;
    case 'left':
      tooltipStyle.top = targetRect.top + targetRect.height / 2;
      tooltipStyle.left = targetRect.left - tooltipMargin;
      tooltipStyle.transform = 'translate(-100%, -50%)';
      break;
    case 'right':
       tooltipStyle.top = targetRect.top + targetRect.height / 2;
       tooltipStyle.left = targetRect.right + tooltipMargin;
       tooltipStyle.transform = 'translateY(-50%)';
      break;
  }


  const highlightStyle: React.CSSProperties = {
    top: `${targetRect.top - 5}px`,
    left: `${targetRect.left - 5}px`,
    width: `${targetRect.width + 10}px`,
    height: `${targetRect.height + 10}px`,
  };

  return ReactDOM.createPortal(
    <div className="tour-overlay">
      <div className="tour-highlight-box" style={highlightStyle}></div>
      <div className="tour-tooltip" style={tooltipStyle}>
        <h4>{currentStep.title}</h4>
        <p>{currentStep.content}</p>
        <div className="tour-tooltip-footer">
          <span className="tour-tooltip-step">{currentStepIndex + 1} / {steps.length}</span>
          <div className="tour-tooltip-actions">
            <button onClick={handleSkip} className="tour-skip-button">Skip</button>
            <button onClick={handleNext} className="tour-next-button">
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FeatureTour;