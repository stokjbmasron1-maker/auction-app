-- SCHEMA UNTUK APLIKASI LELANG (AUCTION APP) WITH SUPABASE
-- Silakan salin & jalankan script ini di SQL Editor Supabase Anda.

-- 1. Tabel Profil (Hubungan 1-to-1 dengan auth.users Supabase)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Aktifkan Row Level Security (RLS) untuk profiles
alter table public.profiles enable row level security;

create policy "Profil dapat dilihat oleh siapa saja" 
    on public.profiles for select 
    using (true);

create policy "Pengguna dapat mengubah profilnya sendiri" 
    on public.profiles for update 
    using (auth.uid() = id);

-- 2. Tabel Barang Lelang (Items)
create table if not exists public.items (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    category text not null,
    starting_price numeric not null,
    bid_increment numeric not null default 50000.00,
    buy_now_price numeric,
    image_url text,
    seller_id uuid references public.profiles(id) on delete cascade not null,
    end_time timestamp with time zone not null,
    status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Aktifkan RLS untuk items
alter table public.items enable row level security;

create policy "Barang lelang dapat dilihat oleh semua orang" 
    on public.items for select 
    using (true);

create policy "Pengguna terautentikasi dapat membuat lelang baru" 
    on public.items for insert 
    with check (auth.uid() = seller_id);

create policy "Penjual dapat memperbarui lelangnya sendiri jika belum ada bid" 
    on public.items for update 
    using (auth.uid() = seller_id);

-- 3. Tabel Riwayat Bid (Bids)
create table if not exists public.bids (
    id uuid default gen_random_uuid() primary key,
    item_id uuid references public.items(id) on delete cascade not null,
    bidder_id uuid references public.profiles(id) on delete cascade not null,
    amount numeric not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Aktifkan RLS untuk bids
alter table public.bids enable row level security;

create policy "Riwayat bid dapat dilihat oleh semua orang" 
    on public.bids for select 
    using (true);

create policy "Pengguna terautentikasi dapat menempatkan bid" 
    on public.bids for insert 
    with check (auth.uid() = bidder_id);

-- 4. Fungsi Otomatis: Membuat Profil Baru saat User Mendaftar (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Fungsi Database (RPC) untuk Menempatkan Bid Secara Aman (Mencegah Race Condition)
create or replace function public.place_bid(p_item_id uuid, p_bid_amount numeric)
returns void as $$
declare
    v_item_end_time timestamp with time zone;
    v_item_status text;
    v_seller_id uuid;
    v_highest_bid numeric;
    v_previous_bidder_id uuid;
    v_starting_price numeric;
    v_increment numeric;
    v_bidder_id uuid;
    v_bidder_balance numeric;
begin
    -- 1. Ambil ID penawar dari sesi yang sedang login
    v_bidder_id := auth.uid();
    if v_bidder_id is null then
        raise exception 'Anda harus login untuk menawar.';
    end if;

    -- 2. Ambil saldo penawar saat ini
    select coalesce(wallet_balance, 0) into v_bidder_balance
    from public.profiles
    where id = v_bidder_id;

    -- 3. Cek apakah saldo cukup untuk melakukan bid
    if v_bidder_balance < p_bid_amount then
        raise exception 'Saldo dompet tidak cukup (Saldo Anda: Rp %). Silakan Top Up terlebih dahulu.', v_bidder_balance;
    end if;

    -- 4. Ambil detail barang
    select end_time, status, seller_id, starting_price, bid_increment
    into v_item_end_time, v_item_status, v_seller_id, v_starting_price, v_increment
    from public.items
    where id = p_item_id;

    if not found then
        raise exception 'Barang tidak ditemukan.';
    end if;

    -- 5. Penjual tidak boleh menawar barangnya sendiri
    if v_bidder_id = v_seller_id then
        raise exception 'Penjual tidak dapat menawar barangnya sendiri.';
    end if;

    -- 6. Cek status dan waktu
    if v_item_status != 'active' or v_item_end_time <= now() then
        raise exception 'Lelang untuk barang ini sudah ditutup.';
    end if;

    -- 7. Cari tawaran tertinggi saat ini dan siapa penawarnya
    select amount, bidder_id into v_highest_bid, v_previous_bidder_id
    from public.bids
    where item_id = p_item_id
    order by amount desc
    limit 1;

    v_highest_bid := coalesce(v_highest_bid, 0);

    -- 8. Validasi apakah tawaran cukup tinggi
    if v_highest_bid = 0 then
        if p_bid_amount < v_starting_price then
            raise exception 'Tawaran harus minimal sebesar harga awal (Rp %).', v_starting_price;
        end if;
    else
        if p_bid_amount < (v_highest_bid + v_increment) then
            raise exception 'Tawaran harus lebih tinggi dari tawaran tertinggi saat ini ditambah kelipatan bid (Rp %).', (v_highest_bid + v_increment);
        end if;
    end if;

    -- 9. POTONG saldo penawar yang baru
    update public.profiles
    set wallet_balance = wallet_balance - p_bid_amount
    where id = v_bidder_id;

    -- 10. KEMBALIKAN (Refund) saldo ke penawar tertinggi sebelumnya (jika ada)
    if v_previous_bidder_id is not null then
        update public.profiles
        set wallet_balance = wallet_balance + v_highest_bid
        where id = v_previous_bidder_id;
    end if;

    -- 11. Masukkan tawaran baru ke database
    insert into public.bids (item_id, bidder_id, amount)
    values (p_item_id, v_bidder_id, p_bid_amount);

end;
$$ language plpgsql security definer;

-- 6. Aktifkan Realtime di Supabase untuk Tabel `bids` dan `items`
alter publication supabase_realtime add table public.bids;
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.profiles;
