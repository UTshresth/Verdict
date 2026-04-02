export default function Loading() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ height: '3rem', width: '350px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: '1.2rem', width: '420px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '3rem', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />
      <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2.5fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', height: '280px', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
          <div className="glass-panel" style={{ padding: '2rem', height: '160px', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.3s' }} />
        </div>
        <div>
          <div style={{ height: '1.5rem', width: '200px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '1.5rem', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.15s' }} />
          {[1, 2].map(i => (
            <div key={i} className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem', height: '170px', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${0.2 + i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
