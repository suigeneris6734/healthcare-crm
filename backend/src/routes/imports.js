const router = require('express').Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('../db/connection');
const { logActivity } = require('../services/logService');
const { previewImport, saveImport, listProjectFiles, previewProjectImport } = require('../services/importService');
const upload = multer({ dest: path.join(__dirname, '../../uploads'), limits: { fileSize: 50 * 1024 * 1024 } });
function now(){return new Date().toISOString();}
function importCsv(file, forced) {
 return new Promise((resolve,reject)=>{
  let inserted=0, skipped=0;
  fs.createReadStream(file.path).pipe(csv()).on('data', row=>{
   const email=(row.email||'').trim();
   if(email && db.prepare('SELECT id FROM organizations WHERE email=?').get(email)){ skipped++; return; }
   const t=now();
   db.prepare(`INSERT INTO organizations (name,type,region_type,city,district,email,phone,website,contact_person,status,source,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(row.name, forced.type, forced.region_type, row.city||'', row.district||'', email, row.phone||'', row.website||'', row.contact_person||'', 'NEW', forced.source, row.notes||'', t, t);
   inserted++;
  }).on('end',()=>{ fs.unlinkSync(file.path); logActivity(null,'CSV_IMPORT',`${forced.source}: ${inserted} inserted, ${skipped} skipped`); resolve({inserted, skipped}); }).on('error',reject);
 });
}
router.post('/osgb-marmara', upload.single('file'), async (req,res)=>{ if(!req.file) return res.status(400).json({error:'CSV file required'}); res.json(await importCsv(req.file,{type:'OSGB',region_type:'MARMARA',source:'CSV_OSGB_MARMARA'})); });
router.post('/private-hospitals', upload.single('file'), async (req,res)=>{ if(!req.file) return res.status(400).json({error:'CSV file required'}); res.json(await importCsv(req.file,{type:'HOSPITAL',region_type:'TURKEY',source:'CSV_PRIVATE_HOSPITALS'})); });
router.get('/project-files', (req,res)=>{ try { res.json(listProjectFiles()); } catch(e) { res.status(400).json({error:e.message}); } });
router.post('/preview-project', (req,res)=>{ try { if(!req.body.filename) return res.status(400).json({error:'Dosya seçimi gerekli'}); res.json(previewProjectImport(req.body.filename, req.body.listType || 'OSGB_MARMARA')); } catch(e) { res.status(400).json({error:e.message}); } });
router.post('/preview', upload.single('file'), (req,res)=>{ try { if(!req.file) return res.status(400).json({error:'Dosya gerekli'}); const result=previewImport(req.file, req.body.listType || 'OSGB_MARMARA'); fs.unlinkSync(req.file.path); res.json(result); } catch(e) { if(req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); res.status(400).json({error:e.message}); } });
router.post('/save', (req,res)=>{ try { res.json(saveImport(req.body.records || [], req.body.listType || 'OSGB_MARMARA')); } catch(e) { res.status(400).json({error:e.message}); } });
module.exports = router;
