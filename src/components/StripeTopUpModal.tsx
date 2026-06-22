import React, { useState, useEffect, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, AddressElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { X, CreditCard, Loader2, Save } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import type { Profile } from '../types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormProps {
  amount: number;
  currentUser: Profile;
  savedMethods: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ amount, currentUser, savedMethods, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [isAddressComplete, setIsAddressComplete] = useState(false);

  const [selectedMethodId, setSelectedMethodId] = useState<string | 'new'>(
    savedMethods.length > 0 ? savedMethods[0].id : 'new'
  );
  
  const { formatPrice, currencyInfo } = useCurrency();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe && selectedMethodId === 'new') return;

    setProcessing(true);
    setError(null);

    try {
      // Get address value asynchronously to avoid React state lag
      let currentBillingDetails = null;
      if (selectedMethodId === 'new') {
        const addressElement = elements!.getElement(AddressElement);
        if (addressElement) {
          const { value } = await addressElement.getValue();
          currentBillingDetails = value;
        }
      }

      const payload: any = {
        amount,
        currency: currencyInfo.code.toLowerCase(),
        userId: currentUser.id,
        name: currentBillingDetails?.name || currentUser.full_name,
      };

      if (selectedMethodId !== 'new') {
        payload.paymentMethodId = selectedMethodId;
      } else {
        payload.saveCard = saveCard;
      }

      const response = await fetch('http://localhost:3001/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menghubungi server pembayaran");

      if (selectedMethodId !== 'new') {
        // Direct charge successful
        if (data.paymentIntent && data.paymentIntent.status === 'succeeded') {
          onSuccess();
          return;
        } else if (data.paymentIntent && data.paymentIntent.status === 'requires_action') {
          // 3D Secure / OTP needed
          const { error: stripeError, paymentIntent } = await stripe!.confirmCardPayment(data.paymentIntent.client_secret);
          if (stripeError) throw stripeError;
          if (paymentIntent.status === 'succeeded') onSuccess();
        }
      } else {
        // New card confirmation
        const cardElement = elements!.getElement(CardElement);
        if (!cardElement) throw new Error("Card element not found");

        const { error: stripeError, paymentIntent } = await stripe!.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: currentBillingDetails?.name || currentUser.full_name,
              address: currentBillingDetails?.address || undefined,
            }
          },
        });

        if (stripeError) throw stripeError;
        if (paymentIntent.status === 'succeeded') onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memproses pembayaran.");
    } finally {
      setProcessing(false);
    }
  };

  const cardStyle = useMemo(() => ({
    style: {
      base: {
        color: '#fff',
        fontFamily: '"Inter", sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': { color: 'rgba(255,255,255,0.4)' },
      },
      invalid: { color: '#ef4444', iconColor: '#ef4444' },
    },
    hidePostalCode: true,
  }), []);

  const addressOptions = useMemo(() => ({
    mode: 'billing' as const,
    fields: { phone: 'never' as const },
    defaultValues: {
      name: currentUser.full_name,
      address: {
        country: 'ID'
      }
    }
  }), [currentUser.full_name]);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {savedMethods.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Pilih Metode Pembayaran</p>
          
          {savedMethods.map((method) => (
            <div 
              key={method.id} 
              onClick={() => setSelectedMethodId(method.id)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', 
                background: selectedMethodId === method.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)', 
                border: selectedMethodId === method.id ? '1px solid var(--accent-primary)' : '1px solid var(--bg-dark-700)',
                borderRadius: '12px', cursor: 'pointer', transition: '0.2s'
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', border: '2px solid',
                borderColor: selectedMethodId === method.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {selectedMethodId === method.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)' }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {method.card.brand} •••• {method.card.last4}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  A.n. {method.billing_details?.name || 'Tidak diketahui'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Kedaluwarsa {method.card.exp_month}/{method.card.exp_year}
                </span>
              </div>
            </div>
          ))}
          
          <div 
            onClick={() => setSelectedMethodId('new')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', 
              background: selectedMethodId === 'new' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)', 
              border: selectedMethodId === 'new' ? '1px solid var(--accent-primary)' : '1px solid var(--bg-dark-700)',
              borderRadius: '12px', cursor: 'pointer', transition: '0.2s'
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', border: '2px solid',
              borderColor: selectedMethodId === 'new' ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {selectedMethodId === 'new' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)' }} />}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Pakai Kartu Baru</span>
          </div>
        </div>
      )}

      {selectedMethodId === 'new' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-dark-900)', borderRadius: '12px', border: '1px solid var(--bg-dark-700)' }}>
              <AddressElement 
                options={addressOptions} 
                onChange={(event) => {
                  // Only update state if completion status changes to avoid typing lag
                  if (isAddressComplete !== event.complete) {
                    setIsAddressComplete(event.complete);
                  }
                }}
              />
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-dark-900)', borderRadius: '12px', border: '1px solid var(--bg-dark-700)', marginTop: '4px' }}>
              <CardElement options={cardStyle} />
            </div>
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
            <input 
              type="checkbox" 
              checked={saveCard} 
              onChange={(e) => setSaveCard(e.target.checked)} 
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Simpan kartu ini untuk top-up berikutnya dengan 1-klik</span>
          </label>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }} disabled={processing}>
          Batal
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={(!stripe && selectedMethodId === 'new') || processing || (selectedMethodId === 'new' && !isAddressComplete)} 
          style={{ flex: 1 }}
        >
          {processing ? 'Memproses...' : `Bayar ${formatPrice(amount)}`}
        </button>
      </div>
    </form>
  );
};

