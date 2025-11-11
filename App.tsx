/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { generateDefinition, generateAsciiArt, generateComparison, checkForAmbiguity, AsciiArtData, DefinitionData, ComparisonData, Meaning } from './services/geminiService';
import ContentDisplay from './components/ContentDisplay';
import SearchBar from './components/SearchBar';
import LoadingSkeleton from './components/LoadingSkeleton';
import AsciiArtDisplay from './components/AsciiArtDisplay';
import Breadcrumbs from './components/Breadcrumbs';
import TemperatureSlider from './components/TemperatureSlider';
import Pinboard from './components/Pinboard';
import Disambiguation from './components/Disambiguation';
import { PinnedItem } from './types';


// A curated list of "banger" words and phrases for the random button.
const PREDEFINED_WORDS = [
  // List 1
  'Balance', 'Harmony', 'Discord', 'Unity', 'Fragmentation', 'Clarity', 'Ambiguity', 'Presence', 'Absence', 'Creation', 'Destruction', 'Light', 'Shadow', 'Beginning', 'Ending', 'Rising', 'Falling', 'Connection', 'Isolation', 'Hope', 'Despair',
  // Complex phrases from List 1
  'Order and chaos', 'Light and shadow', 'Sound and silence', 'Form and formlessness', 'Being and nonbeing', 'Presence and absence', 'Motion and stillness', 'Unity and multiplicity', 'Finite and infinite', 'Sacred and profane', 'Memory and forgetting', 'Question and answer', 'Search and discovery', 'Journey and destination', 'Dream and reality', 'Time and eternity', 'Self and other', 'Known and unknown', 'Spoken and unspoken', 'Visible and invisible',
  // List 2
  'Zigzag', 'Waves', 'Spiral', 'Bounce', 'Slant', 'Drip', 'Stretch', 'Squeeze', 'Float', 'Fall', 'Spin', 'Melt', 'Rise', 'Twist', 'Explode', 'Stack', 'Mirror', 'Echo', 'Vibrate',
  // List 3
  'Gravity', 'Friction', 'Momentum', 'Inertia', 'Turbulence', 'Pressure', 'Tension', 'Oscillate', 'Fractal', 'Quantum', 'Entropy', 'Vortex', 'Resonance', 'Equilibrium', 'Centrifuge', 'Elastic', 'Viscous', 'Refract', 'Diffuse', 'Cascade', 'Levitate', 'Magnetize', 'Polarize', 'Accelerate', 'Compress', 'Undulate',
  // List 4
  'Liminal', 'Ephemeral', 'Paradox', 'Zeitgeist', 'Metamorphosis', 'Synesthesia', 'Recursion', 'Emergence', 'Dialectic', 'Apophenia', 'Limbo', 'Flux', 'Sublime', 'Uncanny', 'Palimpsest', 'Chimera', 'Void', 'Transcend', 'Ineffable', 'Qualia', 'Gestalt', 'Simulacra', 'Abyssal',
  // List 5
  'Existential', 'Nihilism', 'Solipsism', 'Phenomenology', 'Hermeneutics', 'Deconstruction', 'Postmodern', 'Absurdism', 'Catharsis', 'Epiphany', 'Melancholy', 'Nostalgia', 'Longing', 'Reverie', 'Pathos', 'Ethos', 'Logos', 'Mythos', 'Anamnesis', 'Intertextuality', 'Metafiction', 'Stream', 'Lacuna', 'Caesura', 'Enjambment'
];
const UNIQUE_WORDS = [...new Set(PREDEFINED_WORDS)];


/**
 * Creates a simple ASCII art bounding box as a fallback.
 * @param topic The text to display inside the box.
 * @returns An AsciiArtData object with the generated art.
 */
const createFallbackArt = (topic: string): AsciiArtData => {
  const displayableTopic = topic.length > 20 ? topic.substring(0, 17) + '...' : topic;
  const paddedTopic = ` ${displayableTopic} `;
  const topBorder = `┌${'─'.repeat(paddedTopic.length)}┐`;
  const middle = `│${paddedTopic}│`;
  const bottomBorder = `└${'─'.repeat(paddedTopic.length)}┘`;
  return {
    art: `${topBorder}\n${middle}\n${bottomBorder}`
  };
};

