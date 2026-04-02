'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Users, Globe, Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function getPhase(room: any) {
  const now = new Date();
  const bDate = room.bettingDeadline ? new Date(room.bettingDeadline) : null;
  const aDate = room.argumentDeadline ? new Date(room.argumentDeadline) : null;

  if (room.adminControls && !bDate && !aDate) {
    if (room.status === 'COMPLETED') return { phase: 'COMPLETED', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', timeLeft: 'Ended' };
    if (room.status === 'LIVE') return { phase: 'DEBATING', color: '#10b981', bg: 'rgba(16,185,129,0.1)', timeLeft: 'Manual' };
    return { phase: 'BETTING', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', timeLeft: 'Manual' };
  }

  if (room.status === 'COMPLETED') return { phase: 'COMPLETED', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', timeLeft: 'Ended' };

  if (bDate && now < bDate) {
    const mins = Math.max(0, Math.floor((bDate.getTime() - now.getTime()) / 60000));
    return { phase: 'BETTING', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', timeLeft: `${mins}m left` };
  }
  if (aDate && now < aDate) {
    const mins = Math.max(0, Math.floor((aDate.getTime() - now.getTime()) / 60000));
    return { phase: 'DEBATING', color: '#10b981', bg: 'rgba(16,185,129,0.1)', timeLeft: `${mins}m left` };
  }
  return { phase: 'COMPLETED', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', timeLeft: 'Ended' };
}

export default function LiveClient({ publicRooms, privateRooms }: { publicRooms: any[], privateRooms: any[] }) {
  const [tab, setTab] = useState<'public' | 'private'>('public');
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const router = useRouter();

  const rooms = tab === 'public' ? publicRooms : privateRooms;
  const pendingCount = privateRooms.filter((r: any) => r.inviteStatus === 'PENDING').length;

  const handleRoomClick = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    setLoadingRoomId(roomId);
    router.push(`/room/${roomId}`);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>Live Debates</h1>
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
          <button onClick={() => setTab('public')} style={{
            padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
            background: tab === 'public' ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: tab === 'public' ? '#10b981' : 'var(--text-secondary)',
            border: tab === 'public' ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
          }}>
            <Globe size={16} /> Public Feeds
          </button>
          <button onClick={() => setTab('private')} style={{
            padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
            background: tab === 'private' ? 'rgba(139,92,246,0.15)' : 'transparent',
            color: tab === 'private' ? '#8b5cf6' : 'var(--text-secondary)',
            border: tab === 'private' ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', position: 'relative'
          }}>
            <Lock size={16} /> Private Invites
            {pendingCount > 0 && (
              <span style={{ 
                minWidth: '18px', height: '18px', borderRadius: '50%', background: '#f43f5e', 
                color: '#fff', fontSize: '0.65rem', fontWeight: 800, display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>{pendingCount}</span>
            )}
          </button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <ShieldAlert size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>No Arenas Found</div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {tab === 'public' ? "No public debates running right now. Be the first to launch one!" : "You don't have any pending private invitations."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {rooms.map((room: any) => {
            const { phase, color: phaseColor, bg: phaseBg, timeLeft } = getPhase(room);
            const isLoading = loadingRoomId === room.id;

            return (
              <a href={`/room/${room.id}`} onClick={(e) => handleRoomClick(e, room.id)} key={room.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', padding: '1.5rem', transition: 'transform 0.2s, border 0.2s', position: 'relative' }}>
                {isLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', zIndex: 10 }}>
                    <Loader2 size={32} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ background: phaseBg, color: phaseColor, padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px' }}>{phase}</div>
                    {tab === 'private' && room.inviteStatus === 'PENDING' && (
                      <div style={{ background: 'rgba(139,92,246,0.2)', color: '#8b5cf6', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>NEW</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Clock size={14} /> {timeLeft}
                  </div>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: '1.5rem', flex: 1 }}>{room.topic}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Pool Size</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{room.wagerPool?.toLocaleString() || 0} C</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Slots</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1.1rem', fontWeight: 800, color: '#fff', justifyContent: 'flex-end' }}>
                      <Users size={14} color="var(--text-secondary)" /> {room._count?.participants || 0} / {room.participantLimit || '∞'}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
