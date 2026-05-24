import playersData from '../data/players.json';

// Manual calendar day overrides (Format: 'YYYY-MM-DD': 'Player Name')
const SPECIAL_DATES = {
  '2026-04-30': 'Rohit Sharma',
  '2026-05-24': 'MS Dhoni'
};

// Permanent system launch date baseline anchor
const LAUNCH_DATE = new Date(2026, 2, 28); // March 28, 2026

export function getDailyPlayer() {
  const today = new Date();
  
  // Format current browser clock day to ISO YYYY-MM-DD
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateString = `${yyyy}-${mm}-${dd}`;

  // Priority check: Custom hardcoded overlay match
  if (SPECIAL_DATES[dateString]) {
    const customPlayer = playersData.find(
      p => p.name.toLowerCase() === SPECIAL_DATES[dateString].toLowerCase()
    );
    if (customPlayer) return customPlayer;
  }

  // Fallback check: Calculate elapsed index sequencing math
  const startUTC = Date.UTC(LAUNCH_DATE.getFullYear(), LAUNCH_DATE.getMonth(), LAUNCH_DATE.getDate());
  const currentUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysElapsed = Math.floor((currentUTC - startUTC) / msPerDay);
  const safeGameDay = daysElapsed < 0 ? 0 : daysElapsed;

  // Infinite cycle looping wrap boundaries
  const playerIndex = safeGameDay % playersData.length;
  return playersData[playerIndex];
}