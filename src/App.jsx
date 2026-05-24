import { useState, useEffect } from 'react';
import { getDailyPlayerForDate } from './utils/dailyPlayer';
import { comparePlayers } from './utils/gameLogic';
import SearchBar from './components/SearchBar'; // <-- Import SearchBar

export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeDate, setActiveDate] = useState(todayStr);
  const targetPlayer = getDailyPlayerForDate(activeDate);

  const [guesses, setGuesses] = useState(() => {
    const savedState = localStorage.getItem(`ipl-legends-game-${activeDate}`);
    if (savedState) return JSON.parse(savedState).guesses;
    return [];
  });

  const [gameStatus, setGameStatus] = useState(() => {
    const savedState = localStorage.getItem(`ipl-legends-game-${activeDate}`);
    if (savedState) return JSON.parse(savedState).gameStatus;
    return 'playing';
  });

  // Sync state changes over to localStorage automatically
  useEffect(() => {
    const stateToSave = { date: activeDate, gameStatus: gameStatus, guesses: guesses };
    localStorage.setItem(`ipl-legends-game-${activeDate}`, JSON.stringify(stateToSave));
  }, [guesses, gameStatus, activeDate]);

  const handleGuessSubmit = (guessedPlayer) => {
    if (gameStatus !== 'playing') return;

    // Prevent duplicate entries of the exact same player on the same day
    if (guesses.some(g => g.player.id === guessedPlayer.id)) {
      alert("You already guessed that player today!");
      return;
    }

    const evaluation = comparePlayers(guessedPlayer, targetPlayer);
    const newGuessLog = { player: guessedPlayer, matrix: evaluation.results };
    const updatedGuesses = [...guesses, newGuessLog];
    
    setGuesses(updatedGuesses);

    if (evaluation.isCorrect) {
      setGameStatus('won');
      return;
    }

    if (updatedGuesses.length >= 8) {
      setGameStatus('lost');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>IPL Legends Puzzles</h1>
      <p>Target Player ID for today: <strong>{targetPlayer?.name || "Loading..."}</strong></p>
      
      {/* Connect search engine bar inputs */}
      <SearchBar onGuessSubmit={handleGuessSubmit} gameStatus={gameStatus} />

      <p>Status: <strong>{gameStatus.toUpperCase()}</strong></p>
      <p>Guesses Made: {guesses.length} / 8</p>

      {/* Basic Text feedback list of ongoing guesses */}
      <div style={{ marginTop: '20px', maxWidth: '400px', margin: '20px auto' }}>
        {guesses.map((g, index) => (
          <div key={index} style={{ padding: '10px', background: '#eee', margin: '5px 0', borderRadius: '4px' }}>
            🚀 {g.player.name} ({g.player.currentTeam})
          </div>
        ))}
      </div>
    </div>
  );
}