const App: React.FC = () => {
  const [history, setHistory] = useState<string[]>(['Hypertext']);
  const [content, setContent] = useState<DefinitionData | ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<AsciiArtData | null>(null);
  const [temperature, setTemperature] = useState<number>(0.4); // 0.1=Factual, 1.0=Creative
  const [ambiguityOptions, setAmbiguityOptions] = useState<Meaning[] | null>(null);
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [isPinboardVisible, setIsPinboardVisible] = useState(false);

  const currentTopic = history[history.length - 1];

  useEffect(() => {
    if (!currentTopic) return;

    let isCancelled = false;
    const isComparison = currentTopic.toLowerCase().includes(' vs. ');

    const fetchContent = async () => {
      // Set initial state for a clean page load
      setIsLoading(true);
      setError(null);
      setContent(null);
      setAsciiArt(null);
      setAmbiguityOptions(null);

      try {
        // Step 1: Check for ambiguity (unless it's a comparison)
        if (!isComparison) {
          const ambiguityData = await checkForAmbiguity(currentTopic, temperature);
          if (!isCancelled && ambiguityData.is_ambiguous && ambiguityData.meanings?.length) {
            setAmbiguityOptions(ambiguityData.meanings);
            setIsLoading(false);
            return; // Stop processing, wait for user input
          }
        }
        
        // Step 2: Fetch content and art
        // Kick off ASCII art generation, but don't wait for it.
        generateAsciiArt(currentTopic)
          .then(art => {
            if (!isCancelled) setAsciiArt(art);
          })
          .catch(err => {
            if (!isCancelled) {
              console.error("Failed to generate ASCII art:", err);
              setAsciiArt(createFallbackArt(currentTopic));
            }
          });

        let data;
        if (isComparison) {
          const [topicA, topicB] = currentTopic.split(/ vs. /i);
          data = await generateComparison(topicA.trim(), topicB.trim(), temperature);
        } else {
          data = await generateDefinition(currentTopic, temperature);
        }
        
        if (!isCancelled) {
          setContent(data);
        }
      } catch (e: unknown) {
        if (!isCancelled) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
          setError(errorMessage);
          setContent(null);
          console.error(e);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchContent();
    
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTopic, temperature]);

  const handleTopicChange = useCallback((topic: string) => {
    const newTopic = topic.trim();
    if (newTopic && newTopic.toLowerCase() !== currentTopic.toLowerCase()) {
      setAmbiguityOptions(null); // Clear ambiguity when a new topic is chosen
      setHistory(prev => [...prev, newTopic]);
    }
  }, [currentTopic]);

  const handleRandom = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setContent(null);
    setAsciiArt(null);
    setAmbiguityOptions(null);

    const randomIndex = Math.floor(Math.random() * UNIQUE_WORDS.length);
    let randomWord = UNIQUE_WORDS[randomIndex];

    if (randomWord.toLowerCase() === currentTopic.toLowerCase()) {
      const nextIndex = (randomIndex + 1) % UNIQUE_WORDS.length;
      randomWord = UNIQUE_WORDS[nextIndex];
    }
    setHistory([randomWord]);
  }, [currentTopic]);

  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index < history.length - 1) {
      setHistory(prev => prev.slice(0, index + 1));
    }
  }, [history.length]);

  const addPinnedItem = (item: Omit<PinnedItem, 'id'>) => {
    setPinnedItems(prev => [...prev, { ...item, id: `item-${Date.now()}` }]);
    setIsPinboardVisible(true);
  };
  
  const updatePinnedItemPosition = (id: string, x: number, y: number) => {
    setPinnedItems(prev => prev.map(item => item.id === id ? { ...item, x, y } : item));
  };

  return (
    <div>
      <Breadcrumbs path={history} onNavigate={handleBreadcrumbClick} />
      <SearchBar 
        onSearch={handleTopicChange} 
        onRandom={handleRandom} 
        isLoading={isLoading}
        onTogglePinboard={() => setIsPinboardVisible(prev => !prev)}
      />
      <TemperatureSlider value={temperature} onChange={setTemperature} disabled={isLoading} />
      
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ letterSpacing: 'normal', textTransform: 'lowercase', fontWeight: 'bold' }}>
          infinite-wiki.app
        </h1>
        <p style={{ marginTop: '0.5rem', color: '#666' }}>
          An encyclopedia where every word is a hyperlink.
        </p>
        <AsciiArtDisplay artData={asciiArt} topic={currentTopic} />
      </header>
      
      <main>
        <div>
          <h2 style={{ marginBottom: '2rem', textTransform: 'capitalize' }}>
            {currentTopic}
          </h2>

          {error && (
            <div style={{ border: '1px solid #cc0000', padding: '1rem', color: '#cc0000' }}>
              <p style={{ margin: 0 }}>An Error Occurred</p>
              <p style={{ marginTop: '0.5rem', margin: 0 }}>{error}</p>
            </div>
          )}
          
          {isLoading && !content && !error && !ambiguityOptions && (
            <LoadingSkeleton />
          )}

          {ambiguityOptions && (
            <Disambiguation options={ambiguityOptions} onSelect={handleTopicChange} />
          )}

          {content && !error && !ambiguityOptions && (
             <ContentDisplay 
               content={content} 
               onWordClick={handleTopicChange} 
             />
          )}

          {!isLoading && !error && !content && !ambiguityOptions && (
            <div style={{ color: '#888', padding: '2rem 0' }}>
              <p>Content could not be generated.</p>
            </div>
          )}
        </div>
      </main>
      <Pinboard 
        isVisible={isPinboardVisible} 
        items={pinnedItems} 
        onAdd={addPinnedItem}
        onMove={updatePinnedItemPosition}
        onClose={() => setIsPinboardVisible(false)}
      />
    </div>
  );
};

export default App;