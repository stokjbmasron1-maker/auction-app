# 📋 Trello Kanban Board - Auction App Project

Berikut adalah struktur papan Kanban (Kanban Board) yang bisa kamu salin ke Trello untuk memanajemen proyek aplikasi lelang kita. 

Di Trello, buatlah 4 buah *List* (kolom) dengan nama-nama berikut, lalu tambahkan *Cards* di bawahnya sesuai daftar ini:

---

## 🧊 Kolom 1: BACKLOG (Ide & Fitur Masa Depan)
*Fitur-fitur yang bagus untuk ditambahkan nanti, tapi belum prioritas sekarang.*
- [ ] **Sistem Rating & Ulasan:** Pembeli bisa memberikan bintang ke penjual setelah barang diterima.
- [ ] **Notifikasi Email:** Kirim email otomatis saat *user* menang lelang atau saat bid-nya dikalahkan (*outbid*).
- [ ] **Admin Panel (Dasbor Admin):** Halaman khusus admin untuk memantau semua transaksi lelang dan memblokir *user* nakal.
- [ ] **Sistem Penarikan Dana (Withdrawal):** Fitur untuk penjual mencairkan saldo dompetnya ke rekening bank asli.
- [ ] **Fitur Pencarian & Filter Lanjutan:** Filter barang lelang berdasarkan kategori, rentang harga, dan status aktif/selesai.
- [ ] **Integrasi Ongkos Kirim:** Cek resi otomatis & perhitungan ongkir (RajaOngkir/Kurir lokal).

---

## 📝 Kolom 2: TO DO (Akan Dikerjakan)
*Pekerjaan yang sudah direncanakan dan harus segera dikerjakan selanjutnya.*
- [ ] **Halaman "Lelang Saya" (Seller Dashboard):** Buat halaman khusus agar penjual bisa melihat daftar barang yang sedang mereka lelang.
- [ ] **Validasi Gambar Barang:** Batasi ukuran *upload* foto barang lelang maksimal 2MB.
- [ ] **Penyempurnaan UI/UX Halaman Utama:** Rapihkan animasi *hover* dan tambahkan efek *glassmorphism* di kartu-kartu barang lelang.
- [ ] **Testing Menyeluruh (QA):** Uji coba alur dari daftar -> top up -> pasang barang -> bid -> menang -> chat penjual.

---

## ⏳ Kolom 3: IN PROGRESS (Sedang Dikerjakan)
*Pekerjaan yang saat ini sedang aktif digarap (kosongkan atau isi dengan fokus terbarumu).*
- [ ] *(Kosong - Saat ini kita baru menyelesaikan fitur Claim & Chat)*

---

## ✅ Kolom 4: DONE (Selesai)
*Pencapaian dan fitur yang sudah berhasil kita selesaikan sejauh ini! 🎉*
- [x] **Setup Database Supabase:** Membuat tabel `profiles`, `items`, dan `bids` dengan aturan keamanan RLS yang ketat.
- [x] **Sistem Autentikasi User:** Login & Register aman menggunakan Supabase Auth.
- [x] **Integrasi Top-Up Stripe:** *User* bisa menambah saldo menggunakan kartu kredit dengan simulasi Stripe Edge Functions.
- [x] **Sistem Tahan Dana (Escrow Bidding):** Saldo *user* otomatis dipotong saat menawar, dan otomatis di-*refund* ke dompet jika kalah (*outbid*).
- [x] **Manajemen Profil & Alamat:** *User* bisa menyimpan alamat pengiriman lengkap di halaman profilnya.
- [x] **Alur Klaim Barang (Claim Flow):** Pop-up khusus muncul untuk pemenang lelang guna mengonfirmasi alamat pengiriman.
- [x] **Fitur Pesan Instan (Real-time Chat):** Pemenang lelang bisa langsung mengirim pesan/chat ke penjual barang secara langsung di dalam aplikasi.

---

### 💡 Tips Memasukkan ke Trello dengan Cepat:
1. Buka papan Trello-mu.
2. Buat kolom baru (misal: **TO DO**).
3. *Copy* semua teks poin-poin yang ada di bawah kategori **TO DO** di atas (blok teksnya, lalu tekan `Ctrl+C`).
4. *Paste* (`Ctrl+V`) di kotak tambah kartu (*Add a card*) di Trello. Trello biasanya akan cerdas dan bertanya apakah kamu mau memecahnya menjadi banyak kartu terpisah. Pilih **"Create X cards"**. Selesai!
