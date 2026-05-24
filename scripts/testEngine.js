// scripts/testEngine.js
import { comparePlayers } from '../src/utils/gameLogic.js';

// 1. Mock Database Profiles for Verification
const mockTarget = {
  id: 3,
  name: "MS Dhoni",
  currentTeam: "CSK",
  pastTeams: ["RPSG"],
  role: "Wicketkeeper Batter",
  battingHand: "Right",
  debutYear: 2008,
  matches: 278,
  runs: 5439,
  wickets: 0
};

const mockGuess = {
  id: 3,
  name: "MS Dhoni",
  currentTeam: "CSK",
  pastTeams: ["RPSG"],
  role: "Wicketkeeper Batter",
  battingHand: "Right",
  debutYear: 2008,
  matches: 278,
  runs: 5439,
  wickets: 0
};

// 2. Run the Comparison Engine
printTestHeader("EVALUATING ENGINE MATCH MATRIX");
const evaluationResult = comparePlayers(mockGuess, mockTarget);
console.log(JSON.stringify(evaluationResult, null, 2));


// Tiny cosmetic helper for clean terminal outputs
function printTestHeader(title) {
  console.log(`\n================ ${title} ================`);
}