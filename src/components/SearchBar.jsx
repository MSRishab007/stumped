import { useState } from 'react';
import playersData from '../data/players.json';

export default function SearchBar({ onGuessSubmit, gameStatus }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // 1. Check if we have valid data in our JSON array first
    if (!playersData || playersData.length === 0) {
      console.warn("Search bar warning: players.json data pool is empty or missing!");
      return;
    }

    // 2. Start filtering if the user types 1 or more characters
    if (value.trim().length > 0) {
      const cleanValue = value.toLowerCase().trim();

      const filtered = playersData.filter(player => {
        const playerName = player.name.toLowerCase();
        
        return playerName.includes(cleanValue);
      });

      // Show top 5 matches max
      setSuggestions(filtered.slice(0, 5));
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
    <div style={{ position: 'relative', maxWidth: '400px', margin: '20px auto' }}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        disabled={gameStatus !== 'playing'}
        placeholder={gameStatus === 'playing' ? "Type 'honi', 'rat', 'ro'..." : "Game Over!"}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '1.1rem',
          border: '2px solid #000',
          borderRadius: '4px',
          outline: 'none',
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
          boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
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
              }}
            >
              <strong>{player.name}</strong> <span style={{ color: '#666', fontSize: '0.85rem' }}>({player.currentTeam})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}