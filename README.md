# 🩺 ScanBatuk

![ScanBatuk Banner](https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop)

**ScanBatuk** adalah platform skrining kesehatan berbasis kecerdasan buatan (AI) yang dirancang untuk mendeteksi indikasi awal risiko masalah pernapasan, khususnya Tuberkulosis (TB), melalui analisis akustik suara batuk. Aplikasi ini juga dilengkapi dengan chatbot edukasi kesehatan dan fitur pencarian fasilitas kesehatan terdekat.

*Catatan: Aplikasi ini berfungsi sebagai alat skrining awal dan edukasi, **bukan** sebagai pengganti diagnosis medis dari dokter.*

---

## ✨ Fitur Utama

- 🎙️ **Analisis Akustik AI:** Rekam suara batuk Anda langsung dari perangkat, dan biarkan Gemini AI menganalisis pola suara untuk memberikan estimasi tingkat risiko (Low, Medium, High) beserta insight kesehatannya.
- 🤖 **Asisten Edukasi Kesehatan:** Chatbot pintar yang siap menjawab pertanyaan seputar gejala, pencegahan, dan informasi umum tentang Tuberkulosis dan penyakit pernapasan.
- 🏥 **Pencari Faskes Terdekat:** Integrasi dengan Google Maps API untuk membantu pengguna menemukan Rumah Sakit, Klinik, Apotek, atau Puskesmas terdekat berdasarkan lokasi saat ini.
- 🌓 **Tema Gelap & Terang:** Antarmuka pengguna bergaya "Clay Design" yang modern, elegan, dan mendukung Dark Mode & Light Mode secara mulus.
- 📊 **Dashboard & Riwayat Pengguna:** Pantau riwayat skrining batuk Anda dari waktu ke waktu dengan visualisasi data interaktif.
- 🔐 **Autentikasi Aman:** Sistem login yang terintegrasi penuh dengan Firebase Authentication.

---

## 🛠️ Tech Stack

Aplikasi ini dibangun menggunakan teknologi modern:

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion (Animasi), Lucide (Ikon)
- **Backend/BaaS:** Firebase (Authentication & Cloud Firestore)
- **Kecerdasan Buatan (AI):** Google Gemini AI API
- **Peta & Lokasi:** Google Maps Places API & Geolocation API

---

## 🚀 Panduan Instalasi Lokal

Untuk menjalankan aplikasi ini secara lokal di mesin Anda, ikuti langkah-langkah berikut:

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru) disarankan.
- Akun Firebase (untuk database dan autentikasi).
- Akun Google Cloud Console (untuk Gemini API dan Google Maps API).

### Langkah-langkah

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment Variables:**
   Duplikat file `.env.example` menjadi `.env`, lalu isi API key yang dibutuhkan:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   
   VITE_GEMINI_API_KEY=your_gemini_api_key
   
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

3. **Jalankan Aplikasi (Development Mode):**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000` atau port yang tersedia.

---

## 📜 Lisensi
Aplikasi ini dikembangkan untuk tujuan edukasi dan kompetisi. Hak cipta © 2026 ScanBatuk. All rights reserved.
