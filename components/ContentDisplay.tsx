/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import type { DefinitionData } from '../services/geminiService';
import InteractiveText from './InteractiveText';

interface ContentDisplayProps {
  content: DefinitionData;
  onWordClick: (word: string) => void;
}

const InteractiveParagraph: React.FC<{
  text: string;
  onWordClick: (word: string) => void;
  isTourTarget?: boolean;
}> = ({ text, onWordClick, isTourTarget = false }) => {
  return (
    <p>
      <InteractiveText
        text={text}
        onWordClick={onWordClick}
        data-tour-id={isTourTarget ? 'interactive-word' : undefined}
      />
    </p>
  );
};


const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, onWordClick }) => {

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, concept: { title: string; description: string }) => {
    const data = {
      type: 'concept',
      content: concept
    };
    event.dataTransfer.setData('application/json', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'copy';
  };
  
  return (
    <div>
      <InteractiveParagraph text={content.summary} onWordClick={onWordClick} isTourTarget={true} />
      
      {content.key_concepts && content.key_concepts.length > 0 && (
        <div className="section">
          <h3>
            <InteractiveText text="Key Concepts" onWordClick={onWordClick} />
          </h3>
          {content.key_concepts.map((concept, index) => (
            <div 
              key={index} 
              className="concept"
              draggable="true"
              onDragStart={(e) => handleDragStart(e, concept)}
              data-tour-id={index === 0 ? 'key-concept' : undefined}
            >
              <h4>
                <InteractiveText text={concept.title} onWordClick={onWordClick} />
              </h4>
              <InteractiveParagraph text={concept.description} onWordClick={onWordClick} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentDisplay;