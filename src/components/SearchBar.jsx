import { useState, useEffect, useRef, useCallback } from 'react';
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

// Debounce hook — prevents search from running on every single keystroke
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// Shorten role names for display in the dropdown
const formatRole = (role) => {
  if (!role) return '';
  return role
    .replace(/Bowling Allrounder/gi, 'Bowling AR')
    .replace(/Batting Allrounder/gi, 'Batting AR')
    .replace(/Wicketkeeper/gi, 'WK')
    .replace(/Top-Order Batter/gi, 'Top Order')
    .replace(/Middle-Order Batter/gi, 'Mid Order')
    .replace(/Batter/gi, 'Batter');
};

export default function SearchBar({ onGuessSubmit, gameStatus, guessedPlayers = [] }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce by 120ms — imperceptible to users, saves a lot of work
  const debouncedQuery = useDebounce(query, 120);

  // Reset active index whenever suggestions change
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions]);

  // Scroll active item into view
  useEffect(() => {
    if (activeSuggestionIndex >= 0 && dropdownRef.current) {
      const activeEl = dropdownRef.current.children[activeSuggestionIndex];
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeSuggestionIndex]);

  // Run the actual search against the debounced value
  useEffect(() => {
    const cleanValue = debouncedQuery.toLowerCase().trim();
    if (cleanValue.length === 0) {
      setSuggestions([]);
      return;
    }

    const guessedIds = new Set(guessedPlayers.map(p => String(p.id)));
    const scoredPlayers = [];

    playersData.forEach(player => {
      if (guessedIds.has(String(player.id))) return;

      const playerName = player.name.toLowerCase();
      let matchType = 5;

      if (playerName.startsWith(cleanValue)) {
        matchType = 1;
      } else if (playerName.includes(cleanValue)) {
        matchType = 2;
      }

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

    setSuggestions(scoredPlayers.map(item => item.player).slice(0, 6));
  }, [debouncedQuery, guessedPlayers]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSuggestions([]);
      return;
    }
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev === suggestions.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        handleSelectPlayer(suggestions[activeSuggestionIndex]);
      }
    }
  };

  const handleSelectPlayer = useCallback((player) => {
    onGuessSubmit(player);
    setQuery('');
    setSuggestions([]);
    // Return focus to input so the user can immediately type again
    inputRef.current?.focus();
  }, [onGuessSubmit]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.closest('[data-searchbar]')?.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      data-searchbar
      style={{ position: 'relative', flexGrow: 1, width: '100%', fontFamily: 'var(--heading2), sans-serif' }}
    >
      {/* Input wrapper */}
      <div className="input-wrapper hoverable-menu search-input-wrapper">
        <label htmlFor="player-name-input" className="question-mark">?</label>
        <label htmlFor="player-name-input" className="sr-only">Enter a player's name to guess:</label>
        <input
          id="player-name-input"
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls="suggestions-listbox"
          aria-activedescendant={activeSuggestionIndex >= 0 ? `suggestion-${activeSuggestionIndex}` : undefined}
          autoComplete="off"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={gameStatus !== 'playing'}
          placeholder={gameStatus === 'playing' ? 'Guess a player...' : 'Game Over!'}
        />
      </div>

      {/* Dropdown */}
      {suggestions.length > 0 && (
        <ul
          id="suggestions-listbox"
          role="listbox"
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--white)',
            border: '3px solid var(--dark)',
            boxShadow: '3px 3px 0px var(--dark)',
            listStyle: 'none',
            padding: 0,
            margin: '5px 0 0 0',
            zIndex: 999,
            textAlign: 'left',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((player, idx) => {
            const isHighlighted = idx === activeSuggestionIndex;
            const roleLabel = formatRole(player.role);
            const teamLabel = player.currentFranchise || '';

            return (
              <li
                key={player.id}
                id={`suggestion-${idx}`}
                role="option"
                aria-selected={isHighlighted}
                onClick={() => handleSelectPlayer(player)}
                onMouseEnter={() => setActiveSuggestionIndex(idx)}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderBottom: '2px solid var(--dark)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: isHighlighted ? 'var(--biege)' : 'var(--white)',
                  color: 'var(--dark)',
                  transition: 'background-color 0.08s',
                }}
              >
                {/* Name */}
                <span style={{ fontFamily: 'sans-serif', fontSize: '1.1rem', fontWeight: 'bold', flexShrink: 0 }}>
                  {player.name}
                </span>

                {/* Team + Role pills — the key UX improvement: player context at a glance */}
                <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {teamLabel && (
                    <span style={{
                      fontSize: '0.78rem',
                      fontFamily: 'sans-serif',
                      fontWeight: '600',
                      padding: '2px 7px',
                      border: '1.5px solid var(--dark)',
                      borderRadius: '3px',
                      backgroundColor: 'var(--white)',
                      color: 'var(--dark)',
                      whiteSpace: 'nowrap',
                    }}>
                      {teamLabel}
                    </span>
                  )}
                  {roleLabel && (
                    <span style={{
                      fontSize: '0.78rem',
                      fontFamily: 'sans-serif',
                      fontWeight: '500',
                      padding: '2px 7px',
                      border: '1.5px dashed var(--dark)',
                      borderRadius: '3px',
                      color: 'var(--dark)',
                      whiteSpace: 'nowrap',
                      opacity: 0.75,
                    }}>
                      {roleLabel}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
