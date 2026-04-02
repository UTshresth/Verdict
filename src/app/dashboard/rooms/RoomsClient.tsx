'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Users, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function getPhase(room: any) {
  const now = new Date();
  const bDate = room.bettingDeadline ? new Date(room.bettingDeadline) : null;
  const aDate = room.argumentDeadline ? new Date(room.argumentDeadline) : null;
  
  // Admin-controlled rooms with no deadlines stay OPEN (betting) until admin changes phase
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

export default function RoomsClient({ createdRooms, joinedRooms, userId }: { createdRooms: any[], joinedRooms: any[], userId: string }) {
  const [tab, setTab] = useState<'created' | 'joined'>('created');
  const [hiddenRoomIds, setHiddenRoomIds] = useState<Set<string>>(new Set());
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const router = useRouter();
  
  const rooms = tab === 'created' ? createdRooms : joinedRooms;
  const visibleRooms = rooms.filter(r => !hiddenRoomIds.has(r.id));

  const handleDelete = async (e: React.MouseEvent, room: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (room.creatorId === userId) {
      if (!confirm('You are the room creator. This will permanently delete this room for everyone. Continue?')) return;
      // Hide instantly from UI
      setHiddenRoomIds(prev => new Set(prev).add(room.id));
      // Fire-and-forget API call
      fetch(`/api/room/${room.id}`, { method: 'DELETE' }).catch(console.error);
    } else {
      // Just hide it locally for joined users
      setHiddenRoomIds(prev => new Set(prev).add(room.id));
    }
  };

  const handleRoomClick = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    setLoadingRoomId(roomId);
    router.push(`/room/${roomId}`);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>Your Rooms</h1>
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
          <button onClick={() => setTab('created')} style={{
            padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
            background: tab === 'created' ? 'rgba(139,92,246,0.15)' : 'transparent',
            color: tab === 'created' ? '#8b5cf6' : 'var(--text-secondary)',
            border: tab === 'created' ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
            transition: 'all 0.2s'
          }}>Created</button>
          <button onClick={() => setTab('joined')} style={{
            padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
            background: tab === 'joined' ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: tab === 'joined' ? '#10b981' : 'var(--text-secondary)',
            border: tab === 'joined' ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
            transition: 'all 0.2s'
          }}>Joined</button>
        </div>
      </div>

      {visibleRooms.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>No rooms found.</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You haven&apos;t {tab} any battlegrounds yet.</p>
          {tab === 'created' && <Link href="/room/create" className="btn-neon">Create a Room</Link>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {visibleRooms.map(room => {
            const { phase, color: phaseColor, bg: phaseBg, timeLeft } = getPhase(room);
            const isLoading = loadingRoomId === room.id;
            
            return (
              <a href={`/room/${room.id}`} onClick={(e) => handleRoomClick(e, room.id)} key={room.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', padding: '1.5rem', transition: 'transform 0.2s, border 0.2s', position: 'relative' }}>
                {isLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', zIndex: 10 }}>
                    <Loader2 size={32} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                
                {/* Delete icon for completed rooms */}
                {phase === 'COMPLETED' && (
                  <button onClick={(e) => handleDelete(e, room)} title="Remove from history" style={{
                    position: 'absolute', top: '12px', right: '12px', background: 'rgba(244,63,94,0.1)',
                    border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', padding: '6px', cursor: 'pointer',
                    color: '#f43f5e', transition: 'all 0.2s', zIndex: 5,
                  }}>
                    <Trash2 size={14} />
                  </button>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', paddingRight: phase === 'COMPLETED' ? '36px' : '0' }}>
                  <div style={{ background: phaseBg, color: phaseColor, padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px' }}>
                    {phase}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Clock size={14} /> {timeLeft}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                  {room.topic}
                </h3>

                {/* Side descriptions */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    A: {room.sideAPov}
                  </span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    B: {room.sideBPov}
                  </span>
                </div>

                {/* Winner display for completed rooms */}
                {phase === 'COMPLETED' && room.winningSide && (
                  <div style={{ 
                    background: room.winningSide === 'A' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${room.winningSide === 'A' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    color: room.winningSide === 'A' ? '#6366f1' : '#10b981',
                    padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center'
                  }}>
                    🏆 Winner: Side {room.winningSide} — {room.winningSide === 'A' ? room.sideAPov : room.sideBPov}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Pool</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{room.wagerPool?.toLocaleString() || 0} C</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Slots</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1.1rem', fontWeight: 800, color: '#fff', justifyContent: 'flex-end' }}>
                      <Users size={14} color="var(--text-secondary)" /> {room._count?.participants || 0}
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