export const StripeTopUpModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onTopUpSuccess: (amount: number) => void;
  currentUser: Profile;
}> = ({ isOpen, onClose, onTopUpSuccess, currentUser }) => {
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [showStripe, setShowStripe] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [savedMethods, setSavedMethods] = useState<any[]>([]);
  const { formatPrice, currencyInfo } = useCurrency();

  useEffect(() => {
    if (isOpen && currentUser) {
      // Fetch saved payment methods
      const fetchCards = async () => {
        setLoadingCards(true);
        try {
          const res = await fetch(`http://localhost:3001/payment-methods?userId=${currentUser.id}`);
          const data = await res.json();
          if (data.paymentMethods) {
            setSavedMethods(data.paymentMethods);
          }
        } catch (err) {
          console.error("Gagal memuat kartu tersimpan", err);
        } finally {
          setLoadingCards(false);
        }
      };
      fetchCards();
    } else {
      setShowStripe(false);
      setTopUpAmount('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(topUpAmount);
    if (amountNum && amountNum >= 10000) {
      setShowStripe(true);
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
        {!showStripe && (
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        )}
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <CreditCard size={24} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Top Up Saldo via Stripe</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {showStripe ? 'Selesaikan pembayaran Anda' : 'Masukkan nominal saldo yang diinginkan'}
          </p>
        </div>

        {loadingCards && !showStripe ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Loader2 className="spin" size={24} color="var(--accent-primary)" style={{ margin: '0 auto' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Memeriksa metode pembayaran tersimpan...</p>
          </div>
        ) : !showStripe ? (
          <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {savedMethods.length > 0 && (
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)' }}>
                <Save size={16} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{savedMethods.length} Kartu Tersimpan ditemukan</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Jumlah Top Up (Min. Rp 10.000)</label>
              <input 
                type="text" 
                inputMode="numeric"
                className="form-input" 
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 100000"
                required
              />
              {topUpAmount && Number(topUpAmount) >= 10000 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--success)' }}>
                  Akan dibayar: {formatPrice(Number(topUpAmount))}
                </div>
              )}
              {topUpAmount && Number(topUpAmount) < 10000 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--danger)' }}>
                  Minimal top-up adalah Rp 10.000
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={!topUpAmount || Number(topUpAmount) < 10000} style={{ marginTop: '8px', width: '100%', height: '44px' }}>
              Lanjut ke Pembayaran
            </button>
          </form>
        ) : (
          <Elements 
            stripe={stripePromise}
            options={{
              mode: 'payment',
              amount: Number(topUpAmount) * 100,
              currency: currencyInfo.code.toLowerCase(),
              appearance: { theme: 'night' }
            }}
          >
            <CheckoutForm 
              amount={Number(topUpAmount)} 
              currentUser={currentUser}
              savedMethods={savedMethods}
              onSuccess={() => onTopUpSuccess(Number(topUpAmount))} 
              onCancel={() => setShowStripe(false)}
            />
          </Elements>
        )}
      </motion.div>
    </motion.div>
  );
};
