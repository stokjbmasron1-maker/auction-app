import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { CreateAuctionModal } from './components/CreateAuctionModal';
import { AuthModal } from './components/AuthModal';
import { auctionService } from './services/auctionService';
import type { Profile } from './types';
import { Bell } from 'lucide-react';

import { LandingPage } from './pages/LandingPage';
import { AuctionPage } from './pages/AuctionPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await auctionService.getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();

    // Listen to real Supabase auth changes for perfect sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
         const user = await auctionService.getCurrentUser();
         setCurrentUser(user);
      } else {
         setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time toast notification listener (Global)
  useEffect(() => {
    const handleGlobalBid = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string; bid: any }>;
      const { bid } = customEvent.detail;
      
      // Show toast notification
      setShowNotification(`Bid baru masuk! Rp ${bid.amount.toLocaleString('id-ID')} dari ${bid.bidder_profile?.full_name}`);
      setTimeout(() => setShowNotification(null), 4000);
    };

    window.addEventListener('mock-bid-inserted', handleGlobalBid);
    return () => window.removeEventListener('mock-bid-inserted', handleGlobalBid);
  }, []);

  return (
    <div className="app-container">
      <Navbar 
        currentUser={currentUser}
        onUserChanged={setCurrentUser}
        onLoginClick={() => setIsAuthOpen(true)}
      />

      <main className="main-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/auction" 
              element={
                <AuctionPage 
                  currentUser={currentUser} 
                  searchQuery={searchQuery} 
                  onSearch={setSearchQuery}
                  onCreateAuctionClick={() => setIsCreateOpen(true)}
                />
              } 
            />
            <Route path="/profile" element={<ProfilePage currentUser={currentUser} />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Floating Real-time Toast Notifications */}
      <AnimatePresence>
        {showNotification && (
          <div 
            className="glass-panel"
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 9999,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              animation: 'slideUp 0.3s ease-out',
              background: 'rgba(21, 26, 36, 0.95)',
            }}
          >
            <div style={{
              background: 'rgba(139, 92, 246, 0.2)',
              padding: '8px',
              borderRadius: '50%',
              color: 'var(--accent-secondary)'
            }}>
              <Bell size={16} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>
              {showNotification}
            </span>
          </div>
        )}
      </AnimatePresence>

      {/* Create Auction Modal */}
      <CreateAuctionModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onAuctionCreated={() => {
          // You could trigger a global refresh or redirect to auction page here
        }}
      />

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal 
            isOpen={isAuthOpen} 
            onClose={() => setIsAuthOpen(false)} 
            onSuccess={() => setIsAuthOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
