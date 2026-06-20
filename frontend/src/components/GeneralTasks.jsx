import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function GeneralTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');

  async function load() {
    setLoading(true);
    try {
      setTasks(await api.get('/general-tasks'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTask() {
    if (!newTask) return;
    try {
      await api.post('/general-tasks', {
        title: newTask,
        due_date: dueDate || null
      });
      setNewTask('');
      setDueDate('');
      load();
    } catch (e) {
      alert('Görev eklenemedi: ' + e.message);
    }
  }

  async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.patch(`/general-tasks/${id}/status`, { status: newStatus });
      load();
    } catch (e) {
      alert('Durum güncellenemedi');
    }
  }

  async function deleteTask(id) {
    if (!confirm('Görevi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/general-tasks/${id}`);
      load();
    } catch (e) {
      alert('Silinemedi');
    }
  }

  return (
    <div className="card h-full flex flex-col">
      <h2 className="section-title mb-4 flex items-center gap-2">
        <span>📋</span> Yapılacaklar (To-Do)
      </h2>
      
      <div className="flex flex-col gap-2 mb-4">
        <input 
          type="text" 
          className="input" 
          placeholder="Yeni görev ekle..." 
          value={newTask} 
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <div className="flex gap-2">
          <input 
            type="date" 
            className="input text-xs" 
            value={dueDate} 
            onChange={e => setDueDate(e.target.value)}
          />
          <button className="btn w-1/3" onClick={addTask} disabled={!newTask}>Ekle</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
        {loading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : 
         tasks.length === 0 ? <p className="text-sm text-slate-500 italic">Harika! Bekleyen görev yok.</p> :
         tasks.map(t => (
          <div key={t.id} className={`flex items-start gap-3 p-3 border rounded-xl transition-all ${t.status === 'COMPLETED' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              checked={t.status === 'COMPLETED'}
              onChange={() => toggleStatus(t.id, t.status)}
            />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${t.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                {t.title}
              </p>
              {t.due_date && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  ⏰ Son: {new Date(t.due_date).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
            <button onClick={() => deleteTask(t.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
