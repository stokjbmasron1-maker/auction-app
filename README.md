# 🔨 LelangKu | Platform Lelang Multi-Kategori Premium Real-Time

[![Framework - React](https://img.shields.io/badge/Framework-React_18-blue?logo=react&logoColor=white&style=for-the-badge)](https://react.dev/)
[![Build Tool - Vite](https://img.shields.io/badge/Build_Tool-Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vite.dev/)
[![Database - Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&logoColor=white&style=for-the-badge)](https://supabase.com/)
[![Deployment - Vercel](https://img.shields.io/badge/Deployment-Vercel-000000?logo=vercel&logoColor=white&style=for-the-badge)](https://vercel.com/)

**LelangKu** adalah platform lelang digital modern yang memungkinkan pengguna melakukan transaksi penawaran (bidding) barang secara langsung (real-time) dan aman tanpa adanya perantara bot. Menggunakan arsitektur modern berbasis React dan Supabase Real-time, platform ini menghubungkan penjual dan pembeli secara instan untuk melakukan penawaran dan penyelesaian transaksi secara langsung dari aplikasi.

---

## 👥 Tim Pengembangan & Pembagian Tugas

Berikut adalah susunan anggota tim proyek pengembangan **LelangKu** beserta peran dan tanggung jawab masing-masing:

| No | Nama Anggota | NIM | Peran / Role | Tanggung Jawab Utama |
|---|---|---|---|---|
| 1 | **Bryan Chandra** (GitHub: [@stokjbmasron](https://github.com/stokjbmasron)) | `241110637` | **Project Manager & Backend Lead** | Mengelola *roadmap* proyek, merancang skema database PostgreSQL di Supabase, menulis fungsi RPC transaksional (`place_bid`), dan konfigurasi RLS (Row Level Security). |
| 2 | **Steven Aurelio** (GitHub: [@oasdioqs](https://github.com/oasdioqs)) | `201111110` | **Frontend Lead Engineer** | Merancang arsitektur aplikasi menggunakan React (Vite) + TypeScript, mengintegrasikan Supabase JS SDK, dan menangani pengelolaan *state* penawaran & real-time subscription. |
| 3 | **Stevania** | *Pending* | **UI/UX Designer & CSS Specialist** | Merancang purwarupa antarmuka pengguna, mengembangkan sistem desain CSS (vanilla) yang premium bertema *dark glassmorphic*, dan memastikan responsivitas UI di semua perangkat. |
| 4 | **Raihan** | *Pending* | **QA Engineer & Deployment Lead** | Melakukan pengujian integrasi fungsionalitas bidding, menangani konfigurasi *environment variables*, serta memimpin proses *deployment* kontinu di platform Vercel. |

---

## ⚡ Fitur Utama Aplikasi

1. **Pelelangan Online Real-Time:** 
   * Penawaran sinkron secara langsung menggunakan *Supabase Realtime Subscriptions*. Setiap bid baru yang masuk akan langsung memperbarui angka penawaran dan log riwayat penawaran di layar pengguna lain secara instan tanpa perlu memuat ulang (*refresh*) halaman.
2. **Transaksi Bidding yang Aman (Transactional RPC):**
   * Bidding dilakukan menggunakan fungsi database PostgreSQL transaksional yang mencegah terjadinya *race conditions* (dua orang menawar harga yang sama di waktu bersamaan).
   * Sistem otomatis memotong saldo penawar baru, mengembalikan saldo penawar tertinggi sebelumnya, dan menolak bid jika saldo pembeli tidak mencukupi.
3. **Multi-Kategori Barang:**
   * Mendukung penayangan barang lelang dari berbagai kategori (Elektronik, Fashion, Otomotif, Seni & Koleksi, Properti, dan Lainnya) lengkap dengan pencarian dan filtrasi dinamis.
4. **Dashboard Penjual Mandiri:**
   * Pengguna dapat mendaftarkan barang lelangnya sendiri secara langsung, menentukan harga awal (*starting price*), nominal kelipatan kenaikan penawaran (*bid increment*), serta batas waktu berakhir lelang (*countdown*).
5. **Sistem Autentikasi Pengguna & Wallet Digital:**
   * Manajemen akun pembeli/penjual terintegrasi dengan saldo wallet simulasi untuk melakukan penawaran secara langsung.

---

## 🛠️ Stack Teknologi

*   **Frontend:** React (Vite) + TypeScript (tipe data statis untuk meminimalkan bug runtime).
*   **Styling:** Vanilla CSS (mengutamakan performa, fleksibilitas desain premium, serta efek glassmorphism).
*   **Database & Backend:** Supabase (Auth untuk login, PostgreSQL sebagai database, dan Real-time channel untuk broadcast bid).
*   **Hosting:** Vercel (otomatis terhubung dengan GitHub untuk continuous deployment).

---

## 🚀 Cara Menjalankan Project Secara Lokal

1. Clone repositori ini:
   ```bash
   git clone https://github.com/stokjbmasron1-maker/auction-app.git
   cd auction-app
   ```
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Jalankan server lokal:
   ```bash
   npm run dev
   ```
4. Buka halaman di browser Anda (biasanya `http://localhost:5173`).
