'use client';

import { useState, useEffect } from 'react';
import { Gavel, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TopbarProps {
  userName: string;
  userAvatar: string;
  userInitial: string;
}

export default function Topbar({ userName, userAvatar, userInitial }: TopbarProps) {
  const pathname = usePathname();
  const isSettings = pathname === '/dashboard/settings';

  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/user/credits')
      .then(r => r.json())
      .then(d => {
        if (d.balance !== undefined) setBalance(d.balance);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="dashboard-topbar" style={{
      height: '64px', flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 2rem', gap: '1rem',
    }}>
      {isSettings ? (
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
          <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>Back</span>
        </Link>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gavel size={20} color="#fff" />
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>VERDICT</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="creds-badge" style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '20px', padding: '5px 14px', color: '#10b981',
          fontWeight: 700, letterSpacing: '0.5px', fontSize: '0.85rem'
        }}>
          {balance !== null ? balance.toLocaleString() : '...'} CREDS
        </div>
        <Link href="/dashboard/settings" title="Profile Settings" style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(139,92,246,0.4)', flexShrink: 0 }}>
          {userAvatar ? (
            <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
              {userInitial}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
