# ☁️ CodeHaven - Modern Snippet Manager

CodeHaven adalah aplikasi manajemen snippet kode modern yang dirancang untuk developer. Aplikasi ini memungkinkan pengguna menyimpan, mengelola, membagikan, dan menemukan potongan kode (snippets) dengan antarmuka yang indah dan responsif.

## 🚀 Fitur Utama

### 1. Manajemen Snippet (CRUD)
- **Create**: Buat snippet baru dengan dukungan syntax highlighting untuk berbagai bahasa.
- **Read**: Lihat detail snippet, termasuk pewarnaan kode yang akurat.
- **Update**: Edit snippet yang sudah ada (hanya pemilik).
- **Delete**: Hapus snippet yang tidak lagi dibutuhkan (hanya pemilik).
- **Tags**: Kategorisasi snippet menggunakan sistem tagging.
- **Public/Private**: Atur visibilitas snippet (Publik untuk bisa dilihat semua orang, Privat untuk koleksi pribadi).

### 2. Fitur Sosial & Interaksi
- **Like / Favorit**: Simpan snippet menarik dari pengguna lain ke koleksi favorit.
- **Forking**: Salin snippet orang lain ke dashboard pribadi Anda untuk dimodifikasi.
- **Copy Code**: Salin kode ke clipboard dengan satu klik.
- **Download Code**: Unduh snippet sebagai file asli (misal: `.js`, `.py`, `.html`) dengan ekstensi otomatis.
- **Profil Pengguna**: Halaman profil publik yang menampilkan koleksi snippet publik pengguna tersebut.

### 3. Sistem Notifikasi Realtime
- Mendapatkan notifikasi instan saat seseorang:
  - Menyukai snippet Anda.
  - Melakukan Fork pada snippet Anda.
  - Menyalin kode Anda (Copy).
- Indikator "Belum Dibaca" (badge merah) pada ikon lonceng.

### 4. UI/UX Modern
- **Dark Mode**: Dukungan penuh untuk tema gelap dan terang.
- **Responsive**: Tampilan optimal di Desktop, Tablet, dan Mobile.
- **Lazy Loading**: Halaman dimuat secara bertahap untuk performa awal yang cepat.
- **Animations**: Transisi halus dan micro-interactions menggunakan CSS dan Tailwind.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Code Editor**: [@uiw/react-codemirror](https://uiwjs.github.io/react-codemirror/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM](https://reactrouter.com/)

## ☁️ Backend & Database (Supabase)

Proyek ini menggunakan **Supabase** sebagai Full Backend-as-a-Service:

- **Authentication**: Email/Password Sign-in & Sign-up.
- **PostgreSQL Database**:
  - `profiles`: Data pengguna.
  - `snippets`: Metadata dan konten kode.
  - `favorites`: Relasi like user-snippet.
  - `notifications`: Mencatat aktivitas sosial.
- **Realtime**: Subscription untuk update notifikasi langsung.
- **RLS (Row Level Security)**: Kebijakan keamanan data di level database.

## 📂 Struktur Proyek

```
src/
├── components/     # Komponen UI reusable (SnippetCard, Navbar, Modal, dll)
├── hooks/          # Custom Hooks (misal: useShortcut)
├── lib/            # Konfigurasi library pihak ketiga (Supabase client)
├── pages/          # Halaman utama (Dashboard, Login, Detail, dll)
├── store/          # Global State Management (Zustand)
│   ├── authStore.js        # Logika Login/Session
│   ├── snippetStore.js     # Logika CRUD & Interaksi Snippet
│   ├── notificationStore.js# Logika Notifikasi Realtime
│   └── themeStore.js       # Logika Dark Mode
├── utils/          # Fungsi helper (Format tanggal, Config Bahasa, AI Service)
└── App.jsx         # Entry point & Routing
```

## 🚀 Cara Menjalankan

1. **Clone Repository**
   ```bash
   git clone https://github.com/sofyan2108/codeheaven-ta.git
   cd snippet-manager
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   *(Pastikan Node.js sudah terinstall)*

3. **Setup Environment Variables**
   Buat file `.env.local` di root folder dan isi dengan kredensial Supabase Anda:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   ```

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Akses aplikasi di `http://localhost:5173`

## ✨ Pengembangan Terakhir (Changelog)

- **[New] Download Snippet**: Tombol download dengan konfirmasi dan deteksi ekstensi file otomatis.
- **[New] Toggle Password**: Tombol "Lihat Password" (ikon mata) di halaman Login/Register.
- **[Optimasi] Performance**: Implementasi `React.lazy` dan `Suspense` untuk mempercepat loading awal.
- **[Fix] Notifikasi**: Perbaikan logika trigger notifikasi dan relasi database untuk avatar pengirim.
- **[Fix] Scrollbar**: Perbaikan interaksi scroll pada preview snippet card.

---
Dibuat untuk Tugas Akhir Kuliah.
