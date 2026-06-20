const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

function cleanError(message) {
  const text = String(message || 'İşlem başarısız');
  if (text.includes('PayloadTooLargeError') || text.includes('request entity too large') || text.includes('entity.too.large')) {
    return 'Dosya çok büyük. Lütfen daha küçük bir Excel/CSV dosyası deneyin veya dosyayı parçalara bölün.';
  }
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) return 'İşlem başarısız. Lütfen dosyayı ve sunucu ayarlarını kontrol edin.';
  try { const parsed = JSON.parse(text); return parsed.error || parsed.message || text; } catch { return text; }
}

async function readResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

async function request(path, options={}) {
  const token = localStorage.getItem('token');
  const headers = { 
    'Content-Type': 'application/json', 
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}) 
  };
  const res = await fetch(BASE + path, { ...options, headers });
  const data = await readResponse(res);
  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    throw new Error(cleanError(typeof data === 'string' ? data : (data.error || data.message)));
  }
  return data;
}

export const api = { 
  get: p => request(p), 
  post: (p,b={}) => request(p,{method:'POST',body:JSON.stringify(b)}), 
  put:(p,b={})=>request(p,{method:'PUT',body:JSON.stringify(b)}), 
  patch:(p,b={})=>request(p,{method:'PATCH',body:JSON.stringify(b)}), 
  del:p=>request(p,{method:'DELETE'}), 
  upload: async (p,file)=>{ 
    const token = localStorage.getItem('token');
    const fd=new FormData(); 
    fd.append('file',file); 
    const res=await fetch(BASE+p,{
      method:'POST',
      body:fd,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }); 
    const data=await readResponse(res); 
    if(!res.ok) throw new Error(cleanError(typeof data === 'string' ? data : (data.error || data.message))); 
    return data; 
  } 
};
