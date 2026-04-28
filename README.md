# Palugada - Apa Mau Lu Gw Ada

Aplikasi manajemen koperasi modern berbasis Web (React + Express + SQLite).

## Prasyarat Utama
- **Node.js** (v18.x atau lebih baru)
- **npm** (biasanya terinstal bersama Node.js)

## Cara Instalasi Lokal
1. **Ekstrak/Download** semua file project ke dalam satu folder.
2. Buka terminal di folder tersebut.
3. Jalankan perintah untuk menginstal semua library yang dibutuhkan:
   ```bash
   npm install
   ```
4. Buat file `.env` di root folder dan isi variabel berikut (lihat `.env.example` sebagai referensi):
   ```env
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret
   MIDTRANS_SERVER_KEY=your_midtrans_key
   SESSION_SECRET=random_string_secure
   ```

## Cara Menjalankan
### Mode Pengembangan (Development)
Untuk menjalankan aplikasi dengan fitur auto-reload:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### Mode Produksi (Production)
Untuk menjalankan aplikasi dengan performa maksimal:
1. Build aplikasi:
   ```bash
   npm run build
   ```
2. Jalankan server:
   ```bash
   npm start
   ```

## Struktur Folder Utama
- `/src`: Kode sumber Frontend (React + Tailwind)
- `/server.ts`: Entry point Backend (Express)
- `/server/db.ts`: Konfigurasi Database SQLite
- `syskop.db`: File database utama (Jangan dihapus!)

## Teknologi yang Digunakan
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend:** Node.js, Express, Better-SQLite3.
- **Integrasi:** Midtrans (Payment), Google OAuth (Login).
