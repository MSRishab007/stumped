import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HelpCircle, BarChart2, Info, History, User, X, ChevronLeft, ChevronRight,Share } from 'lucide-react';
import SearchBar from './SearchBar'; 
import { getDailyPlayerForDate } from '../utils/dailyPlayer';
import { getGuessResult } from '../utils/gameLogic';
// import { HelpCircle, BarChart2, Info, History, User, X, ChevronLeft, ChevronRight, Share } from 'lucide-react';
import './mainPage.css';

const getTodayStr = () => {
  // return "2026-04-24";
  // return "2026-06-04"
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

const SilhouetteIcon = ({ active }) => (
  <svg className="silhouette" viewBox="0 0 34.93 41.1" style={{ height: '40px', marginRight: '8px', marginTop: '-2px' }}>
    <path fill={active ? "var(--white)" : "var(--orange)"} d="m31.75,36.34c0,.15-.1.28-.25.31-9.28,1.67-18.79,1.67-28.08,0-.15-.03-.26-.17-.26-.31.01-7.02,5.7-12.7,12.7-12.7h3.17c3.51,0,6.68,1.42,8.98,3.72s3.72,5.47,3.72,8.98ZM17.47,3.17c-4.38,0-7.95,3.55-7.95,7.94s3.57,7.95,7.95,7.95,7.94-3.57,7.94-7.95c-.01-4.37-3.57-7.93-7.94-7.94Z" />
    <path fill="var(--dark)" d="m34.93,36.34c.01,1.68-1.19,3.13-2.86,3.44-4.81.87-9.7,1.31-14.6,1.31s-9.79-.44-14.6-1.31C1.2,39.48-.01,38.03,0,36.34,0,28.84,5.21,22.57,12.2,20.9c-3.49-1.87-5.85-5.55-5.85-9.79C6.35,4.98,11.33,0,17.47,0s11.11,4.98,11.11,11.11c-.01,4.24-2.38,7.92-5.85,9.79,6.99,1.67,12.2,7.94,12.2,15.44Zm-3.42.31c.15-.03.25-.17.25-.31,0-3.51-1.42-6.68-3.72-8.98s-5.47-3.72-8.98-3.72h-3.17c-7.01,0-12.69,5.68-12.7,12.7,0,.15.11.28.26.31,9.28,1.67,18.79,1.67,28.08,0Zm-14.04-17.59c4.38,0,7.94-3.57,7.94-7.95-.01-4.37-3.57-7.93-7.94-7.94-4.38,0-7.95,3.55-7.95,7.94s3.57,7.95,7.95,7.95Z" />
  </svg>
);

const ResultIcon = ({ status }) => {
  if (status === 'exact') return (
    <svg className="check" viewBox="0 0 33 31" style={{ width: '20px', marginLeft: '5px' }}>
      <path fill="var(--equal)" d="m0,0v31h33V0H0Zm13.76,25.54l-9.21-7.81,2.59-3.05,6.11,5.18,12.47-15.26,3.1,2.53-15.05,18.41Z" />
    </svg>
  );
  if (status === 'partial') return (
    <svg className="close" viewBox="0 0 33 31" style={{ width: '20px', marginLeft: '5px' }}>
      <path fill="var(--close)" d="m0,0v31h33V0H0Zm21.15,20.01c-4.54,0-6.64-4.8-9.37-4.8-1.86,0-3.06,1.72-3.15,4.38h-3.82c.14-6.26,2.87-9.28,6.69-9.28,4.64,0,6.69,4.85,9.37,4.85,1.91,0,3.11-1.77,3.2-4.43h3.78c-.1,6.31-2.82,9.28-6.69,9.28Z" />
    </svg>
  );
  return null;
};
const HelpIcon = ({ active }) => (
  <svg viewBox="0 0 25.89 51.36">
    <path fill={active ? "var(--white)" : "var(--orange)"} d="m9.15,48.36v-8.11h6.48v8.11h-6.48Zm13.74-25.94v-13.48c0-1.84-.49-3.3-1.46-4.36-.96-1.05-2.62-1.58-4.93-1.58h-7.11c-2.31,0-3.97.53-4.93,1.58-.97,1.06-1.46,2.53-1.46,4.37v5.8h5.74v-4.83c0-.88.15-1.52.47-1.95.09-.12.19-.23.31-.32.4-.3.99-.45,1.79-.45h3.26c.59,0,.96.07,1.19.13.38.08.72.3.94.63.29.44.44,1.08.44,1.96v11.92c0,.68-.08,1.21-.25,1.63-.1.25-.27.48-.5.66-.39.29-.99.44-1.82.44h-5.02l.53,8.7h4.69l.21-3.48c.05-.79.7-1.41,1.5-1.41,2.33,0,3.98-.54,4.94-1.61.97-1.08,1.46-2.54,1.46-4.33Z"/>
    <path fill="var(--dark)" d="m16.13,51.36h-7.48c-1.38,0-2.5-1.12-2.5-2.5v-9.11c0-1.38,1.12-2.5,2.5-2.5h7.48c1.38,0,2.5,1.12,2.5,2.5v9.11c0,1.38-1.12,2.5-2.5,2.5Zm-6.98-3h6.48v-8.11h-6.48v8.11Zm6.98-8.11h0,0Zm-.89-4h-5.63c-1.32,0-2.42-1.03-2.5-2.35l-.59-9.7c-.04-.69.2-1.36.67-1.86.47-.5,1.14-.79,1.82-.79h5.13v-11.37h-2.41v5.05c0,1.38-1.12,2.5-2.5,2.5H2.5c-1.38,0-2.5-1.12-2.5-2.5v-6.3c0-2.61.76-4.76,2.25-6.39C3.8.86,6.2,0,9.39,0h7.11c3.19,0,5.59.86,7.14,2.55,0,0,0,0,0,0,1.49,1.63,2.25,3.78,2.25,6.39v13.48c0,2.55-.75,4.68-2.23,6.33-1.32,1.47-3.25,2.33-5.76,2.55l-.16,2.6c-.08,1.32-1.18,2.35-2.5,2.35Zm-5.16-3h4.69l.21-3.48c.05-.79.7-1.41,1.5-1.41,2.33,0,3.98-.54,4.94-1.61.97-1.08,1.46-2.54,1.46-4.33v-13.48c0-1.84-.49-3.3-1.46-4.36h0c-.96-1.05-2.62-1.58-4.93-1.58h-7.11c-2.31,0-3.97.53-4.93,1.58-.97,1.06-1.46,2.53-1.46,4.37v5.8h5.74v-4.83c0-.88.15-1.52.47-1.95.09-.12.19-.23.31-.32.4-.3.99-.45,1.79-.45h3.26c.59,0,.96.07,1.19.13.38.08.72.3.94.63.29.44.44,1.08.44,1.96v11.92c0,.68-.08,1.21-.25,1.63-.1.25-.27.48-.5.66-.39.29-.99.44-1.82.44h-5.02l.53,8.7Z"/>
  </svg>
);

const StatsIcon = ({ active }) => (
  <svg viewBox="0 0 53.79 54.83">
    <path fill={active ? "var(--white)" : "var(--green)"} d="m14.13,51.83H3v-31.07h11.13v31.07ZM32.38,3h-11.13v48.83h11.13V3Zm18.41,11.1h-11.13v37.73h11.13V14.1Z"/>
    <path fill="var(--dark)" d="m32.38,3v48.83h-11.13V3h11.13m18.41,11.1v37.73h-11.13V14.1h11.13m-36.66,6.66v31.07H3v-31.07h11.13M32.38,0h-11.13c-1.66,0-3,1.34-3,3v48.83c0,1.66,1.34,3,3,3h11.13c1.66,0,3-1.34,3-3V3c0-1.66-1.34-3-3-3h0Zm18.41,11.1h-11.13c-1.66,0-3,1.34-3,3v37.73c0,1.66,1.34,3,3,3h11.13c1.66,0,3-1.34,3-3V14.1c0-1.66-1.34-3-3-3h0Zm-36.66,6.66H3c-1.66,0-3,1.34-3,3v31.07c0,1.66,1.34,3,3,3h11.13c1.66,0,3-1.34,3-3v-31.07c0-1.66-1.34-3-3-3h0Z"/>
  </svg>
);

const AboutIcon = ({ active }) => (
  <svg viewBox="0 0 53 53">
    <path fill={active ? "var(--white)" : "var(--blue)"} d="m26.5,0C11.86,0,0,11.86,0,26.5s11.86,26.5,26.5,26.5,26.5-11.86,26.5-26.5S41.14,0,26.5,0Zm2.93,40.69c-1.45,1.62-3.28,2.42-5.47,2.42-1.47,0-2.58-.37-3.31-1.11-.74-.74-1.11-1.61-1.11-2.62s.32-2.46.97-4.29l3.39-9.4c.33-.85.5-1.43.5-1.73,0-.19-.08-.37-.24-.53-.16-.16-.33-.24-.53-.24-.6,0-1.25.47-1.96,1.41-.71.94-1.24,1.78-1.59,2.53h-2.31c1.03-2.34,2.38-4.16,4.04-5.45,1.66-1.29,3.31-1.93,4.96-1.93,1.16,0,2.12.29,2.88.87.76.58,1.15,1.34,1.15,2.3,0,1.01-.19,2.03-.58,3.06l-4.1,11.16c-.28.76-.42,1.38-.42,1.86,0,.21.08.42.25.63.17.2.35.31.54.31.53,0,1.07-.28,1.63-.85.56-.57,1.26-1.62,2.1-3.14h2.42c-.68,1.54-1.75,3.12-3.21,4.74Zm3.05-25.93c-.68.68-1.47,1.03-2.38,1.03-.98,0-1.8-.34-2.46-1.03-.66-.68-.99-1.5-.99-2.46s.33-1.73.99-2.41c.66-.68,1.48-1.03,2.46-1.03.63,0,1.21.16,1.72.47.52.31.92.72,1.22,1.22s.45,1.09.45,1.74c0,.96-.34,1.78-1.01,2.46Z"/>
    <path fill="var(--dark)" d="m26.5,3c12.96,0,23.5,10.54,23.5,23.5s-10.54,23.5-23.5,23.5S3,39.46,3,26.5,13.54,3,26.5,3m-1.02,13.85c-1.88.26-3.73,1.09-5.51,2.47-2.05,1.59-3.71,3.81-4.94,6.6-.41.93-.32,2,.23,2.85.55.85,1.5,1.36,2.51,1.36h1.34l-1.43,3.96c-.77,2.17-1.15,3.9-1.15,5.29,0,1.81.69,3.45,1.98,4.74,1.32,1.32,3.14,1.98,5.44,1.98,3.03,0,5.69-1.18,7.7-3.41,1.66-1.84,2.91-3.7,3.72-5.53.41-.93.32-2-.23-2.85s-1.5-1.36-2.51-1.36h-1.78l2.17-5.91c.51-1.36.77-2.75.77-4.11,0-1.72-.69-3.26-1.95-4.38,1.03-.3,1.97-.86,2.77-1.67,1.23-1.24,1.88-2.82,1.88-4.57,0-1.2-.29-2.3-.86-3.27-.55-.94-1.31-1.7-2.26-2.27-.99-.59-2.09-.89-3.27-.89-1.8,0-3.4.67-4.62,1.94-1.19,1.24-1.83,2.79-1.83,4.49s.63,3.3,1.82,4.54c0,0,0,0,0,0m-1.02,9.13h0,0M26.5,0C11.86,0,0,11.86,0,26.5s11.86,26.5,26.5,26.5,26.5-11.86,26.5-26.5S41.14,0,26.5,0h0Zm3.6,15.79c-.98,0-1.8-.34-2.46-1.03-.66-.68-.99-1.5-.99-2.46s.33-1.73.99-2.41c.66-.68,1.48-1.03,2.46-1.03.63,0,1.21.16,1.72.47.52.31.92.72,1.22,1.22.3.51.45,1.09.45,1.74,0,.96-.34,1.78-1.01,2.46-.68.68-1.47,1.03-2.38,1.03h0Zm-12.32,11.35c1.03-2.34,2.38-4.16,4.04-5.45,1.66-1.29,3.31-1.93,4.96-1.93,1.16,0,2.12.29,2.88.87.76.58,1.15,1.34,1.15,2.3,0,1.01-.19,2.03-.58,3.06l-4.1,11.16c-.28.76-.42,1.38-.42,1.86,0,.21.08.42.25.63.17.2.35.31.54.31.53,0,1.07-.28,1.63-.85.56-.57,1.26-1.62,2.1-3.14h2.42c-.68,1.54-1.75,3.12-3.21,4.74-1.45,1.62-3.28,2.42-5.47,2.42-1.47,0-2.58-.37-3.31-1.11-.74-.74-1.11-1.61-1.11-2.62s.32-2.46.97-4.29l3.39-9.4c.33-.85.5-1.43.5-1.73,0-.19-.08-.37-.24-.53-.16-.16-.33-.24-.53-.24-.6,0-1.25.47-1.96,1.41-.71.94-1.24,1.78-1.59,2.53h-2.31Z"/>
  </svg>
);

const FlashbackIcon = ({ active }) => (
  <svg viewBox="0 0 49.16 43.55">
    <path fill={active ? "var(--white)" : "var(--yellow)"} d="m13.53,38.58c-.85-.7-.97-1.96-.27-2.82.7-.85,1.96-.97,2.82-.27,3.17,2.62,7.19,4.06,11.31,4.06,9.8,0,17.78-7.97,17.78-17.78S37.18,4,27.38,4,9.91,11.7,9.63,21.26l4.48-.02c.79,0,1.19,1.12.63,1.77l-6.64,7.76c-.12.15-.28.22-.44.26,1.64,3.48,4.17,6.46,7.3,8.64-.49-.34-.97-.7-1.44-1.08Zm11.41-26.86c0-.83.67-1.5,1.5-1.5s1.5.67,1.5,1.5v10.43l9,5.35c.71.42.95,1.34.52,2.06-.28.47-.78.73-1.29.73-.26,0-.53-.07-.77-.21l-9.73-5.79c-.45-.27-.73-.76-.73-1.29v-11.28Z"/>
    <path fill="var(--dark)" d="m49.16,21.78c0,12.01-9.77,21.78-21.78,21.78-5.05,0-9.97-1.77-13.85-4.97-.85-.7-.97-1.96-.27-2.82.7-.85,1.96-.97,2.82-.27,3.17,2.62,7.19,4.06,11.31,4.06,9.8,0,17.78-7.97,17.78-17.78S37.18,4,27.38,4,9.91,11.7,9.63,21.26l4.48-.02c.79,0,1.19,1.12.63,1.77l-6.64,7.76c-.35.41-.91.41-1.26,0L.26,23.07c-.56-.65-.17-1.77.63-1.77l4.73-.02C5.88,9.5,15.54,0,27.38,0s21.78,9.77,21.78,21.78Zm-11.7,7.78c.42-.71.19-1.63-.52-2.06l-9-5.35v-10.43c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5,1.5v11.28c0,.53.28,1.02.73,1.29l9.73,5.79c.24.14.5.21.77.21.51,0,1.01-.26,1.29-.73Z"/>
  </svg>
);

const MainGame = () => {
  const MAX_GUESSES = 7;
  const realTodayStr = getTodayStr();
  const [copySuccess, setCopySuccess] = useState(false);

  // --- TIME MACHINE STATES ---
  const [activeDate, setActiveDate] = useState(realTodayStr);
  const [cursorDate, setCursorDate] = useState(activeDate);

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
  const initialGameState = (() => {
    const saved = localStorage.getItem(`stumped_gameState_${activeDate}`);
    return saved ? JSON.parse(saved) : { date: activeDate, guesses: [], status: 'playing', usedSilhouette: false };
  })();

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

  // --- SUGGESTIONS STATE (lifted from SearchBar) ---
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchBarRef = useRef(null);
  const suggestionsRef = useRef(null);
  const isOpen = suggestions.length > 0 && isSearchFocused;
  // Each result row is approx 2rem tall; cap at 300px
  const ITEM_HEIGHT_REM = 2;
  const suggestionsHeight = isOpen
    ? Math.min(suggestions.length * ITEM_HEIGHT_REM, 15) + 'rem'
    : '0px';

  const handleSuggestionsChange = useCallback((newSuggestions) => {
    setSuggestions(newSuggestions);
    setActiveSuggestionIndex(-1);
  }, []);

  // Keyboard nav for suggestions — lives here because suggestions state is here
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev === suggestions.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[activeSuggestionIndex]);
        }
      } else if (e.key === 'Escape') {
        setSuggestions([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, suggestions, activeSuggestionIndex]);

  const handleSuggestionSelect = (player) => {
    handleGuessSubmit(player);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    searchBarRef.current?.clear();
  };

  // --- RUNTIME EFFECTS ---
  // Re-sync components whenever the user switches dates on the calendar
useEffect(() => {
    setTargetPlayer(getDailyPlayerForDate(activeDate));
    
    const savedState = localStorage.getItem(`stumped_gameState_${activeDate}`);
    const parsedState = savedState ? JSON.parse(savedState) : { date: activeDate, guesses: [], status: 'playing', usedSilhouette: false };
    
    setGameState(parsedState);
    
    const savedTime = localStorage.getItem(`stumped_timer_${activeDate}`);
    setSeconds(savedTime ? parseInt(savedTime, 10) : 0);

    setActiveModal(parsedState.status !== 'playing' ? 'silhouette' : null);
    
  }, [activeDate]);

  // Save states to local storage on mutation
  useEffect(() => localStorage.setItem(`stumped_gameState_${activeDate}`, JSON.stringify(gameState)), [gameState, activeDate]);
  useEffect(() => localStorage.setItem('stumped_stats', JSON.stringify(stats)), [stats]);

// --- TIME MACHINE KEYBOARD NAVIGATION ---
  useEffect(() => {
    if (activeModal !== 'flashback') return;

    const handleKeyDown = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Enter') return;
      e.preventDefault();

      if (e.key === 'Enter') {
        // Only trigger the game change when ENTER is pressed
        setActiveDate(cursorDate);
        setActiveModal(null);
        return;
      }

      // Calculate movement based on the CURSOR date, not the active game date
      const [year, month, day] = cursorDate.split('-').map(Number);
      const current = new Date(year, month - 1, day);
      
      current.setDate(current.getDate() + (e.key === 'ArrowLeft' ? -1 : 1));
      
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const targetStr = `${y}-${m}-${d}`;

      const targetObj = new Date(y, current.getMonth(), current.getDate());
      
      if (targetObj >= LAUNCH_DATE && targetStr <= realTodayStr) {
         // Move the visual white ball
         setCursorDate(targetStr);
         
         // Flip the calendar page if necessary
         if (current.getMonth() !== calMonth || current.getFullYear() !== calYear) {
             setCalMonth(current.getMonth());
             setCalYear(current.getFullYear());
         }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, cursorDate, calMonth, calYear, realTodayStr]); 
  // --- FLASHBACK GLOBAL THEME TOGGLE ---
  useEffect(() => {
    if (activeDate !== realTodayStr) {
      document.body.classList.add('flashback-theme');
    } else {
      document.body.classList.remove('flashback-theme');
    }
    
    return () => document.body.classList.remove('flashback-theme');
  }, [activeDate, realTodayStr]);



  // Sync the cursor with the currently active game whenever the modal opens
  useEffect(() => {
    if (activeModal === 'flashback') {
      setCursorDate(activeDate);
    }
  }, [activeModal, activeDate]);

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
    const timeUsed = seconds;
    const mins = Math.floor(timeUsed / 60);
    const secs = String(timeUsed % 60).padStart(2, '0');

    // Header line
    let shareText = `🏏 Stumped #${gameNum} — ${attemptCount}/${MAX_GUESSES}\n`;

    // Result metadata
    shareText += gameStatus === 'won' ? `✅ Won in ${mins}m ${secs}s` : `❌ Lost`;
    shareText += ` | 🔥 Streak: ${stats.currentStreak}`;
    shareText += usedSilhouette ? ` | 👁️ Silhouette used` : ``;
    shareText += `\n\n`;

    // Emoji grid
    guesses.forEach(guess => {
      const result = getGuessResult(guess, targetPlayer);
      const getEmoji = (status) => status === 'exact' ? '🟩' : status === 'partial' ? '🟨' : '⬛';
      shareText += getEmoji(result.team.status);
      shareText += getEmoji(result.role.status);
      shareText += getEmoji(result.battingHand.status);
      shareText += getEmoji(result.age.status);
      shareText += getEmoji(result.debutYear.status);
      shareText += getEmoji(result.auctionPrice.status);
      shareText += getEmoji(result.matches.status);
      shareText += getEmoji(result.runs.status);
      shareText += getEmoji(result.wickets.status);
      shareText += '\n';
    });

    shareText += '\nhttps://stumped-seven.vercel.app/';

    navigator.clipboard.writeText(shareText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
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

            // Streak continues only if yesterday was also played (won or lost)
            // A skipped day breaks the streak just like a loss does
            const yesterdayDate = new Date(activeDate);
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
            const playedYesterday = !!newStats.history[yStr];

            if (playedYesterday) {
              newStats.currentStreak += 1;
            } else {
              newStats.currentStreak = 1; // restart — day was skipped
            }
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
        if (cellDateStr === cursorDate) {
          dayClass += "active-selection ";
        }
        if (cellDateStr === activeDate) {
          dayClass += "active-playing-day ";
        }
      }

      days.push(
        <div 
          key={i} 
          className={dayClass}
          onClick={() => {
            if (!isBeforeLaunch && !isFuture) {
              setActiveDate(cellDateStr);   // 1. Sets the actual game date
              setCursorDate(cellDateStr);   // 2. Snaps the white ball to the clicked day
              setActiveModal(null);         // 3. Closes the Time Machine to start playing
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
  const getBoxClass = (status) => {
  if (status === 'exact') return 'equal';  
  if (status === 'partial') return 'close';
  return 'far';                            
};
  const renderArrow = (direction) => {
  if (direction === 'up') {
    return (
      <svg className="arrow-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V4M5 11l7-7 7 7" />
      </svg>
    );
  }
  if (direction === 'down') {
    return (
      <svg className="arrow-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v16M5 13l7 7 7-7" />
      </svg>
    );
  }
  return null;
};
  const emptyRowsCount = Math.max(0, MAX_GUESSES - guesses.length);
  const winPercentage = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const displayDateStr = new Date(activeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="main-game-wrapper">
      
  {/* --- HEADER SECTION --- */}
      <header className="game-header">
        
        {/* --- LEFT SIDE: LOGO & TAGLINE --- */}
        <div className="group">
          {/* Poeltl hides this H1 off-screen for screen readers only */}
          <h1>STUMPED</h1>
          
          <a href="/" aria-label="Link to homepage" className="logo-link">
            <span className="logo">Stumped</span>
          </a>
          
          <h2>
            <span>
              An <a href="#" target="_blank" rel="noreferrer" className="ipl-brand">
                {/* <img src="public\ipl-logo-crop.svg" alt="IPL Logo" className="ipl-logo-img" /> */}
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" className="ipl-logo-img" viewBox="0 0 435 759">
<path d="M0 0 C1.61320381 1.42735084 3.21841377 2.86382956 4.8125 4.3125 C5.48925781 4.84875 6.16601562 5.385 6.86328125 5.9375 C30.91826674 25.2200535 43.78220393 59.50240519 47.34375 89.296875 C51.7209816 136.61740148 41.75993078 183.78021186 20.8125 226.3125 C20.3489209 227.26801758 19.8853418 228.22353516 19.40771484 229.20800781 C7.16518925 254.27087731 -8.1401586 278.62637718 -27.20703125 299.1171875 C-30.11210341 302.33740556 -32.6732883 305.78274397 -35.1875 309.3125 C-34.13949219 310.02212891 -34.13949219 310.02212891 -33.0703125 310.74609375 C-25.63252345 316.15060619 -25.63252345 316.15060619 -24.32421875 319.56640625 C-24.10559878 321.08094218 -23.89482817 322.59662925 -23.69140625 324.11328125 C-22.68360108 328.51168676 -19.30432999 331.22612763 -16.1875 334.3125 C-15.05399498 335.45764827 -13.92124737 336.6035465 -12.7890625 337.75 C-9.80507039 340.75955346 -6.80197302 343.74893666 -3.78710938 346.72753906 C-2.33761644 348.16375825 -0.89865023 349.61058221 0.5390625 351.05859375 C1.83228802 352.34070908 3.14591797 353.60462308 4.515625 354.8046875 C17.71831091 366.60708854 25.12615909 386.86223391 32.87231445 402.4387207 C33.79789563 404.28339365 34.74483816 406.11539902 35.69921875 407.9453125 C36.29347656 409.09773438 36.88773437 410.25015625 37.5 411.4375 C38.10199219 412.59507812 38.70398438 413.75265625 39.32421875 414.9453125 C40.74072269 418.15010619 41.4176244 420.8481247 41.8125 424.3125 C42.34617187 423.96316406 42.87984375 423.61382813 43.4296875 423.25390625 C49.11099533 419.78418019 54.08481032 417.92348393 60.8125 418.3125 C64.51601059 419.52455801 66.20942923 420.58881507 68.6875 423.5625 C70.2020478 427.26472796 70.40226196 429.31522451 69.8125 433.3125 C66.23743793 441.23451254 60.37552302 447.73801825 54.8125 454.3125 C53.89565727 455.45871915 52.98168771 456.60724127 52.0703125 457.7578125 C47.29463202 463.7207756 43.22225908 468.76665149 35.8125 471.3125 C24.64090367 475.64774634 17.3549511 480.5641687 9.0078125 489.109375 C7.12414689 490.99974405 5.21215554 492.76458097 3.1875 494.5 C-0.78945382 497.91447629 -4.61349892 501.47908335 -8.4375 505.0625 C-12.97774701 509.31684852 -17.52930431 513.5555656 -22.125 517.75 C-26.7463641 521.9816105 -31.35402209 526.22735057 -35.9375 530.5 C-36.6063623 531.12285889 -37.27522461 531.74571777 -37.96435547 532.38745117 C-41.56009687 535.76151378 -45.07790292 539.19117222 -48.51953125 542.72265625 C-49.22819336 543.44751221 -49.93685547 544.17236816 -50.66699219 544.91918945 C-52.01956717 546.31092126 -53.36325232 547.71136895 -54.69628906 549.12182617 C-58.61392095 553.15453211 -61.79888365 555.59531905 -67.1875 557.3125 C-68.5075 557.3125 -69.8275 557.3125 -71.1875 557.3125 C-71.65001705 559.68675421 -72.10851975 562.06160696 -72.5625 564.4375 C-72.69970459 565.15510498 -72.83690918 565.87270996 -72.97827148 566.61206055 C-74.09364204 572.56048544 -74.93405798 578.51020369 -75.66015625 584.51953125 C-76.1875 587.3125 -76.1875 587.3125 -78.1875 590.3125 C-84.66882212 589.96528632 -89.27045373 588.68638419 -94.1875 584.3125 C-96.38715834 581.60306683 -98.38329101 578.83075348 -100.328125 575.93359375 C-102.09723204 573.43974748 -103.96468787 571.40253353 -106.1875 569.3125 C-116.40642084 577.36465826 -124.3098435 587.72590116 -131.67895508 598.3527832 C-134.04260927 601.7599427 -136.54003944 604.9275558 -139.25 608.0625 C-142.42234158 612.01492558 -143.00897703 615.33515125 -143.1171875 620.34375 C-143.1875 622.3125 -143.1875 622.3125 -144.1875 623.3125 C-177.13856194 628.39044768 -177.13856194 628.39044768 -187.1875 621.3125 C-191.42257276 618.0307093 -192.24836954 614.39815023 -193.0625 609.3125 C-193.18906982 608.55646484 -193.31563965 607.80042969 -193.44604492 607.02148438 C-194.41765744 600.42375271 -193.78256455 594.77871975 -192.1875 588.3125 C-192.08566406 587.49136719 -191.98382813 586.67023437 -191.87890625 585.82421875 C-191.10243741 580.12052791 -189.02265665 577.58750031 -184.54296875 574.0625 C-183.37701172 573.19625 -183.37701172 573.19625 -182.1875 572.3125 C-173.26431612 565.37976836 -167.46631953 558.8071456 -161.296875 549.390625 C-159.3594549 546.56342678 -157.31592994 543.94501271 -155.125 541.3125 C-149.75807218 534.70303442 -145.51018373 527.62928718 -142.27734375 519.74609375 C-137.45442474 508.21277619 -132.25439208 501.57374907 -121.92724609 494.52099609 C-113.82353749 488.89184123 -107.95703824 481.51313604 -105.234375 471.97265625 C-104.62158726 468.08145413 -104.32660842 464.24294531 -104.1875 460.3125 C-104.15188965 459.46848633 -104.1162793 458.62447266 -104.07958984 457.75488281 C-103.28493288 435.7315327 -105.07455847 413.52217972 -111.1875 392.3125 C-111.67034176 390.12580826 -112.14973834 387.93835173 -112.625 385.75 C-113.88219238 380.63043326 -115.8064559 377.33320109 -119.1875 373.3125 C-120.12142578 373.7146875 -120.12142578 373.7146875 -121.07421875 374.125 C-124.43385423 375.54944796 -127.8067017 376.93924743 -131.1875 378.3125 C-131.96480469 378.62848145 -132.74210938 378.94446289 -133.54296875 379.27001953 C-145.26916063 383.99458405 -156.78118981 387.84099391 -169.1875 390.3125 C-168.1875 388.3125 -168.1875 388.3125 -164.59375 387.0078125 C-162.95867482 386.48330925 -161.32322611 385.95996971 -159.6875 385.4375 C-118.20669372 371.4795394 -78.47028146 343.4722427 -51.30859375 308.984375 C-49.88414982 307.19004784 -48.41658949 305.42919259 -46.91015625 303.703125 C-5.57136192 256.267361 16.21047953 192.80151527 13.8125 130.3125 C13.30123569 123.55422492 12.24173182 116.93394647 10.8125 110.3125 C10.66796387 109.6426709 10.52342773 108.9728418 10.37451172 108.28271484 C5.65121495 87.30248967 -2.94543362 68.49915621 -17.1875 52.3125 C-17.6515625 51.70535156 -18.115625 51.09820312 -18.59375 50.47265625 C-33.89497438 30.64637466 -61.49230363 19.65671377 -85.48413086 15.77978516 C-104.45979162 13.38546683 -124.70677741 14.61530124 -143.1875 19.3125 C-144.01040527 19.51617187 -144.83331055 19.71984375 -145.68115234 19.9296875 C-185.0171793 29.93940494 -220.70691207 52.7465968 -249.1875 81.3125 C-248.50830002 81.20862976 -247.82910004 81.10475952 -247.12931824 80.9977417 C-240.58913882 79.99766613 -234.04886457 78.99821307 -227.50849438 77.99938583 C-224.14957555 77.48640059 -220.7906991 76.97314187 -217.43188477 76.45947266 C-210.92844474 75.46495825 -204.42450831 74.47400282 -197.91943359 73.49023438 C-192.76278829 72.70939998 -187.61025658 71.90645623 -182.45947266 71.08789062 C-180.03158928 70.70954713 -177.60369273 70.33128811 -175.17578125 69.953125 C-174.06720261 69.77231384 -172.95862396 69.59150269 -171.81645203 69.4052124 C-163.63700023 68.14691481 -158.40693327 67.90062411 -151.1875 72.3125 C-150.1975 71.9825 -149.2075 71.6525 -148.1875 71.3125 C-147.1975 73.2925 -146.2075 75.2725 -145.1875 77.3125 C-145.5175 75.0025 -145.8475 72.6925 -146.1875 70.3125 C-142.3209716 73.534607 -141.30690982 76.46172412 -140.1875 81.3125 C-127.61354417 77.61481511 -127.61354417 77.61481511 -115.3125 73.125 C-113.1875 72.3125 -113.1875 72.3125 -110.1875 72.3125 C-110.5175 71.631875 -110.8475 70.95125 -111.1875 70.25 C-112.36057315 66.80409762 -112.32930493 63.92852578 -112.1875 60.3125 C-111.5275 60.3125 -110.8675 60.3125 -110.1875 60.3125 C-109.5275 59.6525 -108.8675 58.9925 -108.1875 58.3125 C-107.8575 60.6225 -107.5275 62.9325 -107.1875 65.3125 C-105.8675 65.3125 -104.5475 65.3125 -103.1875 65.3125 C-103.33058594 66.45525391 -103.33058594 66.45525391 -103.4765625 67.62109375 C-104.79467352 77.2486008 -104.79467352 77.2486008 -102.1875 86.3125 C-99.3216128 87.93631283 -96.36888286 88.55006514 -93.1875 89.3125 C-90.125 90.875 -90.125 90.875 -88.1875 92.3125 C-88.1875 92.9725 -88.1875 93.6325 -88.1875 94.3125 C-89.1775 94.8075 -89.1775 94.8075 -90.1875 95.3125 C-89.5275 95.6425 -88.8675 95.9725 -88.1875 96.3125 C-88.375 98.125 -88.375 98.125 -89.1875 100.3125 C-90.0125 100.76625 -90.8375 101.22 -91.6875 101.6875 C-94.52441703 103.12972878 -94.52441703 103.12972878 -95 106.5 C-95.061875 107.428125 -95.12375 108.35625 -95.1875 109.3125 C-91.93264286 110.30810336 -89.13792281 110.32846766 -85.75 110.1875 C-81.3752379 110.12901388 -78.67757712 110.42416032 -75.1875 113.3125 C-75.5877977 116.11458391 -76.01642214 118.05487443 -77.59521484 120.43237305 C-79.69740343 124.23481383 -80.45075666 127.98235605 -81.3515625 132.20703125 C-81.75553745 133.98654928 -82.16051986 135.76583885 -82.56640625 137.54492188 C-83.1890903 140.31540409 -83.80429369 143.08681172 -84.40087891 145.86303711 C-87.03691716 158.0385538 -90.51681042 168.1239199 -97.17272949 178.68185425 C-98.53518818 180.87120391 -99.76114486 183.12272885 -100.97265625 185.3984375 C-101.35437988 186.11281982 -101.73610352 186.82720215 -102.12939453 187.56323242 C-102.49919434 188.26424072 -102.86899414 188.96524902 -103.25 189.6875 C-103.65847168 190.46134033 -104.06694336 191.23518066 -104.48779297 192.0324707 C-108.78375184 200.28347901 -112.5306836 208.76290411 -116.1875 217.3125 C-115.135625 218.1478125 -115.135625 218.1478125 -114.0625 219 C-108.78653204 223.24371336 -103.79637623 227.55569476 -99.08203125 232.4140625 C-97.18744072 234.3125594 -95.22237592 236.0660628 -93.1875 237.8125 C-85.40649534 244.56234784 -79.61832945 251.18116494 -74.4375 260.125 C-73.23354175 262.15990297 -72.02777984 264.19373978 -70.8203125 266.2265625 C-70.21993164 267.24137695 -69.61955078 268.25619141 -69.00097656 269.30175781 C-67.25445843 272.20133531 -65.45396593 275.05534437 -63.6171875 277.8984375 C-62.7813916 279.19237427 -62.7813916 279.19237427 -61.92871094 280.51245117 C-60.87341512 282.13668216 -59.81182893 283.75684828 -58.74316406 285.37231445 C-58.03885254 286.46225708 -58.03885254 286.46225708 -57.3203125 287.57421875 C-56.69987061 288.51720825 -56.69987061 288.51720825 -56.06689453 289.47924805 C-55.1875 291.3125 -55.1875 291.3125 -55.1875 295.3125 C-54.40375 295.415625 -53.62 295.51875 -52.8125 295.625 C-50.1875 296.3125 -50.1875 296.3125 -48.1875 299.3125 C-53.32039548 305.69524946 -58.54842371 311.91913295 -64.06640625 317.97265625 C-65.99536335 320.10054815 -67.87786353 322.25970859 -69.75 324.4375 C-75.72269982 331.27720463 -82.23619054 337.47991691 -89.1875 343.3125 C-89.7340625 343.77285645 -90.280625 344.23321289 -90.84375 344.70751953 C-98.34701078 351.00064106 -105.98012341 357.06254986 -114 362.6875 C-114.67546875 363.16993164 -115.3509375 363.65236328 -116.046875 364.14941406 C-117.70549071 365.28822843 -119.44194691 366.3120258 -121.1875 367.3125 C-122.1775 366.9825 -123.1675 366.6525 -124.1875 366.3125 C-125.38690425 363.91369149 -125.31268975 362.39625217 -125.328125 359.71875 C-125.49142782 349.99973269 -125.83333706 340.66167618 -128.4375 331.25 C-128.62989258 330.53199219 -128.82228516 329.81398438 -129.02050781 329.07421875 C-131.16779164 321.98649135 -135.36419081 317.71476781 -141.1875 313.1875 C-146.18297321 309.19651466 -150.88449913 304.97762214 -155.55834961 300.61694336 C-158.41862124 297.94863626 -161.29122646 295.30976881 -164.25 292.75 C-171.59273821 286.38733066 -178.76882451 279.82986141 -185.57421875 272.89453125 C-187.23918986 271.26181139 -188.97200722 269.7584865 -190.75 268.25 C-194.80387619 264.72384734 -198.70366432 261.04953458 -202.5625 257.3125 C-203.1819751 256.73105225 -203.8014502 256.14960449 -204.43969727 255.55053711 C-210.76684423 249.3419969 -211.46149273 242.90886418 -211.8125 234.375 C-211.85117188 233.59576172 -211.88984375 232.81652344 -211.9296875 232.01367188 C-212.02294127 230.11362621 -212.10625962 228.21309722 -212.1875 226.3125 C-212.96738281 226.11398437 -213.74726563 225.91546875 -214.55078125 225.7109375 C-217.1875 224.3125 -217.1875 224.3125 -218.48046875 221.4140625 C-218.77566406 220.26679688 -219.07085937 219.11953125 -219.375 217.9375 C-220.51765195 213.42144691 -220.51765195 213.42144691 -222.30078125 209.1484375 C-223.1875 207.3125 -223.1875 207.3125 -223.1875 203.3125 C-221.2075 202.6525 -219.2275 201.9925 -217.1875 201.3125 C-217.87457031 200.85101563 -218.56164062 200.38953125 -219.26953125 199.9140625 C-224.93098674 195.81578428 -227.90567165 193.12158946 -229.34765625 186.26953125 C-230.45689063 182.36399439 -232.33255104 179.06181947 -234.25 175.5 C-238.9452308 166.44081655 -241.73298885 158.19224144 -238.625 148.0625 C-233.89340166 136.02709214 -228.02866458 127.16043711 -216.1875 121.3125 C-206.02858959 117.36181262 -196.96405918 119.30088461 -187.1875 123.3125 C-180.14311561 126.83469219 -175.31302597 133.71826296 -171.3671875 140.390625 C-168.75694983 143.88965328 -166.32181427 145.24534286 -162.4375 147.1875 C-161.26703125 147.78304687 -160.0965625 148.37859375 -158.890625 148.9921875 C-157.55257812 149.64574219 -157.55257812 149.64574219 -156.1875 150.3125 C-156.89253901 154.61395014 -157.71849599 156.5372968 -161.1875 159.3125 C-162.5075 159.6425 -163.8275 159.9725 -165.1875 160.3125 C-164.5275 162.9525 -163.8675 165.5925 -163.1875 168.3125 C-159.8875 167.6525 -156.5875 166.9925 -153.1875 166.3125 C-152.8575 167.9625 -152.5275 169.6125 -152.1875 171.3125 C-151.8575 171.9725 -151.5275 172.6325 -151.1875 173.3125 C-148.45254831 171.05319209 -145.82657684 168.68267527 -143.1875 166.3125 C-142.64625488 165.85601074 -142.10500977 165.39952148 -141.54736328 164.92919922 C-130.67338721 155.70033009 -123.27124455 144.72880178 -121.99511719 130.10839844 C-121.93417849 126.39113808 -122.31084913 122.91650911 -123.1875 119.3125 C-124.944298 110.77760821 -124.944298 110.77760821 -124.1875 106.3125 C-119.72774937 102.15282539 -114.5515676 100.16229612 -108.5 100.25 C-107.69175781 100.25902344 -106.88351563 100.26804687 -106.05078125 100.27734375 C-105.43589844 100.28894531 -104.82101563 100.30054688 -104.1875 100.3125 C-104.77905331 98.99426698 -105.38621463 97.68302949 -106 96.375 C-106.33644531 95.64410156 -106.67289063 94.91320312 -107.01953125 94.16015625 C-108.12350134 91.98220511 -108.12350134 91.98220511 -111.1875 91.3125 C-111.1875 90.6525 -111.1875 89.9925 -111.1875 89.3125 C-119.22330397 91.83981025 -119.22330397 91.83981025 -125.1875 97.3125 C-125.7854379 100.01621918 -126.00214199 102.5321299 -126.1875 105.3125 C-131.04413211 105.71721934 -134.96627325 105.37114767 -139.3203125 103.05859375 C-143.35928332 99.28156456 -144.72976889 93.5126754 -146.1875 88.3125 C-146.1875 87.6525 -146.1875 86.9925 -146.1875 86.3125 C-150.58966975 87.50435882 -150.58966975 87.50435882 -154.08084106 90.30706787 C-156.50543985 92.61516256 -157.89026358 93.03850409 -161.14404297 93.64941406 C-162.63510056 93.9409864 -162.63510056 93.9409864 -164.15628052 94.2384491 C-165.23650482 94.43304214 -166.31672913 94.62763519 -167.4296875 94.828125 C-168.56542206 95.04515579 -169.70115662 95.26218658 -170.87130737 95.48579407 C-174.59896189 96.19359235 -178.33041831 96.87846317 -182.0625 97.5625 C-184.63853345 98.04579742 -187.21437862 98.53009946 -189.79003906 99.01538086 C-212.16894447 103.20985378 -234.58571339 107.22420404 -257.04650879 110.95666504 C-259.01422701 111.28370185 -260.98126916 111.61479971 -262.94824219 111.94628906 C-269.62050699 113.03128964 -276.18269184 113.70474411 -282.9375 113.9375 C-283.90631104 113.97399658 -284.87512207 114.01049316 -285.87329102 114.0480957 C-326.37094679 115.43116369 -326.37094679 115.43116369 -336.1875 112.3125 C-339.89744207 107.75434467 -340.89140783 102.07807262 -341.1875 96.3125 C-340.52790242 93.57517003 -339.61212163 91.77819128 -338.1875 89.3125 C-333.5675 89.3125 -328.9475 89.3125 -324.1875 89.3125 C-324.1875 89.9725 -324.1875 90.6325 -324.1875 91.3125 C-328.4775 92.6325 -332.7675 93.9525 -337.1875 95.3125 C-287.68944428 100.57193351 -238.53657605 88.51132714 -190.2066803 79.21937561 C-189.50812424 79.08510666 -188.80956818 78.95083771 -188.08984375 78.8125 C-187.41163071 78.68213852 -186.73341766 78.55177704 -186.03465271 78.41746521 C-181.71843917 77.59239536 -177.39623272 76.81263554 -173.06640625 76.0625 C-172.01428955 75.87921143 -170.96217285 75.69592285 -169.87817383 75.50708008 C-167.99000293 75.18149013 -166.10058647 74.86299876 -164.2097168 74.5534668 C-162.19003897 74.20462636 -160.18564679 73.76878677 -158.1875 73.3125 C-157.8575 72.6525 -157.5275 71.9925 -157.1875 71.3125 C-157.74854431 71.39940094 -158.30958862 71.48630188 -158.88763428 71.57583618 C-185.99968202 75.76605314 -213.11400738 79.71463797 -240.375 82.8125 C-241.51022095 82.94182922 -242.64544189 83.07115845 -243.81506348 83.20440674 C-247.01562779 83.56709853 -250.216602 83.92571552 -253.41796875 84.28125 C-254.36860703 84.38710419 -255.3192453 84.49295837 -256.2986908 84.60202026 C-257.60139671 84.74391281 -257.60139671 84.74391281 -258.93041992 84.88867188 C-259.68465744 84.97113159 -260.43889496 85.05359131 -261.21598816 85.1385498 C-263.1875 85.3125 -263.1875 85.3125 -266.1875 85.3125 C-264.5419271 81.44493884 -261.96577058 78.46343298 -259.25 75.3125 C-258.76055908 74.74072021 -258.27111816 74.16894043 -257.7668457 73.57983398 C-245.29230718 59.08779604 -232.26078285 45.13109289 -217.1875 33.3125 C-216.02278009 32.36046514 -214.86013933 31.40588287 -213.69921875 30.44921875 C-205.2111733 23.48649973 -196.48788734 17.14578182 -187.1875 11.3125 C-186.54651367 10.90821777 -185.90552734 10.50393555 -185.24511719 10.08740234 C-132.49410875 -22.8721802 -53.42747715 -43.24378675 0 0 Z M-120.75 78.0625 C-121.5632373 78.33400879 -122.37647461 78.60551758 -123.21435547 78.88525391 C-128.6944573 80.7412227 -133.96972074 82.80023591 -139.1875 85.3125 C-138.8575 86.3025 -138.5275 87.2925 -138.1875 88.3125 C-131.45317877 87.74865943 -125.55291026 85.96691874 -119.1875 83.75 C-118.22199219 83.42064453 -117.25648438 83.09128906 -116.26171875 82.75195312 C-113.90120194 81.94563798 -111.54333283 81.13237837 -109.1875 80.3125 C-109.5175 78.6625 -109.8475 77.0125 -110.1875 75.3125 C-113.84448728 75.3125 -117.30646722 76.90730807 -120.75 78.0625 Z M-144.1875 78.3125 C-143.8575 79.6325 -143.5275 80.9525 -143.1875 82.3125 C-142.8575 81.6525 -142.5275 80.9925 -142.1875 80.3125 C-142.8475 79.6525 -143.5075 78.9925 -144.1875 78.3125 Z M-159.1875 173.3125 C-160.1775 173.9725 -161.1675 174.6325 -162.1875 175.3125 C-160.5375 174.9825 -158.8875 174.6525 -157.1875 174.3125 C-157.8475 173.9825 -158.5075 173.6525 -159.1875 173.3125 Z M-158.1875 175.3125 C-157.1875 177.3125 -157.1875 177.3125 -157.1875 177.3125 Z M-157.1875 178.3125 C-156.1875 180.3125 -156.1875 180.3125 -156.1875 180.3125 Z M-176.1875 180.3125 C-174.8675 180.6425 -173.5475 180.9725 -172.1875 181.3125 C-171.8575 180.3225 -171.5275 179.3325 -171.1875 178.3125 C-173.51107511 178.12759993 -173.51107511 178.12759993 -176.1875 180.3125 Z M-156.1875 181.3125 C-156.1875 181.9725 -156.1875 182.6325 -156.1875 183.3125 C-157.1775 183.8075 -157.1775 183.8075 -158.1875 184.3125 C-157.1975 184.3125 -156.2075 184.3125 -155.1875 184.3125 C-154.8575 183.3225 -154.5275 182.3325 -154.1875 181.3125 C-154.8475 181.3125 -155.5075 181.3125 -156.1875 181.3125 Z M-190.1875 183.3125 C-189.1975 183.8075 -189.1975 183.8075 -188.1875 184.3125 C-187.8575 184.9725 -187.5275 185.6325 -187.1875 186.3125 C-187.1875 185.3225 -187.1875 184.3325 -187.1875 183.3125 C-188.1775 183.3125 -189.1675 183.3125 -190.1875 183.3125 Z M-155.1875 185.3125 C-155.1875 188.9425 -155.1875 192.5725 -155.1875 196.3125 C-154.8575 196.3125 -154.5275 196.3125 -154.1875 196.3125 C-154.1875 192.6825 -154.1875 189.0525 -154.1875 185.3125 C-154.5175 185.3125 -154.8475 185.3125 -155.1875 185.3125 Z M-189.1875 187.3125 C-188.1875 189.3125 -188.1875 189.3125 -188.1875 189.3125 Z M-171.1875 187.3125 C-171.1875 187.9725 -171.1875 188.6325 -171.1875 189.3125 C-172.1775 189.8075 -172.1775 189.8075 -173.1875 190.3125 C-171.5375 189.9825 -169.8875 189.6525 -168.1875 189.3125 C-169.1775 188.6525 -170.1675 187.9925 -171.1875 187.3125 Z M-216.1875 189.3125 C-216.1875 189.6425 -216.1875 189.9725 -216.1875 190.3125 C-214.2075 190.3125 -212.2275 190.3125 -210.1875 190.3125 C-210.1875 189.9825 -210.1875 189.6525 -210.1875 189.3125 C-212.1675 189.3125 -214.1475 189.3125 -216.1875 189.3125 Z M-190.1875 190.3125 C-189.1875 192.3125 -189.1875 192.3125 -189.1875 192.3125 Z M-170.1875 191.3125 C-169.1875 194.3125 -169.1875 194.3125 -169.1875 194.3125 Z M-191.1875 193.3125 C-190.8575 193.9725 -190.5275 194.6325 -190.1875 195.3125 C-188.5375 194.9825 -186.8875 194.6525 -185.1875 194.3125 C-185.1875 193.9825 -185.1875 193.6525 -185.1875 193.3125 C-187.1675 193.3125 -189.1475 193.3125 -191.1875 193.3125 Z M-199.1875 194.3125 C-199.1875 194.6425 -199.1875 194.9725 -199.1875 195.3125 C-197.2075 195.3125 -195.2275 195.3125 -193.1875 195.3125 C-193.1875 194.9825 -193.1875 194.6525 -193.1875 194.3125 C-195.1675 194.3125 -197.1475 194.3125 -199.1875 194.3125 Z M-205.1875 195.3125 C-201.1875 196.3125 -201.1875 196.3125 -201.1875 196.3125 Z M-192.1875 196.3125 C-191.1875 198.3125 -191.1875 198.3125 -191.1875 198.3125 Z M-169.1875 196.3125 C-169.1875 198.2925 -169.1875 200.2725 -169.1875 202.3125 C-170.1775 202.8075 -170.1775 202.8075 -171.1875 203.3125 C-166.70866304 202.86546014 -166.70866304 202.86546014 -163.1875 200.3125 C-164.8375 200.6425 -166.4875 200.9725 -168.1875 201.3125 C-168.1875 199.6625 -168.1875 198.0125 -168.1875 196.3125 C-168.5175 196.3125 -168.8475 196.3125 -169.1875 196.3125 Z M-193.1875 199.3125 C-192.1875 201.3125 -192.1875 201.3125 -192.1875 201.3125 Z M-178.1875 204.3125 C-174.1875 205.3125 -174.1875 205.3125 -174.1875 205.3125 Z M-183.1875 205.3125 C-183.1875 205.6425 -183.1875 205.9725 -183.1875 206.3125 C-181.5375 206.3125 -179.8875 206.3125 -178.1875 206.3125 C-178.1875 205.9825 -178.1875 205.6525 -178.1875 205.3125 C-179.8375 205.3125 -181.4875 205.3125 -183.1875 205.3125 Z M-191.1875 206.3125 C-191.1875 206.6425 -191.1875 206.9725 -191.1875 207.3125 C-188.5475 207.3125 -185.9075 207.3125 -183.1875 207.3125 C-183.1875 206.9825 -183.1875 206.6525 -183.1875 206.3125 C-185.8275 206.3125 -188.4675 206.3125 -191.1875 206.3125 Z M-195.1875 205.3125 C-195.1875 205.9725 -195.1875 206.6325 -195.1875 207.3125 C-196.1775 207.6425 -197.1675 207.9725 -198.1875 208.3125 C-195.8775 208.3125 -193.5675 208.3125 -191.1875 208.3125 C-192.1775 207.9825 -193.1675 207.6525 -194.1875 207.3125 C-194.5175 206.6525 -194.8475 205.9925 -195.1875 205.3125 Z M49.4375 423.25 C48.37789063 423.81589844 47.31828125 424.38179687 46.2265625 424.96484375 C45.42992187 425.40957031 44.63328125 425.85429688 43.8125 426.3125 C43.96847656 426.85777344 44.12445313 427.40304687 44.28515625 427.96484375 C45.68213541 433.37698155 47.03721484 438.97318439 44.8125 444.3125 C42.11088504 446.84966883 39.02572157 448.49874757 35.8125 450.3125 C31.4920411 453.32624668 27.39640572 456.42993547 23.8125 460.3125 C24.1425 460.9725 24.4725 461.6325 24.8125 462.3125 C34.85217769 457.82731855 42.5372959 452.62599119 50.8125 445.3125 C52.78616752 443.7223171 54.76515073 442.13870383 56.75 440.5625 C62.36450286 435.96705232 62.36450286 435.96705232 66.8125 430.3125 C66.89176299 426.9834543 66.11019779 425.70943039 64.125 423.0625 C58.90569761 419.11275765 54.86187539 420.29672895 49.4375 423.25 Z M-58.1875 442.3125 C-58.1875 442.6425 -58.1875 442.9725 -58.1875 443.3125 C-54.5575 443.3125 -50.9275 443.3125 -47.1875 443.3125 C-47.1875 442.9825 -47.1875 442.6525 -47.1875 442.3125 C-50.8175 442.3125 -54.4475 442.3125 -58.1875 442.3125 Z M-63.1875 443.3125 C-63.8475 443.9725 -64.5075 444.6325 -65.1875 445.3125 C-63.5375 445.3125 -61.8875 445.3125 -60.1875 445.3125 C-59.8575 444.6525 -59.5275 443.9925 -59.1875 443.3125 C-60.5075 443.3125 -61.8275 443.3125 -63.1875 443.3125 Z M-46.1875 443.3125 C-42.1875 444.3125 -42.1875 444.3125 -42.1875 444.3125 Z M-42.1875 444.3125 C-38.1875 445.3125 -38.1875 445.3125 -38.1875 445.3125 Z M-87.75 562.8125 C-88.76191406 563.0909375 -89.77382813 563.369375 -90.81640625 563.65625 C-91.59886719 563.8728125 -92.38132812 564.089375 -93.1875 564.3125 C-92.61651727 568.14624121 -91.54983216 570.81778359 -89.4375 574.0625 C-88.94765625 574.84109375 -88.4578125 575.6196875 -87.953125 576.421875 C-85.78398575 578.74458163 -84.29522002 578.99538571 -81.1875 579.3125 C-79.90384613 576.74519226 -80.05474365 574.86597003 -80.0625 572 C-80.05992187 571.05511719 -80.05734375 570.11023438 -80.0546875 569.13671875 C-80.182137 566.42654264 -80.58153774 563.95276415 -81.1875 561.3125 C-83.38598934 561.3125 -85.65372194 562.2342164 -87.75 562.8125 Z M-183.1875 597.3125 C-183.9927969 600.23594732 -183.9927969 600.23594732 -184.125 603.375 C-184.21652344 604.41785156 -184.30804688 605.46070313 -184.40234375 606.53515625 C-184.40906537 609.2499346 -184.40906537 609.2499346 -183.12890625 610.99609375 C-177.46483812 614.83671942 -172.25535747 615.83529151 -165.5625 616.125 C-164.82515625 616.17591797 -164.0878125 616.22683594 -163.328125 616.27929688 C-159.17392866 616.49891837 -155.78401505 616.53792981 -152.1875 614.3125 C-150.61828628 611.11185704 -151.39022498 608.56424284 -152.375 605.25 C-152.61605469 604.39277344 -152.85710937 603.53554688 -153.10546875 602.65234375 C-154.8862569 598.80146973 -157.27444669 597.673615 -161.140625 596.14453125 C-173.12722568 591.79004427 -173.12722568 591.79004427 -183.1875 597.3125 Z "fill="var(--dark)" transform="translate(353.1875,117.6875)"/>
<path d="M0 0 C4.34484435 1.71035143 7.51141349 4.3660209 10.4609375 7.96875 C11.171875 10.15234375 11.171875 10.15234375 11.5234375 12.40625 C12.42287234 18.17037006 15.40335118 20.95081437 19.4609375 24.96875 C20.59444252 26.11389827 21.72719013 27.2597965 22.859375 28.40625 C25.84336711 31.41580346 28.84646448 34.40518666 31.86132812 37.38378906 C33.31082106 38.82000825 34.74978727 40.26683221 36.1875 41.71484375 C37.48072552 42.99695908 38.79435547 44.26087308 40.1640625 45.4609375 C53.36674841 57.26333854 60.77459659 77.51848391 68.52075195 93.0949707 C69.44633313 94.93964365 70.39327566 96.77164902 71.34765625 98.6015625 C71.94191406 99.75398437 72.53617188 100.90640625 73.1484375 102.09375 C73.75042969 103.25132812 74.35242188 104.40890625 74.97265625 105.6015625 C76.38916019 108.80635619 77.0660619 111.5043747 77.4609375 114.96875 C77.99460937 114.61941406 78.52828125 114.27007813 79.078125 113.91015625 C84.75943283 110.44043019 89.73324782 108.57973393 96.4609375 108.96875 C100.16444809 110.18080801 101.85786673 111.24506507 104.3359375 114.21875 C105.8504853 117.92097796 106.05069946 119.97147451 105.4609375 123.96875 C101.88587543 131.89076254 96.02396052 138.39426825 90.4609375 144.96875 C89.54409477 146.11496915 88.63012521 147.26349127 87.71875 148.4140625 C82.94306952 154.3770256 78.87069658 159.42290149 71.4609375 161.96875 C60.28934117 166.30399634 53.0033886 171.2204187 44.65625 179.765625 C42.77258439 181.65599405 40.86059304 183.42083097 38.8359375 185.15625 C34.85898368 188.57072629 31.03493858 192.13533335 27.2109375 195.71875 C22.67069049 199.97309852 18.11913319 204.2118156 13.5234375 208.40625 C8.9020734 212.6378605 4.29441541 216.88360057 -0.2890625 221.15625 C-0.9579248 221.77910889 -1.62678711 222.40196777 -2.31591797 223.04370117 C-5.91165937 226.41776378 -9.42946542 229.84742222 -12.87109375 233.37890625 C-13.57975586 234.10376221 -14.28841797 234.82861816 -15.01855469 235.57543945 C-16.37112967 236.96717126 -17.71481482 238.36761895 -19.04785156 239.77807617 C-22.96548345 243.81078211 -26.15044615 246.25156905 -31.5390625 247.96875 C-32.8590625 247.96875 -34.1790625 247.96875 -35.5390625 247.96875 C-36.00157955 250.34300421 -36.46008225 252.71785696 -36.9140625 255.09375 C-37.05126709 255.81135498 -37.18847168 256.52895996 -37.32983398 257.26831055 C-38.44520454 263.21673544 -39.28562048 269.16645369 -40.01171875 275.17578125 C-40.5390625 277.96875 -40.5390625 277.96875 -42.5390625 280.96875 C-49.02038462 280.62153632 -53.62201623 279.34263419 -58.5390625 274.96875 C-60.73872084 272.25931683 -62.73485351 269.48700348 -64.6796875 266.58984375 C-66.44879454 264.09599748 -68.31625037 262.05878353 -70.5390625 259.96875 C-80.75798334 268.02090826 -88.661406 278.38215116 -96.03051758 289.0090332 C-98.39417177 292.4161927 -100.89160194 295.5838058 -103.6015625 298.71875 C-106.77390408 302.67117558 -107.36053953 305.99140125 -107.46875 311 C-107.5390625 312.96875 -107.5390625 312.96875 -108.5390625 313.96875 C-141.49012444 319.04669768 -141.49012444 319.04669768 -151.5390625 311.96875 C-155.77413526 308.6869593 -156.59993204 305.05440023 -157.4140625 299.96875 C-157.54063232 299.21271484 -157.66720215 298.45667969 -157.79760742 297.67773438 C-158.76921994 291.08000271 -158.13412705 285.43496975 -156.5390625 278.96875 C-156.43722656 278.14761719 -156.33539063 277.32648438 -156.23046875 276.48046875 C-155.45399991 270.77677791 -153.37421915 268.24375031 -148.89453125 264.71875 C-147.72857422 263.8525 -147.72857422 263.8525 -146.5390625 262.96875 C-137.61587862 256.03601836 -131.81788203 249.4633956 -125.6484375 240.046875 C-123.7110174 237.21967678 -121.66749244 234.60126271 -119.4765625 231.96875 C-114.10963468 225.35928442 -109.86174623 218.28553718 -106.62890625 210.40234375 C-101.80598724 198.86902619 -96.60595458 192.22999907 -86.27880859 185.17724609 C-78.17509999 179.54809123 -72.30860074 172.16938604 -69.5859375 162.62890625 C-68.97314976 158.73770413 -68.67817092 154.89919531 -68.5390625 150.96875 C-68.48564697 149.70272949 -68.48564697 149.70272949 -68.43115234 148.41113281 C-67.63649538 126.3877827 -69.42612097 104.17842972 -75.5390625 82.96875 C-76.02190426 80.78205826 -76.50130084 78.59460173 -76.9765625 76.40625 C-78.22833044 71.25931589 -80.34789853 68.13499186 -83.5390625 63.96875 C-82.5390625 60.96875 -82.5390625 60.96875 -79.79296875 59.34765625 C-78.56539559 58.73633809 -77.33465872 58.13134955 -76.1015625 57.53125 C-63.11994964 50.91016951 -51.18220777 42.4892138 -39.7265625 33.515625 C-37.5390625 31.96875 -37.5390625 31.96875 -35.5390625 31.96875 C-35.0440625 30.48375 -35.0440625 30.48375 -34.5390625 28.96875 C-32.32421875 26.92578125 -32.32421875 26.92578125 -29.6015625 24.78125 C-28.25771484 23.70810547 -28.25771484 23.70810547 -26.88671875 22.61328125 C-24.5390625 20.96875 -24.5390625 20.96875 -22.5390625 20.96875 C-22.28125 20.37320312 -22.0234375 19.77765625 -21.7578125 19.1640625 C-20.43094856 16.7740063 -19.14796907 15.56371888 -17.0390625 13.84375 C-12.62837006 10.16415594 -8.79708938 6.05672784 -4.93359375 1.8125 C-2.5390625 -0.03125 -2.5390625 -0.03125 0 0 Z M85.0859375 113.90625 C84.02632812 114.47214844 82.96671875 115.03804687 81.875 115.62109375 C81.07835937 116.06582031 80.28171875 116.51054688 79.4609375 116.96875 C79.61691406 117.51402344 79.77289063 118.05929687 79.93359375 118.62109375 C81.33057291 124.03323155 82.68565234 129.62943439 80.4609375 134.96875 C77.75932254 137.50591883 74.67415907 139.15499757 71.4609375 140.96875 C67.1404786 143.98249668 63.04484322 147.08618547 59.4609375 150.96875 C59.7909375 151.62875 60.1209375 152.28875 60.4609375 152.96875 C70.50061519 148.48356855 78.1857334 143.28224119 86.4609375 135.96875 C88.43460502 134.3785671 90.41358823 132.79495383 92.3984375 131.21875 C98.01294036 126.62330232 98.01294036 126.62330232 102.4609375 120.96875 C102.54020049 117.6397043 101.75863529 116.36568039 99.7734375 113.71875 C94.55413511 109.76900765 90.51031289 110.95297895 85.0859375 113.90625 Z M-22.5390625 132.96875 C-22.5390625 133.29875 -22.5390625 133.62875 -22.5390625 133.96875 C-18.9090625 133.96875 -15.2790625 133.96875 -11.5390625 133.96875 C-11.5390625 133.63875 -11.5390625 133.30875 -11.5390625 132.96875 C-15.1690625 132.96875 -18.7990625 132.96875 -22.5390625 132.96875 Z M-27.5390625 133.96875 C-28.1990625 134.62875 -28.8590625 135.28875 -29.5390625 135.96875 C-27.8890625 135.96875 -26.2390625 135.96875 -24.5390625 135.96875 C-24.2090625 135.30875 -23.8790625 134.64875 -23.5390625 133.96875 C-24.8590625 133.96875 -26.1790625 133.96875 -27.5390625 133.96875 Z M-10.5390625 133.96875 C-6.5390625 134.96875 -6.5390625 134.96875 -6.5390625 134.96875 Z M-6.5390625 134.96875 C-2.5390625 135.96875 -2.5390625 135.96875 -2.5390625 135.96875 Z M-52.1015625 253.46875 C-53.11347656 253.7471875 -54.12539063 254.025625 -55.16796875 254.3125 C-55.95042969 254.5290625 -56.73289062 254.745625 -57.5390625 254.96875 C-56.96807977 258.80249121 -55.90139466 261.47403359 -53.7890625 264.71875 C-53.29921875 265.49734375 -52.809375 266.2759375 -52.3046875 267.078125 C-50.13554825 269.40083163 -48.64678252 269.65163571 -45.5390625 269.96875 C-44.25540863 267.40144226 -44.40630615 265.52222003 -44.4140625 262.65625 C-44.41148437 261.71136719 -44.40890625 260.76648438 -44.40625 259.79296875 C-44.5336995 257.08279264 -44.93310024 254.60901415 -45.5390625 251.96875 C-47.73755184 251.96875 -50.00528444 252.8904664 -52.1015625 253.46875 Z M-147.5390625 287.96875 C-148.3443594 290.89219732 -148.3443594 290.89219732 -148.4765625 294.03125 C-148.56808594 295.07410156 -148.65960938 296.11695313 -148.75390625 297.19140625 C-148.76062787 299.9061846 -148.76062787 299.9061846 -147.48046875 301.65234375 C-141.81640062 305.49296942 -136.60691997 306.49154151 -129.9140625 306.78125 C-129.17671875 306.83216797 -128.439375 306.88308594 -127.6796875 306.93554688 C-123.52549116 307.15516837 -120.13557755 307.19417981 -116.5390625 304.96875 C-114.96984878 301.76810704 -115.74178748 299.22049284 -116.7265625 295.90625 C-116.96761719 295.04902344 -117.20867187 294.19179688 -117.45703125 293.30859375 C-119.2378194 289.45771973 -121.62600919 288.329865 -125.4921875 286.80078125 C-137.47878818 282.44629427 -137.47878818 282.44629427 -147.5390625 287.96875 Z "fill="var(--dark)" transform="translate(317.5390625,427.03125)"/>
<path d="M0 0 C1.61320381 1.42735084 3.21841377 2.86382956 4.8125 4.3125 C5.48925781 4.84875 6.16601562 5.385 6.86328125 5.9375 C30.91826674 25.2200535 43.78220393 59.50240519 47.34375 89.296875 C51.7209816 136.61740148 41.75993078 183.78021186 20.8125 226.3125 C20.3489209 227.26801758 19.8853418 228.22353516 19.40771484 229.20800781 C7.18187549 254.23671728 -8.11475683 278.68212199 -27.171875 299.14453125 C-29.09659611 301.21472547 -30.92497487 303.34203109 -32.75 305.5 C-35.60975218 308.78609138 -38.70000821 311.58615299 -42.01953125 314.3984375 C-44.51852333 316.60475484 -46.84660047 318.93933693 -49.1875 321.3125 C-55.19421218 327.37431963 -61.39053464 332.88161781 -68.328125 337.85546875 C-70.24237399 339.28594424 -70.24237399 339.28594424 -71.921875 341.11328125 C-75.09819189 344.1964992 -78.60320688 346.7236291 -82.1875 349.3125 C-82.97060547 349.878479 -83.75371094 350.44445801 -84.56054688 351.02758789 C-92.68965307 356.81033844 -101.18708257 361.91653532 -109.8125 366.91748047 C-111.44794626 367.8781034 -113.07247159 368.85748348 -114.6875 369.85205078 C-120.03950356 373.14646501 -125.37197651 375.93396024 -131.1875 378.3125 C-131.99566162 378.64717285 -132.80382324 378.9818457 -133.63647461 379.32666016 C-145.15241036 384.01796518 -156.87612991 388.32679515 -169.1875 390.3125 C-168.1875 388.3125 -168.1875 388.3125 -164.59375 387.0078125 C-162.95867482 386.48330925 -161.32322611 385.95996971 -159.6875 385.4375 C-118.20669372 371.4795394 -78.47028146 343.4722427 -51.30859375 308.984375 C-49.88414982 307.19004784 -48.41658949 305.42919259 -46.91015625 303.703125 C-5.57136192 256.267361 16.21047953 192.80151527 13.8125 130.3125 C13.30123569 123.55422492 12.24173182 116.93394647 10.8125 110.3125 C10.66796387 109.6426709 10.52342773 108.9728418 10.37451172 108.28271484 C5.65121495 87.30248967 -2.94543362 68.49915621 -17.1875 52.3125 C-17.6515625 51.70535156 -18.115625 51.09820312 -18.59375 50.47265625 C-33.89497438 30.64637466 -61.49230363 19.65671377 -85.48413086 15.77978516 C-104.45979162 13.38546683 -124.70677741 14.61530124 -143.1875 19.3125 C-144.01040527 19.51617187 -144.83331055 19.71984375 -145.68115234 19.9296875 C-182.56581687 29.31561431 -220.17114693 50.68635515 -246.34375 78.61328125 C-251.79798704 84.1762078 -255.88984332 85.23258877 -263.66015625 85.375 C-264.49417969 85.354375 -265.32820313 85.33375 -266.1875 85.3125 C-264.5419271 81.44493884 -261.96577058 78.46343298 -259.25 75.3125 C-258.76055908 74.74072021 -258.27111816 74.16894043 -257.7668457 73.57983398 C-245.29230718 59.08779604 -232.26078285 45.13109289 -217.1875 33.3125 C-216.02278009 32.36046514 -214.86013933 31.40588287 -213.69921875 30.44921875 C-205.2111733 23.48649973 -196.48788734 17.14578182 -187.1875 11.3125 C-186.54651367 10.90821777 -185.90552734 10.50393555 -185.24511719 10.08740234 C-132.49410875 -22.8721802 -53.42747715 -43.24378675 0 0 Z "fill="var(--dark)" transform="translate(353.1875,117.6875)"/>
<path d="M0 0 C3.70891391 0.11048593 7.41686811 0.24097114 11.125 0.375 C12.17171875 0.4059375 13.2184375 0.436875 14.296875 0.46875 C24.43250188 0.85364722 24.43250188 0.85364722 29 3 C32.56846586 7.147136 33.56742916 10.59286454 34 16 C37.63 16.33 41.26 16.66 45 17 C44.9669712 19.10483555 44.89755454 21.2091243 44.8125 23.3125 C44.77769531 24.48425781 44.74289062 25.65601563 44.70703125 26.86328125 C44.47371094 27.89839844 44.24039063 28.93351562 44 30 C43.1853125 30.4640625 42.370625 30.928125 41.53125 31.40625 C38.56755079 32.86239655 38.56755079 32.86239655 38.07421875 36.79296875 C37.92200192 38.25557398 37.79381657 39.72084366 37.6875 41.1875 C37.57825195 42.31188477 37.57825195 42.31188477 37.46679688 43.45898438 C37.29050909 45.30412987 37.14248587 47.15193695 37 49 C35.10338182 45.44991981 34.04257839 41.88935056 32.9765625 38.0234375 C31.73249804 35.44573594 30.66055803 34.94487108 28 34 C26.989375 33.9175 25.97875 33.835 24.9375 33.75 C19.39749418 33.13309979 14.70710644 29.78340652 10 27 C10 26.34 10 25.68 10 25 C14.29 25.33 18.58 25.66 23 26 C22.505 23.525 22.505 23.525 22 21 C23.98 21 25.96 21 28 21 C28.33 20.01 28.66 19.02 29 18 C29.66 17.67 30.32 17.34 31 17 C30.71788123 15.3733152 30.42397625 13.74867104 30.125 12.125 C29.96257812 11.22007812 29.80015625 10.31515625 29.6328125 9.3828125 C29.16955297 6.83494012 29.16955297 6.83494012 27 5 C26.67 5.66 26.34 6.32 26 7 C25.01 6.67 24.02 6.34 23 6 C23 5.34 23 4.68 23 4 C20.69 4.66 18.38 5.32 16 6 C15.34 5.34 14.68 4.68 14 4 C12.00041636 3.95919217 9.99954746 3.95745644 8 4 C7.67 3.67 7.34 3.34 7 3 C4.32941149 2.85884839 1.67567762 2.95752893 -1 3 C-0.67 2.01 -0.34 1.02 0 0 Z "fill="var(--dark)" transform="translate(246,169)"/>
<path d="M0 0 C0 3.96243766 -1.31779017 4.89306328 -3.875 7.875 C-4.69871094 8.85726562 -5.52242187 9.83953125 -6.37109375 10.8515625 C-6.80534668 11.36879883 -7.23959961 11.88603516 -7.68701172 12.41894531 C-24.71699755 32.9258602 -38.16607955 55.88705144 -49.13720703 80.13500977 C-50.0515023 82.111326 -51.01728793 84.05692247 -52 86 C-53.2632793 82.2101621 -52.52883757 81.15239094 -51.04296875 77.50390625 C-50.5951001 76.39797119 -50.14723145 75.29203613 -49.68579102 74.15258789 C-49.19135498 72.96785889 -48.69691895 71.78312988 -48.1875 70.5625 C-47.683396 69.3448999 -47.17929199 68.1272998 -46.65991211 66.87280273 C-39.5808436 49.91487594 -31.25052209 33.84117802 -21.44628906 18.29492188 C-20.50579403 16.80257662 -19.57488468 15.30413222 -18.65527344 13.79882812 C-11.94989016 2.88923562 -11.94989016 2.88923562 -7.15625 0.703125 C-4.69311758 0.19112556 -2.5090474 -0.07473758 0 0 Z "fill="var(--dark)" transform="translate(82,233)"/>
<path d="M0 0 C-0.33 1.32 -0.66 2.64 -1 4 C-3.97 3.505 -3.97 3.505 -7 3 C-7.33 3.99 -7.66 4.98 -8 6 C-8.66 5.67 -9.32 5.34 -10 5 C-10 4.34 -10 3.68 -10 3 C-12.47266765 3.34444881 -12.47266765 3.34444881 -15 4 C-15.33 4.66 -15.66 5.32 -16 6 C-18.97 5.67 -21.94 5.34 -25 5 C-25 5.99 -25 6.98 -25 8 C-25.66 8 -26.32 8 -27 8 C-27.66 7.01 -28.32 6.02 -29 5 C-29.99 4.34 -30.98 3.68 -32 3 C-10.47890026 -0.19405371 -10.47890026 -0.19405371 0 0 Z " fill="var(--dark)" transform="translate(240,170)"/>
<path d="M0 0 C-3.83900467 2.55933644 -7.64641748 3.47558056 -12.0625 4.6875 C-12.89072266 4.92533203 -13.71894531 5.16316406 -14.57226562 5.40820312 C-15.36439453 5.62798828 -16.15652344 5.84777344 -16.97265625 6.07421875 C-17.69718994 6.27619873 -18.42172363 6.47817871 -19.16821289 6.6862793 C-21 7 -21 7 -23 6 C-20.58222111 5.02397041 -18.1624544 4.05381858 -15.73828125 3.09375 C-14.06176919 2.42410182 -12.39083761 1.73997888 -10.73046875 1.03125 C-6.76737033 -0.60551722 -4.13124865 -1.42011672 0 0 Z "fill="var(--dark)" transform="translate(207,501)"/>
<path d="M0 0 C0.85078125 0.54720703 0.85078125 0.54720703 1.71875 1.10546875 C-3.62657193 4.66901671 -8.78064519 6.59301411 -15.28125 6.10546875 C-12.67843145 3.84214827 -9.86596294 2.29212907 -6.78125 0.79296875 C-6.0284375 0.42558594 -5.275625 0.05820312 -4.5 -0.3203125 C-2.28125 -0.89453125 -2.28125 -0.89453125 0 0 Z "fill="var(--dark)" transform="translate(218.28125,494.89453125)"/>
</svg>

                <span className="brand-text">IPL</span>
              </a>
              <br />
              player guessing game
            </span>
          </h2>
        </div>

        {/* --- RIGHT SIDE: BUTTONS --- */}
        <div className="header-buttons">
          <button className={`game-btn help ${activeModal === 'help' ? 'activated' : ''}`} onClick={() => toggleModal('help')}>
            <div className="content">
              <HelpIcon active={activeModal === 'help'} />
              <label>Help</label>
            </div>
          </button>
          
          <button className={`game-btn stats ${activeModal === 'stats' ? 'activated' : ''}`} onClick={() => toggleModal('stats')}>
            <div className="content">
              <StatsIcon active={activeModal === 'stats'} />
              <label>Stats</label>
            </div>
          </button>
          
          <button className={`game-btn about ${activeModal === 'about' ? 'activated' : ''}`} onClick={() => toggleModal('about')}>
            <div className="content">
              <AboutIcon active={activeModal === 'about'} />
              <label>About</label>
            </div>
          </button>
          
          <button className={`game-btn flashback ${activeModal === 'flashback' ? 'activated' : ''}`} onClick={() => toggleModal('flashback')}>
            <div className="content">
              <FlashbackIcon active={activeModal === 'flashback'} />
              <label>Flashback</label>
            </div>
          </button>
        </div>
      </header>

      {/* ACTIVE TIME MACHINE ALERT BANNER */}
{activeDate !== realTodayStr && (
  <div className="flashback-banner">
    <div className="banner-info">
      <div className="banner-text">
        <strong>Flashback Archive</strong>
        <span>
          
          Game #{getGameNumber(activeDate)} • {displayDateStr}
        </span>
      </div>
    </div>
    <button className="return-today-btn game-btn" onClick={() => setActiveDate(realTodayStr)}>
      <div className="content">
        <label>Return to Today</label>
      </div>
    </button>
  </div>
)}

      <main className="game-content">
        {/* =========================================
          TOP MENU (MODALS / POPUPS)
          ========================================= */}
      <div className="top-menu">
        
        {/* --- 1. TIME MACHINE (FLASHBACK) --- */}
        <div className={`flashback row ${activeModal === 'flashback' ? '' : 'closed'}`}>
          <div className={`expandable-menu ${activeModal === 'flashback' ? '' : 'closed'}`}>
            <div className="content">
              <div className="game-selector">
                <h3>Time Machine</h3>
                <div className="calendar-container">
                  <div className="cal-header">
                    <button onClick={handlePrevMonth}>&lt;</button>
                    <h4>{new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                    <button onClick={handleNextMonth}>&gt;</button>
                  </div>
                  <div className="cal-grid-labels">
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                  </div>
                  <div className="cal-grid">
                    {renderCalendarDays()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- THE STATS OVERLAY --- */}

{activeModal === 'stats' && (
  <div className="sm-wrapper">
    <div className="sm-container">
      
      {/* LEFT SIDE: Guess Distribution */}
      <div className="sm-box sm-dist-box">
        <div className="sm-content">
          <h3>Guess Distribution</h3>
          <div className="sm-chart" aria-label="Guess Distribution Chart">
            
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
              const count = stats.distribution[num] || 0;
              const maxCount = Math.max(...Object.values(stats.distribution), 1);
              const heightPercent = count > 0 ? (count / maxCount) * 75 : 0;

              return (
                <div className="sm-guess" key={num}>
                  <label>{num === 8 ? 'OUT' : num}</label>
                  <div className="sm-bar-wrapper">
                    <div className="sm-bar" style={{ height: `${heightPercent}%`, backgroundColor: count > 0 ? 'var(--green, #00d200)' : 'transparent', borderColor: count > 0 ? 'var(--dark, #000)' : 'transparent' }}>
                      {count > 0 && <p>{count}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
            
          </div>
          
        </div>
      </div>

      {/* RIGHT SIDE: Stats Column */}
      <div className="sm-col">
        <div className="sm-row">
          <div className="sm-box sm-game-box">
            <div className="sm-content">
              <h5><label>Current Game:</label> {getGameNumber(new Date())}</h5>
            </div>
          </div>
          
          <button className="sm-box sm-btn" onClick={() => setActiveModal(null)} role="button">
            <div className="sm-content">
              <svg className="sm-close-icon" viewBox="0 0 27.88 27.88">
                <path fill="var(--red)" d="m23.49,26.88c-.9,0-1.75-.35-2.39-.99l-7.16-7.16-7.16,7.16c-.64.64-1.49.99-2.39.99s-1.75-.35-2.39-.99c-.64-.64-.99-1.49-.99-2.39s.35-1.75.99-2.39l7.16-7.16L1.99,6.78c-.64-.64-.99-1.49-.99-2.39s.35-1.75.99-2.39c.64-.64,1.49-.99,2.39-.99s1.75.35,2.39.99l7.16,7.16,7.16-7.16c.64-.64,1.49-.99,2.39-.99s1.75.35,2.39.99c.64.64.99,1.49.99,2.39s-.35,1.75-.99,2.39l-7.16,7.16,7.16,7.16c.64.64.99,1.49.99,2.39s-.35,1.75-.99,2.39c-.64.64-1.49.99-2.39.99Z"></path>
                <path fill="var(--dark, #000)" d="m23.49,2c.61,0,1.22.23,1.69.7.93.93.93,2.44,0,3.37l-7.87,7.87,7.87,7.87c.93.93.93,2.44,0,3.37-.47.47-1.08.7-1.69.7s-1.22-.23-1.69-.7l-7.87-7.87-7.87,7.87c-.47.47-1.08.7-1.69.7s-1.22-.23-1.69-.7c-.93-.93-.93-2.44,0-3.37l7.87-7.87L2.7,6.07c-.93-.93-.93-2.44,0-3.37.47-.47,1.08-.7,1.69-.7s1.22.23,1.69.7l7.87,7.87,7.87-7.87c.47-.47,1.08-.7,1.69-.7m0-2c-1.17,0-2.27.46-3.1,1.28l-6.45,6.45L7.48,1.28c-.83-.83-1.93-1.28-3.1-1.28S2.11.46,1.28,1.28c-.83.83-1.28,1.93-1.28,3.1s.46,2.27,1.28,3.1l6.45,6.45-6.45,6.46c-.83.83-1.28,1.93-1.28,3.1s.46,2.27,1.28,3.1c.83.83,1.93,1.28,3.1,1.28s2.27-.46,3.1-1.28l6.45-6.46,6.45,6.46c.83.83,1.93,1.28,3.1,1.28s2.27-.46,3.1-1.28c.83-.83,1.28-1.93,1.28-3.1s-.46-2.27-1.28-3.1l-6.45-6.45,6.45-6.46c.83-.83,1.28-1.93,1.28-3.1s-.46-2.27-1.28-3.1c-.83-.83-1.93-1.28-3.1-1.28h0Z"></path>
              </svg>
              <label>Close</label>
            </div>
          </button>
        </div>
        {/* Top Right: Numbers Grid */}
        <div className="sm-box sm-num-box">
          <div className="sm-content">
            <h5><label>Games Played</label> {stats.gamesPlayed || 0}</h5>
            <h5><label>Current Streak</label> {stats.currentStreak || 0}</h5>
            <h5><label>Longest Streak</label> {stats.maxStreak || 0}</h5>
            <h5><label>Win Percentage</label> {winPercentage || 0}%</h5>
          </div>
        </div>

        {/* Bottom Right Row: Current Game + Close */}
        
      </div>
    </div>
  </div>
)}
        {/* --- 3. HELP --- */}
        <div className={`help row ${activeModal === 'help' ? '' : 'closed'}`}>
          <div className={`expandable-menu ${activeModal === 'help' ? '' : 'closed'}`}>
            <div className="content">
              <h3>How to Play</h3>
              <ol>
                <li>Identify the secret IPL player inside 7 attempts.</li>
                <li>Green blocks symbolize perfect profile matches.</li>
                <li>Yellow represents historic franchise alignment or adjacent roles.</li>
                <li>Gray elements mean no matching traits.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* --- 4. ABOUT --- */}
<div className={`about row ${activeModal === 'about' ? '' : 'closed'}`}>
  <div className={`expandable-menu ${activeModal === 'about' ? '' : 'closed'}`}>
    <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3>About STUMPED</h3>
      
      <p>A Wordle-inspired cricket challenge built explicitly for passionate IPL fans everywhere.</p>
      
      <div className="about-extras" style={{ fontSize: '1.1rem', lineHeight: '1.4' }}>
        <p><strong>Created by:</strong> Stumped</p>
        <p><strong>Data:</strong> Player stats are updated as of the 2026 IPL season.</p>
        <p><strong>Inspired by:</strong> The brilliant NBA guessing game, <a href="https://poeltl.nbpa.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--dark)', textDecoration: 'underline' }}>Poeltl</a>.</p>
        <p><strong>Feedback:</strong> Found a bug or missing player? <a href="mailto:abc@example.com" style={{ color: 'var(--dark)', textDecoration: 'underline' }}>Let us know!</a></p>
      </div>

      {/* Version Number at the very bottom */}
      <div className="about-footer" style={{ marginTop: '10px', textAlign: 'center' }}>
        <small style={{ color: '#888', fontFamily: 'sans-serif', fontSize: '0.8rem' }}>
          v{__APP_VERSION__}
        </small>
      </div>

    </div>
  </div>
</div>

        {/* --- 5. SILHOUETTE / FINAL REVEAL --- */}
        {targetPlayer?.imageLink && (
          <div className={`hint row reveal ${activeModal === 'silhouette' ? '' : 'closed'}`}>

            {/* --- LEFT COLUMN: PLAYER CARD / SILHOUETTE --- */}
            <div className={`expandable-menu player-data ${activeModal === 'silhouette' ? '' : 'closed'}`}
              aria-hidden={activeModal !== 'silhouette'}
              aria-label="Mystery Player"
            >
              <div className="content">
                {gameStatus === 'playing' ? (
                  /* Mid-Game Silhouette View */
                  <div className="headshot only-silhouette">
                    <img
                      src={targetPlayer.imageLink}
                      alt="Mystery Player silhouette"
                      style={{ filter: 'brightness(0)' }}
                    />
                  </div>
                ) : (
                  /* Post-Game ID Card View */
                  <>
                    <div className="headshot">
                      <img
                        src={targetPlayer.imageLink}
                        alt={`Headshot of ${targetPlayer.name}`}
                      />
                    </div>
                    <div className="data">
                      <p>Today's Player is...</p>
                      <h3>{targetPlayer.name}</h3>
                      <div className="stats-grid">
                        <div className="stat-item"><label>Team</label> {targetPlayer.currentFranchise ?? '—'}</div>
                        <div className="stat-item"><label>Role</label> {targetPlayer.role ? targetPlayer.role.replace(/Top-Order Batter/gi, 'Top Order').replace(/Middle-Order Batter/gi, 'Mid Order').replace(/Bowling Allrounder/gi, 'Bowl AR').replace(/Batting Allrounder/gi, 'Bat AR').replace(/Wicketkeeper/gi, 'WK') : '—'}</div>
                        <div className="stat-item"><label>Batting</label> {targetPlayer.battingHand ?? '—'}</div>
                        <div className="stat-item"><label>Age</label> {targetPlayer.dob ? (2026 - parseInt(targetPlayer.dob.split('-')[2] || 2000)) : '—'}</div>
                        <div className="stat-item"><label>Matches</label> {targetPlayer.matches ?? '—'}</div>
                        <div className="stat-item"><label>Wickets</label> {targetPlayer.wickets ?? '—'}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* --- RIGHT COLUMN: ACTIONS & RESULTS --- */}
            <div className="column">
              
              {/* Stacked Action Buttons */}
              <div className="row buttons-row">
                {gameStatus !== 'playing' && (
                  <button
                    className="button horizontal-button"
                    role="button"
                    aria-label="Share Today's Game"
                    onClick={handleShare}
                  >
                    <div className="content">
                      <svg className="share" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38.62 31.88">
                        <path fill="#00e1ff" d="m1.24,30.87c-.06-.01-.11-.03-.14-.07-.07-.06-.1-.13-.1-.22v-5.69c0-4.33,1.7-8.41,4.78-11.49,3.08-3.08,7.17-4.78,11.5-4.78h4.43V1.47l15.63,12.19-15.63,12.18v-.07h0v-7.06h-2.21c-3.83,0-7.55,1.13-10.74,3.26-3.22,2.15-5.7,5.16-7.18,8.72-.04.09-.09.14-.17.17l-.1.02s-.04,0-.06,0Z"></path>
                        <path fill="var(--dark)" d="m22.71,3.52l13,10.14-13,10.13v-6.08h-3.21c-4.03,0-7.94,1.19-11.29,3.43-2.55,1.7-4.66,3.92-6.21,6.5v-2.76c0-4.06,1.59-7.89,4.49-10.79,2.89-2.89,6.73-4.49,10.79-4.49h5.43V3.52m-1.45-3.52c-.3,0-.55.24-.55.55v7.06h-3.43c-4.75,0-9.07,1.94-12.2,5.07C1.94,15.82,0,20.13,0,24.88v5.69c0,.42.18.76.45.99.17.15.38.24.59.29.09.02.17.03.26.03.13,0,.27-.02.39-.06.34-.1.64-.34.8-.74,1.41-3.38,3.8-6.26,6.82-8.27,2.92-1.95,6.42-3.09,10.18-3.09h1.21v7.06h0c0,.12.04.24.11.34.11.14.27.21.43.21.12,0,.24-.04.34-.12l16.81-13.11s.07-.06.1-.1c.19-.24.14-.58-.09-.76L21.63.14c-.1-.09-.23-.14-.37-.14h0Z"></path>
                      </svg>
                      <label>{copySuccess ? 'Copied!' : 'Share'}</label>
                    </div>
                  </button>
                )}

                <button
                  className="button horizontal-button"
                  role="button"
                  aria-label="Close Reveal Menu"
                  onClick={() => setActiveModal(null)}
                >
                  <div className="content">
                    <svg className="close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27.88 27.88">
                      <path fill="var(--red, red)" d="m23.49,26.88c-.9,0-1.75-.35-2.39-.99l-7.16-7.16-7.16,7.16c-.64.64-1.49.99-2.39.99s-1.75-.35-2.39-.99c-.64-.64-.99-1.49-.99-2.39s.35-1.75.99-2.39l7.16-7.16L1.99,6.78c-.64-.64-.99-1.49-.99-2.39s.35-1.75.99-2.39c.64-.64,1.49-.99,2.39-.99s1.75.35,2.39.99l7.16,7.16,7.16-7.16c.64-.64,1.49-.99,2.39-.99s1.75.35,2.39.99c.64.64.99,1.49.99,2.39s-.35,1.75-.99,2.39l-7.16,7.16,7.16,7.16c.64.64.99,1.49.99,2.39s-.35,1.75-.99,2.39c-.64.64-1.49.99-2.39.99Z"></path>
                      <path fill="var(--dark)" d="m23.49,2c.61,0,1.22.23,1.69.7.93.93.93,2.44,0,3.37l-7.87,7.87,7.87,7.87c.93.93.93,2.44,0,3.37-.47.47-1.08.7-1.69.7s-1.22-.23-1.69-.7l-7.87-7.87-7.87,7.87c-.47.47-1.08.7-1.69.7s-1.22-.23-1.69-.7c-.93-.93-.93-2.44,0-3.37l7.87-7.87L2.7,6.07c-.93-.93-.93-2.44,0-3.37.47-.47,1.08-.7,1.69-.7s1.22.23,1.69.7l7.87,7.87,7.87-7.87c.47-.47,1.08-.7,1.69-.7m0-2c-1.17,0-2.27.46-3.1,1.28l-6.45,6.45L7.48,1.28c-.83-.83-1.93-1.28-3.1-1.28S2.11.46,1.28,1.28c-.83.83-1.28,1.93-1.28,3.1s.46,2.27,1.28,3.1l6.45,6.45-6.45,6.46c-.83.83-1.28,1.93-1.28,3.1s.46,2.27,1.28,3.1c.83.83,1.93,1.28,3.1,1.28s2.27-.46,3.1-1.28l6.45-6.46,6.45,6.46c.83.83,1.93,1.28,3.1,1.28s2.27-.46,3.1-1.28c.83-.83,1.28-1.93,1.28-3.1s-.46-2.27-1.28-3.1l-6.45-6.45,6.45-6.46c.83-.83,1.28-1.93,1.28-3.1s-.46-2.27-1.28-3.1c-.83-.83-1.93-1.28-3.1-1.28h0Z"></path>
                    </svg>
                    <label>Close</label>
                  </div>
                </button>
              </div>

              {/* Cards wrapper (Who Is / Results) */}
              {gameStatus === 'playing' ? (
                <div className="who-is-card">
                  <h3>Who is<br/>today's<br/>player?</h3>
                </div>
              ) : (
                <div className="result-card">
                  <h3>{gameStatus === 'won' ? 'You won!' : "Sorry! You didn't get today's player"}</h3>
                  
                  {/* Poeltl's Guess Count for Winners */}
                  {gameStatus === 'won' && (
                    <>
                      <span className="result-sub">You got it in...</span>
                      <span className="result-guesses">{guesses.length} guess{guesses.length !== 1 ? 'es' : ''}</span>
                    </>
                  )}
                  
                  {/* Stats Meta */}
                  <h5 style={{ marginTop: '5px' }}><label>Current Streak</label> {stats.currentStreak}</h5>
                  <h5><label>Time</label> {Math.floor(seconds / 60)}m {String(seconds % 60).padStart(2, '0')}s</h5>
                </div>
              )}

            </div>
          </div>
        )}
        </div>

        {/* --- MAIN GAMEPLAY ROW (SEARCH, SILHOUETTE, TIMER) --- */}
        <div
          className="searchbar"
          onFocus={() => setIsSearchFocused(true)}
          onBlur={(e) => {
            // Only hide if focus leaves the entire searchbar+suggestions area
            const next = e.relatedTarget;
            if (!e.currentTarget.contains(next) && !suggestionsRef.current?.contains(next)) {
              setIsSearchFocused(false);
            }
          }}
        >
          
          {/* 1. The Search Bar Component */}
          <SearchBar
            ref={searchBarRef}
            onSuggestionsChange={handleSuggestionsChange}
            gameStatus={gameStatus}
            guessedPlayers={guesses}
          />
          
          {/* 2. The Right-Side Controls */}
          <div className="time-hint-wrapper">
            
            <button 
              className={`button horizontal-button game-btn ${activeModal === 'silhouette' ? 'activated' : ''}`}
              role="button" 
              aria-label="Show Mystery Player's Silhouette"
              onClick={() => toggleModal('silhouette')}
            >
              <div className="content">
                {/* CRITICAL: Pass the active state to the icon! */}
                <SilhouetteIcon active={activeModal === 'silhouette'} />
                <label>
                  {gameStatus !== 'playing' 
                    ? (activeModal === 'silhouette' ? "Hide Player" : "Show Player") 
                    : (activeModal === 'silhouette' ? "Hide Silhouette" : "Show Silhouette")}
                </label>
              </div>
            </button>

            <div className="time" role="timer" aria-label={gameStatus === 'playing' ? "Game Timer" : "Next Game Timer"}>
  {gameStatus === 'playing' ? (
    /* Active Game State */
    <span className="timer-numbers">{formatTime(seconds)}</span>
  ) : (
    /* Game Over State (Uses React Fragment to avoid extra divs) */
    <>
      <span className="next-label">NEXT IN</span>
      <span className="timer-numbers">{countdown}</span>
    </>
  )}
</div>

          </div>
        </div>

        {/* --- SUGGESTIONS BOX --- sits in normal flow between searchbar and guesses grid */}
        <div
          id="suggestions-listbox"
          ref={suggestionsRef}
          className="expandable-menu suggestions"
          role="listbox"
          aria-hidden={!isOpen}
          style={{ height: suggestionsHeight }}
          onMouseEnter={() => setIsSearchFocused(true)}
        >
          <div className="content">
            {suggestions.map((player, idx) => {
              const isActive = idx === activeSuggestionIndex;
              return (
                <button
                  key={player.id}
                  id={`suggestion-${idx}`}
                  role="option"
                  aria-label={`Submit ${player.name} as a guess`}
                  aria-selected={isActive}
                  data-name={player.name}
                  className={`suggestion${isActive ? ' active' : ''}`}
                  onClick={() => handleSuggestionSelect(player)}
                  onMouseEnter={() => setActiveSuggestionIndex(idx)}
                  tabIndex={isOpen ? 0 : -1}
                >
                  {player.name}
                </button>
              );
            })}
          </div>
        </div>
        {/* --- RESULTS GRID DISPLAY MATRIX --- */}
        {/* --- THE GUESSES GRID --- */}
<div className="guesses" id="guesses" role="table" aria-rowcount="8" aria-label="Today's User Guesses">
  
  {/* 1. The Header Row (10 Columns) */}
<div className="heading" role="row" aria-rowindex="1">
  <div role="columnheader">Player</div>
  <div role="columnheader">Team</div>
  <div role="columnheader">Role</div>
  <div role="columnheader">Batting</div>
  <div role="columnheader">Age</div>
  <div role="columnheader">Debut</div>
  <div role="columnheader">Price (L)</div>
  <div role="columnheader">Matches</div>
  <div role="columnheader">Runs</div>
  <div role="columnheader">Wickets</div>
</div>

{/* 2. The 7 Guess Rows */}
  {[...Array(7)].map((_, index) => {
    const guess = guesses[index]; 
    const isGuessed = !!guess;

    let result, evaluatedAge;
    if (isGuessed) {
      result = getGuessResult(guess, targetPlayer);
      const birthYear = guess.dob ? guess.dob.split('-')[2] : 2026;
      evaluatedAge = 2026 - parseInt(birthYear || 2000);
    }

    return (
      <div key={index} id={`guess${index}`} role="row" className={`guess ${isGuessed ? 'activated' : ''}`}>
        <div className="guess-wrapper">
          
          {/* THE ROW (Always renders, even if empty, so the grid holds its shape) */}
          <div className="row" aria-disabled={!isGuessed}>
            
            {isGuessed ? (
              /* --- PLAYED CELLS --- */
              <>
                <div role="cell" className="cell-name">
                  <strong>{guess.name}</strong>
                </div>
                
                {/* Map the 9 data columns */}
                {[
                  { val: guess?.currentFranchise, res: result?.team },
                  { val: guess?.role ? guess.role.replace(/Top-Order Batter/gi, 'Top Order').replace(/Middle-Order Batter/gi, 'Middle Order').replace(/Bowling Allrounder/gi, 'Bowling AR').replace(/Batting Allrounder/gi, 'Batting AR').replace(/Top-Order/gi, 'Top\u00A0Order').replace(/Middle-Order/gi, 'Middle\u00A0Order').replace(/Wicketkeeper/gi, 'WK').replace(/-/g, ' ') : 'Null', res: result?.role },
                  { val: guess?.battingHand, res: result?.battingHand },
                  { val: evaluatedAge, res: result?.age },
                  { val: (!guess?.debutYear || guess?.debutYear === 'Unknown') ? 'NA' : guess.debutYear, res: result?.debutYear },
                  { val: guess?.auctionPrice, res: result?.auctionPrice },
                  { val: guess?.matches, res: result?.matches },
                  { val: guess?.runs, res: result?.runs },
                  { val: guess?.wickets, res: result?.wickets }
                ].map((item, i) => {
                  const statusClass = item.res?.status ? getBoxClass(item.res.status) : '';
                  return (
                    <div key={i} role="cell">
                      <div className={`badge ${statusClass}`}>
                        <span>{item.val ?? 'Null'}</span>
                        {renderArrow(item.res?.direction)}
                        <ResultIcon status={item.res?.status} />
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              /* --- UNPLAYED EMPTY CELLS (Draws the invisible grid for alignment) --- */
              <>
                <div role="cell" className="cell-name"></div>
                <div role="cell"></div><div role="cell"></div>
                <div role="cell"></div><div role="cell"></div>
                <div role="cell"></div><div role="cell"></div>
                <div role="cell"></div><div role="cell"></div>
                <div role="cell"></div>
              </>
            )}

          </div>

          {/* THE COVER (Only shows if NOT guessed. Overlays on top of the empty row) */}
          {!isGuessed && (
            <div className="cover">
              <span>{index + 1}</span>
            </div>
          )}
          
        </div>
      </div>
    );
  })}
</div>
      </main>
    </div>
  );
};
export default MainGame;