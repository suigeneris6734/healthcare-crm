const router = require('express').Router();
const db = require('../db/connection');
const { getSmtpSettings, saveSmtpSettings, sendTestEmail } = require('../services/smtpService');
router.get('/',(req,res)=>res.json(db.prepare('SELECT key, CASE WHEN key="smtp_password" AND value<>"" THEN "********" ELSE value END as value FROM settings ORDER BY key').all()));
router.put('/',(req,res)=>{ const now=new Date().toISOString(); const entries=Object.entries(req.body||{}); const stmt=db.prepare('INSERT INTO settings (key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at'); entries.forEach(([k,v])=>{ if(k==='smtp_password' && v==='********') return; stmt.run(k,String(v),now); }); res.json({updated:entries.length});});
router.get('/smtp',(req,res)=>res.json(getSmtpSettings(false)));
router.put('/smtp',(req,res)=>res.json(saveSmtpSettings(req.body || {})));
router.post('/smtp/test', async (req,res)=>{ try { res.json(await sendTestEmail()); } catch(e) { res.status(400).json({error:e.message}); } });
module.exports = router;
