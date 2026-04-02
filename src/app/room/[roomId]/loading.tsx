import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080514', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={48} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }} />
      <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>Loading Arena...</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Preparing your battleground</div>
    </div>
  );
}
