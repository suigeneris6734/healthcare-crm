const db = require('./connection');

function now() { return new Date().toISOString(); }

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('OSGB', 'HOSPITAL')),
      region_type TEXT NOT NULL CHECK (region_type IN ('MARMARA', 'TURKEY')),
      city TEXT,
      district TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      contact_person TEXT,
      status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','EMAIL_PLANNED','EMAIL_SENT','FOLLOW_UP_DUE','FOLLOW_UP_SENT','REPLIED','POSITIVE','NEGATIVE','CLOSED')),
      source TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_email_unique ON organizations(email) WHERE email IS NOT NULL AND email != '';
    CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
    CREATE INDEX IF NOT EXISTS idx_organizations_type_region ON organizations(type, region_type);

    CREATE TABLE IF NOT EXISTS email_actions (
      id INTEGER PRIMARY KEY,
      organization_id INTEGER NOT NULL,
      action_type TEXT NOT NULL CHECK (action_type IN ('FIRST_EMAIL','FOLLOW_UP','REPLY','NOTE')),
      subject TEXT,
      email_from TEXT,
      email_to TEXT,
      action_date TEXT NOT NULL,
      next_follow_up_date TEXT,
      status TEXT,
      note TEXT,
      external_message_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_email_actions_org ON email_actions(organization_id);
    CREATE INDEX IF NOT EXISTS idx_email_actions_date ON email_actions(action_date);

    CREATE TABLE IF NOT EXISTS daily_tasks (
      id INTEGER PRIMARY KEY,
      organization_id INTEGER NOT NULL,
      task_date TEXT NOT NULL,
      task_type TEXT NOT NULL CHECK (task_type IN ('SEND_FIRST_EMAIL','SEND_FOLLOW_UP')),
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      UNIQUE(organization_id, task_date, task_type)
    );
    CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(task_date);

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY,
      organization_id INTEGER,
      action TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS general_tasks (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED')),
      organization_id INTEGER,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_general_tasks_status ON general_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_general_tasks_due_date ON general_tasks(due_date);

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY,
      organization_id INTEGER,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      document_type TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
  `);
  db.prepare(`INSERT OR IGNORE INTO settings (key,value,updated_at) VALUES ('email_provider','NONE',?)`).run(now());

  // Migrations for organizations table
  try {
    const tableInfo = db.prepare("PRAGMA table_info(organizations)").all();
    const hasClientStatus = tableInfo.some(col => col.name === 'client_status');
    if (!hasClientStatus) {
      db.exec(`
        ALTER TABLE organizations ADD COLUMN client_status TEXT NOT NULL DEFAULT 'PROSPECT' CHECK (client_status IN ('PROSPECT', 'ACTIVE_CLIENT'));
        ALTER TABLE organizations ADD COLUMN daily_pax_volume INTEGER DEFAULT 0;
        ALTER TABLE organizations ADD COLUMN contract_date TEXT;
      `);
    }
  } catch (e) {
    console.error("Migration error:", e.message);
  }
}

module.exports = { initDatabase, now };
