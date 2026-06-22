import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Hammer, PlusCircle, Search } from 'lucide-react';
import { auctionService } from '../services/auctionService';
import type { AuctionItem, Profile } from '../types';
import { AuctionCard } from '../components/AuctionCard';
import { ItemDetailModal } from '../components/ItemDetailModal';

const CATEGORIES = ['Semua', 'Elektronik', 'Fashion', 'Otomotif', 'Seni & Koleksi', 'Properti', 'Kartu', 'Lainnya'];

interface AuctionPageProps {
  currentUser: Profile | null;
  searchQuery: string;
  onSearch: (query: string) => void;
  onCreateAuctionClick: () => void;
}

export const AuctionPage: React.FC<AuctionPageProps> = ({ 
  currentUser, 
  searchQuery, 
  onSearch, 
  onCreateAuctionClick 
}) => {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed'>('active');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  const loadData = async () => {
    setLoading(true);
    try {
      const list = await auctionService.getItems({
        category: selectedCategory,
        status: statusFilter,
        search: searchQuery
      });
      setItems(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleMockItemCreated = () => loadData();
    const handleGlobalBid = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string; bid: any }>;
      const { bid, itemId } = customEvent.detail;
      setItems(prevItems => 
        prevItems.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              highest_bid: bid.amount,
              bid_count: (item.bid_count || 0) + 1
            };
          }
          return item;
        })
      );
    };

    window.addEventListener('mock-item-created', handleMockItemCreated);
    window.addEventListener('mock-bid-inserted', handleGlobalBid);
    return () => {
      window.removeEventListener('mock-item-created', handleMockItemCreated);
      window.removeEventListener('mock-bid-inserted', handleGlobalBid);
    };
  }, [selectedCategory, statusFilter, searchQuery]);



  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 24px', maxWidth: '1280px', margin: '0 auto' }}
    >
      {/* Top Header Section for Search and Create */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
        {/* Search Bar */}
        <div style={{
          flex: '1',
          minWidth: '250px',
          position: 'relative'
        }}>
          <Search size={18} color="var(--text-secondary)" style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="Cari nama barang lelang..."
            className="form-input"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              paddingLeft: '46px',
              height: '48px',
              borderRadius: '24px',
              background: 'var(--bg-dark-800)',
              border: '1px solid var(--bg-dark-700)',
              fontSize: '15px'
            }}
          />
        </div>

        {currentUser && (
          <button 
            className="btn btn-primary" 
            onClick={onCreateAuctionClick}
            style={{
              height: '48px',
              padding: '0 24px',
              borderRadius: '24px',
              fontWeight: 700
            }}
          >
            <PlusCircle size={20} />
            Mulai Lelang
          </button>
        )}
      </div>

      <div style={{ width: '100%' }}>
        {/* Catalog Filter Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div className="category-tabs" style={{ marginBottom: 0 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'inline-flex',
              background: 'var(--bg-dark-800)',
              border: '1px solid var(--bg-dark-700)',
              padding: '4px',
              borderRadius: '10px'
            }}>
              <button 
                onClick={() => setStatusFilter('active')}
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  background: statusFilter === 'active' ? 'var(--bg-dark-700)' : 'transparent',
                  color: statusFilter === 'active' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                Aktif
              </button>
              <button 
                onClick={() => setStatusFilter('completed')}
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  background: statusFilter === 'completed' ? 'var(--bg-dark-700)' : 'transparent',
                  color: statusFilter === 'completed' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                Selesai
              </button>
            </div>

            <button 
              onClick={loadData} 
              className="btn btn-secondary" 
              title="Refresh data"
              style={{ width: '36px', height: '36px', padding: 0 }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{
              border: '4px solid var(--bg-dark-700)',
              borderTop: '4px solid var(--accent-primary)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px auto'
            }}></div>
            <p>Memuat barang lelang...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', borderStyle: 'dashed' }}>
            <Hammer size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Tidak Ada Barang Lelang</h3>
            <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
              Maaf, saat ini tidak ada barang lelang di kategori <strong>{selectedCategory}</strong> dengan filter status terpilih.
            </p>
          </div>
        ) : (
          <motion.div 
            layout
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {items.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
                transition={{ duration: 0.3 }}
              >
                <AuctionCard 
                  item={item}
                  currentUser={currentUser}
                  onBidClick={(i) => setSelectedItemId(i.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>



      {selectedItemId && (
        <ItemDetailModal 
          itemId={selectedItemId}
          isOpen={!!selectedItemId}
          currentUser={currentUser}
          onClose={() => setSelectedItemId(null)}
          onBidPlaced={loadData}
        />
      )}
    </motion.div>
  );
};
