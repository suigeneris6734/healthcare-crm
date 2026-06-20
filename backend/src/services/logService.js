const db = require('../db/connection');
function logActivity(organizationId, action, description) { db.prepare('INSERT INTO activity_logs (organization_id, action, description, created_at) VALUES (?,?,?,?)').run(organizationId || null, action, description || '', new Date().toISOString()); }
module.exports = { logActivity };
