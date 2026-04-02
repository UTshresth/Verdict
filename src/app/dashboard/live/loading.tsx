export default function Loading() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ height: '3rem', width: '240px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '1.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ display: 'flex', gap: '10px', marginBottom: '2.5rem' }}>
        <div style={{ height: '40px', width: '140px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '40px', width: '150px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-panel" style={{ padding: '1.5rem', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ height: '22px', width: '80px', background: 'rgba(255,255,255,0.06)', borderRadius: '20px' }} />
              <div style={{ height: '18px', width: '70px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
            </div>
            <div style={{ height: '24px', width: '85%', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '1.5rem' }} />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ height: '20px', width: '90px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
              <div style={{ height: '20px', width: '60px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
