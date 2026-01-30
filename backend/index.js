const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDb } = require('./db');
const { roundRobin, doublesRotation } = require('./matchMaker');

let db;

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// --- API ---

// 1. Create Activity
app.post('/api/activities', async (req, res) => {
  const { name, type, players, rounds } = req.body;
  if (!players || players.length < 2) return res.status(400).json({ error: 'Need more players' });

  const roundsCount = parseInt(rounds) || 1;

  const result = await db.run(
    'INSERT INTO activities (name, type, players) VALUES (?, ?, ?)',
    [name || '未命名比赛', type, JSON.stringify(players)]
  );
  const activityId = result.lastID;

  let allMatches = [];
  for (let r = 0; r < roundsCount; r++) {
    let matches = [];
    if (type === 'singles_round_robin') {
      matches = roundRobin(players).map(m => ({ ...m, teamA: [m.a], teamB: [m.b] }));
    } else if (type === 'doubles_fixed_round_robin') {
      // Logic for fixed pairs: roundRobin expects pairs as items
      const pairs = [];
      for (let i = 0; i < players.length; i += 2) {
        if (players[i+1]) pairs.push([players[i], players[i+1]]);
        else pairs.push([players[i]]); // Lone player
      }
      matches = roundRobin(pairs).map(m => ({ ...m, teamA: m.a, teamB: m.b }));
    } else {
      matches = doublesRotation(players);
    }
    allMatches.push(...matches.map(m => ({ ...m, round: (r * 10) + (m.round || 1) })));
  }

  for (const m of allMatches) {
    await db.run(
      'INSERT INTO matches (activity_id, round, team_a, team_b) VALUES (?, ?, ?, ?)',
      [activityId, m.round, JSON.stringify(m.teamA), JSON.stringify(m.teamB)]
    );
  }

  res.json({ id: activityId });
});

// 2. Get Activity Details
app.get('/api/activities/:id', async (req, res) => {
  const activity = await db.get('SELECT * FROM activities WHERE id = ?', req.params.id);
  if (!activity) return res.status(404).json({ error: 'Not found' });
  
  const matches = await db.all('SELECT * FROM matches WHERE activity_id = ?', req.params.id);
  
  res.json({
    ...activity,
    players: JSON.parse(activity.players),
    matches: matches.map(m => ({
      ...m,
      team_a: JSON.parse(m.team_a),
      team_b: JSON.parse(m.team_b)
    }))
  });
});

// 3. Update Match Score
app.put('/api/matches/:matchId', async (req, res) => {
  const { score_a, score_b } = req.body;
  await db.run(
    'UPDATE matches SET score_a = ?, score_b = ?, status = ? WHERE id = ?',
    [score_a, score_b, 'finished', req.params.matchId]
  );
  res.json({ success: true });
});

// 4. Get Leaderboard
app.get('/api/activities/:id/leaderboard', async (req, res) => {
  const activity = await db.get('SELECT * FROM activities WHERE id = ?', req.params.id);
  const matches = await db.all('SELECT * FROM matches WHERE activity_id = ? AND status = "finished"', req.params.id);
  
  const stats = {};
  const players = JSON.parse(activity.players);
  
  // Initialize
  const initPlayer = (name) => {
    if (!stats[name]) stats[name] = { name, played: 0, win: 0, loss: 0, points: 0, diff: 0 };
  };

  // Logic depends on type
  matches.forEach(m => {
    const teamA = JSON.parse(m.team_a);
    const teamB = JSON.parse(m.team_b);
    const sA = m.score_a;
    const sB = m.score_b;

    [...teamA, ...teamB].forEach(initPlayer);

    teamA.forEach(p => {
      stats[p].played++;
      stats[p].points += sA;
      stats[p].diff += (sA - sB);
      if (sA > sB) stats[p].win++; else stats[p].loss++;
    });

    teamB.forEach(p => {
      stats[p].played++;
      stats[p].points += sB;
      stats[p].diff += (sB - sA);
      if (sB > sA) stats[p].win++; else stats[p].loss++;
    });
  });

  const leaderboard = Object.values(stats).sort((a, b) => b.win - a.win || b.diff - a.diff);
  res.json(leaderboard);
});

