import { useEffect, useState } from 'react';
import { api } from '../services/api';
import ComposeModal from './ComposeModal';
import StatusBadge from './StatusBadge';
import { taskLabels, typeLabels } from '../utils/labels';

const sentStatuses = new Set(['EMAIL_SENT','FOLLOW_UP_SENT','SENT','COMPLETED']);

export default function TodayTasksTable({tasks=[],onChange,onNotify}){
  const [compose,setCompose]=useState(null),[confirmTask,setConfirmTask]=useState(null),[busy,setBusy]=useState(false),[localCompleted,setLocalCompleted]=useState(new Set());
  useEffect(()=>{setLocalCompleted(prev=>{const next=new Set(prev);tasks.forEach(t=>{if(t.completed||sentStatuses.has(t.status))next.add(t.id)});return next;})},[tasks]);
  const isCompleted=t=>Boolean(t.completed)||sentStatuses.has(t.status)||localCompleted.has(t.id);
  async function refresh(){await onChange?.();}
  async function markConfirmed(){
    const t=confirmTask; if(!t)return;
    setBusy(true);
    try{
      const payload = { note: 'Mail sistem dışından manuel gönderildi olarak işaretlendi.' };
      if(t.task_type==='SEND_FIRST_EMAIL') await api.post(`/tasks/${t.id}/mark-email-sent`, payload);
      else await api.post(`/tasks/${t.id}/mark-follow-up-sent`, payload);
      setLocalCompleted(prev=>new Set(prev).add(t.id));
      setConfirmTask(null);
      onNotify?.('Gönderildi olarak işaretlendi');
      refresh();
    }catch(e){onNotify?.('İşlem başarısız: '+e.message,'error')}finally{setBusy(false)}
  }
  function handleSent(){
    if(compose?.task?.id)setLocalCompleted(prev=>new Set(prev).add(compose.task.id));
    onNotify?.('Mail gönderildi');
    refresh();
  }
  if(!tasks.length) return <div className="card friendly-empty"><h2 className="section-title">Bugünün 10 Mail Görevi</h2><p>Bugün için görev yok. “Bugünün 10 Mail Görevi Oluştur” düğmesine basarak öneri oluşturabilirsiniz.</p></div>;
  return <div className="card overflow-x-auto">
    <h2 className="section-title mb-1">Bugünün 10 Mail Görevi</h2>
    <p className="section-help mb-4">Her mail manuel hazırlanır ve son “Gönder” onayı olmadan gönderilmez.</p>
    <table className="w-full text-sm"><thead><tr><th>Kurum</th><th>E-posta</th><th>Tür</th><th>Görev</th><th>Durum</th><th>Aksiyonlar</th></tr></thead><tbody>{tasks.map(t=>{const completed=isCompleted(t);return <tr key={t.id} className={completed?'completed-row':''}><td className="font-semibold text-slate-800">{t.name}</td><td>{t.email || <span className="text-amber-700">E-posta yok</span>}</td><td>{typeLabels[t.type]||t.type}</td><td>{taskLabels[t.task_type]||t.task_type}</td><td>{completed?<span className="text-emerald-700 font-semibold">Gönderildi ✓</span>:<StatusBadge status={t.status}/>}</td><td className="space-x-2 whitespace-nowrap">{completed?<><button className="btn-light opacity-60 cursor-not-allowed" disabled>Mail Hazırla</button><button className="btn-success cursor-not-allowed" disabled>Gönderildi ✓</button></>:<><button className="btn-light" onClick={()=>setCompose({task:t, actionType:t.task_type==='SEND_FIRST_EMAIL'?'FIRST_EMAIL':'FOLLOW_UP'})}>Mail Hazırla</button><button className="btn" onClick={()=>setConfirmTask(t)}>Gönderildi İşaretle</button></>}</td></tr>})}</tbody></table>
    <ComposeModal open={!!compose} task={compose?.task} actionType={compose?.actionType} onClose={()=>setCompose(null)} onSent={handleSent}/>
    {confirmTask&&<div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4"><h3 className="text-xl font-bold text-slate-800">Gönderildi İşaretle</h3><p className="text-slate-700">Bu işlem mailin sistem dışından gönderildiğini işaretler. Devam etmek istiyor musunuz?</p><p className="text-sm bg-slate-50 p-3 rounded-xl">{confirmTask.name}</p><div className="flex justify-end gap-2"><button className="btn-light" disabled={busy} onClick={()=>setConfirmTask(null)}>Vazgeç</button><button className="btn" disabled={busy} onClick={markConfirmed}>Evet, Gönderildi İşaretle</button></div></div></div>}
  </div>
}
