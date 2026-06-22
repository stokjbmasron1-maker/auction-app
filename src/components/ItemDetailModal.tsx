import React, { useState, useEffect } from 'react';
import { X, Hammer, Clock, User, Award, TrendingUp, AlertTriangle } from 'lucide-react';
import { auctionService } from '../services/auctionService';
import type { AuctionItem, Bid, Profile } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { ClaimModal } from './ClaimModal';
import { ChatModal } from './ChatModal';
import { MessageCircle, CheckCircle } from 'lucide-react';

interface ItemDetailModalProps {
  itemId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile | null;
  onBidPlaced: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  itemId,
  isOpen,
  onClose,
  currentUser,
  onBidPlaced
}) => {
  const [item, setItem] = useState<AuctionItem | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isEnded, setIsEnded] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const { formatPrice, currencyInfo } = useCurrency();

  // Load item and bid history
  const loadData = async () => {
    setLoading(true);
    const data = await auctionService.getItemById(itemId);
    if (data) {
      setItem(data.item);
      setBids(data.bids);
      const minBid = data.bids.length > 0 
        ? data.bids[0].amount + data.item.bid_increment 
        : data.item.starting_price;
      setBidAmount(minBid);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && itemId) {
      loadData();
      setError(null);
      setSuccess(false);

      // Subscribe to real-time bid updates
      const unsubscribe = auctionService.subscribeToBids(itemId, (newBid) => {
        // Tambahkan bid baru ke atas daftar
        setBids(prevBids => {
          const exists = prevBids.some(b => b.id === newBid.id);
          if (exists) return prevBids;
          
          const updatedBids = [newBid, ...prevBids].sort((a, b) => b.amount - a.amount);
          
          // Update item info locally
          setItem(prevItem => {
            if (!prevItem) return null;
            return {
              ...prevItem,
              highest_bid: newBid.amount,
              bid_count: updatedBids.length
            };
          });

          // Set input ke bid minimal berikutnya
          if (item) {
            setBidAmount(newBid.amount + item.bid_increment);
          } else {
            setBidAmount(newBid.amount + 100000); // fallback
          }

          // Trigger flash effect or parent update
          onBidPlaced();
          return updatedBids;
        });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isOpen, itemId]);

  // Set default bid amount when item loads
  useEffect(() => {
    if (item) {
      const currentHighest = bids.length > 0 ? bids[0].amount : item.starting_price;
      const minBid = bids.length > 0 ? currentHighest + item.bid_increment : item.starting_price;
      setBidAmount(minBid);
    }
  }, [item, bids]);

  // Countdown timer effect
  useEffect(() => {
    if (!item) return;

    const calculateTimeLeft = () => {
      const difference = new Date(item.end_time).getTime() - Date.now();
      
      if (difference <= 0 || item.status === 'completed') {
        setTimeLeft('Lelang Selesai');
        setIsEnded(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let formattedTime = '';
      if (days > 0) formattedTime += `${days} hari `;
      formattedTime += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      setTimeLeft(formattedTime);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [item]);

  if (!isOpen) return null;

  const formatRupiah = (value: number | '') => {
    if (value === '') return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handlePriceChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>, rawValue: string) => {
    const numericValue = rawValue.replace(/\D/g, '');
    if (numericValue === '') {
      setter('');
    } else {
      setter(parseInt(numericValue, 10));
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Silakan login terlebih dahulu untuk melakukan bid.');
      return;
    }
    if (!item || bidAmount === '') return;

    setError(null);
    setSuccess(false);
    setSubmitting(true);

    if ((currentUser.wallet_balance || 0) < (bidAmount as number)) {
      setError(`Saldo Anda tidak mencukupi untuk melakukan bid. Saldo saat ini: ${formatPrice(currentUser.wallet_balance || 0)}`);
      setSubmitting(false);
      return;
    }

    try {
      await auctionService.placeBid(itemId, bidAmount as number);
      setSuccess(true);
      onBidPlaced();
    } catch (err: any) {
      setError(err.message || 'Gagal menempatkan bid. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePresetBid = (increment: number) => {
    if (!item) return;
    const base = bids.length > 0 ? bids[0].amount : item.starting_price;
    const currentBid = typeof bidAmount === 'number' ? bidAmount : base;
    setBidAmount(currentBid + increment);
  };

  const isSeller = currentUser?.id === item?.seller_id;
  const currentHighestBid = bids.length > 0 ? bids[0].amount : item?.starting_price || 0;
  const nextMinBid = bids.length > 0 ? currentHighestBid + (item?.bid_increment || 0) : item?.starting_price || 0;
  const isWinner = isEnded && bids.length > 0 && currentUser?.id === bids[0].bidder_id;
  const isClaimed = item?.status === 'claimed';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(8, 9, 13, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--bg-dark-700)'
        }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '6px' }}>
              Detail Barang Lelang
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{item?.title}</h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'var(--bg-dark-800)',
              border: '1px solid var(--bg-dark-700)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            className="category-tab"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{
              border: '4px solid var(--bg-dark-700)',
              borderTop: '4px solid var(--accent-primary)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px auto'
            }}></div>
            <p>Memuat data barang & bid history...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : item ? (
          /* Main Modal Content */
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            overflowY: 'auto',
            flexGrow: 1
          }}>
            {/* Left Section: Image and Details */}
            <div style={{
              flex: '1 1 500px',
              padding: '24px',
              borderRight: '1px solid var(--bg-dark-700)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              maxHeight: '100%'
            }}>
              {/* Product Image */}
              <div style={{
                width: '100%',
                height: '300px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: 'var(--bg-dark-900)',
                border: '1px solid var(--bg-dark-700)'
              }}>
                <img 
                  src={item.image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600'} 
                  alt={item.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Countdown & Specs Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
              }}>
                <div className="glass-card" style={{ padding: '12px', border: '1px solid var(--bg-dark-700)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    Sisa Waktu
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Clock size={14} color={isEnded ? 'var(--danger)' : 'var(--accent-secondary)'} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: isEnded ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {timeLeft}
                    </span>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '12px', border: '1px solid var(--bg-dark-700)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    Kategori
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-secondary)', display: 'block', marginTop: '4px' }}>
                    {item.category}
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '12px', border: '1px solid var(--bg-dark-700)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    Penjual
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <User size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>
                      {item.seller_profile?.full_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Deskripsi Barang
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {item.description}
                </p>
              </div>
            </div>

            {/* Right Section: Bidding Panel & Bid History */}
            <div style={{
              flex: '1 1 380px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              background: 'rgba(8, 9, 13, 0.4)'
            }}>
              {/* Price Panel */}
              <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--bg-dark-700)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Bid Tertinggi Saat Ini
                    </span>
                    <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
                      {formatPrice(currentHighestBid)}
                    </h3>
                  </div>
                  <div className="badge badge-success" style={{ padding: '6px 10px' }}>
                    <TrendingUp size={12} style={{ marginRight: '4px' }} />
                    {bids.length} Bid
                  </div>
                </div>

                {/* Form Bidding */}
                {isEnded ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      textAlign: 'center',
                      padding: '16px',
                      background: isWinner ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${isWinner ? 'var(--success)' : 'var(--danger)'}`,
                      borderRadius: 'var(--radius-md)',
                      color: isWinner ? 'var(--success)' : 'var(--danger)',
                      fontSize: '13px',
                      fontWeight: 700
                    }}>
                      {isWinner ? 'Selamat! Anda memenangkan lelang ini 🎉' : 'Lelang Telah Berakhir. Barang sudah terjual / ditutup.'}
                    </div>

                    {isWinner && !isClaimed && (
                      <button onClick={() => setShowClaimModal(true)} className="btn btn-primary" style={{ width: '100%', display: 'flex', gap: '8px' }}>
                        <CheckCircle size={18} />
                        Klaim Barang Sekarang
                      </button>
                    )}

                    {isWinner && isClaimed && (
                      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        ✅ Barang ini telah diklaim.
                      </div>
                    )}

                    {isWinner && (
                      <button onClick={() => setShowChatModal(true)} className="btn btn-secondary" style={{ width: '100%', display: 'flex', gap: '8px' }}>
                        <MessageCircle size={18} />
                        Chat Penjual
                      </button>
                    )}
                  </div>
                ) : isSeller ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--bg-dark-700)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 700
                  }}>
                    Ini adalah barang lelang Anda sendiri. Anda tidak dapat menawar.
                  </div>
                ) : (
                  <form onSubmit={handlePlaceBid} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tempatkan Bid Anda ({currencyInfo.code})</span>
                        <span style={{ color: 'var(--text-muted)', textTransform: 'none' }}>
                          Min: {formatPrice(nextMinBid)}
                        </span>
                      </label>
                      <input 
                        type="text"
                        className="form-input"
                        value={formatRupiah(bidAmount)}
                        onChange={(e) => handlePriceChange(setBidAmount, e.target.value)}
                        required
                        style={{ fontSize: '18px', fontWeight: 800, textAlign: 'center', color: 'var(--warning)' }}
                      />
                    </div>

                    {/* Presets */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => handlePresetBid(item.bid_increment)}
                        style={{ flex: 1, padding: '6px 0', fontSize: '11px' }}
                      >
                        +{formatPrice(item.bid_increment)}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => handlePresetBid(item.bid_increment * 5)}
                        style={{ flex: 1, padding: '6px 0', fontSize: '11px' }}
                      >
                        +{formatPrice(item.bid_increment * 5)}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => handlePresetBid(item.bid_increment * 10)}
                        style={{ flex: 1, padding: '6px 0', fontSize: '11px' }}
                      >
                        +{formatPrice(item.bid_increment * 10)}
                      </button>
                    </div>

                    {/* Feedback messages */}
                    {error && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--danger)',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                      </div>
                    )}

                    {success && (
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--success)',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        textAlign: 'center'
                      }}>
                        🎉 Bid Anda berhasil ditempatkan!
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={submitting}
                      style={{ width: '100%', height: '46px' }}
                    >
                      <Hammer size={18} />
                      {submitting ? 'Mengirim...' : 'Tempatkan Tawaran (Bid)'}
                    </button>
                  </form>
                )}
              </div>

              {/* Bid History */}
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: '200px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color="var(--accent-secondary)" />
                  Riwayat Penawaran ({bids.length})
                </h4>

                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    overflowY: 'auto',
                    maxHeight: '220px',
                    paddingRight: '6px'
                  }}
                >
                  {bids.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Belum ada penawaran. Jadilah penawar pertama!
                    </div>
                  ) : (
                    bids.map((bid, idx) => {
                      const isHighest = idx === 0;
                      return (
                        <div 
                          key={bid.id} 
                          className="glass-card" 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            border: `1px solid ${isHighest ? 'rgba(245, 158, 11, 0.3)' : 'var(--bg-dark-700)'}`,
                            background: isHighest ? 'rgba(245, 158, 11, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={bid.bidder_profile?.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg'} 
                              alt="bidder" 
                              style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                            />
                            <div>
                              <span style={{ fontSize: '12px', fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>
                                {bid.bidder_profile?.full_name}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {new Date(bid.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: 800, 
                              color: isHighest ? 'var(--warning)' : 'var(--text-primary)' 
                            }}>
                              {formatPrice(bid.amount)}
                            </span>
                            {isHighest && (
                              <span className="badge badge-warning" style={{ fontSize: '8px', padding: '2px 4px', display: 'block', width: 'fit-content', marginLeft: 'auto', marginTop: '2px' }}>
                                LDR
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
            Error loading item details.
          </div>
        )}
      </div>

      {/* Modals */}
      {item && currentUser && showClaimModal && (
        <ClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          item={item}
          currentUser={currentUser}
          onClaimSuccess={() => {
            setShowClaimModal(false);
            loadData(); // Reload to update status to claimed
          }}
        />
      )}

      {item && currentUser && item.seller_profile && showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          item={item}
          currentUser={currentUser}
          receiverProfile={item.seller_profile}
        />
      )}
    </div>
  );
};
