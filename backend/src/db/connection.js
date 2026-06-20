const path = require('path');
const Database = require('better-sqlite3');

const fs = require('fs');
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/healthcare-crm.db');
const dbDir = path.dirname(databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
module.exports = db;
