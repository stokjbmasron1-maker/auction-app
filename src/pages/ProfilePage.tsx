import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, Settings, X, UploadCloud, AtSign, CheckCircle2, History, ArrowUpRight, Wallet } from 'lucide-react';
import { auctionService } from '../services/auctionService';
import type { Profile, AuctionItem } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { AuctionCard } from '../components/AuctionCard';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { StripeTopUpModal } from '../components/StripeTopUpModal';

interface ProfilePageProps {
  currentUser: Profile | null;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser }) => {
  const [myItems, setMyItems] = useState<AuctionItem[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'bids'>('items');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { formatPrice } = useCurrency();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Topup State
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  const ALL_AVATARS = currentUser ? [
    `https://api.dicebear.com/7.x/adventurer/svg?seed=Lily`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=Felix`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=Jocelyn`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=Jack`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Mia`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Leo`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Jane`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Brian`,
    `https://api.dicebear.com/7.x/micah/svg?seed=Sophia`,
    `https://api.dicebear.com/7.x/micah/svg?seed=Oliver`,
    `https://api.dicebear.com/7.x/micah/svg?seed=Chloe`,
    `https://api.dicebear.com/7.x/micah/svg?seed=Alex`,
    `https://api.dicebear.com/7.x/lorelei/svg?seed=Lily`,
    `https://api.dicebear.com/7.x/notionists/svg?seed=Felix`,
    `https://api.dicebear.com/7.x/personas/svg?seed=Mia`,
    `https://api.dicebear.com/7.x/personas/svg?seed=Leo`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`,
    `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${currentUser.id}`
  ] : [];
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allItems, userBids] = await Promise.all([
          auctionService.getItems(),
          auctionService.getUserBids()
        ]);
        setMyItems(allItems.filter(item => item.seller_id === currentUser.id));
        setMyBids(userBids);
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Sync local state
    setEditName(currentUser.full_name || '');
    setEditUsername(currentUser.username || '');
    setEditAvatarUrl(currentUser.avatar_url || '');
    setEditPhone(currentUser.phone || '');
    setEditAddress(currentUser.address || '');
    setEditCity(currentUser.city || '');
    setEditPostalCode(currentUser.postal_code || '');
  }, [currentUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, dsb)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxSize = 500;
        if (width > height) {
          if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        } else {
          if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setEditAvatarUrl(canvas.toDataURL('image/jpeg', 0.8));
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editUsername.trim()) {
      setError("Nama dan Username tidak boleh kosong.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await auctionService.updateProfile({
        full_name: editName.trim(),
        username: editUsername.trim(),
        avatar_url: editAvatarUrl,
        phone: editPhone.trim() || null,
        address: editAddress.trim() || null,
        city: editCity.trim() || null,
        postal_code: editPostalCode.trim() || null,
      });
      setIsSettingsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 24px', color: 'var(--text-secondary)' }}>
        <div style={{ background: 'var(--bg-dark-800)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
          <User size={40} color="var(--accent-secondary)" />
        </div>
        <h2 style={{ fontSize: '28px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 800 }}>Silakan Login</h2>
        <p>Anda harus masuk untuk melihat dan mengelola profil Anda.</p>
      </div>
    );
  }

  const handleTopUpSuccess = async (amount: number) => {
    if (!currentUser) return;
    try {
      const newBalance = (currentUser.wallet_balance || 0) + amount;
      await auctionService.updateProfile({ wallet_balance: newBalance });
      setIsTopUpModalOpen(false);
    } catch (err) {
      console.error("Failed to update wallet balance after stripe success", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ padding: '0 24px', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '60px' }}
    >
      {/* Aesthetic Profile Header Banner */}
      <section style={{ position: 'relative', marginTop: '20px' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '32px',
          filter: 'blur(40px)',
          opacity: 0.6,
          zIndex: -1
        }}></div>
        
        <div className="glass-panel" style={{ 
          padding: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '32px', 
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(8, 9, 13, 0.7)',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={currentUser.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=fallback'} 
              alt={currentUser.username} 
              style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: '4px solid rgba(139, 92, 246, 0.5)',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
              }}
            />
            <button 
              onClick={() => setIsSettingsOpen(true)}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                background: 'var(--accent-primary)',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Settings size={18} color="white" />
            </button>
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                {currentUser.full_name}
              </h1>
              <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '12px' }}>
                <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Verified
              </span>
            </div>
            <p style={{ color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 600 }}>
              <AtSign size={16} /> {currentUser.username}
            </p>
          </div>
          
          {/* Right Section: Stats & Wallet */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
            {/* Wallet Panel */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.2) 100%)', 
              padding: '16px 24px', 
              borderRadius: '16px', 
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: '200px'
            }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                  <Wallet size={14} /> Saldo LelangKu
                </span>
                <span style={{ display: 'block', fontSize: '24px', fontWeight: 800, color: 'white', marginTop: '4px' }}>
                  {formatPrice(currentUser.wallet_balance || 0)}
                </span>
              </div>
              <button 
                onClick={() => setIsTopUpModalOpen(true)}
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '12px', marginTop: '12px', width: '100%' }}
              >
                + Top Up Saldo
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--bg-dark-700)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ display: 'block', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{myItems.length}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Barang Lelang</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--bg-dark-700)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ display: 'block', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{myBids.length}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Bids</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--bg-dark-700)', paddingBottom: '12px' }}>
          <button 
            onClick={() => setActiveTab('items')}
            style={{
              background: 'transparent', border: 'none', color: activeTab === 'items' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              borderBottom: activeTab === 'items' ? '3px solid var(--accent-secondary)' : '3px solid transparent', paddingBottom: '10px', marginBottom: '-14px'
            }}
          >
            <Package size={22} /> Koleksi Lelang Saya
          </button>
          <button 
            onClick={() => setActiveTab('bids')}
            style={{
              background: 'transparent', border: 'none', color: activeTab === 'bids' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              borderBottom: activeTab === 'bids' ? '3px solid var(--accent-secondary)' : '3px solid transparent', paddingBottom: '10px', marginBottom: '-14px'
            }}
          >
            <History size={22} /> Riwayat Bids ({myBids.length})
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ border: '3px solid var(--bg-dark-700)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
            <p>Memuat data...</p>
          </div>
        ) : activeTab === 'items' ? (
          /* ITEMS TAB */
          myItems.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', borderStyle: 'dashed', borderColor: 'var(--bg-dark-700)' }}>
              <Package size={48} color="var(--bg-dark-700)" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Belum Ada Lelang</h3>
              <p style={{ color: 'var(--text-muted)' }}>Anda belum membuat lelang apapun. Mulai lelang pertama Anda sekarang!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {myItems.map(item => (
                <AuctionCard 
                  key={item.id}
                  item={item}
                  currentUser={currentUser}
                  onBidClick={(i) => setSelectedItemId(i.id)}
                />
              ))}
            </div>
          )
        ) : (
          /* BIDS TAB */
          myBids.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', borderStyle: 'dashed', borderColor: 'var(--bg-dark-700)' }}>
              <History size={48} color="var(--bg-dark-700)" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Belum Ada Riwayat Bid</h3>
              <p style={{ color: 'var(--text-muted)' }}>Anda belum pernah memberikan tawaran ke barang apapun.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myBids.map((bid, idx) => (
                <div key={idx} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderLeft: '4px solid var(--accent-primary)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--bg-dark-800)', overflow: 'hidden' }}>
                      <img src={bid.item?.image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200'} alt="Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <span className="badge badge-primary" style={{ fontSize: '10px', marginBottom: '6px' }}>{bid.item?.category || 'Lelang'}</span>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{bid.item?.title || 'Barang Tidak Diketahui'}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <History size={12} /> {new Date(bid.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Tawaran Anda</span>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--warning)' }}>{formatPrice(Number(bid.amount))}</span>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setSelectedItemId(bid.item_id)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                      <ArrowUpRight size={14} /> Lihat Lelang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </section>

      {selectedItemId && (
        <ItemDetailModal 
          itemId={selectedItemId}
          isOpen={!!selectedItemId}
          currentUser={currentUser}
          onClose={() => setSelectedItemId(null)}
          onBidPlaced={() => {}}
        />
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel"
              style={{ width: '100%', maxWidth: '460px', padding: '32px', position: 'relative' }}
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
              
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={24} color="var(--accent-secondary)" /> Edit Profil
              </h2>

              <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Avatar Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-dark-800)', 
                      border: '2px dashed var(--accent-primary)', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <UploadCloud size={32} color="var(--text-muted)" />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity='1'} onMouseOut={e=>e.currentTarget.style.opacity='0'}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>Ubah Foto</span>
                    </div>
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Klik gambar untuk unggah foto (Opsional)</span>
                  
                  {/* Preset Avatars Grid */}
                  <div style={{ width: '100%', marginTop: '12px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px', textAlign: 'center', fontWeight: 700 }}>Atau pilih avatar ilustrasi:</p>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      justifyContent: 'center', 
                      flexWrap: 'wrap', 
                      maxHeight: '180px', 
                      overflowY: 'auto', 
                      padding: '12px', 
                      background: 'rgba(0,0,0,0.3)', 
                      borderRadius: '12px',
                      border: '1px solid var(--bg-dark-700)'
                    }}>
                      {ALL_AVATARS.map((presetUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditAvatarUrl(presetUrl)}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            border: editAvatarUrl === presetUrl ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            background: 'var(--bg-dark-800)',
                            padding: 0,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            transition: 'var(--transition-fast)'
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <img src={presetUrl} alt={`Avatar Preset ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {error && <div style={{ color: 'var(--danger)', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}

                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div style={{ position: 'relative' }}>
                    <AtSign size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" className="form-input" value={editUsername} onChange={e => setEditUsername(e.target.value)} required style={{ paddingLeft: '42px' }} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--bg-dark-700)', paddingTop: '16px', marginTop: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Alamat Pengiriman (Opsional)</h3>
                  
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Nomor Telepon</label>
                    <input type="tel" className="form-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="08123456789" />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Alamat Lengkap</label>
                    <textarea className="form-input" value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Jalan Raya No. 1, RT 01/RW 02" rows={3} style={{ resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Kota</label>
                      <input type="text" className="form-input" value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="Jakarta Selatan" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kode Pos</label>
                      <input type="text" className="form-input" value={editPostalCode} onChange={e => setEditPostalCode(e.target.value)} placeholder="12345" />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '12px', height: '48px' }}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP UP MODAL (REAL STRIPE) */}
      {currentUser && (
        <StripeTopUpModal 
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          onTopUpSuccess={handleTopUpSuccess}
          currentUser={currentUser}
        />
      )}
    </motion.div>
  );
};
