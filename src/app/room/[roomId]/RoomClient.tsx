'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, MessageSquare, Gavel, Users, ArrowLeft, Send, Clock, AlertTriangle, Coins, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function RoomClient({ room, currentUser, initialParticipant }: any) {
  const router = useRouter();
  const supabase = createClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [hasJoined, setHasJoined] = useState(!!initialParticipant);
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(initialParticipant?.side || null);
  const [isJoining, setIsJoining] = useState(false);
  
  const [messageInput, setMessageInput] = useState('');
  const [wagerAmount, setWagerAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isWagering, setIsWagering] = useState(false);
  const [moderationError, setModerationError] = useState('');
  const [wagerError, setWagerError] = useState('');
  const [wagerSuccess, setWagerSuccess] = useState('');
  const [isJudging, setIsJudging] = useState(false);
  
  const [wagerPool, setWagerPool] = useState(room.wagerPool || 0);
  const [participantsCount, setParticipantsCount] = useState(room._count?.participants || 1);
  const [sideACount, setSideACount] = useState(room.participants?.filter((p: any) => p.side === 'A').length || 0);
  const [sideBCount, setSideBCount] = useState(room.participants?.filter((p: any) => p.side === 'B').length || 0);
  
  const canStartDebate = sideACount > 0 && sideBCount > 0;
  
  const [roomStatus, setRoomStatus] = useState(room.status);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  
  const initialMessages = room.messages?.map((m: any) => ({
      id: m.id,
      sender: m.sender,
      side: m.side,
      content: m.content,
      isMe: m.userId === currentUser.id,
      isSystem: m.isSystem
  })) || [];
  if (initialMessages.length === 0) {
      initialMessages.push({ id: 'system-welcome', sender: 'System', side: 'SYSTEM', content: `Welcome to the Arena: ${room.topic}`, isMe: false, isSystem: true });
  }
  const [messages, setMessages] = useState<any[]>(initialMessages);

  // Phase Calculation
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const bDate = room.bettingDeadline ? new Date(room.bettingDeadline) : null;
  const aDate = room.argumentDeadline ? new Date(room.argumentDeadline) : null;
  
  let phase = 'CLOSED';
  if (room.adminControls && !bDate && !aDate) {
    if (roomStatus === 'COMPLETED') phase = 'COMPLETED';
    else if (roomStatus === 'LIVE') phase = canStartDebate ? 'DEBATING' : 'AWAITING_OPPONENT';
    else phase = 'BETTING';
  } else if (roomStatus === 'COMPLETED') {
    phase = 'COMPLETED';
  } else if (bDate && now < bDate) {
    phase = 'BETTING';
  } else if (aDate && now < aDate) {
    phase = canStartDebate ? 'DEBATING' : 'AWAITING_OPPONENT';
  } else {
    phase = 'COMPLETED';
  }

  // If we are awaiting opponent but admin forces live, we revert to betting/awaiting until logic is met
  if (phase === 'AWAITING_OPPONENT') {
    // Awaiting opponent blocks input, conceptually it's an extended betting phase
  }

  const isAdmin = currentUser.id === room.creatorId && room.adminControls;

  // ─── Fetch wallet balance ───
  useEffect(() => {
    fetch('/api/user/credits').then(r => r.json()).then(d => setWalletBalance(d.balance)).catch(() => {});
  }, []);

  // ─── Fetch existing messages from DB ───
  useEffect(() => {
    if (!hasJoined) return;
    fetch(`/api/room/${room.id}/messages`).then(r => r.json()).then(d => {
      if (d.messages?.length) {
        const dbMsgs = d.messages.map((m: any) => ({
          id: m.id,
          sender: m.sender || 'Anonymous',
          side: m.side || 'SYSTEM',
          content: m.content,
          isMe: m.userId === currentUser.id,
          isSystem: m.isSystem,
        }));
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = dbMsgs.filter((m: any) => !existingIds.has(m.id));
          return [...prev, ...newMsgs];
        });
      }
    }).catch(() => {});
  }, [hasJoined, room.id, currentUser.id]);

  // ─── Supabase Realtime for messages Only ───
  useEffect(() => {
    if (!hasJoined && room.type === 'PRIVATE') return; 

    const channel = supabase.channel(`room-${room.id}`)
      .on('broadcast', { event: 'new_message' }, (payload: any) => {
        const newMsg = payload.payload;
        if (newMsg.userId === currentUser.id && !newMsg.isSystem) return; // Skip own non-system msgs
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          if (newMsg.isSystem) {
             const existingVerdict = prev.some(m => m.id.startsWith('verdict-') || m.content.includes('VERDICT:'));
             if (existingVerdict && newMsg.content.includes('VERDICT:')) return prev; 
          }
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hasJoined, room.id, currentUser.id, supabase]);

  // ─── Polling for Room Stats (WagerPool, Participant Counts) ───
  useEffect(() => {
    if (phase === 'COMPLETED' || !hasJoined) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/room/${room.id}/stats`);
        const data = await res.json();
        if (data && !data.error) {
          setWagerPool(data.wagerPool);
          setRoomStatus(data.status);
          setParticipantsCount(data.participantsCount);
          setSideACount(data.sideA);
          setSideBCount(data.sideB);
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [room.id, phase, hasJoined]);

  // ─── Auto scroll ───
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── JOIN ───
  const handleJoin = async (side: 'A' | 'B') => {
    setIsJoining(true);
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, side }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedSide(side);
        setHasJoined(true);
        setParticipantsCount((prev: number) => prev + 1);
        if (side === 'A') setSideACount((prev: number) => prev + 1);
        if (side === 'B') setSideBCount((prev: number) => prev + 1);
      } else {
        alert(data.error || 'Failed to join');
      }
    } catch { alert('Network error'); }
    finally { setIsJoining(false); }
  };

  // ─── WAGER ───
  const submitWager = async () => {
    if (!wagerAmount || Number(wagerAmount) <= 0) return;
    setIsWagering(true);
    setWagerError('');
    setWagerSuccess('');

    try {
      const res = await fetch(`/api/room/${room.id}/wager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: wagerAmount, side: selectedSide }),
      });
      const data = await res.json();
      if (res.ok) {
        setWagerSuccess(`✅ Wagered ${wagerAmount} creds on Side ${selectedSide}!`);
        setWalletBalance(data.newBalance);
        setWagerPool((prev: number) => prev + Number(wagerAmount));
        setWagerAmount('');
      } else {
        setWagerError(data.error || 'Wager failed');
      }
    } catch { setWagerError('Network error'); }
    finally { setIsWagering(false); }
  };

  // ─── SEND MESSAGE (with AI moderation) ───
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedSide || phase !== 'DEBATING' || isSending) return;
    const text = messageInput;
    setMessageInput('');
    setModerationError('');
    setIsSending(true);

    try {
      // Step 1: AI moderation
      const modRes = await fetch('/api/ai/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, topic: room.topic, sideA: room.sideAPov, sideB: room.sideBPov, userSide: selectedSide }),
      });
      const modResult = await modRes.json();

      if (!modResult.approved) {
        setModerationError(`⚠️ Blocked: ${modResult.reason}`);
        setMessageInput(text);
        setIsSending(false);
        return;
      }

      // Step 2: Store in DB
      const senderName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Anonymous';
      const dbRes = await fetch(`/api/room/${room.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, side: selectedSide, sender: senderName }),
      });
      const dbData = await dbRes.json();

      const pushedMsg = { id: dbData.message?.id || `local-${Date.now()}`, sender: senderName, side: selectedSide, content: text, isMe: true, isSystem: false, userId: currentUser.id };
      
      // Dispatch Broadcast instantly to other users
      await supabase.channel(`room-${room.id}`).send({ type: 'broadcast', event: 'new_message', payload: { ...pushedMsg, isMe: false } });

      // Show locally immediately
      setMessages(prev => [...prev, pushedMsg]);
    } catch {
      setMessages(prev => [...prev, { id: `local-${Date.now()}`, sender: 'You', side: selectedSide, content: text, isMe: true, isSystem: false, userId: currentUser.id }]);
    } finally {
      setIsSending(false);
    }
  };

  // ─── ADMIN ACTIONS ───
  const handleForceEndBetting = async () => {
    if (!canStartDebate) {
       alert("Cannot start debate yet! Ensure at least 1 person is on each side.");
       return;
    }
    if (!confirm("End betting and start the debate?")) return;
    setRoomStatus('LIVE');
    const sysMsg = { id: `sys-${Date.now()}`, sender: 'System', side: 'SYSTEM', content: '⚡ Admin ended betting. Debate phase started!', isMe: false, isSystem: true, userId: currentUser.id };
    await supabase.channel(`room-${room.id}`).send({ type: 'broadcast', event: 'new_message', payload: sysMsg });
    setMessages(prev => [...prev, sysMsg]);
    await fetch(`/api/room/${room.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'END_BETTING' }) });
  };

  const handleForceEndArgument = async () => {
    if (!confirm("End the debate?")) return;
    setRoomStatus('COMPLETED');
    setMessages(prev => [...prev, { id: `sys-${Date.now()}`, sender: 'System', side: 'SYSTEM', content: '🔒 Admin concluded the debate.', isMe: false, isSystem: true }]);
    await fetch(`/api/room/${room.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'END_DEBATE' }) });
  };

  const handleMakeAIJudge = async () => {
    if (!confirm("Summon the AI Judge?")) return;
    setIsJudging(true);
    setMessages(prev => [...prev, { id: `sys-${Date.now()}`, sender: 'System', side: 'SYSTEM', content: '🤖 AI Judge is deliberating... This may take a moment...', isMe: false, isSystem: true }]);
    try {
      const res = await fetch('/api/ai/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          messages: messages.filter(m => m.side === 'A' || m.side === 'B').map(m => ({ sender: m.sender, side: m.side, text: m.content })),
        }),
      });
      const result = await res.json();
      if (result.winner) {
        setRoomStatus('COMPLETED');
        const winLabel = result.winner === 'A' ? room.sideAPov : room.sideBPov;
        const verdictMsg = { id: `verdict-${Date.now()}`, sender: 'System', side: 'SYSTEM', content: `🏆 VERDICT: Side ${result.winner} (${winLabel}) wins!\n\n${result.verdict}`, isMe: false, isSystem: true, userId: currentUser.id };
        await supabase.channel(`room-${room.id}`).send({ type: 'broadcast', event: 'new_message', payload: verdictMsg });
        setMessages(prev => [...prev, verdictMsg]);
      }
    } catch {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, sender: 'System', side: 'SYSTEM', content: '❌ Failed to reach AI Judge.', isMe: false, isSystem: true, userId: currentUser.id }]);
    } finally { setIsJudging(false); }
  };

  // ════════════════════════════════════════════
  // 1. JOIN ARENA SCREEN
  // ════════════════════════════════════════════
  if (!hasJoined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#080514', alignItems: 'center', justifyContent: 'center', padding: '1rem', minHeight: 0 }}>
        <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Gavel size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: '1rem' }}>Enter the Arena</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{room.topic}</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <span style={{ background: phase === 'BETTING' ? 'rgba(251,191,36,0.1)' : phase === 'DEBATING' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: phase === 'BETTING' ? '#fbbf24' : phase === 'DEBATING' ? '#10b981' : '#f43f5e', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
              {phase}
            </span>
            {walletBalance !== null && (
              <span style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Coins size={14} /> {walletBalance.toLocaleString()} Creds
              </span>
            )}
          </div>
          
          {phase === 'COMPLETED' ? (
            <div style={{ color: '#f43f5e', fontWeight: 600 }}>This arena has concluded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button disabled={isJoining} onClick={() => handleJoin('A')} style={{
                padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: isJoining ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isJoining ? 0.5 : 1,
              }}>
                <span className="badge badge-pink" style={{ marginBottom: '8px' }}>SIDE A</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{room.sideAPov || 'Affirmative'}</span>
                <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {sideACount} Joined</span>
              </button>
              <button disabled={isJoining} onClick={() => handleJoin('B')} style={{
                padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: isJoining ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isJoining ? 0.5 : 1,
              }}>
                <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>SIDE B</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{room.sideBPov || 'Negative'}</span>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {sideBCount} Joined</span>
              </button>
              {isJoining && <div style={{ color: '#8b5cf6', fontSize: '0.85rem', fontWeight: 600 }}>Joining arena...</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // 2. LIVE ARENA SCREEN
  // ════════════════════════════════════════════
  return (
    <div className="flex-col-mobile" style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#080514', minHeight: 0 }}>
      
      {/* Sidebar - Hidden on mobile */}
      <aside className="room-sidebar w-full-mobile h-auto-mobile p-mobile-2" style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.05)', background: '#0e0b1a', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
          <Link href="/dashboard" style={{ color: '#fff' }}><ArrowLeft size={20} /></Link>
          <Gavel color="#fff" size={24} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>VERDICT</h1>
        </div>
        
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem', wordBreak: 'break-all' }}>
          Room ID: <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#fff' }}>{room.id.slice(0,8)}</span>
        </div>

        {/* Wallet */}
        <div style={{ padding: '1rem', background: '#09090b', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.15)', marginBottom: '1rem' }}>
           <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Your Wallet</div>
           <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Coins size={18} /> {walletBalance !== null ? walletBalance.toLocaleString() : '...'} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CREDS</span>
           </div>
        </div>
        
        <div style={{ padding: '1.2rem', background: '#09090b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
           <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>AI Arbiter</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
             <ShieldCheck size={18} /> {room.judgeMode || 'Arbitrator'}
           </div>
        </div>

        <div style={{ padding: '1.2rem', background: '#09090b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
             <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Filled Slots</span>
             <Users size={16} color="var(--text-secondary)" />
           </div>
           <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{participantsCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {room.participantLimit || '∞'}</span></div>
        </div>
      </aside>

      {/* Main Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        
        {/* Header */}
        <header className="room-main-header flex-col-mobile text-left-mobile p-mobile-2" style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', gap: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link href="/dashboard" className="mobile-only-flex" style={{ display: 'none', color: '#fff' }}><ArrowLeft size={20} /></Link>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.3, margin: 0 }}>{room.topic}</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-pink" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                SIDE A: {room.sideAPov || 'AFFIRMATIVE'} 
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>{sideACount}</span>
              </span>
              <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                SIDE B: {room.sideBPov || 'NEGATIVE'}
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>{sideBCount}</span>
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Pool</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{wagerPool.toLocaleString()} CREDS</div>
          </div>
        </header>

        {/* Admin Console */}
        {isAdmin && phase !== 'COMPLETED' && (
          <div style={{ background: 'rgba(244,63,94,0.05)', borderBottom: '1px solid rgba(244,63,94,0.1)', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <AlertTriangle size={16} /> Admin Console
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {phase === 'BETTING' && <button onClick={handleForceEndBetting} className="btn-outline" style={{ borderColor: '#fbbf24', color: '#fbbf24', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>End Betting → Debate</button>}
              {phase === 'DEBATING' && <button onClick={handleForceEndArgument} className="btn-outline" style={{ borderColor: '#f43f5e', color: '#f43f5e', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>End Debate</button>}
              {phase === 'DEBATING' && <button onClick={handleMakeAIJudge} disabled={isJudging} className="btn-outline" style={{ borderColor: '#8b5cf6', color: '#8b5cf6', padding: '0.4rem 1rem', fontSize: '0.8rem', opacity: isJudging ? 0.5 : 1 }}>{isJudging ? '⏳ Judging...' : '🤖 AI Judge'}</button>}
            </div>
          </div>
        )}

        {/* Chat Feed */}
        <div className="room-chat hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.02), transparent 80%)', minHeight: 0 }}>
          
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <span style={{ background: phase === 'BETTING' ? 'rgba(251,191,36,0.1)' : phase === 'DEBATING' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.75rem', color: phase === 'BETTING' ? '#fbbf24' : phase === 'DEBATING' ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
              PHASE: {phase}
            </span>
          </div>

          {messages.map((msg, idx) => {
            if (msg.isSystem || msg.side === 'SYSTEM') {
              return (
                <div key={msg.id || idx} style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>{msg.content}</span>
                </div>
              );
            }

            const isMe = msg.isMe;
            const tintColor = msg.side === 'A' ? '#6366f1' : '#10b981';
            const badgeBg = msg.side === 'A' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)';
            const badgeBorder = msg.side === 'A' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)';

            return (
              <div key={msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', marginLeft: isMe ? 0 : '4px', marginRight: isMe ? '4px' : 0 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{isMe ? '' : msg.sender}</span>
                  <span style={{ fontSize: '0.65rem', background: badgeBg, border: `1px solid ${badgeBorder}`, color: tintColor, padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    SIDE {msg.side} {isMe ? '(YOU)' : ''}
                  </span>
                </div>
                <div className="chat-bubble-mobile" style={{
                  maxWidth: '85%', background: isMe ? tintColor : '#0b0a1a', color: isMe ? '#fff' : 'var(--text-primary)',
                  padding: '1rem 1.25rem', borderRadius: '16px',
                  borderBottomRightRadius: isMe ? '4px' : '16px', borderBottomLeftRadius: !isMe ? '4px' : '16px',
                  border: isMe ? 'none' : `1px solid ${badgeBorder}`, fontSize: '0.95rem', lineHeight: 1.5,
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} style={{ height: '10px' }} />
        </div>

        {/* Input Bar */}
        <div style={{ flexShrink: 0 }}>
          {moderationError && (
            <div style={{ padding: '0.6rem 2rem', background: 'rgba(244,63,94,0.08)', borderTop: '1px solid rgba(244,63,94,0.15)', color: '#f43f5e', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {moderationError}
              <button onClick={() => setModerationError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
          )}
          {wagerError && (
            <div style={{ padding: '0.6rem 2rem', background: 'rgba(244,63,94,0.08)', borderTop: '1px solid rgba(244,63,94,0.15)', color: '#f43f5e', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {wagerError}
              <button onClick={() => setWagerError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
          )}
          {wagerSuccess && (
            <div style={{ padding: '0.6rem 2rem', background: 'rgba(16,185,129,0.08)', borderTop: '1px solid rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {wagerSuccess}
              <button onClick={() => setWagerSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
          )}
          {isSending && (
            <div style={{ padding: '0.4rem 2rem', background: 'rgba(139,92,246,0.05)', borderTop: '1px solid rgba(139,92,246,0.1)', color: '#8b5cf6', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> AI Moderator checking...
            </div>
          )}

          <div className="room-input" style={{ padding: '1.25rem 2rem', background: '#09090b', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="hidden-mobile" title={`Side ${selectedSide}`} style={{
              width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
              background: selectedSide === 'A' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
              border: selectedSide === 'A' ? '2px solid #6366f1' : '2px solid #10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: selectedSide === 'A' ? '#6366f1' : '#10b981', fontWeight: 800, fontSize: '1.2rem'
            }}>{selectedSide}</div>

            {phase === 'BETTING' ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                <div className="m-full-width-input" style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
                  <Coins size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input type="number" className="input-field" placeholder="Bet amount (100-10000)" value={wagerAmount}
                    onChange={e => setWagerAmount(e.target.value)}
                    style={{ paddingLeft: '38px', borderColor: 'rgba(251,191,36,0.4)', background: '#111', width: '100%' }} />
                </div>
                <button onClick={submitWager} disabled={isWagering} className="btn-neon btn-responsive-w" style={{ background: '#fbbf24', color: '#000', padding: '0 1.5rem', height: '45px', opacity: isWagering ? 0.5 : 1 }}>
                  {isWagering ? 'Placing...' : `Bet Side ${selectedSide}`}
                </button>
              </div>
            ) : phase === 'DEBATING' ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                <input className="input-field m-full-width-input" placeholder={isSending ? 'AI reviewing...' : `Argue for Side ${selectedSide}...`}
                  value={messageInput} onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()} disabled={isSending}
                  style={{ flex: 1, borderColor: moderationError ? 'rgba(244,63,94,0.4)' : (selectedSide === 'A' ? 'rgba(99,102,241,0.4)' : 'rgba(16,185,129,0.4)'), background: '#111', opacity: isSending ? 0.5 : 1 }} />
                <button onClick={sendMessage} disabled={isSending} className="btn-neon btn-responsive-w" style={{
                  background: isSending ? '#333' : (selectedSide === 'A' ? '#6366f1' : '#10b981'),
                  color: '#fff', padding: '0 1.5rem', minHeight: '45px', opacity: isSending ? 0.5 : 1,
                }}><Send size={18} /></button>
              </div>
            ) : phase === 'AWAITING_OPPONENT' ? (
              <div style={{ flex: 1, textAlign: 'center', color: '#fbbf24', fontSize: '0.9rem', fontStyle: 'italic', fontWeight: 600 }}>
                Awaiting opponents on both sides to begin debate...
              </div>
            ) : (
              <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                This arena has concluded.
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
