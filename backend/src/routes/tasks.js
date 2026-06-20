const router = require('express').Router();
const svc = require('../services/taskService');
router.get('/today',(req,res)=>res.json(svc.getTodayTasks()));
router.post('/generate-today',(req,res)=>res.json(svc.generateTasksForToday()));
router.post('/:id/mark-email-sent',(req,res)=>{try{res.json(svc.markEmailSent(req.params.id, req.body));}catch(e){res.status(404).json({error:e.message})}});
router.post('/:id/mark-follow-up-sent',(req,res)=>{try{res.json(svc.markFollowUpSent(req.params.id, req.body));}catch(e){res.status(404).json({error:e.message})}});
module.exports = router;
