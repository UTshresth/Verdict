import { Book, TrendingUp, Clock, Coins } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch or initialize user in DB
  let dbUser = null;
  if (user) {
    dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {}, // We do NOT overwrite here to preserve user customizations 
      create: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        image: user.user_metadata?.avatar_url,
      },
    });
  }

  const userName = dbUser?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Debater';

  const balance = dbUser?.walletBalance ?? 1000;
  const wins = dbUser?.totalWins ?? 0;
  const losses = dbUser?.totalLosses ?? 0;
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  // Fetch recent public rooms
  const recentRooms = await prisma.room.findMany({
    where: { type: 'PUBLIC', status: { not: 'COMPLETED' } },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { _count: { select: { participants: true } } },
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', marginBottom: '0.5rem' }}>
        Welcome Back, <span style={{ color: '#8b5cf6' }}>{userName}</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '3rem' }}>
        Your tactical overview of current arena stakes and performance metrics.
      </p>

      <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2.5fr', gap: '2rem' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Wallet Panel */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', fontSize: '1rem' }}>Wallet</h3>
              <Coins size={20} color="#fbbf24" />
            </div>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fbbf24' }}>{balance.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Available Creds</div>
            </div>
          </div>

          {/* Record Book Panel */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', fontSize: '1rem' }}>Record Book</h3>
              <Book size={20} color="var(--text-muted)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Wins</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>{wins}</div>
              </div>
              <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Losses</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f43f5e' }}>{losses}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <span>Win Rate</span>
              <span style={{ color: '#8b5cf6' }}>{winRate}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${winRate}%`, height: '100%', background: '#8b5cf6', transition: 'width 0.3s' }}></div>
            </div>
            {wins + losses === 0 && (
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Play your first debate to get started!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Arena Feed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>Active Arenas</h2>
            <Link href="/dashboard/live" className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>View All</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {recentRooms.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>No active arenas</div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Be the first to create a debate!</p>
                <Link href="/room/create" className="btn-neon">Create Arena</Link>
              </div>
            ) : (
              recentRooms.map(room => {
                const isLive = room.status === 'LIVE';
                return (
                  <Link href={`/room/${room.id}`} key={room.id} className="glass-panel" style={{ display: 'flex', padding: 0, overflow: 'hidden', cursor: 'pointer', textDecoration: 'none' }}>
                    <div style={{ width: '8px', background: isLive ? '#10b981' : '#8b5cf6', flexShrink: 0 }}></div>
                    <div style={{ flex: 1, padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span className={isLive ? 'badge badge-cyan' : 'badge badge-pink'}>{isLive ? 'LIVE DEBATE' : 'BETTING OPEN'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Clock size={14} /> {room.adminControls ? 'Manual' : 'Active'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '1rem', fontWeight: 600 }}>{room.topic}</h3>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>A: {room.sideAPov}</span>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>B: {room.sideBPov}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '3rem' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Pool</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{room.wagerPool.toLocaleString()} C</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Players</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{room._count.participants}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
