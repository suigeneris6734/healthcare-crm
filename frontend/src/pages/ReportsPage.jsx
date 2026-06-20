import { useState } from 'react';

export default function ReportsPage() {
  const [opts, setOpts] = useState({
    title: 'İstanbul Görüntüleme - Genel Rapor',
    includeStatuses: true,
    includeMeetings: true,
    includeMetrics: true,
    format: 'DOCX'
  });
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch('http://localhost:4000/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts)
      });
      if (!res.ok) throw new Error('Rapor oluşturulamadı');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapor-${new Date().toISOString().slice(0,10)}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch(e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Esnek Rapor Oluşturucu</h1>
      <p className="text-slate-500">Müşteriye veya yönetime sunulacak raporun içeriğini buradan seçebilirsiniz.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card space-y-6">
          <h2 className="font-bold text-lg">Rapor Ayarları</h2>
          
          <div>
            <label className="block text-sm font-semibold mb-2">Rapor Başlığı</label>
            <input type="text" className="input" value={opts.title} onChange={e=>setOpts({...opts, title: e.target.value})} />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold mb-2">Eklenecek Veriler</label>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="checkbox" className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500" checked={opts.includeMetrics} onChange={e=>setOpts({...opts, includeMetrics: e.target.checked})} />
              <div>
                <p className="font-semibold text-slate-800 text-sm">Genel İletişim Özeti</p>
                <p className="text-xs text-slate-500">Toplam mail, dönüş ve takiplerin rakamsal özeti.</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="checkbox" className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500" checked={opts.includeStatuses} onChange={e=>setOpts({...opts, includeStatuses: e.target.checked})} />
              <div>
                <p className="font-semibold text-slate-800 text-sm">Kurum Durumları</p>
                <p className="text-xs text-slate-500">Hastanelerin güncel satış/iletişim durumları.</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="checkbox" className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500" checked={opts.includeMeetings} onChange={e=>setOpts({...opts, includeMeetings: e.target.checked})} />
              <div>
                <p className="font-semibold text-slate-800 text-sm">Toplantı Kayıtları</p>
                <p className="text-xs text-slate-500">Son yapılan yüz yüze veya online toplantıların logları.</p>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-4">
            <button className="btn flex-1 flex justify-center items-center gap-2" onClick={generate} disabled={busy || (!opts.includeMeetings && !opts.includeMetrics && !opts.includeStatuses)}>
              {busy ? 'Oluşturuluyor...' : 'DOCX Olarak İndir'}
            </button>
            <a className="btn-light whitespace-nowrap flex items-center" href="http://localhost:4000/api/reports/monthly/export-csv">
              Basit CSV İndir
            </a>
          </div>
        </div>

        <div className="card bg-slate-50">
          <h2 className="font-bold text-lg mb-4">Canlı Önizleme</h2>
          <div className="bg-white shadow-sm border border-slate-200 p-8 min-h-[500px] flex flex-col gap-6">
            <div className="border-b border-sky-600 pb-4 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-bold text-sky-800">MEDICARE ANALYTICS</h3>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>{new Date().toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4 text-center">{opts.title}</h4>
              
              {opts.includeMetrics && (
                <div className="mb-6">
                  <h5 className="font-bold border-b border-slate-200 pb-1 mb-2">Genel İletişim Özeti</h5>
                  <div className="bg-slate-50 p-2 text-sm text-slate-600 rounded">İlk Mail: 145 | Takip: 30 | Olumlu Dönüş: 12</div>
                </div>
              )}
              
              {opts.includeStatuses && (
                <div className="mb-6">
                  <h5 className="font-bold border-b border-slate-200 pb-1 mb-2">Kurum Durumları</h5>
                  <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                    <li>Acıbadem Altunizade - Durum: POSITIVE</li>
                    <li>Memorial Şişli - Durum: REPLIED</li>
                  </ul>
                </div>
              )}
              
              {opts.includeMeetings && (
                <div className="mb-6">
                  <h5 className="font-bold border-b border-slate-200 pb-1 mb-2">Toplantı Kayıtları</h5>
                  <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                    <li>{new Date().toLocaleDateString('tr-TR')} - Acıbadem: Proje detayları konuşuldu</li>
                  </ul>
                </div>
              )}

              {!opts.includeMeetings && !opts.includeMetrics && !opts.includeStatuses && (
                <p className="text-center text-slate-400 italic mt-10">Lütfen soldan eklenecek verileri seçin.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
