import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export default function AgendaPage() {
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // We will fetch daily_tasks, general_tasks, and organizations with follow_up_due
      // For simplicity, let's fetch them and group them by date here.
      const [gTasks, dTasks, orgs] = await Promise.all([
        api.get('/general-tasks'),
        api.get('/tasks/today'), // this is just today, maybe we need a new endpoint for all tasks? 
        api.get('/organizations?status=FOLLOW_UP_DUE')
      ]);

      const grouped = {};
      
      const add = (date, item) => {
        const d = date ? date.split('T')[0] : 'Tarihsiz';
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(item);
      };

      gTasks.forEach(t => add(t.due_date, { type: 'TODO', title: t.title, status: t.status, id: t.id }));
      dTasks.forEach(t => add(t.task_date, { type: 'EMAIL', title: `${t.organization_name} - ${t.task_type === 'SEND_FIRST_EMAIL' ? 'İlk Mail' : 'Takip Maili'}`, status: t.completed ? 'COMPLETED' : 'PENDING', orgId: t.organization_id }));
      orgs.forEach(o => add(o.updated_at, { type: 'FOLLOWUP', title: `${o.name} - Takip Bekliyor`, status: 'PENDING', orgId: o.id }));

      setItems(grouped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const dates = Object.keys(items).sort((a,b) => a === 'Tarihsiz' ? 1 : b === 'Tarihsiz' ? -1 : a.localeCompare(b));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Ajanda</h1>
          <p className="text-slate-500 mt-1">Yaklaşan görevleriniz, toplantılarınız ve takipleriniz.</p>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-slate-500">Yükleniyor...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {dates.map(date => (
            <div key={date} className="card">
              <h2 className="font-bold mb-4 text-sky-700 flex items-center gap-2">
                <span>📅</span> {date === 'Tarihsiz' ? 'Tarihsiz Görevler' : new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <div className="space-y-3">
                {items[date].map((item, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${item.status === 'COMPLETED' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mb-1 inline-block ${
                          item.type === 'TODO' ? 'bg-purple-100 text-purple-700' :
                          item.type === 'EMAIL' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.type}
                        </span>
                        <p className={`font-semibold text-sm ${item.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {item.title}
                        </p>
                      </div>
                      {item.orgId && (
                        <Link to={`/organizations/${item.orgId}`} className="text-xs text-sky-600 hover:underline">
                          Kuruma Git &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {dates.length === 0 && (
            <div className="col-span-2 friendly-empty">
              Yaklaşan hiçbir görev veya etkinlik bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
