/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef } from 'react';
import type { Meaning } from '../services/geminiService';

interface DisambiguationProps {
  options: Meaning[];
  onSelect: (topic: string) => void;
}

const Disambiguation: React.FC<DisambiguationProps> = ({ options, onSelect }) => {
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Automatically focus the first option when the component mounts for better accessibility.
    firstOptionRef.current?.focus();
  }, []);

  return (
    <div className="disambiguation-container">
      <h3>Which did you mean?</h3>
      <div>
        {options.map((option, index) => (
          <button 
            key={index} 
            ref={index === 0 ? firstOptionRef : null}
            onClick={() => onSelect(option.title)}
            className="disambiguation-option"
          >
            <strong>{option.title}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Disambiguation;