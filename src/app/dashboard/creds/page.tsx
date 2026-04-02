'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown, Trophy, Loader2 } from 'lucide-react';

export default function CredsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/user/credits')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ height: '3rem', width: '250px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '2rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel" style={{ height: '120px', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <div className="glass-panel" style={{ height: '300px', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.3s' }} />
      </div>
    );
  }

  const balance = data?.balance ?? 0;
  const wins = data?.totalWins ?? 0;
  const losses = data?.totalLosses ?? 0;
  const wagers = data?.wagers ?? [];
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>Arena Wallet</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Your cred balance, betting history, and performance stats.</p>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Balance */}
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(251,191,36,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Coins size={24} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Balance</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24' }}>{balance.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CREDS</div>
        </div>

        {/* Wins */}
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid rgba(16,185,129,0.2)' }}>
            <TrendingUp size={24} color="#10b981" />
          </div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Wins</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>{wins}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{winRate}% win rate</div>
        </div>

        {/* Losses */}
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(244,63,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid rgba(244,63,94,0.2)' }}>
            <TrendingDown size={24} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Losses</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f43f5e' }}>{losses}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wagers.length} total bets</div>
        </div>
      </div>

      {/* Bet History */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} color="#fbbf24" /> Bet History
        </h2>

        {wagers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <Coins size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No bets placed yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Join an arena and wager your creds to see your history here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wagers.map((w: any) => {
              const won = w.room?.winningSide === w.side;
              const isPending = w.room?.status !== 'COMPLETED';
              return (
                <div key={w.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem 1.25rem', borderRadius: '10px',
                  background: isPending ? 'rgba(251,191,36,0.04)' : won ? 'rgba(16,185,129,0.04)' : 'rgba(244,63,94,0.04)',
                  border: `1px solid ${isPending ? 'rgba(251,191,36,0.1)' : won ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)'}`,
                }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{w.room?.topic || 'Unknown Room'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Side {w.side} · {new Date(w.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isPending ? '#fbbf24' : won ? '#10b981' : '#f43f5e' }}>
                      {isPending ? '' : won ? '+' : '-'}{w.amount} C
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: isPending ? '#fbbf24' : won ? '#10b981' : '#f43f5e' }}>
                      {isPending ? 'PENDING' : won ? 'WON' : 'LOST'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buy Creds Teaser */}
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem', textAlign: 'center', opacity: 0.6 }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>💰 Buy Creds marketplace coming soon...</p>
      </div>
    </div>
  );
}
