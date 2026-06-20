const fs = require('fs');
const path = require('path');
const db = require('../db/connection');

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/healthcare-crm.db');
const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const backupPattern = /^healthcare-crm_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.db$/;
function ensureDir() { fs.mkdirSync(backupDir, { recursive: true }); }
function stamp() { return new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\.\d{3}Z$/, ''); }
function backupName(prefix='healthcare-crm') { return `${prefix}_${stamp()}.db`; }
function safePath(filename) { if (!backupPattern.test(filename)) throw new Error('Invalid backup filename'); return path.join(backupDir, filename); }
function createBackup() { ensureDir(); const filename = backupName(); db.pragma('wal_checkpoint(FULL)'); fs.copyFileSync(databasePath, path.join(backupDir, filename)); return { filename }; }
function listBackups() { ensureDir(); return fs.readdirSync(backupDir).filter(f => backupPattern.test(f)).map(filename => ({ filename, size: fs.statSync(path.join(backupDir, filename)).size })).sort((a,b)=>b.filename.localeCompare(a.filename)); }
function restoreBackup(filename) { const source = safePath(filename); if (!fs.existsSync(source)) throw new Error('Backup not found'); const safety = createBackup(); db.close(); fs.copyFileSync(source, databasePath); return { restored: filename, safetyBackup: safety.filename }; }
function deleteBackup(filename) { const p = safePath(filename); if (!fs.existsSync(p)) throw new Error('Backup not found'); fs.unlinkSync(p); return { deleted: filename }; }
module.exports = { createBackup, listBackups, restoreBackup, deleteBackup };
