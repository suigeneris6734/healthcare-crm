const router = require('express').Router();
const svc = require('../services/backupService');
router.post('/create',(req,res)=>res.json(svc.createBackup()));
router.get('/',(req,res)=>res.json(svc.listBackups()));
router.post('/restore',(req,res)=>{try{res.json(svc.restoreBackup(req.body.filename));}catch(e){res.status(400).json({error:e.message})}});
router.delete('/:filename',(req,res)=>{try{res.json(svc.deleteBackup(req.params.filename));}catch(e){res.status(400).json({error:e.message})}});
module.exports = router;
