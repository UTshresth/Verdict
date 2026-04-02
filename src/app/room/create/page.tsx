'use client';

import { useState } from 'react';
import { ArrowLeft, Server, Settings2, Scale, ShieldCheck, Search, Copy, Check, Lock, Globe, Loader2, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateRoom() {
  const router = useRouter();
  
  // Tab State
  const [roomType, setRoomType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  
  // Common State
  const [topic, setTopic] = useState('');
  const [sideA, setSideA] = useState('');
  const [sideB, setSideB] = useState('');
  const [judgeMode, setJudgeMode] = useState<'ANALYST' | 'MONK' | 'ROASTER' | 'DEVILS_ADVOCATE'>('ANALYST');

  // Shared Limits State
  const [bettingDeadline, setBettingDeadline] = useState('');
  const [argumentDeadline, setArgumentDeadline] = useState('');
  const [maxCred, setMaxCred] = useState<number | ''>(10000);

  // Private Specific State
  const [adminControls, setAdminControls] = useState(false);
  const [participantLimit, setParticipantLimit] = useState<number | ''>(''); // Empty means 'No Limit'

  // Submission State
  const [loading, setLoading] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  
  // Inline Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  // Post-creation State
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);

  // Constants
  const JUDGES = [
    { id: 'ANALYST', name: 'The Analytics', desc: 'Data-driven, objective logic.' },
    { id: 'MONK', name: 'The Monk', desc: 'Calm, ethical, and balanced.' },
    { id: 'ROASTER', name: 'The Roaster', desc: 'Aggressive, witty, takes no prisoners.' },
    { id: 'DEVILS_ADVOCATE', name: 'The Judgeman', desc: 'Questions everything, high scrutiny.' },
  ] as const;

  const handleCreate = async () => {
    const newErrors: Record<string, string> = {};

    if (!topic) newErrors.topic = 'Please provide a topic.';
    if (!sideA) newErrors.sideA = 'Please define Side A.';
    if (!sideB) newErrors.sideB = 'Please define Side B.';

    // Skip time/cred validation if admin controls are enabled (manual mode)
    const isManualMode = roomType === 'PRIVATE' && adminControls;

    if (!isManualMode) {
      if (!bettingDeadline) newErrors.bettingDeadline = 'Please select a betting deadline.';
      if (!argumentDeadline) newErrors.argumentDeadline = 'Please select an argument deadline.';

      const bDate = new Date(bettingDeadline);
      const aDate = new Date(argumentDeadline);
      const now = new Date();
      const fortyEightHoursFromNow = now.getTime() + 48 * 60 * 60 * 1000;
      
      if (bettingDeadline) {
        if (bDate.getTime() <= now.getTime()) {
          newErrors.bettingDeadline = 'Betting deadline must be in the future.';
        } else if (bDate.getTime() > fortyEightHoursFromNow) {
          newErrors.bettingDeadline = 'Betting deadline cannot exceed 48 hours from now.';
        }
      }

      if (argumentDeadline) {
        if (aDate.getTime() <= now.getTime()) {
          newErrors.argumentDeadline = 'Argument deadline must be in the future.';
        } else if (aDate.getTime() > fortyEightHoursFromNow) {
          newErrors.argumentDeadline = 'Argument deadline cannot exceed 48 hours from now.';
        }
      }

      if (bettingDeadline && argumentDeadline) {
        if (aDate.getTime() <= bDate.getTime()) {
          newErrors.argumentDeadline = 'Argument deadline must be after betting deadline.';
        } else if (aDate.getTime() - bDate.getTime() < 10 * 60 * 1000) {
          newErrors.argumentDeadline = 'There must be at least a 10-minute gap between deadlines.';
        }
      }

      const mCred = maxCred ? Number(maxCred) : 0;
      if (mCred < 100 || mCred > 10000) {
        newErrors.maxCred = 'Max Cred must be exactly between 100 and 10000.';
      }
    }

    if (participantLimit) {
      const pLimit = Number(participantLimit);
      if (pLimit < 2) {
        newErrors.participantLimit = 'Participant limit must be at least 2.';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
       return;
    }

    setGlobalError('');
    setLoading(true);

    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: roomType,
          topic,
          sideA,
          sideB,
          judgeMode,
          maxCred: maxCred ? Number(maxCred) : null,
          bettingDeadline: bettingDeadline ? new Date(bettingDeadline).toISOString() : null,
          argumentDeadline: argumentDeadline ? new Date(argumentDeadline).toISOString() : null,
          adminControls: roomType === 'PRIVATE' ? adminControls : false,
          participantLimit: participantLimit ? Number(participantLimit) : null,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      
      setCreatedRoomId(data.room.id);
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${createdRoomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchedUsers([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) setSearchedUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleInviteUser = async (userId: string) => {
    if (!createdRoomId) return;
    setInviteLoading(userId);
    try {
      const res = await fetch(`/api/room/${createdRoomId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      });
      if (res.ok) {
        setInvitedUsers(prev => new Set(prev).add(userId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInviteLoading(null);
    }
  };

  const handleGoToRoom = () => {
    router.push(`/dashboard/rooms?tab=created`);
  };

  const clearError = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // SUCCESS VIEW
  if (createdRoomId) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.1)', border: '2px solid #10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Check size={32} color="#10b981" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>Arena Activated</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Your {roomType.toLowerCase()} debate room is live.</p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {roomType === 'PRIVATE' && (
            <>
              {/* Share Link */}
              <div>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Share Invite Link
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input readOnly value={`${window.location.origin}/room/${createdRoomId}`} className="input-field" style={{ flex: 1, padding: '1rem', color: '#8b5cf6', background: 'rgba(139,92,246,0.05)' }} />
                  <button onClick={handleCopyLink} className="btn-neon" style={{ padding: '1rem 1.5rem' }}>
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              {/* Invite Users */}
              <div>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Invite Directly
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Search size={18} color="var(--text-muted)" />
                  </div>
                  <input 
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="input-field"
                    style={{ paddingLeft: '48px', paddingRight: '16px' }}
                  />
                  {searching && <Loader2 size={16} color="#8b5cf6" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />}
                </div>

                {searchedUsers.length > 0 && (
                  <div style={{ marginTop: '1rem', background: '#0e0b1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.5rem', maxHeight: '200px', overflowY: 'auto' }} className="hide-scrollbar">
                    {searchedUsers.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={u.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#999' }} />
                            <div>
                               <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{u.name || 'User'}</div>
                               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{u.email}</div>
                            </div>
                         </div>
                         <button 
                           className={invitedUsers.has(u.id) ? "btn-outline" : "btn-neon"} 
                           onClick={() => !invitedUsers.has(u.id) && handleInviteUser(u.id)}
                           disabled={invitedUsers.has(u.id) || inviteLoading === u.id}
                           style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: invitedUsers.has(u.id) ? 'transparent' : '#8b5cf6', borderColor: invitedUsers.has(u.id) ? '#10b981' : 'transparent', color: invitedUsers.has(u.id) ? '#10b981' : '#fff' }}
                         >
                           {inviteLoading === u.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : invitedUsers.has(u.id) ? 'Invited' : 'Invite'}
                         </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <button onClick={handleGoToRoom} className="btn-neon" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginTop: '1rem', justifyContent: 'center' }}>
            Enter Arena Now
          </button>
        </div>
      </div>
    );
  }

  // CREATE VIEW
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* Topbar */}
      <header className="dashboard-topbar" style={{
        height: '64px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', padding: '0 2rem'
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
          <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>Back</span>
        </Link>
      </header>

      {/* Scrollable Container */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem', paddingBottom: '6rem' }}>
          
          {/* Room Type Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', marginBottom: '2.5rem' }}>
             <button onClick={() => setRoomType('PUBLIC')} style={{
               flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
               borderRadius: '12px', background: roomType === 'PUBLIC' ? 'rgba(16,185,129,0.1)' : 'transparent',
               border: roomType === 'PUBLIC' ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
               color: roomType === 'PUBLIC' ? '#10b981' : 'var(--text-secondary)', fontWeight: 700, transition: 'all 0.2s',
               boxShadow: roomType === 'PUBLIC' ? '0 0 20px rgba(16,185,129,0.1)' : 'none'
             }}>
               <Globe size={20} /> PUBLIC ARENA
             </button>
             <button onClick={() => setRoomType('PRIVATE')} style={{
               flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
               borderRadius: '12px', background: roomType === 'PRIVATE' ? 'rgba(139,92,246,0.1)' : 'transparent',
               border: roomType === 'PRIVATE' ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
               color: roomType === 'PRIVATE' ? '#8b5cf6' : 'var(--text-secondary)', fontWeight: 700, transition: 'all 0.2s',
               boxShadow: roomType === 'PRIVATE' ? '0 0 20px rgba(139,92,246,0.1)' : 'none'
             }}>
               <Lock size={20} /> PRIVATE ARENA
             </button>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Topic Input */}
            <div>
              <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Central Thesis / Topic
              </label>
              <input 
                className={`input-field ${errors.topic ? 'error-border' : ''}`} 
                placeholder="e.g. Will AGI be developed before 2030?" 
                value={topic} 
                onChange={e => { setTopic(e.target.value); clearError('topic'); }}
                style={{ fontSize: '1.1rem', padding: '1rem', borderColor: errors.topic ? '#f43f5e' : undefined }}
              />
              {errors.topic && <div style={{ color: '#f43f5e', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{errors.topic}</div>}
            </div>

            {/* Sides Configuration */}
            <div className="grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Side A
                </label>
                <input 
                  className="input-field" 
                  placeholder="Affirmative stance (e.g. Yes)" 
                  value={sideA} 
                  onChange={e => { setSideA(e.target.value); clearError('sideA'); }} 
                  style={{ borderColor: errors.sideA ? '#f43f5e' : undefined }}
                />
                {errors.sideA && <div style={{ color: '#f43f5e', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{errors.sideA}</div>}
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Side B
                </label>
                <input 
                  className="input-field" 
                  placeholder="Negative stance (e.g. No)" 
                  value={sideB} 
                  onChange={e => { setSideB(e.target.value); clearError('sideB'); }} 
                  style={{ borderColor: errors.sideB ? '#f43f5e' : undefined }}
                />
                {errors.sideB && <div style={{ color: '#f43f5e', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{errors.sideB}</div>}
              </div>
            </div>

            {/* AI Judge Selector */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <Server size={18} color="#8b5cf6" /> Choose AI Arbiter
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {JUDGES.map(j => {
                  const isSelected = judgeMode === j.id;
                  return (
                    <div key={j.id} onClick={() => setJudgeMode(j.id)} style={{
                      padding: '1.25rem 1rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                      background: isSelected ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: isSelected ? '0 0 20px rgba(139,92,246,0.2)' : 'none',
                    }}>
                      <div style={{ color: isSelected ? '#fff' : 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isSelected && <ShieldCheck size={16} color="#8b5cf6" />}
                        {j.name}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>{j.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Settings (Shared & Specific) */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <Settings2 size={18} color="#10b981" /> {roomType === 'PRIVATE' ? 'Private Rules' : 'Public Rules'}
              </div>

              {/* SHARED SETTINGS (Deadlines & Creds) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>BETTING WINDOW DEADLINE</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '12px', pointerEvents: 'none', zIndex: 10 }} />
                      <input 
                        type="datetime-local" 
                        className="input-field" 
                        value={bettingDeadline} 
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={e => { setBettingDeadline(e.target.value); clearError('bettingDeadline'); }} 
                        style={{ paddingLeft: '40px', borderColor: errors.bettingDeadline ? '#f43f5e' : undefined }}
                      />
                    </div>
                    {errors.bettingDeadline && <div style={{ color: '#f43f5e', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{errors.bettingDeadline}</div>}
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>ARGUMENT DEADLINE</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '12px', pointerEvents: 'none', zIndex: 10 }} />
                      <input 
                        type="datetime-local" 
                        className="input-field" 
                        value={argumentDeadline} 
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={e => { setArgumentDeadline(e.target.value); clearError('argumentDeadline'); }} 
                        style={{ paddingLeft: '40px', borderColor: errors.argumentDeadline ? '#f43f5e' : undefined }}
                      />
                    </div>
                    {errors.argumentDeadline && <div style={{ color: '#f43f5e', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{errors.argumentDeadline}</div>}
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>MAX ARENA CRED POOL</label>
                    <input 
                      type="number" min={100} max={10000} 
                      className="input-field" 
                      placeholder="100 to 10000" 
                      value={maxCred} 
                      onChange={e => { setMaxCred(e.target.value ? Number(e.target.value) : ''); clearError('maxCred'); }} 
                      style={{ borderColor: errors.maxCred ? '#f43f5e' : undefined }}
                    />
                    {errors.maxCred && <div style={{ color: '#f43f5e', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{errors.maxCred}</div>}
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>PARTICIPANT LIMIT</label>
                    <input 
                      type="number" min={2} 
                      className="input-field" 
                      placeholder="No Limit" 
                      value={participantLimit} 
                      onChange={e => { setParticipantLimit(e.target.value ? Number(e.target.value) : ''); clearError('participantLimit'); }} 
                      style={{ borderColor: errors.participantLimit ? '#f43f5e' : undefined }}
                    />
                    {errors.participantLimit && <div style={{ color: '#f43f5e', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{errors.participantLimit}</div>}
                 </div>
              </div>

              {/* PRIVATE ONLY SETTINGS */}
              {roomType === 'PRIVATE' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.1)' }}>
                   
                   {/* Admin Controls */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>Creator Admin Controls</label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Allow creator to manually force close betting or argument windows early.</p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                         <button onClick={() => setAdminControls(true)} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, border: 'none', background: adminControls ? '#8b5cf6' : 'rgba(255,255,255,0.05)', color: adminControls ? '#fff' : 'var(--text-secondary)' }}>Enabled</button>
                         <button onClick={() => setAdminControls(false)} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, border: 'none', background: !adminControls ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', color: !adminControls ? '#fff' : 'var(--text-secondary)' }}>Disabled</button>
                      </div>
                   </div>
                </div>
              )}

            </div>

            {/* Global Error Message */}
            {globalError && (
              <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#f43f5e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings2 size={16} /> {globalError}
              </div>
            )}

            {/* Create Button */}
            <button onClick={handleCreate} disabled={loading} className="btn-neon" style={{
              width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginTop: '1rem', justifyContent: 'center', gap: '10px',
              background: loading ? 'rgba(255,255,255,0.1)' : (roomType === 'PUBLIC' ? '#10b981' : '#8b5cf6'), color: '#fff',
              boxShadow: roomType === 'PUBLIC' && !loading ? '0 0 20px rgba(16,185,129,0.3)' : (!loading ? '0 0 20px rgba(139,92,246,0.3)' : 'none')
            }}>
               {loading ? <><Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> 🧠 AI validating your arena...</> : <><Scale size={22} /> Launch {roomType.toLowerCase()} Arena</>}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}
