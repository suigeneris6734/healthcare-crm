const fs = require('fs');
const path = require('path');
const os = require('os');
const xlsx = require('xlsx');
const db = require('../db/connection');
const { logActivity } = require('./logService');

const allowedImportExts = new Set(['.xlsx', '.xls', '.csv']);
let loggedDataDir = false;
function resolveProjectDataDir() {
  const candidates = [
    process.env.DATA_COLLECTION_DIR,
    path.resolve(__dirname, '../../../../../data_collection_healthcare'),
    path.resolve(process.cwd(), '../../data_collection_healthcare'),
    path.resolve(process.cwd(), '../../../data_collection_healthcare'),
    path.resolve(os.homedir(), 'Healthcare-Outreach-CRM/data_collection_healthcare')
  ].filter(Boolean);
  const checked = candidates.map(p => path.resolve(p));
  const found = checked.find(p => fs.existsSync(p) && fs.statSync(p).isDirectory());
  return { folder: found || checked[0], checked, found: !!found };
}

const columnMap = {
  name: ['name','Kurum Adı','kurum adı','kurum_adi','Kurum Adi','Kurum AdÄ±'],
  city: ['city','Şehir','şehir','Sehir','sehir','ÅŞehir','Å\x9Eehir'],
  district: ['district','İlçe','ilçe','Ilce','ilce','Ä°lÃ§e'],
  email: ['email','E-posta','Eposta','E-Posta','e-posta'],
  phone: ['phone','Telefon','telefon'],
  website: ['website','Web Sitesi','web sitesi','WebSite'],
  contact_person: ['contact_person','Yetkili Kişi','yetkili kişi','Yetkili Kisi','Yetkili KiÅ\x9Fi'],
  notes: ['notes','Notlar','notlar']
};
function fixEncoding(value) {
  return String(value).trim()
    .replaceAll('Ä°','İ').replaceAll('Ä±','ı').replaceAll('Ã¶','ö').replaceAll('Ã¼','ü').replaceAll('Ã§','ç').replaceAll('Å\x9F','ş').replaceAll('ÅŸ','ş').replaceAll('ÄŸ','ğ')
    .replaceAll('Ã–','Ö').replaceAll('Ãœ','Ü').replaceAll('Ã‡','Ç').replaceAll('Å\x9E','Ş').replaceAll('Äž','Ğ');
}
function pick(row, key) { for (const col of columnMap[key]) { if (row[col] !== undefined && row[col] !== null) return fixEncoding(row[col]); } return ''; }
function parseFile(filePath) {
  const wb = xlsx.readFile(filePath, { cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    name: pick(row,'name'), city: pick(row,'city'), district: pick(row,'district'), email: pick(row,'email'), phone: pick(row,'phone'), website: pick(row,'website'), contact_person: pick(row,'contact_person'), notes: pick(row,'notes')
  }));
}
function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function emailFormatOk(email) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email); }
function classifyRows(rows) {
  const seen = new Set();
  return rows.map(r => {
    const errors = [];
    let status = 'Hazır';
    const email = normalizeEmail(r.email);
    if (!r.name) errors.push('Kurum adı eksik');
    if (!email) {
      errors.push('E-posta adresi eksik');
      status = 'E-posta Eksik';
    } else if (!emailFormatOk(email)) {
      errors.push('E-posta formatı geçersiz');
      status = 'E-posta Geçersiz';
    }
    const duplicateInDb = email ? !!db.prepare('SELECT id FROM organizations WHERE lower(email)=?').get(email) : false;
    const duplicateInFile = email ? seen.has(email) : false;
    if (email) seen.add(email);
    const duplicate = duplicateInDb || duplicateInFile;
    if (duplicate) status = 'Tekrar';
    const valid = errors.length === 0 && !duplicate;
    return { ...r, email, duplicate, duplicateInDb, duplicateInFile, valid, status, errors };
  });
}
function summarize(records, listType, extra = {}) {
  const missingEmailRows = records.filter(r => r.status === 'E-posta Eksik').length;
  const invalidEmailRows = records.filter(r => r.status === 'E-posta Geçersiz').length;
  const duplicateRows = records.filter(r => r.duplicate).length;
  const invalidRows = records.filter(r => !r.valid && !r.duplicate && r.status !== 'E-posta Eksik').length;
  const importableRows = records.filter(r => r.valid).length;
  return { listType, totalRows: records.length, importableRows, duplicateRows, missingEmailRows, invalidEmailRows, invalidRows, records, ...extra };
}
function previewImport(file, listType) {
  const records = classifyRows(parseFile(file.path));
  return summarize(records, listType);
}
function safeProjectFile(filename) {
  const base = path.basename(filename || '');
  const ext = path.extname(base).toLowerCase();
  if (!base || base !== filename || !allowedImportExts.has(ext)) throw new Error('Geçersiz dosya adı');
  const { folder } = resolveProjectDataDir();
  const resolvedDir = path.resolve(folder);
  const resolvedFile = path.resolve(resolvedDir, base);
  if (!resolvedFile.startsWith(resolvedDir + path.sep)) throw new Error('Geçersiz dosya yolu');
  if (!fs.existsSync(resolvedFile)) throw new Error('Dosya bulunamadı');
  return resolvedFile;
}
function listProjectFiles() {
  const resolved = resolveProjectDataDir();
  if (!loggedDataDir || process.env.NODE_ENV !== 'production') {
    console.log('[import] data_collection_healthcare path:', resolved.folder, 'found:', resolved.found);
    loggedDataDir = true;
  }
  if (!fs.existsSync(resolved.folder)) return { folder: resolved.folder, checked: resolved.checked, files: [] };
  const files = fs.readdirSync(resolved.folder)
    .filter(name => allowedImportExts.has(path.extname(name).toLowerCase()))
    .map(name => {
      const full = safeProjectFile(name);
      const stat = fs.statSync(full);
      return { filename: name, size: stat.size, updatedAt: stat.mtime.toISOString() };
    })
    .sort((a,b)=>a.filename.localeCompare(b.filename));
  return { folder: resolved.folder, checked: resolved.checked, files };
}
function previewProjectImport(filename, listType) {
  const filePath = safeProjectFile(filename);
  return { ...previewImport({ path: filePath }, listType), filename: path.basename(filename) };
}
function saveImport(records, listType) {
  const forced = listType === 'OSGB_MARMARA' ? { type:'OSGB', region_type:'MARMARA', source:'EXCEL_OSGB_MARMARA' } : { type:'HOSPITAL', region_type:'TURKEY', source:'EXCEL_PRIVATE_HOSPITALS' };
  let imported=0, skippedDuplicate=0, invalid=0, missingEmail=0;
  const now = () => new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO organizations (name,type,region_type,city,district,email,phone,website,contact_person,status,source,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const seen = new Set();
  const tx = db.transaction(() => {
    for (const r of records) {
      const email = normalizeEmail(r.email);
      const errors=[];
      if (!r.name) errors.push('Kurum adı eksik');
      if (!email) { missingEmail++; continue; }
      if (!emailFormatOk(email)) errors.push('E-posta formatı geçersiz');
      if (errors.length) { invalid++; continue; }
      if (seen.has(email) || db.prepare('SELECT id FROM organizations WHERE lower(email)=?').get(email)) { skippedDuplicate++; seen.add(email); continue; }
      seen.add(email);
      const t=now(); stmt.run(r.name, forced.type, forced.region_type, r.city||'', r.district||'', email, r.phone||'', r.website||'', r.contact_person||'', 'NEW', forced.source, r.notes||'', t, t); imported++;
    }
  }); tx();
  logActivity(null, 'EXCEL_IMPORT', `${forced.source}: imported=${imported}, duplicates=${skippedDuplicate}, missingEmail=${missingEmail}, invalid=${invalid}`);
  return { imported, skippedDuplicate, missingEmail, invalid };
}
module.exports = { previewImport, saveImport, listProjectFiles, previewProjectImport };
