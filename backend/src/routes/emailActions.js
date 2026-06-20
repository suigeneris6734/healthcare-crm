const router = require('express').Router();
const db = require('../db/connection');
const { logActivity } = require('../services/logService');
router.get('/',(req,res)=>res.json(db.prepare(`SELECT ea.*, o.name as organization_name FROM email_actions ea LEFT JOIN organizations o ON o.id=ea.organization_id ORDER BY ea.created_at DESC, ea.id DESC LIMIT 300`).all()));
router.get('/organization/:organizationId',(req,res)=>res.json(db.prepare('SELECT * FROM email_actions WHERE organization_id=? ORDER BY action_date DESC, id DESC').all(req.params.organizationId)));
router.post('/',(req,res)=>{const b=req.body, now=new Date().toISOString(); const info=db.prepare(`INSERT INTO email_actions (organization_id,action_type,subject,email_from,email_to,action_date,next_follow_up_date,status,note,external_message_id,created_at) VALUES (@organization_id,@action_type,@subject,@email_from,@email_to,@action_date,@next_follow_up_date,@status,@note,@external_message_id,@created_at)`).run({...b, action_date:b.action_date||now.slice(0,10), created_at:now}); if(['REPLIED','POSITIVE','NEGATIVE','CLOSED'].includes(b.status)){db.prepare('UPDATE organizations SET status=?, updated_at=? WHERE id=?').run(b.status, now, b.organization_id)} logActivity(b.organization_id,'EMAIL_ACTION',`${b.action_type} added`); res.status(201).json({id:info.lastInsertRowid});});
module.exports = router;
