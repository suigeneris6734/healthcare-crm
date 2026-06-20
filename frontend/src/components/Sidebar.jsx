import { NavLink } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();

  const menuGroups = [
    {
      title: 'MÜŞTERİ YÖNETİMİ',
      links: [
        ['/organizations?filter=prospect', 'Potansiyel Müşteriler', '🎯'],
        ['/organizations?filter=client', 'Mevcut Müşteriler', '🤝'],
      ]
    },
    {
      title: 'OPERASYON',
      links: [
        ['/agenda', 'Ajanda & Takipler', '📅'],
        ['/documents', 'Akıllı Evrak Merkezi', '📄'],
      ]
    },
    {
      title: 'İLETİŞİM & ANALİZ',
      links: [
        ['/email-history', 'Mail Geçmişi', '✉️'],
        ['/reports', 'Raporlar', '📈'],
      ]
    },
    {
      title: 'SİSTEM',
      links: [
        ['/settings', 'Ayarlar', '⚙️'],
        ['/backups', 'Yedekleme', '🗄️'],
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col shadow-2xl z-20">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/50">
        <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">Medicare</h1>
            <p className="text-[10px] text-sky-400 font-bold tracking-[0.2em] uppercase mt-1">Analytics CRM</p>
          </div>
        </NavLink>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        <NavLink 
          to="/" 
          end
          className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${isActive ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          <span className="text-lg">📊</span>
          Dashboard
        </NavLink>

        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{group.title}</h3>
            <div className="space-y-1">
              {group.links.map(([to, label, icon]) => {
                // Determine if active (handling query params slightly hacky via hook or just letting router handle strict path match)
                // For simplicity, we rely on React Router NavLink behavior, but since they share the same base path, it might highlight both.
                // We'll fix active state for query params later if needed.
                return (
                  <NavLink 
                    key={to} 
                    to={to} 
                    className={({isActive, isPending}) => 
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ` + 
                      (window.location.pathname + window.location.search === to 
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50' 
                        : isActive && !to.includes('?') 
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50' 
                          : 'hover:bg-slate-800 hover:text-white')
                    }
                  >
                    <span className="text-lg opacity-80">{icon}</span>
                    {label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30 space-y-3">
        <button className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl text-white shadow-lg hover:shadow-sky-500/25 hover:-translate-y-0.5 transition-all group" onClick={() => window.dispatchEvent(new Event('open-voice-ai'))}>
          <div className="flex items-center gap-2">
            <span className="text-lg group-hover:scale-110 transition-transform">🎙️</span>
            <span className="font-semibold text-sm">Sesli Asistan</span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">AI</span>
        </button>
        
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
          <span className="text-lg">🚪</span>
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
