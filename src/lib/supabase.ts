import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase URL dan Anon Key belum diatur di .env.local. Aplikasi akan menggunakan fallback LocalStorage (Demo Mode).'
  );
}

// Hanya inisialisasi jika konfigurasi lengkap untuk mencegah error saat inisialisasi
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
