-- 1. Pastikan kolom wallet_balance ada di tabel profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;

-- 2. Update fungsi place_bid untuk menggunakan sistem Escrow (Tahan Saldo)
CREATE OR REPLACE FUNCTION place_bid(p_item_id UUID, p_bid_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_end_time TIMESTAMP WITH TIME ZONE;
  v_item_status TEXT;
  v_seller_id UUID;
  v_highest_bid NUMERIC;
  v_previous_bidder_id UUID;
  v_starting_price NUMERIC;
  v_increment NUMERIC;
  v_bidder_id UUID;
  v_bidder_balance NUMERIC;
BEGIN
  -- Ambil ID penawar dari sesi yang sedang login
  v_bidder_id := auth.uid();
  IF v_bidder_id IS NULL THEN
    RAISE EXCEPTION 'Anda harus login untuk menawar.';
  END IF;

  -- Ambil saldo penawar saat ini
  SELECT COALESCE(wallet_balance, 0) INTO v_bidder_balance
  FROM public.profiles
  WHERE id = v_bidder_id;

  -- Cek apakah saldo cukup untuk melakukan bid
  IF v_bidder_balance < p_bid_amount THEN
    RAISE EXCEPTION 'Saldo dompet tidak cukup (Saldo Anda: Rp %). Silakan Top Up terlebih dahulu.', v_bidder_balance;
  END IF;

  -- Ambil detail barang
  SELECT end_time, status, seller_id, starting_price, bid_increment
  INTO v_item_end_time, v_item_status, v_seller_id, v_starting_price, v_increment
  FROM public.items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Barang tidak ditemukan.';
  END IF;

  -- Penjual tidak boleh menawar barangnya sendiri
  IF v_bidder_id = v_seller_id THEN
    RAISE EXCEPTION 'Penjual tidak dapat menawar barangnya sendiri.';
  END IF;

  -- Cek status dan waktu
  IF v_item_status != 'active' OR v_item_end_time <= now() THEN
    RAISE EXCEPTION 'Lelang untuk barang ini sudah ditutup.';
  END IF;

  -- Cari tawaran tertinggi saat ini dan siapa penawarnya
  SELECT amount, bidder_id INTO v_highest_bid, v_previous_bidder_id
  FROM public.bids
  WHERE item_id = p_item_id
  ORDER BY amount DESC
  LIMIT 1;

  v_highest_bid := COALESCE(v_highest_bid, 0);

  -- Validasi apakah tawaran cukup tinggi
  IF v_highest_bid = 0 THEN
    IF p_bid_amount < v_starting_price THEN
      RAISE EXCEPTION 'Tawaran harus minimal sebesar harga awal (Rp %).', v_starting_price;
    END IF;
  ELSE
    IF p_bid_amount < (v_highest_bid + v_increment) THEN
      RAISE EXCEPTION 'Tawaran harus lebih tinggi dari tawaran tertinggi saat ini ditambah kelipatan bid (Rp %).', (v_highest_bid + v_increment);
    END IF;
  END IF;

  -- 1. POTONG saldo penawar yang baru
  UPDATE public.profiles
  SET wallet_balance = wallet_balance - p_bid_amount
  WHERE id = v_bidder_id;

  -- 2. KEMBALIKAN (Refund) saldo ke penawar tertinggi sebelumnya (jika ada)
  IF v_previous_bidder_id IS NOT NULL THEN
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + v_highest_bid
    WHERE id = v_previous_bidder_id;
  END IF;

  -- 3. Masukkan tawaran baru ke database
  INSERT INTO public.bids (item_id, bidder_id, amount)
  VALUES (p_item_id, v_bidder_id, p_bid_amount);
  
END;
$$;
