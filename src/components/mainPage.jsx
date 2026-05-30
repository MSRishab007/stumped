import React, { useState, useEffect } from 'react';
import { HelpCircle, BarChart2, Info, History, User, X, ChevronLeft, ChevronRight,Share } from 'lucide-react';
import SearchBar from './SearchBar'; 
import { getDailyPlayerForDate } from '../utils/dailyPlayer';
import { getGuessResult } from '../utils/gameLogic';
// import { HelpCircle, BarChart2, Info, History, User, X, ChevronLeft, ChevronRight, Share } from 'lucide-react';
import './mainPage.css';

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const LAUNCH_DATE = new Date(2026, 2, 24); // March 24, 2026

const DEFAULT_STATS = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
  history: {} // Records: { "YYYY-MM-DD": { status: "won" | "lost", guesses: X, time: Y } }
};

const MainGame = () => {
  const MAX_GUESSES = 7;
  const realTodayStr = getTodayStr();
  const [copySuccess, setCopySuccess] = useState(false);

  // --- TIME MACHINE STATES ---
  const [activeDate, setActiveDate] = useState(realTodayStr);
  const [targetPlayer, setTargetPlayer] = useState(() => getDailyPlayerForDate(activeDate));
  
  // Calendar Navigation View States
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const [activeModal, setActiveModal] = useState(null); 

  // --- GAME STATES (Tied to activeDate) ---
  const [gameState, setGameState] = useState(() => {
    const saved = localStorage.getItem(`stumped_gameState_${activeDate}`);
    return saved ? JSON.parse(saved) : { date: activeDate, guesses: [], status: 'playing', usedSilhouette: false };
  });

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('stumped_stats');
    return saved ? JSON.parse(saved) : DEFAULT_STATS;
  });

  const [seconds, setSeconds] = useState(() => {
    const savedTime = localStorage.getItem(`stumped_timer_${activeDate}`);
    return savedTime ? parseInt(savedTime, 10) : 0;
  });
  const [countdown, setCountdown] = useState('');

  const { guesses, status: gameStatus, usedSilhouette } = gameState;

  // --- RUNTIME EFFECTS ---
  // Re-sync components whenever the user switches dates on the calendar
  useEffect(() => {
    setTargetPlayer(getDailyPlayerForDate(activeDate));
    
    const savedState = localStorage.getItem(`stumped_gameState_${activeDate}`);
    setGameState(savedState ? JSON.parse(savedState) : { date: activeDate, guesses: [], status: 'playing', usedSilhouette: false });
    
    const savedTime = localStorage.getItem(`stumped_timer_${activeDate}`);
    setSeconds(savedTime ? parseInt(savedTime, 10) : 0);
  }, [activeDate]);

  // Save states to local storage on mutation
  useEffect(() => localStorage.setItem(`stumped_gameState_${activeDate}`, JSON.stringify(gameState)), [gameState, activeDate]);
  useEffect(() => localStorage.setItem('stumped_stats', JSON.stringify(stats)), [stats]);

  // Stopwatch effect loop
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const interval = setInterval(() => {
      setSeconds(s => {
        const nextTime = s + 1;
        localStorage.setItem(`stumped_timer_${activeDate}`, nextTime.toString());
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStatus, activeDate]);
  useEffect(() => {
    if (gameStatus === 'playing') return;

    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Sets time to exactly 00:00:00 of the next day
      
      const diffMs = midnight - now;
      
      const h = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
      
      setCountdown(`${h}:${m}:${s}`);
    };

    updateCountdown(); // Call immediately so it doesn't wait 1 second to appear
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [gameStatus]);

  const toggleModal = (modalName) => {
    if (activeModal === modalName) {
      setActiveModal(null);
    } else {
      setActiveModal(modalName);
      if (modalName === 'silhouette' && gameStatus === 'playing' && !usedSilhouette) {
        setGameState(prev => ({ ...prev, usedSilhouette: true }));
      }
    }
  };
// --- SHARE TO CLIPBOARD LOGIC ---
  const getGameNumber = (dateStr) => {
    // Calculates how many days have passed since launch
    const diffTime = new Date(dateStr) - LAUNCH_DATE;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

const handleShare = () => {
    const gameNum = getGameNumber(activeDate);
    const attemptCount = gameStatus === 'won' ? guesses.length : 'X';
    
    // Header
    let shareText = `Stumped #${gameNum} - ${attemptCount}/${MAX_GUESSES}\n\n`;

    guesses.forEach(guess => {
      const result = getGuessResult(guess, targetPlayer);
      
      const getEmoji = (status) => status === 'exact' ? '🟩' : status === 'partial' ? '🟨' : '⬛';
      
      let row = '';
      
      // Only append the color blocks, no arrows!
      row += getEmoji(result.team.status);
      row += getEmoji(result.role.status);
      row += getEmoji(result.battingHand.status);
      row += getEmoji(result.age.status);
      row += getEmoji(result.debutYear.status);
      row += getEmoji(result.auctionPrice.status);
      row += getEmoji(result.matches.status);
      row += getEmoji(result.runs.status);
      row += getEmoji(result.wickets.status);

      shareText += row + '\n';
    });

    // Append Site URL
    shareText += '\nhttps://stumped-seven.vercel.app/';

    // Write to clipboard API
    navigator.clipboard.writeText(shareText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };
  // --- GAME CONCLUSION & ACCUMULATION ENGINE ---
const handleGuessSubmit = (chosenPlayer) => {
    // Prevent duplicate guesses or submission if game already ended
    if (guesses.some(g => g.id === chosenPlayer.id) || gameStatus !== 'playing') return;

    const updatedGuesses = [...guesses, chosenPlayer];
    let newStatus = 'playing';

    // Check Win/Loss conditions
    if (chosenPlayer.id === targetPlayer.id) {
      newStatus = 'won';
      setActiveModal('silhouette'); // Automatically reveal player card on win
    } else if (updatedGuesses.length >= MAX_GUESSES) {
      newStatus = 'lost';
      setActiveModal('silhouette'); // Reveal player card on loss
    }

    // --- UPDATE INDIVIDUAL DAY STATE ---
    // This executes for both 'Today' and 'Flashback' games so progress persists per day
    setGameState(prev => ({ ...prev, guesses: updatedGuesses, status: newStatus }));

    // --- IMPLEMENT PRACTICE MODE LOGIC ---.
    if (activeDate !== realTodayStr) return;

    // --- UPDATE GLOBAL STATS (Only for Today's Live Game) ---
    if (newStatus !== 'playing') {
      setStats(prev => {
        const newStats = { ...prev };
        
        // Safety check to prevent duplicate aggregation
        if (!newStats.history[activeDate]) {
          newStats.gamesPlayed += 1;
          
          // Update distribution (Bucket 8 is for losses)
          const distBucket = newStatus === 'won' ? updatedGuesses.length : 8;
          newStats.distribution[distBucket] += 1;
          
          if (newStatus === 'won') {
            newStats.gamesWon += 1;
            // Increment streaks (already guarded by activeDate === realTodayStr check above)
            newStats.currentStreak += 1;
            newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak);
          } else {
            // Reset streak on loss
            newStats.currentStreak = 0;
          }

          // Commit to the history ledger used for UI calendar coloring
          newStats.history[activeDate] = {
            status: newStatus,
            guesses: updatedGuesses.length,
            // Track if silhouette was used either previously or via auto-reveal on end
            usedSilhouette: usedSilhouette || (activeModal === 'silhouette'),
            time: seconds // Capture end time
          };
        }
        return newStats;
      });
    }
  };
  // --- TIME MACHINE CALENDAR GENERATION ---
  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } 
    else { setCalMonth(m => m - 1); }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } 
    else { setCalMonth(m => m + 1); }
  };

 const renderCalendarDays = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const days = [];

    // Empty offset slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const cellDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const cellDateObj = new Date(calYear, calMonth, i);
      
      const isBeforeLaunch = cellDateObj < LAUNCH_DATE;
      const isFuture = cellDateStr > realTodayStr;
      const dayRecord = stats.history[cellDateStr];
      
      let dayClass = "cal-day ";
      
      if (isBeforeLaunch || isFuture) {
        dayClass += "disabled ";
      } else {
        // 1. First, check if there is a win/loss record
        if (dayRecord) {
          dayClass += dayRecord.status === 'won' ? "won " : "lost ";
        } else {
          dayClass += "playable ";
        }

        // 2. Then, independently apply the highlight if it's the day we are currently viewing
        if (cellDateStr === activeDate) {
          dayClass += "active-selection ";
        }
      }

      days.push(
        <div 
          key={i} 
          className={dayClass}
          onClick={() => {
            if (!isBeforeLaunch && !isFuture) {
              setActiveDate(cellDateStr);
              setActiveModal(null); 
            }
          }}
        >
          {i}
        </div>
      );
    }
    return days;
  };
  const formatTime = (s) => new Date(s * 1000).toISOString().substr(11, 8);
  const getBoxClass = (status) => status === 'exact' ? 'box-exact' : status === 'partial' ? 'box-partial' : 'box-wrong';
  const renderArrow = (dir) => dir === 'up' ? ' ↑' : dir === 'down' ? ' ↓' : '';
  const emptyRowsCount = Math.max(0, MAX_GUESSES - guesses.length);
  const winPercentage = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const displayDateStr = new Date(activeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

      {/* ACTIVE TIME MACHINE ALERT BANNER */}
      {activeDate !== realTodayStr && (
        <div className="flashback-banner">
          ⏳ You are exploring a past match archive: <strong>{displayDateStr}</strong>
          <button className="return-today-btn" onClick={() => setActiveDate(realTodayStr)}>Return to Today</button>
        </div>
      )}

      <hr className="separator" />

      <main className="game-content">
        <div className="display-panel-container">
          
          {/* FLASHBACK INTERACTIVE MODAL */}
          {activeModal === 'flashback' && (
            <div className="panel-card flashback-panel">
               <div className="stats-header">
                <h3>Time Machine</h3>
                <button className="close-btn" onClick={() => setActiveModal(null)}><X size={20} color="red"/> Close</button>
              </div>
              <div className="calendar-container">
                <div className="cal-header">
                  <button onClick={handlePrevMonth}><ChevronLeft/></button>
                  <h4>{new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                  <button onClick={handleNextMonth}><ChevronRight/></button>
                </div>
                <div className="cal-grid-labels">
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>
                <div className="cal-grid">
                  {renderCalendarDays()}
                </div>
                <div className="cal-legend">
                  <span className="legend-item"><div className="box green"></div> Solved</span>
                  <span className="legend-item"><div className="box red"></div> Failed</span>
                  <span className="legend-item"><div className="box grey"></div> Unplayed</span>
                </div>
              </div>
            </div>
          )}

         {/* SILHOUETTE & FINAL POST-GAME REVEAL METRIC CARD */}
          {activeModal === 'silhouette' && targetPlayer?.imageLink && (
            gameStatus === 'playing' ? (
              <div className="transparent-panel image-panel">
                <img src={targetPlayer.imageLink} alt="Mystery Silhouette" className="image-hidden" />
              </div>
            ) : (
              <div className="panel-card player-reveal-card">
                <div className="reveal-image-container">
                  <img src={targetPlayer.imageLink} alt={targetPlayer.name} className="image-revealed" />
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
                  
                  {/* --- NEW SHARE BUTTON --- */}
                  <button 
                    className={`share-btn ${copySuccess ? 'copied' : ''}`} 
                    onClick={handleShare}
                  >
                    <Share size={18} />
                    <span>{copySuccess ? 'Copied to Clipboard!' : 'Share Results'}</span>
                  </button>

                </div>
              </div>
            )
          )}
          {/* LCG LIFETIME GLOBAL STATISTICS */}
          {activeModal === 'stats' && (
            <div className="panel-card stats-panel">
              <div className="stats-header">
                <h3>Performance Analytics</h3>
                <button className="close-btn" onClick={() => setActiveModal(null)}><X size={20} color="red"/> Close</button>
              </div>
              <div className="stats-content">
                <div className="stats-box distribution-box">
                  <h4>Guess Distribution</h4>
                  <div className="chart-wrapper">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => {
                      const count = stats.distribution[num] || 0;
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
                  <div className="stat-item"><span>Played</span><strong>{stats.gamesPlayed}</strong></div>
                  <div className="stat-item"><span>Streak</span><strong>{stats.currentStreak}</strong></div>
                  <div className="stat-item"><span>Max Streak</span><strong>{stats.maxStreak}</strong></div>
                  <div className="stat-item"><span>Win Rate</span><strong>{winPercentage}%</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* GUIDE ASSISTANCE VIEW */}
          {activeModal === 'help' && (
            <div className="panel-card text-panel">
              <h3>How to Play</h3>
              <p>Identify the secret IPL player inside 7 attempts.</p>
              <p>Green blocks symbolize perfect profile matches. Yellow represents historic franchise alignment or adjacent tier roles. Gray elements mean no matching traits.</p>
            </div>
          )}

          {/* CREDITS ABOUT VIEW */}
          {activeModal === 'about' && (
            <div className="panel-card text-panel">
              <h3>About Stumped</h3>
              <p>A pure, database-driven cricket challenge built explicitly for passionate IPL fans everywhere.</p>
            </div>
          )}
        </div>

        {/* --- INPUT BAR INTERACTION VIEW --- */}
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
          {/* --- TIMER / COUNTDOWN DISPLAY --- */}
          <div className="timer-display">
            {gameStatus === 'playing' ? (
              <span className="stopwatch">{formatTime(seconds)}</span>
            ) : (
              <div className="countdown-container">
                <span className="countdown-label">Next player in</span>
                <span className="countdown-time">{countdown}</span>
              </div>
            )}
          </div>
        </div>

        {/* --- RESULTS GRID DISPLAY MATRIX --- */}
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