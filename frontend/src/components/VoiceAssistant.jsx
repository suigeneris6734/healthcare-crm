import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-voice-ai', handleOpen);
    return () => window.removeEventListener('open-voice-ai', handleOpen);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tarayıcınız ses tanıma özelliğini desteklemiyor. Lütfen Chrome kullanın.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'tr-TR';

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setListening(false);
      setError('Ses algılanamadı: ' + event.error);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      setError('');
      setResult(null);
      setTranscript('');
      recognitionRef.current?.start();
      setListening(true);
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) return;
    setProcessing(true);
    setError('');
    
    try {
      const res = await api.post('/ai/voice-command', { command: transcript });
      setResult(res);
      // Wait 3 seconds and reload to show changes if any
      if (res.success) {
        setTimeout(() => window.location.reload(), 2500);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative">
        <div className="p-6 pb-2">
          <button onClick={() => { setIsOpen(false); setTranscript(''); setResult(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-2xl">&times;</button>
          <div className="flex flex-col items-center text-center space-y-4 pt-4">
            
            <button 
              onClick={toggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl transition-all duration-300 ${listening ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50 scale-110' : 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white hover:scale-105 shadow-sky-500/30'}`}
            >
              {listening ? '🛑' : '🎙️'}
            </button>
            
            <div>
              <h2 className="text-xl font-bold text-slate-800">{listening ? 'Dinliyorum...' : 'Akıllı CRM Asistanı'}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {listening ? 'Konuşmaya başlayın...' : 'Hastaneye not düşmek veya durum güncellemek için mikrofona basın.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <textarea 
            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-colors resize-none"
            placeholder="Örn: Acıbadem ile görüştüm, durumunu olumlu yap. Cuma gününe takip görevi oluştur."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />

          {error && <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm">{error}</div>}

          {result && (
            <div className={`mt-4 p-4 rounded-xl border ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <h4 className={`font-bold text-sm ${result.success ? 'text-emerald-800' : 'text-rose-800'} mb-2`}>
                {result.success ? '✅ İşlem Başarılı' : '⚠️ İşlem Başarısız'}
              </h4>
              <p className="text-sm text-slate-700">{result.message}</p>
              {result.success && <p className="text-xs text-emerald-600 font-semibold mt-2">Sayfa yenileniyor...</p>}
            </div>
          )}

          <button 
            className="btn w-full mt-6 py-4 shadow-xl shadow-sky-500/20 text-lg"
            onClick={handleSubmit}
            disabled={!transcript.trim() || processing}
          >
            {processing ? '🤖 Yapay Zeka İşliyor...' : 'Gönder ve Uygula'}
          </button>
        </div>
      </div>
    </div>
  );
}
