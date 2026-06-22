import { supabase } from '../lib/supabase';
import type { AuctionItem, Bid, Profile } from '../types';

export const auctionService = {
  
  // --- AUTH SERVICES ---
  getCurrentUser: async (): Promise<Profile | null> => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error || !profile) {
      // If profile doesn't exist in DB yet (e.g. no SQL trigger), construct it from user_metadata
      const metadata = user.user_metadata || {};
      const newProfile = {
        id: user.id,
        username: metadata.username || `${user.email?.split('@')[0]}_${user.id.substring(0, 5)}`,
        full_name: metadata.full_name || 'Pengguna',
        avatar_url: metadata.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`,
      };
      
      // Try to upsert it so relational constraints don't break
      const { error: insertError } = await supabase.from('profiles').upsert([newProfile]);
      
      if (insertError) {
        console.error('Failed to create fallback profile:', insertError);
        // Bisa jadi gagal karena "Race Condition" (dipanggil 2x barengan oleh Navbar & App)
        // Coba fetch ulang untuk memastikan
        const { data: retryProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (retryProfile) return retryProfile as Profile;
        
        // Kalau tetap gagal, kembalikan newProfile agar UI tetap "Logged In"
        return newProfile as Profile;
      }
      return newProfile as Profile;
    }
    
    return profile;
  },

  getAllUsers: async (): Promise<Profile[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('profiles').select('*');
    return data || [];
  },

  updateProfile: async (updates: Partial<Profile>): Promise<Profile> => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    // Dispatch event so UI updates
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: data }));
    return data as Profile;
  },

  signIn: async (email: string, password: string): Promise<Profile | null> => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const user = await auctionService.getCurrentUser();
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: user }));
    return user;
  },

  signUp: async (email: string, password: string, username: string, fullName: string): Promise<Profile | null> => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`
        }
      }
    });
    
    if (error) throw new Error(error.message);
    
    // Attempt to return the new profile immediately, though it might take a second for trigger
    const user = await auctionService.getCurrentUser();
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: user }));
    return user;
  },

  signInWithGoogle: async (): Promise<void> => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw new Error(error.message);
  },

  logout: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
  },

  // --- AUCTION ITEM SERVICES ---
  getItems: async (filters?: { category?: string; search?: string; status?: 'active' | 'completed' | 'cancelled' }): Promise<AuctionItem[]> => {
    if (!supabase) return [];
    
    let query = supabase
      .from('items')
      .select(`
        *,
        seller_profile:profiles(*)
      `);
    
    if (filters?.category && filters.category !== 'Semua') {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching items from Supabase:', error);
      return [];
    }
    
    const items = data as AuctionItem[];
    
    // Hitung bid count & highest bid untuk setiap item
    for (const item of items) {
      const { data: bids } = await supabase
        .from('bids')
        .select('amount')
        .eq('item_id', item.id);
      
      item.bid_count = bids?.length || 0;
      item.highest_bid = bids && bids.length > 0 
        ? Math.max(...bids.map(b => Number(b.amount))) 
        : item.starting_price;
    }
    
    return items;
  },

  getItemById: async (id: string): Promise<{ item: AuctionItem; bids: Bid[] } | null> => {
    if (!supabase) return null;
    
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .select(`
        *,
        seller_profile:profiles(*)
      `)
      .eq('id', id)
      .single();
      
    if (itemError || !itemData) {
      console.error('Error fetching item details:', itemError);
      return null;
    }
    
    const { data: bidsData, error: bidsError } = await supabase
      .from('bids')
      .select(`
        *,
        bidder_profile:profiles(*)
      `)
      .eq('item_id', id)
      .order('amount', { ascending: false });
      
    if (bidsError) {
      console.error('Error fetching item bids:', bidsError);
      return null;
    }

    const bids = bidsData as Bid[];
    const item = itemData as AuctionItem;
    item.bid_count = bids.length;
    item.highest_bid = bids.length > 0 ? bids[0].amount : item.starting_price;

    return { item, bids };
  },

  createItem: async (item: Omit<AuctionItem, 'id' | 'seller_id' | 'status' | 'created_at' | 'highest_bid' | 'bid_count'>): Promise<AuctionItem> => {
    if (!supabase) throw new Error("Supabase is not configured");
    const currentUser = await auctionService.getCurrentUser();
    if (!currentUser) throw new Error('Pengguna tidak terautentikasi. Silakan login terlebih dahulu.');

    const { data, error } = await supabase
      .from('items')
      .insert([{
        ...item,
        seller_id: currentUser.id,
        status: 'active'
      }])
      .select(`
        *,
        seller_profile:profiles(*)
      `)
      .single();
      
    if (error) {
      console.error('Error creating auction item:', error);
      throw new Error(error.message);
    }
    
    return data as AuctionItem;
  },

  // --- BIDDING SERVICES ---
  getUserBids: async (): Promise<any[]> => {
    if (!supabase) return [];
    const currentUser = await auctionService.getCurrentUser();
    if (!currentUser) return [];

    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        item:items(*)
      `)
      .eq('bidder_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bids:', error);
      return [];
    }
    return data;
  },

  placeBid: async (itemId: string, amount: number): Promise<void> => {
    if (!supabase) throw new Error("Supabase is not configured");
    const currentUser = await auctionService.getCurrentUser();
    if (!currentUser) throw new Error('Pengguna tidak terautentikasi. Silakan login terlebih dahulu.');

    const { error } = await supabase.rpc('place_bid', {
      p_item_id: itemId,
      p_bid_amount: amount
    });
    
    if (error) {
      console.error('Error placing bid on Supabase:', error);
      throw new Error(error.message);
    }
  },

  // --- REAL-TIME SUBSCRIPTIONS ---
  subscribeToBids: (itemId: string, callback: (bid: Bid) => void) => {
    const client = supabase;
    if (!client) return () => {};

    const channel = client
      .channel(`bids:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `item_id=eq.${itemId}`
        },
        async (payload) => {
          // Dapatkan profil penawar untuk melengkapi real-time data
          const { data: bidderProfile } = await client
            .from('profiles')
            .select('*')
            .eq('id', payload.new.bidder_id)
            .single();
            
          const completeBid: Bid = {
            id: payload.new.id,
            item_id: payload.new.item_id,
            bidder_id: payload.new.bidder_id,
            amount: Number(payload.new.amount),
            created_at: payload.new.created_at,
            bidder_profile: bidderProfile as Profile
          };
          callback(completeBid);
        }
      )
      .subscribe();
      
    return () => {
      client.removeChannel(channel);
    };
  },
  
  subscribeToItemUpdates: (itemId: string, callback: (item: AuctionItem) => void) => {
    const client = supabase;
    if (!client) return () => {};

    const channel = client
      .channel(`item:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'items',
          filter: `id=eq.${itemId}`
        },
        async (payload) => {
          const { data: sellerProfile } = await client
            .from('profiles')
            .select('*')
            .eq('id', payload.new.seller_id)
            .single();
            
          const completeItem: AuctionItem = {
            ...(payload.new as AuctionItem),
            seller_profile: sellerProfile as Profile
          };
          callback(completeItem);
        }
      )
      .subscribe();
      
    return () => {
      client.removeChannel(channel);
    };
  },

  // --- CLAIM & CHAT SERVICES ---
  claimItem: async (itemId: string, shippingDetails: { address: string, city: string, phone: string, postal_code: string }) => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase
      .from('items')
      .update({
        claimed_at: new Date().toISOString(),
        shipping_address: shippingDetails.address,
        shipping_city: shippingDetails.city,
        shipping_phone: shippingDetails.phone,
        shipping_postal_code: shippingDetails.postal_code,
        status: 'claimed'
      })
      .eq('id', itemId);

    if (error) throw new Error(error.message);
  },

  getMessages: async (itemId: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    return data;
  },

  sendMessage: async (itemId: string, receiverId: string, content: string) => {
    if (!supabase) throw new Error("Supabase is not configured");
    const currentUser = await auctionService.getCurrentUser();
    if (!currentUser) throw new Error("Not logged in");

    const { error } = await supabase
      .from('messages')
      .insert([{
        item_id: itemId,
        sender_id: currentUser.id,
        receiver_id: receiverId,
        content
      }]);

    if (error) throw new Error(error.message);
  },

  subscribeToMessages: (itemId: string, callback: (message: any) => void) => {
    const client = supabase;
    if (!client) return () => {};

    const channel = client
      .channel(`messages:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `item_id=eq.${itemId}`
        },
        async (payload) => {
          // Fetch sender profile
          const { data: sender } = await client
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();
            
          callback({ ...payload.new, sender });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }
};
