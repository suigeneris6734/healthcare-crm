export default function Toast({ message, type='success', onClose }) {
  if (!message) return null;
  return <div className={`fixed right-5 top-5 z-50 rounded-xl px-4 py-3 shadow-lg text-sm ${type==='error'?'bg-red-600':'bg-emerald-600'} text-white`}>
    <div className="flex gap-3 items-center"><span>{message}</span><button onClick={onClose} className="font-bold">×</button></div>
  </div>;
}
