import { ReactNode } from 'react';
import { createClient } from '@/utils/supabase/server';
import Sidebar from './sidebar';
import Topbar from './topbar';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Debater';
  const userAvatar = user?.user_metadata?.avatar_url || '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#080514' }}>
      <Sidebar userName={userName} userAvatar={userAvatar} userInitial={userInitial} />

      {/* Main: topbar + scrollable content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <Topbar userName={userName} userAvatar={userAvatar} userInitial={userInitial} />

        {/* Scrollable page content */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="dashboard-content">
          <div className="dashboard-inner">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
