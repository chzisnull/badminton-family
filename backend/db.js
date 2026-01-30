const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function initDb() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT,
      players TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER,
      round INTEGER,
      team_a TEXT,
      team_b TEXT,
      score_a INTEGER DEFAULT 0,
      score_b INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY(activity_id) REFERENCES activities(id)
    );
  `);

  return db;
}

module.exports = { initDb };
