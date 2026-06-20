const db = require('../db/connection');
const { todayDate, addDays } = require('../utils/date');
const { logActivity } = require('./logService');

function generateTasksForToday() {
  const today = todayDate();
  const existing = getTodayTasks();
  if (existing.length > 0) {
    return { date: today, created: 0, alreadyCreated: true, tasks: existing, message: 'Bugünün görevleri zaten oluşturulmuş.' };
  }
  const insert = db.prepare('INSERT OR IGNORE INTO daily_tasks (organization_id, task_date, task_type, created_at) VALUES (?,?,?,?)');
  const now = new Date().toISOString();
  const sources = [
    { type: 'OSGB', region: 'MARMARA', limit: 5 },
    { type: 'HOSPITAL', region: 'TURKEY', limit: 5 }
  ];
  let created = 0;
  for (const source of sources) {
    const rows = db.prepare(`
      SELECT id FROM organizations
      WHERE type = ? AND region_type = ? AND status IN ('NEW','EMAIL_PLANNED')
      AND id NOT IN (SELECT organization_id FROM daily_tasks WHERE task_date = ?)
      ORDER BY created_at ASC LIMIT ?
    `).all(source.type, source.region, today, source.limit);
    for (const row of rows) {
      const info = insert.run(row.id, today, 'SEND_FIRST_EMAIL', now);
      created += info.changes;
    }
  }
  logActivity(null, 'GENERATE_TODAY_TASKS', `${created} daily tasks generated for ${today}`);
  return { date: today, created, alreadyCreated: false, tasks: getTodayTasks(), message: created > 0 ? 'Bugünün görevleri oluşturuldu.' : 'Bugün için oluşturulacak yeni görev bulunamadı.' };
}

function getTodayTasks() {
  const today = todayDate();
  return db.prepare(`
    SELECT t.*, o.name, o.type, o.region_type, o.city, o.email, o.status
    FROM daily_tasks t JOIN organizations o ON o.id = t.organization_id
    WHERE t.task_date = ? ORDER BY t.completed ASC, o.type DESC, o.name ASC
  `).all(today);
}

function markEmailSent(taskId, payload = {}) {
  const task = db.prepare('SELECT * FROM daily_tasks WHERE id = ?').get(taskId);
  if (!task) throw new Error('Task not found');
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(task.organization_id);
  const today = todayDate();
  const next = addDays(today, 15);
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare('UPDATE daily_tasks SET completed = 1, completed_at = ? WHERE id = ?').run(now, taskId);
    db.prepare('UPDATE organizations SET status = ?, updated_at = ? WHERE id = ?').run('EMAIL_SENT', now, org.id);
    db.prepare(`INSERT INTO email_actions (organization_id, action_type, subject, email_from, email_to, action_date, next_follow_up_date, status, note, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(org.id, 'FIRST_EMAIL', payload.subject || 'İlk tanıtım maili', payload.email_from || '', payload.email_to || org.email || '', today, next, 'EMAIL_SENT', payload.note || '', now);
    logActivity(org.id, 'FIRST_EMAIL_SENT', `First email marked sent. Follow-up date: ${next}`);
  });
  tx();
  return { taskId, organizationId: org.id, next_follow_up_date: next };
}

function refreshFollowups() {
  const today = todayDate();
  const rows = db.prepare(`
    SELECT o.id FROM organizations o
    JOIN email_actions ea ON ea.organization_id = o.id AND ea.action_type = 'FIRST_EMAIL'
    WHERE ea.next_follow_up_date <= ?
    AND o.status NOT IN ('REPLIED','POSITIVE','NEGATIVE','CLOSED','FOLLOW_UP_SENT')
    GROUP BY o.id
  `).all(today);
  const now = new Date().toISOString();
  const update = db.prepare('UPDATE organizations SET status = ?, updated_at = ? WHERE id = ?');
  rows.forEach(r => { update.run('FOLLOW_UP_DUE', now, r.id); logActivity(r.id, 'FOLLOW_UP_DUE', '15-day follow-up is due'); });
  return { updated: rows.length };
}

function dueFollowups() {
  refreshFollowups();
  return db.prepare(`SELECT * FROM organizations WHERE status = 'FOLLOW_UP_DUE' ORDER BY updated_at ASC`).all();
}

function dueFollowupsWithDays() {
  refreshFollowups();
  return db.prepare(`
    SELECT o.*, ea.action_date as first_email_date, CAST(julianday('now') - julianday(ea.action_date) AS INTEGER) as days_since_first_email
    FROM organizations o
    JOIN email_actions ea ON ea.organization_id=o.id AND ea.action_type='FIRST_EMAIL'
    WHERE o.status='FOLLOW_UP_DUE'
    GROUP BY o.id
    ORDER BY ea.action_date ASC
  `).all();
}

function markFollowUpSent(taskId, payload = {}) {
  const task = db.prepare('SELECT * FROM daily_tasks WHERE id = ?').get(taskId);
  if (!task) throw new Error('Task not found');
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(task.organization_id);
  const today = todayDate();
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare('UPDATE daily_tasks SET completed = 1, completed_at = ? WHERE id = ?').run(now, taskId);
    db.prepare('UPDATE organizations SET status = ?, updated_at = ? WHERE id = ?').run('FOLLOW_UP_SENT', now, org.id);
    db.prepare(`INSERT INTO email_actions (organization_id, action_type, subject, email_from, email_to, action_date, status, note, created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(org.id, 'FOLLOW_UP', payload.subject || 'Takip maili', payload.email_from || '', payload.email_to || org.email || '', today, 'FOLLOW_UP_SENT', payload.note || '', now);
    logActivity(org.id, 'FOLLOW_UP_SENT', 'Follow-up email marked sent');
  });
  tx();
  return { taskId, organizationId: org.id };
}

module.exports = { generateTasksForToday, getTodayTasks, markEmailSent, refreshFollowups, dueFollowups, dueFollowupsWithDays, markFollowUpSent };
