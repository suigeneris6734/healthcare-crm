import { useState, useRef } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function DocumentsPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setAiResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    try {
      const result = await api.upload('/documents/upload', file);
      if (result.success) {
        setAiResult(result);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (createNew = false) => {
    setLoading(true);
    try {
      const payload = {
        file_name: aiResult.file_name,
        file_path: aiResult.file_path,
        document_type: aiResult.ai_result?.document_type || 'Diğer',
      };

      if (createNew) {
        payload.create_new_name = aiResult.ai_result?.institution_name;
      } else {
        payload.organization_id = aiResult.matched_org?.id;
      }

      const res = await api.post('/documents/assign', payload);
      setFile(null);
      setAiResult(null);
      navigate(`/organizations/${res.organization_id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Akıllı Evrak Merkezi</h1>
        <p className="text-slate-500">Faturalar, sözleşmeler ve raporları yükleyerek yapay zekanın otomatik okumasını sağlayın.</p>
      </div>

      <div className="card">
        {!aiResult ? (
          <>
            <div 
              className="border-2 border-dashed border-sky-200 rounded-2xl p-16 text-center cursor-pointer hover:bg-sky-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-5xl mb-4">📥</div>
              <p className="text-lg font-semibold text-slate-700">Evrak seçin veya buraya sürükleyin</p>
              <p className="text-sm text-slate-400 mt-2">PDF, PNG veya JPEG kabul edilir</p>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".pdf,image/*"
              />
            </div>
            
            {file && (
              <div className="mt-6 p-4 bg-slate-50 border rounded-xl flex justify-between items-center">
                <span className="font-medium text-slate-700 truncate text-lg">📄 {file.name}</span>
                <button className="text-rose-500 font-bold hover:text-rose-600" onClick={() => setFile(null)}>Kaldır</button>
              </div>
            )}

            {error && <div className="mt-6 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">{error}</div>}

            <button 
              className="btn w-full mt-6 py-4 text-lg shadow-xl shadow-sky-500/20" 
              onClick={handleUpload} 
              disabled={!file || loading}
            >
              {loading ? '🤖 Yapay Zeka Okuyor...' : 'Yükle ve Analiz Et'}
            </button>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-sky-50 p-6 rounded-xl border border-sky-100">
              <h3 className="font-bold text-sky-800 text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">🤖</span> Yapay Zeka Analiz Sonucu
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-sky-600/80 uppercase font-bold tracking-wider mb-1">Tespit Edilen Kurum</p>
                  <p className="text-xl font-bold text-slate-800">{aiResult.ai_result?.institution_name || 'Bilinmiyor'}</p>
                </div>
                <div>
                  <p className="text-sm text-sky-600/80 uppercase font-bold tracking-wider mb-1">Evrak Tipi</p>
                  <p className="text-xl font-bold text-slate-800">{aiResult.ai_result?.document_type}</p>
                </div>
              </div>
            </div>

            {aiResult.matched_org ? (
              <div className="p-6 border border-emerald-200 bg-emerald-50 rounded-xl">
                <p className="text-lg font-medium text-slate-800">
                  Bu evrak sistemdeki <strong>{aiResult.matched_org.name}</strong> kurumuna ait görünüyor. Oraya kaydedelim mi?
                </p>
                <button className="btn-success w-full mt-6 py-3 text-lg" onClick={() => handleAssign(false)} disabled={loading}>
                  Evet, Hastane Dosyasına Ekle
                </button>
              </div>
            ) : aiResult.is_new ? (
              <div className="p-6 border border-amber-200 bg-amber-50 rounded-xl">
                <p className="text-lg font-medium text-slate-800">
                  Bu evrak <strong>{aiResult.ai_result.institution_name}</strong> isimli bir kuruma ait ancak sistemde böyle bir kayıt yok.
                </p>
                <button className="btn w-full mt-6 py-3 text-lg bg-amber-500 hover:bg-amber-600 text-white border-0" onClick={() => handleAssign(true)} disabled={loading}>
                  Yeni Kurum Oluştur ve Ekle
                </button>
              </div>
            ) : (
              <div className="p-6 border border-rose-200 bg-rose-50 rounded-xl">
                <p className="text-lg font-medium text-slate-800">
                  Kurum adı tespit edilemedi. Lütfen evrağı manuel olarak ilgili hastanenin sayfasına giderek yükleyin.
                </p>
                <button className="btn-light w-full mt-6 py-3 text-lg" onClick={() => { setFile(null); setAiResult(null); }}>
                  Geri Dön
                </button>
              </div>
            )}
            {error && <div className="mt-6 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
