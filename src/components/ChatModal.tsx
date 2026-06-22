import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, User } from 'lucide-react';
import type { Profile, AuctionItem } from '../types';
import { auctionService } from '../services/auctionService';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AuctionItem;
  currentUser: Profile;
  receiverProfile: Profile;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, item, currentUser, receiverProfile }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const unsubscribe = auctionService.subscribeToMessages(item.id, (message) => {
        setMessages(prev => [...prev, message]);
      });
      return () => unsubscribe();
    }
  }, [isOpen, item.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    const data = await auctionService.getMessages(item.id);
    setMessages(data);
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage('');
    try {
      await auctionService.sendMessage(item.id, receiverProfile.id, content);
    } catch (err) {
      console.error("Gagal mengirim pesan", err);
      setNewMessage(content); // Restore if failed
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="glass-panel"
      style={{
        position: 'fixed', bottom: '20px', right: '20px', width: '350px', height: '500px',
        zIndex: 1100, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid var(--bg-dark-700)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px', background: 'var(--bg-dark-900)', borderBottom: '1px solid var(--bg-dark-700)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {receiverProfile.avatar_url ? (
            <img src={receiverProfile.avatar_url} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-dark-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="var(--text-muted)" />
            </div>
          )}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{receiverProfile.username}</h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Penjual: {item.title}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: 'auto', marginBottom: 'auto' }}>Memuat pesan...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: 'auto', marginBottom: 'auto' }}>
            Belum ada pesan. Mulai ngobrol dengan penjual!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: '16px',
                  background: isMe ? 'var(--accent-primary)' : 'var(--bg-dark-800)',
                  color: '#fff', fontSize: '13px', lineHeight: 1.4,
                  borderBottomRightRadius: isMe ? '4px' : '16px',
                  borderBottomLeftRadius: !isMe ? '4px' : '16px',
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{ padding: '12px', background: 'var(--bg-dark-900)', borderTop: '1px solid var(--bg-dark-700)', display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ketik pesan..."
          style={{ flex: 1, background: 'var(--bg-dark-800)', border: '1px solid var(--bg-dark-700)', borderRadius: '20px', padding: '10px 16px', color: '#fff', fontSize: '13px', outline: 'none' }}
        />
        <button type="submit" disabled={!newMessage.trim()} style={{ width: '40px', height: '40px', borderRadius: '50%', background: newMessage.trim() ? 'var(--accent-primary)' : 'var(--bg-dark-800)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: newMessage.trim() ? 'pointer' : 'default', transition: '0.2s' }}>
          <Send size={16} style={{ marginLeft: '-2px' }} />
        </button>
      </form>
    </motion.div>
  );
};
