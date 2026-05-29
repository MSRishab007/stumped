import React, { useState, useEffect } from 'react';
import { HelpCircle, BarChart2, Info, History, User } from 'lucide-react';
import SearchBar from './SearchBar'; 
import { getDailyPlayerForDate } from '../utils/dailyPlayer';
import { getGuessResult } from '../utils/gameLogic';
import './mainPage.css';

// Helper to get local date string in YYYY-MM-DD format
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DEFAULT_STATS = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  // 1-7 for successful guesses, 8 acts as the "Lost / Did Not Solve" bucket
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 } 
};

const MainGame = () => {
  const MAX_GUESSES = 7;
  const todayStr = getTodayStr();

  // --- STATE INITIALIZATION VIA LOCAL STORAGE ---
  const [seconds, setSeconds] = useState(0);

  // Initialize Game State (Board)
  const [gameState, setGameState] = useState(() => {
    const saved = localStorage.getItem('stumped_gameState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // If the saved game is from today, load it. Otherwise, start fresh.
      if (parsed.date === todayStr) {
        return parsed;
      }
    }
    return { date: todayStr, guesses: [], status: 'playing' };
  });

  // Initialize Statistics
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('stumped_stats');
    return saved ? JSON.parse(saved) : DEFAULT_STATS;
  });

  // Extract variables for easier reading
  const { guesses, status: gameStatus } = gameState;

  // --- EFFECT HOOKS ---
  // Fetch the daily player on mount
const [targetPlayer, setTargetPlayer] = useState(() => {
    const todayTarget = getDailyPlayerForDate();
    console.log("🤫 Dev Cheat Code - Target Is:", todayTarget?.name);
    return todayTarget;
  });

  // Persist Game State whenever it changes
  useEffect(() => {
    localStorage.setItem('stumped_gameState', JSON.stringify(gameState));
  }, [gameState]);

  // Persist Stats whenever they change
  useEffect(() => {
    localStorage.setItem('stumped_stats', JSON.stringify(stats));
  }, [stats]);

  // Timer interval loop
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [gameStatus]);

  // --- GAME LOGIC ---
  const handleGuessSubmit = (chosenPlayer) => {
    if (guesses.some(g => g.id === chosenPlayer.id) || gameStatus !== 'playing') return;

    const updatedGuesses = [...guesses, chosenPlayer];
    let newStatus = 'playing';

    // Win/Loss Checks
    if (chosenPlayer.id === targetPlayer.id) {
      newStatus = 'won';
    } else if (updatedGuesses.length >= MAX_GUESSES) {
      newStatus = 'lost';
    }

    // Update Game Board State
    setGameState({
      date: todayStr,
      guesses: updatedGuesses,
      status: newStatus
    });

    // If the game just ended, update Lifetime Statistics
    if (newStatus !== 'playing') {
      setStats(prev => {
        const newStats = { ...prev };
        newStats.gamesPlayed += 1;

        if (newStatus === 'won') {
          newStats.gamesWon += 1;
          newStats.currentStreak += 1;
          newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak);
          // Increment the specific guess count bucket
          newStats.distribution[updatedGuesses.length] += 1;
        } else {
          newStats.currentStreak = 0;
          // Bucket 8 is for losses
          newStats.distribution[8] += 1; 
        }
        return newStats;
      });
    }
  };

  const formatTime = (s) => {
    return new Date(s * 1000).toISOString().substr(11, 8);
  };

  // UI Helpers
  const getBoxClass = (status) => {
    if (status === 'exact') return 'box-exact';
    if (status === 'partial') return 'box-partial';
    return 'box-wrong';
  };

  const renderArrow = (direction) => {
    if (direction === 'up') return ' ↑';
    if (direction === 'down') return ' ↓';
    return '';
  };

  const emptyRowsCount = Math.max(0, MAX_GUESSES - guesses.length);

  return (
    <div className="main-game-wrapper">
      <header className="game-header">
        <div className="header-left">
          <h1 className="logo-mini">Stumped</h1>
          <div className="header-divider"></div>
          <p className="tagline">An <b>IPL</b><br/>player guessing game</p>
        </div>
        <div className="header-right">
          <div className="nav-grid">
            <button className="game-btn"><HelpCircle size={18} color="#DAAE4F"/> <span>Help</span></button>
            <button className="game-btn" onClick={() => console.log("Current Stats:", stats)}><BarChart2 size={18} color="#4ade80"/> <span>Stats</span></button>
            <button className="game-btn"><Info size={18} color="#38bdf8"/> <span>About</span></button>
            <button className="game-btn"><History size={18} color="#facc15"/> <span>Flashback</span></button>
          </div>
        </div>
      </header>

      <hr className="separator" />

      <main className="game-content">
        {gameStatus === 'won' && (
          <div className="alert-banner win">🎉 Incredible! You've guessed {targetPlayer?.name} correctly in {guesses.length} attempts!</div>
        )}
        {gameStatus === 'lost' && (
          <div className="alert-banner loss">☠️ Game Over! Today's player was {targetPlayer?.name}.</div>
        )}

        <div className="search-area">
          <div className="search-container-hook" style={{ flex: 1 }}>
            <SearchBar onGuessSubmit={handleGuessSubmit} gameStatus={gameStatus} />
          </div>
          <button className="game-btn silhouette-btn">
            <User size={20} fill="#DAAE4F" color="#DAAE4F"/> <span>Show Silhouette</span>
          </button>
          <div className="timer-display">{formatTime(seconds)}</div>
        </div>

        <div className="table-responsive" style={{ marginTop: '25px' }}>
          <table className="game-grid-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Role</th>
                <th>Batting</th>
                <th>Age</th>
                <th>Debut</th>
                <th>Price (L)</th>
                <th>Matches</th>
                <th>Runs</th>
                <th>Wickets</th>
              </tr>
            </thead>
            <tbody>
              {guesses.map((guess) => {
                const result = getGuessResult(guess, targetPlayer);
                const birthYear = guess.dob ? guess.dob.split('-')[2] : 2026;
                const evaluatedAge = 2026 - parseInt(birthYear || 2000);

                return (
                  <tr key={guess.id} className="guess-row">
                    <td className="cell-name"><strong>{guess.name}</strong></td>
                    <td className={getBoxClass(result.team.status)}>{guess.currentFranchise}</td>
                    <td className={getBoxClass(result.role.status)}>{guess.role}</td>
                    <td className={getBoxClass(result.battingHand.status)}>{guess.battingHand}</td>
                    <td className={getBoxClass(result.age.status)}>{evaluatedAge} {renderArrow(result.age.direction)}</td>
                    <td className={getBoxClass(result.debutYear.status)}>{guess.debutYear} {renderArrow(result.debutYear.direction)}</td>
                    <td className={getBoxClass(result.auctionPrice.status)}>{guess.auctionPrice ?? 'Null'} {renderArrow(result.auctionPrice.direction)}</td>
                    <td className={getBoxClass(result.matches.status)}>{guess.matches} {renderArrow(result.matches.direction)}</td>
                    <td className={getBoxClass(result.runs.status)}>{guess.runs} {renderArrow(result.runs.direction)}</td>
                    <td className={getBoxClass(result.wickets.status)}>{guess.wickets} {renderArrow(result.wickets.direction)}</td>
                  </tr>
                );
              })}

              {[...Array(emptyRowsCount)].map((_, i) => (
                <tr key={`empty-${i}`} className="empty-row-placeholder">
                  <td colSpan="10" style={{ padding: '15px', color: '#ccc', textAlign: 'center' }}>
                    {guesses.length + i + 1}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default MainGame;