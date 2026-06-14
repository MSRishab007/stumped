import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  // Dynamically calculate the date and game number
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const getGameNumber = () => {
    const LAUNCH_DATE = new Date(2026, 5, 14); // June 14, 2026
    const diffTime = new Date() - LAUNCH_DATE;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <article className="interstitial-dialoge">
      <section>
        
        {/* Replace this H1 with an <img> tag later when you have your SVG */}
        <h1 className="temp-logo">Stumped</h1>
        
        <h2>The IPL Player Guessing Game</h2>
        <p>Guess the mystery player in 7 guesses!</p>
        
        {/* The Poeltl 3D Button */}
        <button className="button" onClick={() => navigate('../')}>
          <div className="content">Play</div>
        </button>
        
        {/* Footer Data */}
        <div className="date">
          <p>{getTodayStr()}</p>
          <p>No. {getGameNumber()}</p>
        </div>

      </section>
    </article>
  );
};

export default Landing;