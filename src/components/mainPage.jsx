import React, { useState, useEffect } from 'react';
import { HelpCircle, BarChart2, Info, History, User } from 'lucide-react';
import './mainPage.css';

const MainGame = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Real-time Timer
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s) => {
    return new Date(s * 1000).toISOString().substr(11, 8);
  };

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
        <div className="search-area">
          <div className={`search-box ${isFocused ? 'is-active' : ''}`}>
            <div className="q-mark">?</div>
            <input 
              type="text" 
              placeholder="Guess a player..." 
              onFocus={() => setIsFocused(true)} 
              onBlur={() => setIsFocused(false)} 
            />
          </div>
          <button className="game-btn silhouette-btn">
            <User size={20} fill="#DAAE4F" color="#DAAE4F"/> <span>Show Silhouette</span>
          </button>
          <div className="timer-display">{formatTime(seconds)}</div>
        </div>

        <div className="table-responsive">
          <div className="guess-grid">
            <div className="grid-labels">
              <span>Name</span><span>Team</span><span>Nationality</span><span>Role</span>
              <span>Batting</span><span>Bowling</span><span>Age</span><span>Number</span>
            </div>
            {[...Array(7)].map((_, i) => (
              <div key={i} className="empty-row">{i + 1}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainGame;