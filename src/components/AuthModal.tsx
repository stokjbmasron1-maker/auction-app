import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, AtSign, Loader, Eye, EyeOff } from 'lucide-react';
import { auctionService } from '../services/auctionService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        await auctionService.signIn(email, password);
      } else {
        if (!fullName || !username) {
          throw new Error('Nama lengkap dan Username wajib diisi');
        }
        if (password !== confirmPassword) {
          throw new Error('Password dan Konfirmasi Password tidak cocok');
        }
        await auctionService.signUp(email, password, username, fullName);
      }
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setIsSuccess(false);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await auctionService.signInWithGoogle();
      // OAuth redirects, so we don't need to manually close modal here immediately, but we can set loading
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login dengan Google');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel"
        style={{
          position: 'relative', width: '100%', maxWidth: '400px', padding: '32px',
          borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'var(--bg-dark-800)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxHeight: '90vh', overflowY: 'auto'
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '40px 0' }}
          >
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto',
              color: '#10b981'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              {isLogin ? 'Berhasil Masuk!' : 'Akun Berhasil Dibuat!'}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Mengarahkan ke aplikasi...</p>
          </motion.div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{isLogin ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                {isLogin ? 'Masuk untuk mulai menawar barang lelang' : 'Daftar sekarang dan ikuti lelang eksklusif'}
              </p>
            </div>

            {errorMsg && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Nama Lengkap</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="form-input" style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <AtSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" required value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\\s+/g, '_'))}
                    placeholder="budi_s"
                    className="form-input" style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="form-input" style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" minLength={6}
                className="form-input" style={{ paddingLeft: '40px', paddingRight: '40px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Konfirmasi Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" minLength={6}
                  className="form-input" style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="btn btn-primary" 
            style={{ height: '48px', fontSize: '16px', borderRadius: '12px', marginTop: '8px', display: 'flex', justifyContent: 'center' }}
          >
            {isLoading ? <Loader className="animate-spin" size={20} /> : (isLogin ? 'Masuk' : 'Daftar')}
          </button>
        </form>

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', flex: 1 }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ATAU</span>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', flex: 1 }} />
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="btn btn-outline"
          style={{ width: '100%', height: '48px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'white', color: 'black', border: 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span style={{ fontWeight: 600 }}>Lanjutkan dengan Google</span>
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button 
            onClick={toggleMode}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            {isLogin ? 'Daftar Sekarang' : 'Masuk di sini'}
          </button>
        </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
