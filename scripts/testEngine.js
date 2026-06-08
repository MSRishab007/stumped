import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getGuessResult } from '../src/utils/gameLogic.js';

// Setup paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load your actual JSON database safely
const jsonPath = path.join(__dirname, '../src/data/players.json'); // Adjust name to player.json if needed
const playersData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

function runRealDataTest() {
    console.log(`📦 Loaded ${playersData.length} players from database.\n`);

    // 2. Find the target player (e.g., Ruturaj Gaikwad)
    const targetName = "Virat Kohli";
    const targetPlayer = playersData.find(p => p.name.toLowerCase() === targetName.toLowerCase());

    // 3. Find the guessed player (e.g., Dewald Brevis)
    const guessName = "MS Dhoni";
    const guessPlayer = playersData.find(p => p.name.toLowerCase() === guessName.toLowerCase());

    if (!targetPlayer || !guessPlayer) {
        console.error("❌ Could not find one or both players in the JSON. Check the spelling!");
        return;
    }

    console.log(`🎯 TARGET PLAYER: ${targetPlayer.name} (${targetPlayer.currentFranchise})`);
    console.log(`🤔 GUESS PLAYER: ${guessPlayer.name} (${guessPlayer.currentFranchise})\n`);

    // 4. Run the Engine
    console.log("⚙️  Running Comparison Engine...\n");
    const result = getGuessResult(guessPlayer, targetPlayer);

    // 5. Output the logic matrix
    console.dir(result, { depth: null, colors: true });

    // 6. Basic sanity checks based on your rules
    console.log("\n📊 Quick Sanity Check:");
    console.log(`Team Status: ${result.team.status === 'exact' ? '✅ Exact' : '❌ Failed (Should be exact for CSK)'}`);
    console.log(`Batting Hand: ${result.battingHand.status === 'exact' ? '✅ Exact' : '❌ Failed'}`);
    console.log(`Wickets Status: ${result.wickets.status} (Delta is ${Math.abs(guessPlayer.wickets - targetPlayer.wickets)}, threshold is 5)`);
    console.log(`Age Direction: ${result.age.direction} (Target DOB: ${targetPlayer.dob}, Guess DOB: ${guessPlayer.dob})`);
}

runRealDataTest();