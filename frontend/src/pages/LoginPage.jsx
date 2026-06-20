import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full card p-8 border-t-4 border-t-sky-500 shadow-2xl shadow-sky-500/10">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 shadow-md shadow-sky-500/20 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 text-center tracking-tight mb-2">Medicare Analytics</h1>
        <p className="text-sm text-slate-500 text-center mb-8">Devam etmek için giriş yapın</p>
        
        {error && <div className="p-3 mb-4 text-sm bg-rose-50 text-rose-600 rounded-lg border border-rose-100">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Kullanıcı Adı</label>
            <input 
              type="text" 
              className="input w-full" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Şifre</label>
            <input 
              type="password" 
              className="input w-full" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>
          <button type="submit" className="btn w-full mt-6" disabled={loading}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
