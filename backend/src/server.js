require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { initDatabase } = require('./db/init');
const { refreshFollowups } = require('./services/taskService');
initDatabase();
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.get('/api/health',(req,res)=>res.json({ok:true}));
app.use('/api/dashboard', require('./routes/dashboard'));
const { router: authRouter, authenticateToken } = require('./routes/auth');

app.use('/api/auth', authRouter);

// Protect all API routes except auth
app.use('/api', authenticateToken);

app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/email-actions', require('./routes/emailActions'));
app.use('/api/email', require('./routes/emailSend'));
app.use('/api/import', require('./routes/imports'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/backups', require('./routes/backups'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/general-tasks', require('./routes/generalTasks'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/ai', require('./routes/aiVoice'));
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large' || err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Dosya çok büyük. Lütfen daha küçük bir Excel/CSV dosyası deneyin veya dosyayı parçalara bölün.' });
  }
  next(err);
});
cron.schedule('15 8 * * *', () => { try { refreshFollowups(); } catch (e) { console.error(e); } });
const port = process.env.PORT || 4000;
app.listen(port,()=>console.log(`Healthcare CRM backend running on http://localhost:${port}`));
