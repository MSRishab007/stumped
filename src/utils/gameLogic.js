const ROLE_PROXIMITY = {
  'top order batter': ['middle order batter', 'wicketkeeper batter', 'batting allrounder'],
  'middle order batter': ['top order batter', 'wicketkeeper batter', 'batting allrounder'],
  'wicketkeeper batter': ['top order batter', 'middle order batter'],
  'batting allrounder': ['top order batter', 'middle order batter', 'bowling allrounder'],
  'bowling allrounder': ['batting allrounder', 'spin bowler', 'pace bowler'],
  'spin bowler': ['bowling allrounder', 'pace bowler'],
  'pace bowler': ['bowling allrounder', 'spin bowler']
};

// Helper: Calculate age from "DD-MM-YYYY"
const calculateAge = (dobString) => {
  if (!dobString || dobString === "Unknown") return NaN;
  const [day, month, year] = dobString.split('-');
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Helper: Evaluate numeric stats
const compareNumeric = (guessVal, targetVal, threshold) => {
  // Handle non-numeric edge cases (e.g., "Retained", "Unknown")
  if (isNaN(guessVal) || isNaN(targetVal)) {
    return {
      status: String(guessVal).toLowerCase() === String(targetVal).toLowerCase() ? 'exact' : 'wrong',
      direction: 'none'
    };
  }

  const g = Number(guessVal);
  const t = Number(targetVal);
  
  let status = 'wrong';
  if (g === t) status = 'exact';
  else if (Math.abs(g - t) <= threshold) status = 'partial';

  let direction = 'none';
  if (t > g) direction = 'up';   // Target is higher
  else if (t < g) direction = 'down'; // Target is lower

  return { status, direction };
};

// Helper: Clean roles to match proximity dictionary (e.g. "Top-Order Batter" -> "top order batter")
const cleanRole = (role) => role ? role.replace(/-/g, ' ').toLowerCase() : '';

export function getGuessResult(guess, target) {
  
  const result = {
    isExactMatch: guess.id === target.id,
    team: { status: 'wrong' },
    role: { status: 'wrong' },
    battingHand: { status: guess.battingHand === target.battingHand ? 'exact' : 'wrong' },
    matches: compareNumeric(guess.matches, target.matches, 10),
    runs: compareNumeric(guess.runs, target.runs, 100),
    strikeRate: compareNumeric(guess.strikeRate, target.strikeRate, 5),
    wickets: compareNumeric(guess.wickets, target.wickets, 5),
    economy: compareNumeric(guess.economy, target.economy, 0.5),
    debutYear: compareNumeric(guess.debutYear, target.debutYear, 2),
    auctionPrice: compareNumeric(guess.auctionPrice, target.auctionPrice, 100),
    age: compareNumeric(calculateAge(guess.dob), calculateAge(target.dob), 2),
  };

  // --- TEAM LOGIC ---
  let teamStatus = 'wrong';
  
  if (guess.currentFranchise === target.currentFranchise) {
    // Exactly the same current team
    teamStatus = 'exact';
  } else if (
    // Guessed player's current team is one of the target's old teams
    (target.pastFranchises && target.pastFranchises.includes(guess.currentFranchise)) 
  ) {
    teamStatus = 'partial';
  }

  result.team.status = teamStatus;
  // --- ROLE LOGIC ---
  const gRole = cleanRole(guess.role);
  const tRole = cleanRole(target.role);

  if (gRole === tRole) {
    result.role.status = 'exact';
  } else if (ROLE_PROXIMITY[gRole] && ROLE_PROXIMITY[gRole].includes(tRole)) {
    result.role.status = 'partial';
  }

  return result;
}