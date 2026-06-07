import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import playersData from '../data/players.json';

// --- LEVENSHTEIN DISTANCE ---
const getEditDistance = (str1, str2) => {
  const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i++) track[0][i] = i;
  for (let j = 0; j <= str2.length; j++) track[j][0] = j;
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  return track[str2.length][str1.length];
};

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// forwardRef so mainPage can call searchBarRef.current.clear()
const SearchBar = forwardRef(function SearchBar(
  { onSuggestionsChange, gameStatus, guessedPlayers = [] },
  ref
) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 120);

  // Expose clear() to parent
  useImperativeHandle(ref, () => ({
    clear() {
      setQuery('');
      onSuggestionsChange([]);
      inputRef.current?.focus();
    }
  }));

  // Run search and bubble results up to mainPage
  useEffect(() => {
    const cleanValue = debouncedQuery.toLowerCase().trim();
    if (cleanValue.length === 0) {
      onSuggestionsChange([]);
      return;
    }

    const guessedIds = new Set(guessedPlayers.map(p => String(p.id)));
    const scoredPlayers = [];

    playersData.forEach(player => {
      if (guessedIds.has(String(player.id))) return;

      const playerName = player.name.toLowerCase();
      let matchType = 5;

      if (playerName.startsWith(cleanValue)) matchType = 1;
      else if (playerName.includes(cleanValue)) matchType = 2;

      if (matchType === 5) {
        const distance = getEditDistance(cleanValue, playerName);
        const maxAllowedDistance = cleanValue.length > 5 ? 3 : 2;
        if (distance <= maxAllowedDistance) matchType = 3;
      }

      if (matchType === 5 && Array.isArray(player.searchTerms)) {
        const keywordMatch = player.searchTerms.some(term =>
          term.toLowerCase().startsWith(cleanValue) || term.toLowerCase().includes(cleanValue)
        );
        if (keywordMatch) matchType = 4;
      }

      if (matchType < 5) {
        scoredPlayers.push({ player, matchType, matchesPlayed: player.matches || 0 });
      }
    });

    scoredPlayers.sort((a, b) => {
      if (a.matchType !== b.matchType) return a.matchType - b.matchType;
      return b.matchesPlayed - a.matchesPlayed;
    });

    onSuggestionsChange(scoredPlayers.map(item => item.player).slice(0, 6));
  }, [debouncedQuery, guessedPlayers, onSuggestionsChange]);

  return (
    <div style={{ flexGrow: 1, fontFamily: 'var(--heading), sans-serif' }}>
      <div className="input-wrapper hoverable-menu search-input-wrapper">
        <label htmlFor="player-name-input" className="question-mark">?</label>
        <label htmlFor="player-name-input" className="sr-only">Enter a player's name to guess:</label>
        <input
          id="player-name-input"
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={query.length > 0}
          aria-controls="suggestions-listbox"
          autoComplete="off"
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={gameStatus !== 'playing'}
          placeholder={gameStatus === 'playing' ? 'Guess a player...' : 'Game Over!'}
        />
      </div>
    </div>
  );
});

export default SearchBar;