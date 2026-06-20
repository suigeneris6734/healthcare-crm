const router = require('express').Router();
const db = require('../db/connection');
const { logActivity } = require('../services/logService');
const allowed = ['NEW','EMAIL_PLANNED','EMAIL_SENT','FOLLOW_UP_DUE','FOLLOW_UP_SENT','REPLIED','POSITIVE','NEGATIVE','CLOSED'];
function now(){return new Date().toISOString();}
router.get('/', (req,res)=>{
 const { type, status, q } = req.query;
 let sql='SELECT * FROM organizations WHERE 1=1'; const args=[];
 if(type){sql+=' AND type=?'; args.push(type)} if(status){sql+=' AND status=?'; args.push(status)} if(q){sql+=' AND (name LIKE ? OR email LIKE ? OR city LIKE ?)'; args.push(`%${q}%`,`%${q}%`,`%${q}%`)}
 sql+=' ORDER BY updated_at DESC, name ASC'; res.json(db.prepare(sql).all(...args));
});
router.get('/:id', (req,res)=>{ const row=db.prepare('SELECT * FROM organizations WHERE id=?').get(req.params.id); if(!row) return res.status(404).json({error:'Not found'}); res.json(row); });
router.post('/', (req,res)=>{ const b=req.body, t=now(); const info=db.prepare(`INSERT INTO organizations (name,type,region_type,city,district,email,phone,website,contact_person,status,source,notes,client_status,daily_pax_volume,contract_date,created_at,updated_at) VALUES (@name,@type,@region_type,@city,@district,@email,@phone,@website,@contact_person,@status,@source,@notes,@client_status,@daily_pax_volume,@contract_date,@created_at,@updated_at)`).run({...b,status:b.status||'NEW',client_status:b.client_status||'PROSPECT',daily_pax_volume:b.daily_pax_volume||0,contract_date:b.contract_date||null,created_at:t,updated_at:t}); logActivity(info.lastInsertRowid,'CREATE_ORGANIZATION',`Created ${b.name}`); res.status(201).json({id:info.lastInsertRowid}); });
router.put('/:id', (req,res)=>{ const b=req.body, t=now(); db.prepare(`UPDATE organizations SET name=@name,type=@type,region_type=@region_type,city=@city,district=@district,email=@email,phone=@phone,website=@website,contact_person=@contact_person,status=@status,source=@source,notes=@notes,client_status=@client_status,daily_pax_volume=@daily_pax_volume,contract_date=@contract_date,updated_at=@updated_at WHERE id=@id`).run({...b,status:b.status||'NEW',client_status:b.client_status||'PROSPECT',daily_pax_volume:b.daily_pax_volume||0,contract_date:b.contract_date||null,updated_at:t,id:req.params.id}); logActivity(req.params.id,'UPDATE_ORGANIZATION','Organization updated'); res.json({ok:true}); });
router.delete('/:id', (req,res)=>{ db.prepare('DELETE FROM organizations WHERE id=?').run(req.params.id); logActivity(null,'DELETE_ORGANIZATION',`Deleted organization ${req.params.id}`); res.json({ok:true}); });
router.patch('/:id/status', (req,res)=>{ const {status}=req.body; if(!allowed.includes(status)) return res.status(400).json({error:'Invalid status'}); db.prepare('UPDATE organizations SET status=?, updated_at=? WHERE id=?').run(status, now(), req.params.id); logActivity(req.params.id,'STATUS_CHANGE',`Status changed to ${status}`); res.json({ok:true}); });
module.exports = router;
