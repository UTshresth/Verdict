'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, Check, Loader2, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Orion',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sage',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zara',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Blaze',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ember',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Storm',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Vega',
];

export default function SettingsPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [googleAvatar, setGoogleAvatar] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState('');
  const [uploadedAvatar, setUploadedAvatar] = useState('');
  const [uploadedPath, setUploadedPath] = useState(''); // storage path for deletion
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'presets' | 'google' | 'upload'>('presets');
  const [userId, setUserId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUsername(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
        setGoogleAvatar(user.user_metadata?.avatar_url || '');
        setCurrentAvatar(user.user_metadata?.avatar_url || PRESET_AVATARS[0]);
      }
    };
    load();
  }, []);

  const activeAvatar = uploadedAvatar || selectedAvatar || currentAvatar;

  const handleFileUpload = async (file: File) => {
    if (!file || !userId) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Bust cache by adding timestamp
      setUploadedAvatar(`${publicUrl}?t=${Date.now()}`);
      setUploadedPath(path); // save path for potential deletion
      setSelectedAvatar('');
    } catch (e) {
      console.error('Upload error:', e);
      alert('Upload failed. Make sure the "avatars" bucket exists in Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  // Delete from Supabase Storage and clear local state
  const handleRemoveUpload = async () => {
    if (uploadedPath) {
      const supabase = createClient();
      await supabase.storage.from('avatars').remove([uploadedPath]);
    }
    setUploadedAvatar('');
    setUploadedPath('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update Prisma DB
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, image: activeAvatar }),
      });

      // 2. Update Supabase Auth metadata so server components see fresh data
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          full_name: username,
          avatar_url: activeAvatar,
        },
      });

      // 3. Navigate to dashboard with full refresh so Server Components re-fetch
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      console.error('Save error:', e);
      setSaving(false);
    }
  };

  const panel = {
    background: '#0e0b1a',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '1.25rem',
    marginBottom: '1rem',
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', marginBottom: '0.2rem' }}>
        Profile <span style={{ color: '#8b5cf6' }}>Settings</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Customise your identity in the arena.
      </p>

      {/* Preview + Username */}
      <div style={panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'nowrap' }}>
          {/* Avatar Preview */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              border: '3px solid #8b5cf6', overflow: 'hidden',
              background: '#1a1330', boxShadow: '0 0 20px rgba(139,92,246,0.3)'
            }}>
              {activeAvatar && (
                <img src={activeAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
          </div>

          {/* Username Input */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Display Name
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0 1rem' }}>
              <User size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Your arena name..."
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '1rem', fontWeight: 500, padding: '0.75rem 0',
                  width: '100%', fontFamily: 'var(--font-main)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Picker */}
      <div style={panel}>
        <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem' }}>Choose Avatar</h3>

        {/* Tabs */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {([
            { key: 'presets', label: '🎭 Presets' },
            { key: 'upload', label: '📷 Upload Photo' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer', border: 'none',
              whiteSpace: 'nowrap', flexShrink: 0,
              background: tab === t.key ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Presets Grid */}
        {tab === 'presets' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: '8px' }}>
            {PRESET_AVATARS.map((url, i) => {
              const isSelected = selectedAvatar === url && !uploadedAvatar;
              return (
                <div key={i} onClick={() => { setSelectedAvatar(url); setUploadedAvatar(''); }} style={{
                  width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden',
                  cursor: 'pointer',
                  border: isSelected ? '3px solid #8b5cf6' : '3px solid transparent',
                  boxShadow: isSelected ? '0 0 12px rgba(139,92,246,0.5)' : 'none',
                  transition: 'all 0.2s', background: '#1a1330', position: 'relative',
                }}>
                  <img src={url} alt={`preset ${i}`} style={{ width: '100%', height: '100%' }} />
                  {isSelected && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={16} color="#fff" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Photo */}
        {tab === 'upload' && (
          <div>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
            />

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#8b5cf6' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
                marginBottom: '0',
              }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={24} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Uploading...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload size={24} color={dragOver ? '#8b5cf6' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                      Drop image or browse
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded preview */}
            {uploadedAvatar && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', marginTop: '1rem' }}>
                <img src={uploadedAvatar} alt="uploaded" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>✓ Photo uploaded successfully</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>This will be your new avatar</div>
                </div>
                <button onClick={handleRemoveUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ marginTop: 'auto', paddingTop: '0' }}>
        <button onClick={handleSave} disabled={saving} className="settings-save-btn" style={{
          background: saved ? '#10b981' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          color: '#fff', border: 'none', borderRadius: '12px',
          padding: '0.9rem 2rem', fontSize: '0.95rem', fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: '10px',
          transition: 'all 0.3s', boxShadow: '0 0 20px rgba(139,92,246,0.3)',
          opacity: saving ? 0.7 : 1
        }}>
          {saving && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
          {saved && <Check size={18} />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