// 5. Get History
app.get('/api/history', async (req, res) => {
  const list = await db.all(`
    SELECT a.*, 
           (SELECT COUNT(*) FROM matches WHERE activity_id = a.id) as total_matches,
           (SELECT COUNT(*) FROM matches WHERE activity_id = a.id AND status = 'finished') as finished_matches
    FROM activities a 
    ORDER BY created_at DESC
  `);
  res.json(list);
});

// 5.1 Delete Activity
app.delete('/api/activities/:id', async (req, res) => {
  await db.run('DELETE FROM matches WHERE activity_id = ?', req.params.id);
  await db.run('DELETE FROM activities WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// 5.2 Regenerate Matches
app.post('/api/activities/:id/regenerate', async (req, res) => {
  const { type: newType, rounds: newRounds } = req.body;
  const activity = await db.get('SELECT * FROM activities WHERE id = ?', req.params.id);
  if (!activity) return res.status(404).json({ error: 'Not found' });

  const players = JSON.parse(activity.players);
  const type = newType || activity.type;
  const roundsCount = parseInt(newRounds) || 1;

  // Update activity record if type changed
  if (newType) {
    await db.run('UPDATE activities SET type = ? WHERE id = ?', [newType, req.params.id]);
  }

  // Clear existing
  await db.run('DELETE FROM matches WHERE activity_id = ?', req.params.id);

  let allMatches = [];
  for (let r = 0; r < roundsCount; r++) {
    let matches = [];
    if (type === 'singles_round_robin') {
      matches = roundRobin(players).map(m => ({ ...m, teamA: [m.a], teamB: [m.b] }));
    } else if (type === 'doubles_fixed_round_robin') {
      const pairs = [];
      for (let i = 0; i < players.length; i += 2) {
        if (players[i+1]) pairs.push([players[i], players[i+1]]);
        else pairs.push([players[i]]);
      }
      matches = roundRobin(pairs).map(m => ({ ...m, teamA: m.a, teamB: m.b }));
    } else {
      matches = doublesRotation(players);
    }
    // Offset round number
    allMatches.push(...matches.map(m => ({ ...m, round: (r * 10) + (m.round || 1) })));
  }

  for (const m of allMatches) {
    await db.run(
      'INSERT INTO matches (activity_id, round, team_a, team_b) VALUES (?, ?, ?, ?)',
      [activity.id, m.round, JSON.stringify(m.teamA), JSON.stringify(m.teamB)]
    );
  }

  res.json({ success: true });
});

// 6. Player Management
app.get('/api/players', async (req, res) => {
  const list = await db.all('SELECT * FROM players ORDER BY name ASC');
  res.json(list);
});

app.post('/api/players', async (req, res) => {
  const { name } = req.body;
  try {
    await db.run('INSERT INTO players (name) VALUES (?)', [name]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Player already exists or invalid data' });
  }
});

// 7. Get Player Performance (Grouped by Activity)
app.get('/api/players/:name/activities', async (req, res) => {
  const name = req.params.name;
  const rows = await db.all(`
    SELECT a.id, a.name, a.type, a.created_at,
           COUNT(m.id) as total_matches,
           SUM(CASE WHEN (m.team_a LIKE ? AND m.score_a > m.score_b) OR (m.team_b LIKE ? AND m.score_b > m.score_a) THEN 1 ELSE 0 END) as wins
    FROM activities a
    JOIN matches m ON a.id = m.activity_id
    WHERE (m.team_a LIKE ? OR m.team_b LIKE ?) AND m.status = 'finished'
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `, [`%"${name}"%`, `%"${name}"%`, `%"${name}"%`, `%"${name}"%`]);
  
  res.json(rows);
});

async function main() {
  db = await initDb();

  // Catch-all for SPA: Serve index.html for any route not handled by API or static middleware
  app.use((req, res, next) => {
    // Only serve index.html for non-api routes
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`Badminton Pro listening at http://0.0.0.0:${port}`);
  });
}

main();
