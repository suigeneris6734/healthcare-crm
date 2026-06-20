const nodemailer = require('nodemailer');
const db = require('../db/connection');
const { addDays, todayDate } = require('../utils/date');
const { logActivity } = require('./logService');

const SMTP_KEYS = ['smtp_sender_name','smtp_sender_email','smtp_host','smtp_port','smtp_secure','smtp_username','smtp_password'];
function getSetting(key) { const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key); return row ? row.value : ''; }
function setSetting(key, value) { db.prepare('INSERT INTO settings (key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at').run(key, value ?? '', new Date().toISOString()); }
function getSmtpSettings(includePassword=false) {
  const out={}; SMTP_KEYS.forEach(k => out[k]=getSetting(k));
  out.smtp_secure = out.smtp_secure === 'true';
  out.smtp_port = Number(out.smtp_port || 587);
  if (!includePassword) { out.smtp_password = out.smtp_password ? '********' : ''; out.smtp_password_saved = !!getSetting('smtp_password'); }
  return out;
}
function saveSmtpSettings(body) {
  for (const k of SMTP_KEYS) {
    if (k === 'smtp_password' && (body[k] === undefined || body[k] === '********')) continue;
    if (body[k] !== undefined) setSetting(k, String(body[k]));
  }
  return getSmtpSettings(false);
}
function transporter() {
  const s=getSmtpSettings(true);
  if (!s.smtp_host || !s.smtp_username || !s.smtp_password || !s.smtp_sender_email) throw new Error('SMTP ayarları eksik');
  return nodemailer.createTransport({ host:s.smtp_host, port:s.smtp_port, secure:!!s.smtp_secure, auth:{ user:s.smtp_username, pass:s.smtp_password } });
}
async function sendTestEmail() {
  const s=getSmtpSettings(true); const t=transporter();
  const info=await t.sendMail({ from:`${s.smtp_sender_name || 'Healthcare CRM'} <${s.smtp_sender_email}>`, to:s.smtp_sender_email, subject:'Healthcare CRM Test Maili', text:'SMTP ayarları başarıyla çalışıyor.' });
  logActivity(null,'SMTP_TEST','SMTP test email sent'); return { messageId: info.messageId };
}
async function sendEmail({ organization_id, task_id, action_type='FIRST_EMAIL', to, subject, body }) {
  const org = organization_id ? db.prepare('SELECT * FROM organizations WHERE id=?').get(organization_id) : null;
  const task = task_id ? db.prepare('SELECT * FROM daily_tasks WHERE id=?').get(task_id) : null;
  const orgId = organization_id || task?.organization_id;
  const finalOrg = org || (orgId ? db.prepare('SELECT * FROM organizations WHERE id=?').get(orgId) : null);
  if (!finalOrg) throw new Error('Kurum bulunamadı');
  const finalTo = to || finalOrg.email; if (!finalTo) throw new Error('Alıcı e-posta adresi yok');
  const s=getSmtpSettings(true); const t=transporter();
  const info = await t.sendMail({ from:`${s.smtp_sender_name || 'Healthcare CRM'} <${s.smtp_sender_email}>`, to: finalTo, subject, text: body });
  const today=todayDate(); const now=new Date().toISOString(); const isFirst=action_type === 'FIRST_EMAIL'; const next=isFirst ? addDays(today,15) : null;
  const tx=db.transaction(()=>{
    if (task_id) db.prepare('UPDATE daily_tasks SET completed=1, completed_at=? WHERE id=?').run(now, task_id);
    db.prepare('UPDATE organizations SET status=?, updated_at=? WHERE id=?').run(isFirst?'EMAIL_SENT':'FOLLOW_UP_SENT', now, finalOrg.id);
    db.prepare(`INSERT INTO email_actions (organization_id, action_type, subject, email_from, email_to, action_date, next_follow_up_date, status, note, external_message_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(finalOrg.id, action_type, subject, s.smtp_sender_email, finalTo, today, next, isFirst?'EMAIL_SENT':'FOLLOW_UP_SENT', body, info.messageId, now);
    logActivity(finalOrg.id, isFirst?'SMTP_FIRST_EMAIL_SENT':'SMTP_FOLLOW_UP_SENT', `SMTP email sent to ${finalTo}`);
  }); tx();
  return { messageId: info.messageId, organizationId: finalOrg.id, next_follow_up_date: next };
}
module.exports = { getSmtpSettings, saveSmtpSettings, sendTestEmail, sendEmail };
