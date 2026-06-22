export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  wallet_balance?: number;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  created_at: string;
}

export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  category: string;
  starting_price: number;
  bid_increment: number;
  buy_now_price: number | null;
  image_url: string | null;
  seller_id: string;
  end_time: string;
  status: 'active' | 'completed' | 'cancelled' | 'claimed';
  created_at: string;
  seller_profile?: Profile;
  highest_bid?: number;
  bid_count?: number;
}

export interface Bid {
  id: string;
  item_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
  bidder_profile?: Profile;
}
