import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const templates = {
  FIRST_EMAIL: {
    subject: 'Kısa tanıtım ve iş birliği hakkında',
    body: 'Merhaba,\n\nKurumunuzla sağlık alanındaki hizmetler kapsamında tanışmak isteriz. Uygun olmanız halinde kısa bir görüşme planlayabiliriz.\n\nSaygılarımla'
  },
  FOLLOW_UP: {
    subject: 'Önceki mesajımız hakkında kısa takip',
    body: 'Merhaba,\n\nDaha önce ilettiğimiz mesajı kısa bir şekilde takip etmek istedim. Uygun olduğunuzda dönüşünüzü bekleriz.\n\nSaygılarımla'
  }
};

function isEmail(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value || '');
}

export default function ComposeModal({ open, onClose, organization, task, actionType='FIRST_EMAIL', onSent }) {
  const tpl = templates[actionType] || templates.FIRST_EMAIL;
  const recipient = useMemo(() => organization?.email || task?.email || '', [organization?.email, task?.email]);
  const [to,setTo]=useState('');
  const [subject,setSubject]=useState(tpl.subject);
  const [body,setBody]=useState(tpl.body);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  useEffect(() => {
    if (open) {
      setTo(recipient || '');
      setSubject(tpl.subject);
      setBody(tpl.body);
      setError(recipient ? '' : 'Bu kurum için e-posta adresi kayıtlı değil.');
    }
  }, [open, recipient, actionType]);

  if(!open) return null;

  async function send(){
    if (!to.trim()) { setError('Bu kurum için e-posta adresi kayıtlı değil.'); return; }
    if (!isEmail(to.trim())) { setError('Lütfen geçerli bir e-posta adresi girin.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/email/send',{ organization_id: organization?.id || task?.organization_id, task_id: task?.id, action_type: actionType, to: to.trim(), subject, body });
      onSent && onSent();
      onClose();
    } catch(e){
      setError('Mail gönderilemedi. Lütfen SMTP ayarlarını kontrol edin.');
    } finally { setLoading(false); }
  }

  return <div className="fixed inset-0 bg-slate-900/40 z-40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-sky-100">
      <div className="flex justify-between items-start gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800">Mail Hazırla</h2><p className="text-sm text-slate-500">Mail son onayınız olmadan gönderilmez.</p></div>
        <button className="text-slate-500 hover:text-slate-800" onClick={onClose}>✕</button>
      </div>
      {error&&<p className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl text-sm">{error}</p>}
      {!recipient&&<p className="bg-amber-50 text-amber-800 border border-amber-100 p-3 rounded-xl text-sm">Bu kurum için e-posta adresi kayıtlı değil.</p>}
      <label className="block text-sm font-medium text-slate-700">Alıcı<input className="input mt-1" value={to} onChange={e=>setTo(e.target.value)} placeholder="ornek@kurum.com"/></label>
      <label className="block text-sm font-medium text-slate-700">Konu<input className="input mt-1" value={subject} onChange={e=>setSubject(e.target.value)}/></label>
      <label className="block text-sm font-medium text-slate-700">Mesaj<textarea className="input mt-1 min-h-48" value={body} onChange={e=>setBody(e.target.value)}/></label>
      <div className="flex justify-end gap-2"><button className="btn-light" onClick={onClose}>Vazgeç</button><button className="btn" disabled={loading || !to.trim()} onClick={send}>{loading?'Gönderiliyor...':'Gönder'}</button></div>
    </div>
  </div>;
}
