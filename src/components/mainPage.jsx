import React, { useState, useEffect } from 'react';
import { HelpCircle, BarChart2, Info, History, User } from 'lucide-react';
import SearchBar from './SearchBar'; // Our custom fuzzy search box
import { getDailyPlayerForDate } from '../utils/dailyPlayer';
import { getGuessResult } from '../utils/gameLogic';
import './mainPage.css';

const MainGame = () => {
  const [seconds, setSeconds] = useState(0);
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
  const MAX_GUESSES = 8;

  // Fetch the daily player on mount
  useEffect(() => {
    const todayTarget = getDailyPlayerForDate();
    setTargetPlayer(todayTarget);
    console.log("🤫 Dev Cheat Code - Target Is:", todayTarget?.name);
  }, []);

  // Timer interval loop
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [gameStatus]);

  // Handle guess submission from the SearchBar dropdown
  const handleGuessSubmit = (chosenPlayer) => {
    if (guesses.some(g => g.id === chosenPlayer.id) || gameStatus !== 'playing') return;

    const updatedGuesses = [...guesses, chosenPlayer];
    setGuesses(updatedGuesses);

    if (chosenPlayer.id === targetPlayer.id) {
      setGameStatus('won');
    } else if (updatedGuesses.length >= MAX_GUESSES) {
      setGameStatus('lost');
    }
  };

  const formatTime = (s) => {
    return new Date(s * 1000).toISOString().substr(11, 8);
  };

  // Helper to color-code grid boxes
  const getBoxClass = (status) => {
    if (status === 'exact') return 'box-exact';   // Green
    if (status === 'partial') return 'box-partial'; // Yellow
    return 'box-wrong';                             // Gray
  };

  // Helper to render high/low directional indicators
  const renderArrow = (direction) => {
    if (direction === 'up') return ' ↑';
    if (direction === 'down') return ' ↓';
    return '';
  };

  // Create filler rows for the remaining un-guessed spots
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
            <button className="game-btn"><BarChart2 size={18} color="#4ade80"/> <span>Stats</span></button>
            <button className="game-btn"><Info size={18} color="#38bdf8"/> <span>About</span></button>
            <button className="game-btn"><History size={18} color="#facc15"/> <span>Flashback</span></button>
          </div>
        </div>
      </header>

      <hr className="separator" />

      <main className="game-content">
        {/* Banner Messages */}
        {gameStatus === 'won' && (
          <div className="alert-banner win">🎉 Incredible! You've guessed {targetPlayer?.name} correctly!</div>
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

        {/* Dynamic Comparison Grid Table */}
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
              {/* Render User Guesses */}
              {guesses.map((guess) => {
                const result = getGuessResult(guess, targetPlayer);
                // Calculate age string from guess structure to print it
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

              {/* Render Empty Placeholders */}
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