import React, { useState, useEffect } from 'react';
import { HelpCircle, BarChart2, Info, History, User, X } from 'lucide-react';
import SearchBar from './SearchBar'; 
import { getDailyPlayerForDate } from '../utils/dailyPlayer';
import { getGuessResult } from '../utils/gameLogic';
import './mainPage.css';

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DEFAULT_STATS = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
  history: {}
};

const MainGame = () => {
  const MAX_GUESSES = 7;
  const todayStr = getTodayStr();

  // --- COMPONENT STATES ---
  const [targetPlayer, setTargetPlayer] = useState(() => getDailyPlayerForDate());
  
  // Controls what is shown in the top display space (null, 'silhouette', 'stats', 'help', 'about', 'flashback')
  const [activeModal, setActiveModal] = useState(null); 

  const [gameState, setGameState] = useState(() => {
    const saved = localStorage.getItem('stumped_gameState');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === todayStr) return parsed;
    }
    return { date: todayStr, guesses: [], status: 'playing', usedSilhouette: false };
  });

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('stumped_stats');
    return saved ? JSON.parse(saved) : DEFAULT_STATS;
  });

  const [seconds, setSeconds] = useState(() => {
    const savedTime = localStorage.getItem(`stumped_timer_${todayStr}`);
    return savedTime ? parseInt(savedTime, 10) : 0;
  });

  const { guesses, status: gameStatus, usedSilhouette } = gameState;

  // --- PERSISTENCE ---
  useEffect(() => localStorage.setItem('stumped_gameState', JSON.stringify(gameState)), [gameState]);
  useEffect(() => localStorage.setItem('stumped_stats', JSON.stringify(stats)), [stats]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const interval = setInterval(() => {
      setSeconds(s => {
        const nextTime = s + 1;
        localStorage.setItem(`stumped_timer_${todayStr}`, nextTime.toString());
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStatus, todayStr]);

  // --- UI TOGGLES ---
  const toggleModal = (modalName) => {
    if (activeModal === modalName) {
      setActiveModal(null); // Close if clicking the same button
    } else {
      setActiveModal(modalName); // Open new panel
      
      // If silhouette is opened during active play, mark it as used in storage eternally
      if (modalName === 'silhouette' && gameStatus === 'playing' && !usedSilhouette) {
        setGameState(prev => ({ ...prev, usedSilhouette: true }));
      }
    }
  };

  // --- GAME LOGIC ---
  const handleGuessSubmit = (chosenPlayer) => {
    if (guesses.some(g => g.id === chosenPlayer.id) || gameStatus !== 'playing') return;

    const updatedGuesses = [...guesses, chosenPlayer];
    let newStatus = 'playing';

    if (chosenPlayer.id === targetPlayer.id) {
      newStatus = 'won';
      setActiveModal('silhouette'); // Auto-reveal on win
    } else if (updatedGuesses.length >= MAX_GUESSES) {
      newStatus = 'lost';
      setActiveModal('silhouette'); // Auto-reveal on loss
    }

    setGameState(prev => ({ ...prev, guesses: updatedGuesses, status: newStatus }));

    if (newStatus !== 'playing') {
      setStats(prev => {
        const newStats = { ...prev };
        if (!newStats.history[todayStr]) {
          newStats.gamesPlayed += 1;
          if (newStatus === 'won') {
            newStats.gamesWon += 1;
            newStats.currentStreak += 1;
            newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak);
            newStats.distribution[updatedGuesses.length] += 1;
          } else {
            newStats.currentStreak = 0;
            newStats.distribution[8] += 1;
          }
          newStats.history[todayStr] = {
            status: newStatus,
            guesses: updatedGuesses.length,
            usedSilhouette: gameState.usedSilhouette || (activeModal === 'silhouette'), // catch edge cases
            time: seconds
          };
        }
        return newStats;
      });
    }
  };

  const formatTime = (s) => new Date(s * 1000).toISOString().substr(11, 8);
  const getBoxClass = (status) => status === 'exact' ? 'box-exact' : status === 'partial' ? 'box-partial' : 'box-wrong';
  const renderArrow = (dir) => dir === 'up' ? ' ↑' : dir === 'down' ? ' ↓' : '';
  const emptyRowsCount = Math.max(0, MAX_GUESSES - guesses.length);

  const winPercentage = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

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
            <button className="game-btn" onClick={() => toggleModal('help')}><HelpCircle size={18} color="#DAAE4F"/> <span>Help</span></button>
            <button className="game-btn" onClick={() => toggleModal('stats')}><BarChart2 size={18} color="#4ade80"/> <span>Stats</span></button>
            <button className="game-btn" onClick={() => toggleModal('about')}><Info size={18} color="#38bdf8"/> <span>About</span></button>
            <button className="game-btn" onClick={() => toggleModal('flashback')}><History size={18} color="#facc15"/> <span>Flashback</span></button>
          </div>
        </div>
      </header>

      <hr className="separator" />

      <main className="game-content">
        
        {/* --- DYNAMIC DISPLAY PANEL --- */}
       <div className="display-panel-container">
          
          {/* SILHOUETTE & POST-GAME REVEAL VIEW */}
          {activeModal === 'silhouette' && targetPlayer?.imageLink && (
            gameStatus === 'playing' ? (
              // ACTIVE GAME: Transparent silhouette container
              <div className="transparent-panel image-panel">
                <img 
                  src={targetPlayer.imageLink} 
                  alt="Mystery Player" 
                  className="image-hidden"
                />
              </div>
            ) : (
              // POST-GAME: Revealed card with player statistics
              <div className="panel-card player-reveal-card">
                <div className="reveal-image-container">
                  <img 
                    src={targetPlayer.imageLink} 
                    alt={targetPlayer.name} 
                    className="image-revealed"
                  />
                </div>
                <div className="reveal-stats-container">
                  <h3>{targetPlayer.name}</h3>
                  <div className="reveal-stats-grid">
                    <div><span>Team</span><strong>{targetPlayer.currentFranchise}</strong></div>
                    <div><span>Role</span><strong>{targetPlayer.role}</strong></div>
                    <div><span>Batting</span><strong>{targetPlayer.battingHand}</strong></div>
                    <div><span>Debut</span><strong>{targetPlayer.debutYear}</strong></div>
                    <div><span>Matches</span><strong>{targetPlayer.matches}</strong></div>
                    <div><span>Runs</span><strong>{targetPlayer.runs}</strong></div>
                    <div><span>Wickets</span><strong>{targetPlayer.wickets}</strong></div>
                    <div><span>Price</span><strong>{targetPlayer.auctionPrice} L</strong></div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* STATS VIEW (Poeltl Style) */}
          {activeModal === 'stats' && (
            <div className="panel-card stats-panel">
              <div className="stats-header">
                <h3>Statistics</h3>
                <button className="close-btn" onClick={() => setActiveModal(null)}><X size={20} color="red"/> Close</button>
              </div>
              <div className="stats-content">
                <div className="stats-box distribution-box">
                  <h4>Guess Distribution</h4>
                  <div className="chart-wrapper">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => {
                      const count = stats.distribution[num] || 0;
                      // Math to make highest bar 100% height
                      const maxCount = Math.max(...Object.values(stats.distribution), 1);
                      const heightPct = (count / maxCount) * 100;
                      return (
                        <div key={num} className="chart-bar-container">
                          <div className="chart-bar" style={{ height: `${heightPct}%` }}>
                            {count > 0 && <span className="bar-label">{count}</span>}
                          </div>
                          <div className="chart-axis">{num === 8 ? 'Fail' : num}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="stats-box numbers-box">
                  <div className="stat-item"><span>Games Played</span><strong>{stats.gamesPlayed}</strong></div>
                  <div className="stat-item"><span>Current Streak</span><strong>{stats.currentStreak}</strong></div>
                  <div className="stat-item"><span>Longest Streak</span><strong>{stats.maxStreak}</strong></div>
                  <div className="stat-item"><span>Win Percentage</span><strong>{winPercentage}%</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* HELP VIEW */}
          {activeModal === 'help' && (
            <div className="panel-card text-panel">
              <h3>How to Play</h3>
              <p>Guess the hidden IPL player in 7 tries.</p>
              <p>Green = Exact match.<br/>Yellow = Partial match.<br/>Grey = No match.</p>
            </div>
          )}

          {/* ABOUT VIEW */}
          {activeModal === 'about' && (
            <div className="panel-card text-panel">
              <h3>About Stumped</h3>
              <p>Created for IPL fans. A new player every day!</p>
            </div>
          )}
        </div>

        {/* --- MAIN INTERFACE --- */}
        <div className="search-area">
          <div className="search-container-hook" style={{ flex: 1 }}>
            <SearchBar onGuessSubmit={handleGuessSubmit} gameStatus={gameStatus} guessedPlayers={guesses} />
          </div>
          
          <button 
            className="game-btn silhouette-btn"
            onClick={() => toggleModal('silhouette')}
            style={{ backgroundColor: activeModal === 'silhouette' ? '#e5e7eb' : 'white' }}
          >
            <User size={20} fill="#DAAE4F" color="#DAAE4F"/> 
            <span>
              {gameStatus !== 'playing' 
                ? (activeModal === 'silhouette' ? "Hide Player" : "Show Player") 
                : (activeModal === 'silhouette' ? "Hide Silhouette" : "Show Silhouette")}
            </span>
          </button>
          
          <div className="timer-display">{formatTime(seconds)}</div>
        </div>

        <div className="table-responsive" style={{ marginTop: '25px' }}>
          <table className="game-grid-table">
            <thead>
              <tr>
                <th>Player</th><th>Team</th><th>Role</th><th>Batting</th>
                <th>Age</th><th>Debut</th><th>Price (L)</th>
                <th>Matches</th><th>Runs</th><th>Wickets</th>
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