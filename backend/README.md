# Kalkulator HPP & Rekomendasi Strategi Penjualan (AI)

Aplikasi web full-stack untuk menghitung Harga Pokok Penjualan (HPP) dan
mendapatkan rekomendasi strategi penjualan dari Claude (Anthropic API).

## Arsitektur

- **Frontend**: React + Vite + Tailwind CSS — menghitung HPP real-time di
  klien untuk UX instan, lalu mengirim `hpp_per_unit` ke backend untuk
  permintaan rekomendasi AI.
- **Backend**: FastAPI — sumber kebenaran untuk kalkulasi HPP (opsional
  divalidasi ulang via endpoint `/api/hpp/calculate`), dan satu-satunya
  pihak yang menyimpan `GEMINI_API_KEY` (tidak pernah dikirim ke browser).

## 1. Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env, isi GEMINI_API_KEY dengan API key Anda dari aistudio.google.com/apikey

uvicorn app.main:app --reload --port 8000
```

Backend akan berjalan di `http://localhost:8000`.
Cek dokumentasi API otomatis di `http://localhost:8000/docs`.

## 2. Setup Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Default VITE_API_BASE_URL=http://localhost:8000 sudah sesuai untuk lokal

npm run dev
```

Frontend akan berjalan di `http://localhost:5173`.

## 3. Environment Variables — Keamanan API Key

- **JANGAN PERNAH** menaruh `GEMINI_API_KEY` di file frontend (`.env` di
  folder `frontend/`) karena semua env var dengan prefix `VITE_` akan
  ter-bundle ke kode JavaScript yang bisa dilihat siapa pun di browser.
- API key Gemini **hanya** disimpan di `backend/.env`, yang tidak pernah
  dikirim ke klien. Frontend hanya berkomunikasi dengan backend Anda sendiri.
- Tambahkan `.env` ke `.gitignore` di kedua folder agar tidak ter-commit ke
  repository.

## 4. Alur Data Singkat

1. User mengisi item Bahan Baku, Tenaga Kerja, Overhead, dan Jumlah Unit.
2. Frontend menghitung **Total HPP** dan **HPP per Unit** secara real-time
   (murni JavaScript, tanpa request ke server).
3. User mengisi margin keuntungan (%) dan deskripsi produk, lalu klik
   "Dapatkan Rekomendasi AI".
4. Frontend mengirim `{ hpp_per_unit, margin_percentage, product_description }`
   ke `POST /api/ai/sales-recommendation`.
5. Backend menyusun system instruction + response schema terstruktur,
   memanggil Gemini (`gemini-2.5-flash`) dengan structured output JSON,
   lalu mengembalikannya ke frontend sesuai skema `AIRecommendationResponse`.
6. Frontend menampilkan hasil di `AIRecommendationCard`.

## 5. Error Handling

- **Timeout**: `client.js` menggunakan `AbortController` dengan timeout 35
  detik khusus untuk request AI. Jika timeout, UI menampilkan pesan
  "Permintaan ke server melebihi batas waktu" beserta tombol "Coba Lagi".
- **Backend timeout ke Gemini API**: di-handle di `ai_service.py`
  (`TimeoutError`, `ClientError`, `APIError`) dan diteruskan sebagai HTTP 504/500 ke frontend.
- **Respons AI tidak valid/JSON gagal di-parse**: backend mengembalikan
  HTTP 502 dengan pesan yang jelas, bukan meneruskan raw text yang rusak.
- **Server backend mati / CORS / network error**: ditangani sebagai
  kegagalan koneksi generik di `client.js`.

## 6. Build untuk Production

```bash
# Frontend
cd frontend
npm run build
# Hasil build statis ada di frontend/dist — deploy ke Vercel/Netlify/dst

# Backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
# Untuk production sesungguhnya, gunakan Gunicorn + Uvicorn workers,
# dan update allow_origins di main.py sesuai domain frontend production Anda.
```
