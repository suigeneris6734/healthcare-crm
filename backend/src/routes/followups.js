const router = require('express').Router();
const svc = require('../services/taskService');
router.get('/due',(req,res)=>res.json(svc.dueFollowupsWithDays()));
router.post('/refresh',(req,res)=>res.json(svc.refreshFollowups()));
module.exports = router;
