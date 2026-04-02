'use client';

import { LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div
      onClick={handleLogout}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
        transition: 'color 0.2s', color: 'var(--text-secondary)', fontSize: '0.9rem'
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      <LogOut size={18} /> Logout
    </div>
  );
}
