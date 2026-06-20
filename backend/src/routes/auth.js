const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// A simple hardcoded admin login since it's a single-user system
// In a real app, this should be in the database and hashed.
// Using an environment variable or default fallback
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '123456';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-medicare-key-2026';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ id: 1, role: 'admin', username }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { username, role: 'admin' } });
  }
  
  return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
});

// Middleware to verify token (can be exported and used in server.js)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Oturum süresi dolmuş veya geçersiz' });
    req.user = user;
    next();
  });
};

module.exports = {
  router,
  authenticateToken
};
