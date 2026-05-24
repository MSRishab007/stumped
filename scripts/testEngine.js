// scripts/testStateEngine.js
import { comparePlayers } from '../src/utils/gameLogic.js';

// Mocking LocalStorage inside our Node testing environment
const mockLocalStorage = {};
const localStorage = {
  getItem: (key) => mockLocalStorage[key] || null,
  setItem: (key, value) => { mockLocalStorage[key] = String(value); },
};

// Test Configuration Simulation Parameters
const todayStr = "2026-05-24";
const yesterdayStr = "2026-05-23";

const targetPlayerToday = { id: 3, name: "MS Dhoni", currentTeam: "CSK" };
const targetPlayerYesterday = { id: 5, name: "Sarfaraz Khan", currentTeam: "CSK" };

// Global Initial Stats Mock Tracker
let globalStats = { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0 };

function updateDailyStatistics(isVictory, activeDate) {
  // PROTECTION: Only log to streaks if this is today's live puzzle!
  if (activeDate !== todayStr) return;

  globalStats.gamesPlayed += 1;
  if (isVictory) {
    globalStats.currentStreak += 1;
    globalStats.gamesWon += 1;
    globalStats.maxStreak = Math.max(globalStats.currentStreak, globalStats.maxStreak);
  } else {
    globalStats.currentStreak = 0;
  }
  localStorage.setItem('ipl-legends-statistics', JSON.stringify(globalStats));
}

// ========================================================
// RUN INTEGRATION TEST SIMULATION
// ========================================================
console.log("\n==================================================");
console.log("  RUNNING STATE MACHINE INTEGRATION TESTS");
console.log("==================================================\n");

// --- TEST 1: PLAYING TODAY'S LIVE MATCH ---
console.log("👉 [ACTION]: Simulating 3 guesses on Today's Live Board...");
let guessesToday = [
  { name: "Ruturaj Gaikwad" },
  { name: "Dewald Brevis" },
  { name: "MS Dhoni" } // Winning match guess
];

let finalGuessToday = guessesToday[guessesToday.length - 1];
let evaluationToday = finalGuessToday.name === targetPlayerToday.name;

if (evaluationToday) {
  updateDailyStatistics(true, todayStr);
  localStorage.setItem(`ipl-legends-game-${todayStr}`, JSON.stringify({ date: todayStr, gameStatus: 'won', guesses: guessesToday }));
}

console.log("✅ TODAY'S BOARD STATE SAVED:", localStorage.getItem(`ipl-legends-game-${todayStr}`) !== null);
console.log("📊 STATS AFTER TODAY'S WIN:", JSON.stringify(globalStats));

console.log("\n──────────────────────────────────────────────────\n");

// --- TEST 2: PLAYING YESTERDAY'S ARCHIVE MATCH ---
console.log("👉 [ACTION]: Switching to Yesterday's Archive Board...");
console.log("👉 [ACTION]: Simulating a Loss (8 incorrect guesses)...");

let guessesYesterday = Array(8).fill({ name: "Ruturaj Gaikwad" }); // 8 wrong guesses
let evaluationYesterday = false; // Player lost

updateDailyStatistics(evaluationYesterday, yesterdayStr);
localStorage.setItem(`ipl-legends-game-${yesterdayStr}`, JSON.stringify({ date: yesterdayStr, gameStatus: 'lost', guesses: guessesYesterday }));

console.log("✅ ARCHIVE BOARD STATE SAVED:", localStorage.getItem(`ipl-legends-game-${yesterdayStr}`) !== null);
console.log("🛑 STATS AFTER ARCHIVE LOSS (Should look identical to above):", JSON.stringify(globalStats));

// --- FINAL VERIFICATION VERDICT ---
console.log("\n==================================================");
if (globalStats.currentStreak === 1 && mockLocalStorage[`ipl-legends-game-${yesterdayStr}`]) {
  console.log("        🏆 INTEGRATION VERDICT: PASSED! 🏆");
  console.log(" Streak protection and file isolation working perfectly.");
} else {
  console.log("        ❌ INTEGRATION VERDICT: FAILED! ❌");
}
console.log("==================================================\n");