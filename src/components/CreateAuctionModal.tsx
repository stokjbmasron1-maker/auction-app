import React, { useState, useRef } from 'react';
import { X, Hammer, Calendar, Image as ImageIcon, DollarSign, List, Tag, UploadCloud } from 'lucide-react';
import { auctionService } from '../services/auctionService';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuctionCreated: () => void;
}

const CATEGORIES = ['Elektronik', 'Fashion', 'Otomotif', 'Seni & Koleksi', 'Properti', 'Kartu', 'Lainnya'];

export const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({
  isOpen,
  onClose,
  onAuctionCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [startingPrice, setStartingPrice] = useState<number | ''>('');
  const [bidIncrement, setBidIncrement] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const maxSize = 800; // max dimension

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.7 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImageUrl(compressedDataUrl);
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasi form
    if (!title.trim() || !description.trim()) {
      setError('Harap isi semua kolom deskripsi dan nama barang.');
      return;
    }

    if (startingPrice === '' || bidIncrement === '' || startingPrice <= 0 || bidIncrement <= 0) {
      setError('Harga mulai dan minimal kenaikan bid harus diisi dan bernilai positif.');
      return;
    }

    if (!endTime) {
      setError('Harap tentukan batas waktu berakhir lelang.');
      return;
    }

    const selectedEndTime = new Date(endTime).getTime();
    if (selectedEndTime <= Date.now()) {
      setError('Waktu berakhir lelang harus di masa depan.');
      return;
    }

    // Default image if empty
    let finalImageUrl = imageUrl.trim();
    if (!finalImageUrl) {
      finalImageUrl = 'https://placehold.co/600x400/transparent/8b5cf6?text=LelangKu\\n(Tanpa+Foto)&font=Montserrat';
    }

    setSubmitting(true);

    try {
      await auctionService.createItem({
        title: title.trim(),
        description: description.trim(),
        category,
        starting_price: startingPrice,
        bid_increment: bidIncrement,
        buy_now_price: null,
        image_url: finalImageUrl,
        end_time: new Date(endTime).toISOString(),
      });

      onAuctionCreated();
      // Reset form
      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setStartingPrice('');
      setBidIncrement('');
      setImageUrl('');
      setEndTime('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat lelang baru. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

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
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: 'var(--shadow-lg)'
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
            <h2 style={{ fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hammer size={20} color="var(--accent-secondary)" />
              Buat Barang Lelang Baru
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Daftarkan barang Anda untuk ditawar oleh pembeli lain
            </p>
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} style={{
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)',
              fontSize: '13px',
              fontWeight: 600
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Nama Barang */}
          <div className="form-group">
            <label className="form-label">
              <Tag size={12} style={{ marginRight: '6px' }} />
              Nama Barang
            </label>
            <input 
              type="text" 
              placeholder="Contoh: iPhone 15 Pro Max 256GB"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Kategori & Batas Waktu */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                <List size={12} style={{ marginRight: '6px' }} />
                Kategori
              </label>
              <select 
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ height: '45px' }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={12} style={{ marginRight: '6px' }} />
                Waktu Berakhir
              </label>
              <input 
                type="datetime-local" 
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                style={{ height: '45px' }}
              />
            </div>
          </div>

          {/* Harga Awal & Kelipatan Bid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                <DollarSign size={12} style={{ marginRight: '6px' }} />
                Harga Awal (Rp)
              </label>
              <input 
                type="text" 
                placeholder="Rp 100.000"
                className="form-input"
                value={formatRupiah(startingPrice)}
                onChange={(e) => handlePriceChange(setStartingPrice, e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <DollarSign size={12} style={{ marginRight: '6px' }} />
                Minimal Kenaikan Bid (Rp)
              </label>
              <input 
                type="text" 
                placeholder="Rp 50.000"
                className="form-input"
                value={formatRupiah(bidIncrement)}
                onChange={(e) => handlePriceChange(setBidIncrement, e.target.value)}
                required
              />
            </div>
          </div>

          {/* Foto Barang */}
          <div className="form-group">
            <label className="form-label">
              <ImageIcon size={12} style={{ marginRight: '6px' }} />
              Foto Barang (Opsional)
            </label>
            <div 
              style={{
                border: '2px dashed var(--bg-dark-700)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-dark-800)',
                transition: 'var(--transition-fast)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--bg-dark-700)')}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
              />
              
              {imageUrl ? (
                <div style={{ position: 'relative' }}>
                  <img src={imageUrl} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.opacity = '1'}
                    onMouseOut={e => e.currentTarget.style.opacity = '0'}
                  >
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UploadCloud size={18} /> Ganti Foto
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ background: 'var(--bg-dark-700)', padding: '12px', borderRadius: '50%' }}>
                    <UploadCloud size={24} color="var(--accent-primary)" />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Klik untuk unggah gambar</p>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>JPG, PNG, atau WEBP (Otomatis dikompres)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deskripsi */}
          <div className="form-group">
            <label className="form-label">Deskripsi Barang</label>
            <textarea 
              placeholder="Jelaskan kondisi barang, kelengkapan, garansi, dll..."
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid var(--bg-dark-700)',
            paddingTop: '20px',
            marginTop: '8px'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '10px 24px' }}
            >
              {submitting ? 'Memproses...' : 'Daftarkan Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
