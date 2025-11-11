/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import type { DefinitionData, ComparisonData } from '../services/geminiService';

interface ContentDisplayProps {
  content: DefinitionData | ComparisonData;
  onWordClick: (word: string) => void;
}

const InteractiveParagraph: React.FC<{
  text: string;
  onWordClick: (word: string) => void;
}> = ({ text, onWordClick }) => {
  const words = text.split(/(\s+)/).filter(Boolean); // Keep whitespace for spacing

  return (
    <p>
      {words.map((word, index) => {
        if (/\S/.test(word)) { // Only make non-whitespace words clickable
          // Trim only leading/trailing punctuation to preserve internal characters (e.g., in "e.g." or "m/s^2")
          const cleanWord = word.replace(/^[.,!?;:()"']+|[.,!?;:()"']+$/g, '');
          if (cleanWord) {
            return (
              <button
                key={index}
                onClick={() => onWordClick(cleanWord)}
                className="interactive-word"
                aria-label={`Learn more about ${cleanWord}`}
              >
                {word}
              </button>
            );
          }
        }
        return <span key={index}>{word}</span>; // Render whitespace and punctuation as-is
      })}
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

  if (content.type === 'comparison') {
    return (
      <div>
        <InteractiveParagraph text={content.introduction} onWordClick={onWordClick} />

        {content.similarities?.length > 0 && (
          <div className="section">
            <h3>Similarities</h3>
            {content.similarities.map((item, index) => (
              <div 
                key={index} 
                className="concept"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, item)}
              >
                <h4>{item.title}</h4>
                <InteractiveParagraph text={item.description} onWordClick={onWordClick} />
              </div>
            ))}
          </div>
        )}
        
        {content.differences?.length > 0 && (
          <div className="section">
            <h3>Differences</h3>
            {content.differences.map((item, index) => (
              <div 
                key={index} 
                className="concept"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, item)}
              >
                <h4>{item.title}</h4>
                <InteractiveParagraph text={item.description} onWordClick={onWordClick} />
              </div>
            ))}
          </div>
        )}

        <div className="section">
          <h3>Conclusion</h3>
          <InteractiveParagraph text={content.conclusion} onWordClick={onWordClick} />
        </div>
      </div>
    );
  }
  
  // Standard definition view
  return (
    <div>
      <InteractiveParagraph text={content.summary} onWordClick={onWordClick} />
      
      {content.key_concepts && content.key_concepts.length > 0 && (
        <div className="section">
          <h3>Key Concepts</h3>
          {content.key_concepts.map((concept, index) => (
            <div 
              key={index} 
              className="concept"
              draggable="true"
              onDragStart={(e) => handleDragStart(e, concept)}
            >
              <h4>{concept.title}</h4>
              <InteractiveParagraph text={concept.description} onWordClick={onWordClick} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentDisplay;