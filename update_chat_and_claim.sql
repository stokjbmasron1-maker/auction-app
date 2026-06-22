-- 1. Tambahkan kolom untuk keperluan "Claim" pada tabel items
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_phone TEXT,
ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT;

-- 2. Buat Tabel Pesan (Chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Aktifkan RLS untuk Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS Messages: User hanya bisa melihat pesan yang dikirim/diterima olehnya
CREATE POLICY "Users can read their own messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Kebijakan RLS Messages: User hanya bisa mengirim pesan sebagai dirinya sendiri
CREATE POLICY "Users can insert messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Kebijakan RLS Messages: User bisa mengupdate is_read jika dia adalah penerima
CREATE POLICY "Users can update received messages" 
ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id);

-- 4. Tambahkan messages ke realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
