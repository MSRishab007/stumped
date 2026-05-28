
import playersData from '../data/players.json';

const SPECIAL_DATES = {
  '2026-04-30': 1, 
  '2026-05-24': 3  
};

const LAUNCH_DATE = new Date(2026, 2, 24); 

function getScrambledIndex(dayCounter, totalPoolSize) {
  if (totalPoolSize === 0) return 0;
  const P = 10007; 
  const A = 347;   
  const C = 19;    
  return ((A * dayCounter + C) % P) % totalPoolSize;
}

export function getDailyPlayerForDate(customDateStr) {
  const targetDate = customDateStr ? new Date(customDateStr) : new Date();
  
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const dateString = `${yyyy}-${mm}-${dd}`;

  if (SPECIAL_DATES[dateString]) {
    const targetId = SPECIAL_DATES[dateString];
    const customPlayer = playersData.find(p => p.id === targetId);
    if (customPlayer) return customPlayer;
  }

  const targetablePool = playersData.filter(player => player.isTargetable === true);

  const activePool = targetablePool.length > 0 ? targetablePool : playersData;

  const startUTC = Date.UTC(LAUNCH_DATE.getFullYear(), LAUNCH_DATE.getMonth(), LAUNCH_DATE.getDate());
  const currentUTC = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysElapsed = Math.floor((currentUTC - startUTC) / msPerDay);
  const safeGameDay = daysElapsed < 0 ? 0 : daysElapsed;

  const scrambledIndex = getScrambledIndex(safeGameDay, activePool.length);
  
  return activePool[scrambledIndex];
}