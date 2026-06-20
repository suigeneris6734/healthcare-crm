const path = require('path');
const Database = require('better-sqlite3');

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/healthcare-crm.db');
const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
module.exports = db;
