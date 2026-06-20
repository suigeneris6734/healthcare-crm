const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get all general tasks
router.get('/', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, o.name as organization_name 
      FROM general_tasks t 
      LEFT JOIN organizations o ON t.organization_id = o.id 
      ORDER BY 
        CASE WHEN t.status = 'PENDING' THEN 0 ELSE 1 END,
        t.due_date ASC, 
        t.created_at DESC
    `).all();
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create a new general task
router.post('/', (req, res) => {
  try {
    const { title, description, due_date, organization_id } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    
    const info = db.prepare(`
      INSERT INTO general_tasks (title, description, due_date, organization_id, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `).run(
      title, 
      description || '', 
      due_date || null, 
      organization_id || null, 
      new Date().toISOString()
    );
      
    res.status(201).json({ id: info.lastInsertRowid, success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update task status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;
    
    db.prepare(`
      UPDATE general_tasks 
      SET status = ?, completed_at = ? 
      WHERE id = ?
    `).run(status, completedAt, req.params.id);
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete task
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM general_tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
