-- Menambahkan kolom saldo dompet (wallet_balance) ke tabel profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0 NOT NULL;

-- (Opsional) Menambahkan kolom currency jika kedepannya mau multi-currency
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR' NOT NULL;
