import {useEffect,useState} from 'react';import {useParams} from 'react-router-dom';import {api} from '../services/api';import EmailHistoryList from '../components/EmailHistoryList';import StatusBadge from '../components/StatusBadge';import ComposeModal from '../components/ComposeModal';import { typeLabels, regionLabels } from '../utils/labels';
export default function OrganizationDetailPage(){const {id}=useParams(); const [org, setOrg] = useState(null);
  const [actions, setActions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('summary'); // summary, actions, tasks, documents
  const [loading, setLoading] = useState(true);
  const [hist,setHist]=useState([]),[acts,setActs]=useState([]),[note,setNote]=useState(''),[actType,setActType]=useState('MEETING'),[actNote,setActNote]=useState(''),[compose,setCompose]=useState(false),[msg,setMsg]=useState(''); async function load(){
      const [orgRes, actionsRes, tasksRes, docsRes] = await Promise.all([
        api.get('/organizations/'+id),
        api.get('/email-actions/organization/'+id),
        api.get('/tasks/org/'+id),
        api.get('/documents/org/'+id)
      ]);
      setOrg(orgRes);
      setHist(actionsRes);
      setTasks(tasksRes);
      setDocuments(docsRes);
      setActs(await api.get('/activities?organization_id='+id));
  } useEffect(()=>{load()},[id]); async function status(s){await api.patch(`/organizations/${id}/status`,{status:s});setMsg('Durum güncellendi');load()} async function add(){await api.post('/email-actions',{organization_id:Number(id),action_type:'NOTE',note,subject:'Manuel not'});setNote('');load()} async function addAct(){await api.post('/activities',{organization_id:Number(id),action:actType,description:actNote});setActNote('');load()} if(!org)return <div className="card">Yükleniyor...</div>; return <div className="space-y-6"><div className="flex items-center gap-4"><h1 className="text-3xl font-bold text-slate-800 tracking-tight">{org.name}</h1>{org.client_status==='ACTIVE_CLIENT'&&<span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Aktif Müşteri</span>}</div>{msg&&<p className="card bg-emerald-50 text-emerald-800 border-emerald-100">{msg}</p>}

        <div className="flex border-b border-slate-200">
          <button className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'summary' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('summary')}>Özet & CRM</button>
          <button className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'actions' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('actions')}>İletişim Geçmişi</button>
          <button className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'documents' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('documents')}>Evraklar</button>
        </div>

        {activeTab === 'summary' && <div className="grid md:grid-cols-3 gap-6"><div className="card md:col-span-1"><h2 className="font-bold mb-4">Kurum Bilgileri</h2><div className="space-y-2"><p><b>Tür:</b> {typeLabels[org.type]}</p><p><b>Bölge:</b> {regionLabels[org.region_type]}</p><p><b>Şehir:</b> {org.city}</p><p><b>İlçe:</b> {org.district}</p><p><b>E-posta:</b> {org.email}</p><p><b>Telefon:</b> {org.phone}</p><p><b>Yetkili:</b> {org.contact_person}</p><p className="pt-2"><StatusBadge status={org.status}/></p></div></div><div className="card md:col-span-1"><h2 className="font-bold mb-4 flex items-center gap-2">⚙️ Operasyon Bilgileri</h2>{org.client_status === 'ACTIVE_CLIENT' ? <div className="space-y-3"><div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Günlük Okuma (PAX)</p><p className="text-2xl font-bold text-sky-600">{org.daily_pax_volume || 0}</p></div><div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Sözleşme Tarihi</p><p className="text-lg font-semibold text-slate-700">{org.contract_date ? new Date(org.contract_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</p></div></div> : <div className="flex h-full items-center justify-center p-6 text-center text-slate-400 text-sm italic">Bu kurum henüz müşteri olmadığı için pax verisi yoktur.</div>}</div><div className="card md:col-span-1"><h2 className="font-bold mb-4">Hızlı Aksiyonlar</h2><div className="flex flex-col gap-2"><button className="btn" onClick={()=>setCompose(true)}>Mail Hazırla</button>{['REPLIED','POSITIVE','NEGATIVE','CLOSED'].map(s=><button className="btn-light text-left" key={s} onClick={()=>status(s)}>{s==='REPLIED'?'Cevap Geldi İşaretle':s==='POSITIVE'?'Olumlu Olarak İşaretle':s==='NEGATIVE'?'Olumsuz İşaretle':'Kapat'}</button>)}</div></div></div>}

        {activeTab === 'actions' && <div className="grid md:grid-cols-2 gap-6"><div className="card"><h2 className="font-bold mb-4">Aktivite İş Takibi</h2><div className="space-y-4 mb-6">{acts.map(a=><div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100"><span className="text-xs font-bold px-2 py-1 bg-sky-100 text-sky-700 rounded-md mr-2">{a.action==='MEETING'?'Toplantı':a.action==='REPORT_STATUS'?'Rapor Durumu':'Aksiyon'}</span><span className="text-sm font-semibold">{a.description}</span><p className="text-xs text-slate-500 mt-1">{new Date(a.created_at).toLocaleString('tr-TR')}</p></div>)}{acts.length===0&&<p className="text-sm text-slate-500">Henüz aktivite yok.</p>}</div><div className="border-t border-slate-100 pt-4"><h3 className="text-sm font-bold mb-2">Yeni Aktivite Ekle</h3><div className="flex gap-2 mb-2"><select className="input !w-auto" value={actType} onChange={e=>setActType(e.target.value)}><option value="MEETING">Toplantı Katılımı</option><option value="REPORT_STATUS">Raporlör Durumu</option><option value="OTHER">Diğer</option></select><input type="text" className="input" value={actNote} onChange={e=>setActNote(e.target.value)} placeholder="Aktivite detayı (Örn: Hastane ziyareti yapıldı)"/></div><button className="btn w-full" onClick={addAct} disabled={!actNote}>Aktiviteyi Kaydet</button></div></div><div className="card"><h2 className="font-bold mb-4">Mail Geçmişi</h2><EmailHistoryList items={hist}/><div className="mt-4 flex gap-2"><input type="text" className="input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Manuel mail notu"/><button className="btn-light whitespace-nowrap" onClick={add} disabled={!note}>Not Ekle</button></div></div></div>}

        {activeTab === 'documents' && (
              <div className="card space-y-4 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <span className="text-xl">📄</span> Kurum Evrakları
                  </h3>
                </div>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">Henüz bu kuruma ait bir evrak yüklenmemiş.</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-sky-100 flex items-center justify-center text-xl">
                            {doc.document_type === 'Fatura' ? '🧾' : doc.document_type === 'Sözleşme' ? '🤝' : '📄'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-800 truncate max-w-[200px]" title={doc.file_name}>{doc.file_name}</p>
                            <p className="text-xs text-slate-500">{doc.document_type} • {new Date(doc.created_at).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                        <a href={`http://localhost:4000${doc.file_path}`} target="_blank" rel="noreferrer" className="btn-sm text-sky-600 border-sky-200 hover:bg-sky-50">
                          Görüntüle
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

        <ComposeModal open={compose} organization={org} actionType="FIRST_EMAIL" onClose={()=>setCompose(false)} onSent={()=>{setMsg('Mail gönderildi');load()}}/></div>}
