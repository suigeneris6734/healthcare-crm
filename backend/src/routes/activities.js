const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get recent activities
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const orgId = req.query.organization_id;
    
    let query = `
      SELECT a.*, o.name as organization_name 
      FROM activity_logs a 
      LEFT JOIN organizations o ON a.organization_id = o.id 
    `;
    const params = [];
    
    if (orgId) {
      query += ` WHERE a.organization_id = ? `;
      params.push(orgId);
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT ?`;
    params.push(limit);
    
    const activities = db.prepare(query).all(...params);
    res.json(activities);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add a manual activity
router.post('/', (req, res) => {
  try {
    const { action, description, organization_id } = req.body;
    if (!action) return res.status(400).json({ error: 'Action is required' });
    
    const info = db.prepare('INSERT INTO activity_logs (organization_id, action, description, created_at) VALUES (?,?,?,?)')
      .run(organization_id || null, action, description || '', new Date().toISOString());
      
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
