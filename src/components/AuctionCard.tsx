import React, { useState, useEffect } from 'react';
import { Hammer, Clock, User, ArrowUpRight } from 'lucide-react';
import type { AuctionItem, Profile } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface AuctionCardProps {
  item: AuctionItem;
  onBidClick: (item: AuctionItem) => void;
  currentUser: Profile | null;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ item, onBidClick, currentUser }) => {
  const { formatPrice } = useCurrency();
  const [timeLeft, setTimeLeft] = useState('');
  const [isEnded, setIsEnded] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(item.end_time).getTime() - Date.now();
      
      if (difference <= 0 || item.status === 'completed') {
        setTimeLeft('Lelang Selesai');
        setIsEnded(true);
        return;
      }

      // Hitung hari, jam, menit, detik
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      // Tandai urgent jika kurang dari 1 jam
      if (difference < 1000 * 60 * 60) {
        setIsUrgent(true);
      } else {
        setIsUrgent(false);
      }

      let formattedTime = '';
      if (days > 0) formattedTime += `${days}h `;
      formattedTime += `${hours.toString().padStart(2, '0')}j ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}d`;
      
      setTimeLeft(formattedTime);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [item.end_time, item.status]);

  const isSeller = currentUser?.id === item.seller_id;
  const currentPrice = item.highest_bid || item.starting_price;

  return (
    <div className={`glass-card anim-slide-up ${!isEnded && isUrgent ? 'glow-active' : ''}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      position: 'relative',
      border: !isEnded && isUrgent ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      {/* Category Tag on top of image */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 10
      }}>
        <span className="badge badge-primary" style={{ background: 'rgba(8, 9, 13, 0.75)', backdropFilter: 'blur(4px)' }}>
          {item.category}
        </span>
      </div>

      {/* Image Section */}
      <div style={{
        width: '100%',
        height: '200px',
        overflow: 'hidden',
        background: 'var(--bg-dark-900)',
        position: 'relative'
      }}>
        <img 
          src={item.image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400'} 
          alt={item.title} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
          className="card-image"
        />
        {isEnded && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(8, 9, 13, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5
          }}>
            <span className="badge badge-danger" style={{ padding: '8px 16px', fontSize: '12px' }}>
              LELANG SELESAI
            </span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        gap: '12px'
      }}>
        {/* Title */}
        <h3 style={{
          fontSize: '16px',
          fontWeight: 700,
          lineHeight: 1.4,
          height: '44px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          color: 'var(--text-primary)'
        }}>
          {item.title}
        </h3>

        {/* Seller Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Penjual: <strong>{item.seller_profile?.full_name || 'Anonim'}</strong>
          </span>
        </div>

        {/* Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isEnded 
            ? 'rgba(239, 68, 68, 0.05)' 
            : isUrgent 
              ? 'rgba(239, 68, 68, 0.1)' 
              : 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${isEnded ? 'rgba(239, 68, 68, 0.1)' : isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'var(--bg-dark-700)'}`,
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <Clock size={15} color={isEnded ? 'var(--danger)' : isUrgent ? 'var(--danger)' : 'var(--text-secondary)'} />
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 700, 
            color: isEnded ? 'var(--text-muted)' : isUrgent ? 'var(--danger)' : 'var(--text-primary)' 
          }}>
            {timeLeft}
          </span>
        </div>

        {/* Pricing info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          background: 'rgba(255, 255, 255, 0.01)',
          borderTop: '1px solid var(--bg-dark-700)',
          paddingTop: '12px',
          marginTop: 'auto'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
              {item.bid_count && item.bid_count > 0 ? 'Bid Tertinggi' : 'Harga Awal'}
            </span>
            <span style={{ 
              fontSize: '18px', 
              fontWeight: 800, 
              color: item.bid_count && item.bid_count > 0 ? 'var(--warning)' : 'var(--text-primary)' 
            }}>
              {formatPrice(currentPrice)}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-primary" style={{ fontSize: '10px' }}>
              {item.bid_count || 0} Bid
            </span>
          </div>
        </div>

        {/* Bid CTA */}
        {isEnded ? (
          <button 
            className="btn btn-secondary" 
            onClick={() => onBidClick(item)} 
            style={{ width: '100%', marginTop: '8px' }}
          >
            Lihat Hasil Lelang
          </button>
        ) : isSeller ? (
          <button 
            className="btn btn-secondary" 
            onClick={() => onBidClick(item)} 
            style={{ width: '100%', marginTop: '8px' }}
          >
            Lihat Detail (Milik Anda)
          </button>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={() => onBidClick(item)} 
            style={{ width: '100%', marginTop: '8px' }}
          >
            <Hammer size={16} />
            Tawar Barang
            <ArrowUpRight size={14} style={{ marginLeft: 'auto' }} />
          </button>
        )}
      </div>
    </div>
  );
};
