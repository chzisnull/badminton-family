/**
 * Badminton Match Maker Engine
 */

/**
 * Standard Round Robin Algorithm (Circle Method)
 * @param {Array} items - List of players or teams
 * @returns {Array} matches - Array of { round, a, b }
 */
function roundRobin(items) {
  const n = items.length;
  if (n < 2) return [];

  const list = [...items];
  const matches = [];
  
  if (n % 2 !== 0) {
    list.push(null); // Dummy player for bye
  }
  
  const numPlayers = list.length;
  const numRounds = numPlayers - 1;
  const half = numPlayers / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const a = list[i];
      const b = list[numPlayers - 1 - i];
      if (a !== null && b !== null) {
        matches.push({ round: round + 1, a, b });
      }
    }
    // Rotate: keep first element, shift the rest
    list.splice(1, 0, list.pop());
  }
  return matches;
}

/**
 * Doubles Multiplayer Rotation (多人轮转赛)
 * Every player rotates partners.
 * Balanced social rotation.
 */
function doublesRotation(players) {
  const n = players.length;
  if (n < 4) return [];

  const matches = [];
  const p = [...players];
  
  // Shuffle for fairness
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }

  // Basic scheduling: Every player plays roughly same rounds
  // Each match needs 4 people.
  const rounds = Math.ceil((n * 2) / 4) * 2; // target rounds
  
  for (let r = 0; r < rounds; r++) {
    const pool = [...p].sort(() => Math.random() - 0.5);
    matches.push({
      round: r + 1,
      teamA: [pool[0], pool[1]],
      teamB: [pool[2], pool[3]]
    });
  }

  return matches;
}

module.exports = { roundRobin, doublesRotation };
