/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onRandom: () => void;
  isLoading: boolean;
  onTogglePinboard: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onRandom, isLoading, onTogglePinboard }) => {
  const [query, setQuery] = useState('');
  const [query2, setQuery2] = useState('');
  const [isCompareMode, setIsCompareMode] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    if (isCompareMode) {
      if (query.trim() && query2.trim()) {
        onSearch(`${query.trim()} vs. ${query2.trim()}`);
        setQuery('');
        setQuery2('');
      }
    } else {
      if (query.trim()) {
        onSearch(query.trim());
        setQuery('');
      }
    }
  };

  const toggleCompareMode = () => {
    setIsCompareMode(prev => !prev);
    setQuery2(''); // Clear second input when toggling
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form" role="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isCompareMode ? "Topic 1" : "Search"}
          className="search-input"
          aria-label={isCompareMode ? "First topic to compare" : "Search for a topic"}
          disabled={isLoading}
        />
        {isCompareMode && (
           <input
            type="text"
            value={query2}
            onChange={(e) => setQuery2(e.target.value)}
            placeholder="Topic 2"
            className="search-input"
            aria-label="Second topic to compare"
            disabled={isLoading}
            style={{ marginLeft: '1rem' }}
          />
        )}
      </form>
       <button onClick={toggleCompareMode} className="utility-button" disabled={isLoading}>
        {isCompareMode ? 'Cancel' : 'Compare'}
      </button>
      <button onClick={onRandom} className="utility-button" disabled={isLoading}>
        Random
      </button>
      <button onClick={onTogglePinboard} className="utility-button" disabled={isLoading}>
        Pinboard
      </button>
    </div>
  );
};

export default SearchBar;