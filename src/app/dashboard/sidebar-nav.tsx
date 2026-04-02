'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, Trophy, Settings } from 'lucide-react';

const navItems = [
  { name: 'Live Debates', href: '/dashboard', icon: Activity },
  { name: 'My Bets', href: '/dashboard/bets', icon: LayoutDashboard },
  { name: 'Rankings', href: '/dashboard/rankings', icon: Trophy },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: '0 1rem' }}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 1rem', borderRadius: '8px',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid #8b5cf6' : '3px solid transparent',
              marginBottom: '8px',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.95rem',
              transition: 'all 0.18s ease',
              textDecoration: 'none',
            }}
          >
            <item.icon
              size={20}
              color={isActive ? '#8b5cf6' : 'var(--text-secondary)'}
              style={{ transition: 'color 0.18s ease', flexShrink: 0 }}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
