import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      <div className="landing-content">
        
        {/* Main Logo */}
        <div className="logo-section">
          <h1 className="stumped-logo">Stumped</h1>
        </div>

        {/* Text Section */}
        <div className="text-section">
          <h2 className="main-subtext">The NBPA Player Guessing Game</h2>
          <p className="guess-count-text">Guess the mystery player in 7 guesses!</p>
        </div>

        {/* Play Button */}
        <div className="button-section">
          <button 
            onClick={() => navigate('/play')}
            className="play-button"
          >
            <span className="play-btn-text">Play</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Landing;