import { useState } from 'react';
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

export default function SearchBar({ onGuessSubmit, gameStatus }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!playersData || playersData.length === 0) {
      console.warn("Search bar warning: players.json pool is empty!");
      return;
    }

    const cleanValue = value.toLowerCase().trim();
if (cleanValue.length > 0) {
      const scoredPlayers = [];

      playersData.forEach(player => {
        const playerName = player.name.toLowerCase();
        
        let matchType = 4; // 1 = Name Prefix, 2 = Name Substring, 3 = Fuzzy Name, 4 = Keywords, 5 = No Match

        // --- TIER 1a: NAME PREFIX MATCH ---
        if (playerName.startsWith(cleanValue)) {
          matchType = 1;
        } 
        // --- TIER 1b: NAME SUBSTRING MATCH ---
        else if (playerName.includes(cleanValue)) {
          matchType = 2;
        }
        
        // --- TIER 2: FUZZY DISTANCE NAME MATCHES ---
        if (matchType === 4) {
          const distance = getEditDistance(cleanValue, playerName);
          const maxAllowedDistance = cleanValue.length > 5 ? 3 : 2;
          if (distance <= maxAllowedDistance) {
            matchType = 3;
          }
        }

        // --- TIER 3: KEYWORDS / NICKNAMES ---
        if (matchType === 4 && Array.isArray(player.searchTerms)) {
          const keywordMatch = player.searchTerms.some(term => 
            term.toLowerCase().startsWith(cleanValue) || term.toLowerCase().includes(cleanValue)
          );
          if (keywordMatch) {
            matchType = 4;
          }
        }

        // If a valid match occurred, push it to our sorting matrix
        if (matchType < 5) {
          scoredPlayers.push({
            player,
            matchType,
            matchesPlayed: player.matches || 0
          });
        }
      });

      // --- ULTIMATE SEARCH SORTING PIPELINE ---
      scoredPlayers.sort((a, b) => {
        // 1. Sort strictly by Tier Category (Prefix > Substring > Fuzzy > Keywords)
        if (a.matchType !== b.matchType) {
          return a.matchType - b.matchType;
        }
        
        // 2. If they land in the same tier, popularity takes absolute priority
        return b.matchesPlayed - a.matchesPlayed;
      });

      const finalSuggestions = scoredPlayers.map(item => item.player).slice(0, 5);
      setSuggestions(finalSuggestions);
    } else {
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
        <ul style={{
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
        }}>
          {suggestions.map(player => (
            <li
              key={player.id}
              onClick={() => handleSelectPlayer(player)}
              style={{
                padding: '12px 15px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                fontSize: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
            >
              <div>
                <strong>{player.name}</strong>
                <span style={{ color: '#666', fontSize: '0.85rem', marginLeft: '8px' }}>
                  ({player.currentFranchise})
                </span>
              </div>
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                {player.matches} matches
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}