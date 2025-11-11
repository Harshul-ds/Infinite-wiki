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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || !query.trim()) return;
    onSearch(query.trim());
    setQuery('');
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form" role="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="search-input"
          aria-label="Search for a topic"
          disabled={isLoading}
          data-tour-id="search-input"
        />
      </form>
      <button onClick={onRandom} className="utility-button" disabled={isLoading} data-tour-id="random-button">
        Random
      </button>
      <button onClick={onTogglePinboard} className="utility-button" disabled={isLoading} data-tour-id="pinboard-button">
        Pinboard
      </button>
    </div>
  );
};

export default SearchBar;