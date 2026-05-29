import { useState, useEffect, useRef } from 'react';
import playersData from '../data/players.json';

// --- CLEAN LEVENSHTEIN DISTANCE ALGORITHM ---
const getEditDistance = (str1, str2) => {
  const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return track[str2.length][str1.length];
};

export default function SearchBar({ onGuessSubmit, gameStatus, guessedPlayers = [] }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Reset index whenever suggestions change
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions]);

  // Scroll active item into view if it goes past dropdown bounds
  useEffect(() => {
    if (activeSuggestionIndex >= 0 && dropdownRef.current) {
      const activeEl = dropdownRef.current.children[activeSuggestionIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeSuggestionIndex]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    const cleanValue = value.toLowerCase().trim();

    if (cleanValue.length > 0) {
      const scoredPlayers = [];
      const guessedIds = new Set(guessedPlayers.map(p => String(p.id)));

      playersData.forEach(player => {
        if (guessedIds.has(String(player.id))) {
          return; 
        }

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
          if (distance <= maxAllowedDistance) {
            matchType = 3;
          }
        }

        if (matchType === 5 && Array.isArray(player.searchTerms)) {
          const keywordMatch = player.searchTerms.some(term => 
            term.toLowerCase().startsWith(cleanValue) || term.toLowerCase().includes(cleanValue)
          );
          if (keywordMatch) {
            matchType = 4;
          }
        }

        if (matchType < 5) {
          scoredPlayers.push({
            player,
            matchType,
            matchesPlayed: player.matches || 0
          });
        }
      });

      scoredPlayers.sort((a, b) => {
        if (a.matchType !== b.matchType) {
          return a.matchType - b.matchType;
        }
        return b.matchesPlayed - a.matchesPlayed;
      });

      const finalSuggestions = scoredPlayers.map(item => item.player).slice(0, 5);
      setSuggestions(finalSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  // --- KEYBOARD ARROW & ENTER INTERCEPT HANDLER ---
  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault(); // Prevents cursor from leaping around text input
      setActiveSuggestionIndex((prevIndex) => 
        prevIndex === suggestions.length - 1 ? 0 : prevIndex + 1
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prevIndex) => 
        prevIndex <= 0 ? suggestions.length - 1 : prevIndex - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        handleSelectPlayer(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  const handleSelectPlayer = (player) => {
    onGuessSubmit(player); 
    setQuery('');          
    setSuggestions([]);    
  };

  return (
    <div style={{ position: 'relative', maxWidth: '400px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={gameStatus !== 'playing'}
        placeholder={gameStatus === 'playing' ? "Type 'gaikwad', 'dhoni', 'brevis'..." : "Game Over!"}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '1.1rem',
          border: '2px solid #000',
          borderRadius: '4px',
          outline: 'none',
          boxSizing: 'border-box',
          backgroundColor: gameStatus !== 'playing' ? '#f0f0f0' : '#fff'
        }}
      />
      
      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <ul 
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '2px solid #000',
            borderRadius: '4px',
            listStyle: 'none',
            padding: 0,
            margin: '5px 0 0 0',
            zIndex: 999,
            textAlign: 'left',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {suggestions.map((player, idx) => {
            const isHighlighted = idx === activeSuggestionIndex;
            return (
              <li
                key={player.id}
                onClick={() => handleSelectPlayer(player)}
                onMouseEnter={() => setActiveSuggestionIndex(idx)}
                style={{
                  padding: '12px 15px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  // Highlight logic merges keyboard focus and mouse hover styles flawlessly
                  backgroundColor: isHighlighted ? '#e5e7eb' : '#fff' 
                }}
              >
                <div>
                  <strong>{player.name}</strong>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}