import React, { useState, useEffect } from 'react';
import { Hammer, LogOut, ChevronDown, PlusCircle, Search, User, Wallet } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { auctionService } from '../services/auctionService';
import type { Profile } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface NavbarProps {
  currentUser: Profile | null;
  onUserChanged: (user: Profile | null) => void;
  onLoginClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChanged,
  onLoginClick,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    // Listen to global auth changes (like logout)
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<Profile | null>;
      onUserChanged(customEvent.detail);
    };
    window.addEventListener('auth-state-changed', handleAuthChange);
    return () => window.removeEventListener('auth-state-changed', handleAuthChange);
  }, [onUserChanged]);

  const handleLogout = async () => {
    await auctionService.logout();
    onUserChanged(null);
    setShowUserDropdown(false);
  };

  return (
    <nav className="glass-panel" style={{
      borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
      borderTop: 'none',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      marginBottom: '32px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Hammer size={24} color="white" />
          </div>
          <div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: 800,
              background: 'linear-gradient(to right, #ffffff, var(--accent-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em'
            }}>
              LelangKu
            </span>
          </div>
        </Link>

        {/* Top Navigation Links */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: 1, 
          justifyContent: 'center' 
        }}>
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(8, 9, 13, 0.5)',
            padding: '6px',
            borderRadius: '100px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <NavLink 
              to="/" 
              style={({ isActive }) => ({
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                textDecoration: 'none', 
                fontSize: '13px', 
                fontWeight: isActive ? 700 : 600, 
                padding: '8px 24px',
                borderRadius: '100px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 4px 15px rgba(139, 92, 246, 0.15)' : 'none'
              })}
            >
              Beranda
            </NavLink>
            <NavLink 
              to="/auction" 
              style={({ isActive }) => ({
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                textDecoration: 'none', 
                fontSize: '13px', 
                fontWeight: isActive ? 700 : 600, 
                padding: '8px 24px',
                borderRadius: '100px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 4px 15px rgba(139, 92, 246, 0.15)' : 'none'
              })}
            >
              Bursa Lelang
            </NavLink>
          </div>
        </div>



        {/* Right Nav Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
              
              {/* Wallet Balance Badge */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '6px 12px',
                  borderRadius: '24px',
                  color: 'var(--success)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}
                onClick={() => navigate('/profile')}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Buka Profil untuk Top Up"
              >
                <Wallet size={14} />
                <span style={{ fontSize: '13px', fontWeight: 800 }}>
                  {formatPrice(currentUser.wallet_balance || 0)}
                </span>
              </div>

              {/* User Dropdown Toggle */}
              <div 
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  background: 'var(--bg-dark-800)',
                  border: '1px solid var(--bg-dark-700)',
                  padding: '6px 12px 6px 6px',
                  borderRadius: '24px',
                  userSelect: 'none'
                }}
              >
                <img 
                  src={currentUser.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default'} 
                  alt={currentUser.username} 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    background: 'var(--bg-dark-700)'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {currentUser.full_name}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    @{currentUser.username}
                  </span>
                </div>
                <ChevronDown size={14} color="var(--text-secondary)" />
              </div>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="glass-panel" style={{
                  position: 'absolute',
                  right: 0,
                  top: '52px',
                  width: '200px',
                  padding: '16px',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  animation: 'slideUp 0.2s ease-out'
                }}>
                  <button 
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/profile');
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', height: '36px', justifyContent: 'center' }}
                  >
                    <User size={14} /> Lihat Profil
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="btn btn-danger"
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      height: '36px',
                      justifyContent: 'center'
                    }}
                  >
                    <LogOut size={14} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-primary"
                onClick={onLoginClick}
                style={{ borderRadius: '24px', height: '40px', padding: '0 24px', fontWeight: 600 }}
              >
                Masuk / Daftar
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
