const router = require('express').Router();
const db = require('../db/connection');
const { todayDate } = require('../utils/date');
router.get('/summary', (req,res)=>{
 const today=todayDate();
 const counts = db.prepare("SELECT status, COUNT(*) count FROM organizations GROUP BY status").all();
 const todayTasks = db.prepare("SELECT COUNT(*) total, SUM(completed) completed FROM daily_tasks WHERE task_date=?").get(today);
 const month = today.slice(0,7)+'%';
 const sentMonth = db.prepare("SELECT action_type, COUNT(*) count FROM email_actions WHERE action_date LIKE ? GROUP BY action_type").all(month);
 const due = db.prepare("SELECT COUNT(*) count FROM organizations WHERE status='FOLLOW_UP_DUE'").get().count;
 res.json({ organizationStatus: counts, todayTasks, sentMonth, followupsDue: due });
});
module.exports = router;
