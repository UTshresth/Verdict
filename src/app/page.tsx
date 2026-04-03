'use client';

import { Gavel, ArrowRight, ShieldAlert, Scale } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReturning(true);
        setTimeout(() => router.push('/dashboard'), 500);
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 15% 30%, rgba(253, 230, 200, 0.4) 0%, transparent 40%),
        radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 50% 100%, rgba(15, 23, 42, 1) 0%, transparent 100%),
        #110a26
      `,
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-main)'
    }}>
      {/* Top Nav */}
      <nav className="landing-nav" style={{ display: 'flex', justifyContent: 'space-between', padding: '2rem 4rem', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Gavel color="#fff" size={28} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>VERDICT</h1>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="hero-layout landing-main">

        {/* Left Column: Typography */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: '2rem' }}>
          <h1 className="hero-heading">
            Settle Debates. <span className="hidden-mobile">Establish Truth.</span> <br/>
            Unbiased <span className="ai-highlight" style={{ color: '#d2b4f7' }}>AI Judging.</span>
          </h1>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {returning ? (
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))',
                  color: '#d2b4f7', padding: '1.2rem 2.8rem', borderRadius: '40px',
                  fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px',
                  border: '1px solid rgba(139,92,246,0.4)', cursor: 'pointer',
                  boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6', flexShrink: 0 }}></span>
                Entering your arena... <ArrowRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="google-login-btn"
                style={{
                  background: '#09090b', color: '#fff', padding: '1.2rem 2.8rem', borderRadius: '40px',
                  fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px',
                  border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)',
                  cursor: 'pointer'
                }}
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" style={{ width: '24px', marginRight: '4px', background: 'white', borderRadius: '50%', padding: '2px' }} />
                Continue with Google <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Orbital Graphic */}
        <div className="hero-orbit" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div className="orbit-circle orbit-large"></div>
          <div className="orbit-circle orbit-medium"></div>
          <div className="orbit-circle orbit-small"></div>

          <div className="orbit-center-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
            <Gavel size={64} color="#fff" className="orbit-hammer-icon" style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.8))' }} />
            <div className="orbit-wordmark-mobile" style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px' }}>VERDICT</div>
            <div className="orbit-label-mobile" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px' }}>Arbiter Engine</div>
          </div>

          <div className="orbit-icon-mobile" style={{ position: 'absolute', top: '15%', left: '8%', background: '#09090b', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 20px rgba(255, 99, 132, 0.3)' }}>
            <ShieldAlert size={28} color="#ff6384" />
          </div>
          <div className="orbit-icon-mobile" style={{ position: 'absolute', bottom: '20%', right: '5%', background: '#09090b', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 20px rgba(255, 159, 64, 0.3)' }}>
            <Scale size={28} color="#ff9f40" />
          </div>
          <div className="orbit-icon-mobile" style={{ position: 'absolute', top: '25%', right: '15%', width: '64px', height: '64px', borderRadius: '50%', background: '#8b5cf6', border: '2px solid #fff', boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)', overflow: 'hidden' }}>
            <img src="https://i.pravatar.cc/150?img=11" alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="orbit-icon-mobile" style={{ position: 'absolute', bottom: '30%', left: '15%', width: '56px', height: '56px', borderRadius: '50%', background: '#ec4899', border: '2px solid #fff', boxShadow: '0 0 25px rgba(236, 72, 153, 0.5)', overflow: 'hidden' }}>
            <img src="https://i.pravatar.cc/150?img=44" alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="orbit-icon-mobile" style={{ position: 'absolute', top: '65%', right: '25%', width: '48px', height: '48px', borderRadius: '50%', background: '#10b981', border: '2px solid #fff', boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)', overflow: 'hidden' }}>
            <img src="https://i.pravatar.cc/150?img=68" alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </main>
    </div>
  );
}
