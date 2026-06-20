const router = require('express').Router();
const { sendEmail } = require('../services/smtpService');
router.post('/send', async (req,res)=>{ try { res.json(await sendEmail(req.body)); } catch(e) { res.status(400).json({error:e.message}); } });
module.exports = router;
