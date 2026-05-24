//For Role Comparison Logic
const ROLE_PROXIMITY = {
  'Top Order Batter': ['Middle Order Batter', 'Wicketkeeper Batter', 'Batting Allrounder'],
  'Middle Order Batter': ['Top Order Batter', 'Wicketkeeper Batter', 'Batting Allrounder'],
  'Wicketkeeper Batter': ['Top Order Batter', 'Middle Order Batter'],
  'Batting Allrounder': ['Top Order Batter', 'Middle Order Batter', 'Bowling Allrounder'],
  'Bowling Allrounder': ['Batting Allrounder', 'Spin Bowler', 'Pace Bowler'],
  'Spin Bowler': ['Bowling Allrounder', 'Pace Bowler'],
  'Pace Bowler': ['Bowling Allrounder', 'Spin Bowler']
};

//Helper function to compare numeric attributes with tolerance
function compareNumeric(guess, target, tolerance) {
  if (guess === target) {
    return { match: 'exact', direction: null };
  }
  
  const difference = Math.abs(guess - target);
  const matchStatus = difference <= tolerance ? 'partial' : 'none';
  const direction = target > guess ? 'higher' : 'lower';
  
  return { match: matchStatus, direction };
}

// Main comparison function
export function comparePlayers(guessedPlayer, targetPlayer) {
  // Check if player has historically worn a jersey matching the target's current active club
  const teamMatch = guessedPlayer.currentTeam === targetPlayer.currentTeam;
  const teamPartial = !teamMatch && targetPlayer.pastTeams.includes(guessedPlayer.currentTeam);

  let teamStatus = 'none';
  if (teamMatch) teamStatus = 'exact';
  else if (teamPartial) teamStatus = 'partial';

  // Evaluate role logic mapping
  let roleStatus = 'none';
  if (guessedPlayer.role === targetPlayer.role) {
    roleStatus = 'exact';
  } else if ((ROLE_PROXIMITY[targetPlayer.role] || []).includes(guessedPlayer.role)) {
    roleStatus = 'partial';
  }

  return {
    isCorrect: guessedPlayer.id === targetPlayer.id,
    results: {
      team: { match: teamStatus },
      role: { match: roleStatus },
      battingHand: {
        match: guessedPlayer.battingHand === targetPlayer.battingHand ? 'exact' : 'none'
      },
      // Appending core numeric tolerances (+-2 years, +-10 matches, +-500 runs, +-50 wickets)
      debutYear: compareNumeric(guessedPlayer.debutYear, targetPlayer.debutYear, 2),
      matches: compareNumeric(guessedPlayer.matches, targetPlayer.matches, 10),
      runs: compareNumeric(guessedPlayer.runs, targetPlayer.runs, 500),
      wickets: compareNumeric(guessedPlayer.wickets, targetPlayer.wickets, 50)
    }
  };
}