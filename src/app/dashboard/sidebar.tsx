'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, LayoutDashboard, Trophy, Settings, Gavel, LogOut, Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const navItems = [
  { name: 'Rooms', href: '/dashboard/rooms', icon: LayoutDashboard },
  { name: 'Live Debates', href: '/dashboard/live', icon: Activity },
  { name: 'Creds', href: '/dashboard/creds', icon: Trophy },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  userName: string;
  userAvatar: string;
  userInitial: string;
}

export default function Sidebar({ userName, userAvatar, userInitial }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* ——— DESKTOP SIDEBAR ——— */}
      <aside style={{
        width: '72px',
        minWidth: '72px',
        height: '100vh',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: '#0e0b1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.25rem 0',
        gap: '0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
      className="desktop-sidebar"
      >
        {/* VERDICT Logo → goes to dashboard */}
        <Link href="/dashboard" title="Dashboard" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '10px', transition: 'background 0.18s' }}>
          <Gavel size={26} color="#fff" />
        </Link>

        {/* Nav Icons */}
        <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, width: '100%' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                style={{
                  width: '48px', height: '48px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '12px',
                  background: isActive ? 'rgba(139,92,246,0.2)' : 'transparent',
                  color: isActive ? '#8b5cf6' : 'var(--text-secondary)',
                  transition: 'all 0.18s ease',
                  textDecoration: 'none',
                  position: 'relative',
                }}
              >
                {/* Active left indicator */}
                {isActive && (
                  <div style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', width: '3px', height: '24px', background: '#8b5cf6', borderRadius: '0 3px 3px 0' }} />
                )}
                <item.icon size={22} color={isActive ? '#8b5cf6' : 'var(--text-secondary)'} />
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Create + Avatar + Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', width: '100%' }}>
          <Link href="/room/create" title="Create New Room">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.18s' }}>
              <Plus size={20} color="#fff" />
            </div>
          </Link>

          {/* Avatar */}
          <div title={userName} style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(139,92,246,0.5)', cursor: 'pointer' }}>
            {userAvatar ? (
              <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
                {userInitial}
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* ——— MOBILE BOTTOM NAV ——— Only shown on non-settings pages */}
      {pathname !== '/dashboard/settings' && (
      <nav className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#0e0b1a',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '0.5rem 0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: '8px 12px', borderRadius: '10px', textDecoration: 'none',
                color: isActive ? '#8b5cf6' : 'var(--text-secondary)',
                fontSize: '0.65rem', fontWeight: 600, transition: 'color 0.18s',
              }}>
                <item.icon size={22} color={isActive ? '#8b5cf6' : 'var(--text-secondary)'} />
                {item.name.split(' ')[0]}
              </Link>
            );
          })}
          <Link href="/room/create" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            padding: '8px 12px', borderRadius: '10px', textDecoration: 'none',
            color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600,
          }}>
            <Plus size={22} />
            Create
          </Link>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '8px 12px', borderRadius: '10px',
              color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <LogOut size={22} />
            Logout
          </button>
        </div>
      </nav>
      )}
    </>
  );
}
