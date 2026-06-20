import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function RecentActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activities').then(setActivities).finally(() => setLoading(false));
  }, []);

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
  }

  function getIcon(action) {
    if (action === 'MEETING') return '🤝';
    if (action === 'REPORT_STATUS') return '📄';
    if (action === 'EMAIL_SENT') return '📧';
    return '✨';
  }

  return (
    <div className="card">
      <h2 className="section-title mb-4">Son Aktiviteler</h2>
      {loading ? <p className="text-slate-500 text-sm">Yükleniyor...</p> : 
       activities.length === 0 ? <p className="text-slate-500 text-sm">Henüz aktivite yok.</p> :
      <div className="space-y-4">
        {activities.map((a) => (
          <div key={a.id} className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sm shrink-0 shadow-sm">
              {getIcon(a.action)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{a.description || a.action}</p>
              <p className="text-xs text-slate-500">{formatTime(a.created_at)} {a.organization_name ? `• ${a.organization_name}` : ''}</p>
            </div>
          </div>
        ))}
      </div>}
      <button className="btn-light w-full mt-4 !text-xs">Tüm Aktiviteleri Gör</button>
    </div>
  );
}
