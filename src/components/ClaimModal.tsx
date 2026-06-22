import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Truck, CheckCircle2 } from 'lucide-react';
import type { Profile, AuctionItem } from '../types';
import { auctionService } from '../services/auctionService';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AuctionItem;
  currentUser: Profile;
  onClaimSuccess: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ isOpen, onClose, item, currentUser, onClaimSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use user's saved profile address by default
  const [address, setAddress] = useState(currentUser.address || '');
  const [city, setCity] = useState(currentUser.city || '');
  const [postalCode, setPostalCode] = useState(currentUser.postal_code || '');
  const [phone, setPhone] = useState(currentUser.phone || '');

  if (!isOpen) return null;

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      await auctionService.claimItem(item.id, {
        address,
        city,
        postal_code: postalCode,
        phone
      });
      onClaimSuccess();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengklaim barang.");
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '420px', padding: '32px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid var(--bg-dark-700)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Klaim Barang Pemenang</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Lengkapi alamat pengiriman untuk <strong>{item.title}</strong>
          </p>
        </div>

        <form onSubmit={handleClaim} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg-dark-900)', borderRadius: '12px', border: '1px solid var(--bg-dark-700)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '4px' }}>
              <Truck size={18} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Informasi Pengiriman</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nomor Telepon Pemasal</label>
              <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08123456789" required />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Alamat Lengkap</label>
              <textarea className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nama Jalan, RT/RW, Patokan" rows={2} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Kota/Kabupaten</label>
                <input type="text" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Kode Pos</label>
                <input type="text" className="form-input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={processing}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={processing} style={{ flex: 1 }}>
              {processing ? 'Menyimpan...' : 'Klaim Sekarang'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
