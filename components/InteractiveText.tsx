/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface InteractiveTextProps {
  text: string;
  onWordClick: (word: string) => void;
  'data-tour-id'?: string;
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ text, onWordClick, 'data-tour-id': tourIdPrefix }) => {
    const words = text.split(/(\s+)/).filter(Boolean);
    let wordMarkedForTour = false;

    return (
        <>
        {words.map((word, index) => {
            if (/\S/.test(word)) { // Only make non-whitespace words clickable
                // Trim only leading/trailing punctuation
                const cleanWord = word.replace(/^[.,!?;:()"']+|[.,!?;:()"']+$/g, '');
                
                let tourId;
                if (tourIdPrefix && !wordMarkedForTour && cleanWord) {
                    tourId = tourIdPrefix;
                    wordMarkedForTour = true;
                }

                if (cleanWord) {
                    return (
                    <button
                        key={index}
                        onClick={() => onWordClick(cleanWord)}
                        className="interactive-word"
                        aria-label={`Learn more about ${cleanWord}`}
                        data-tour-id={tourId}
                    >
                        {word}
                    </button>
                    );
                }
            }
            // Render whitespace and punctuation-only 'words' as-is
            return <span key={index}>{word}</span>;
        })}
        </>
    );
};

export default InteractiveText;
