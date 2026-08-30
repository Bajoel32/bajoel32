# Checklist Backend — Srikandi

Backend **sudah dibuat** di [`server/`](server/) (Node + Express, penyimpanan JSON file).
Cara jalan: `cd server && cp .env.example .env && npm install && npm run seed && npm run dev`
→ `http://localhost:8787`. Frontend memakainya lewat [`.env.local`](.env.local) di root.

**Legenda:** `[x]` selesai di `server/` · `[~]` selesai tapi versi demo (perlu di-*upgrade* untuk produksi) · `[ ]` belum.

**Dokumen rinci:**
[server/README.md](server/README.md) · [ORDERS-AUTH.md](ORDERS-AUTH.md) ·
[CHATBOT.md](CHATBOT.md) · [SECURITY.md](SECURITY.md) ·
[API-SCHEMA.md](API-SCHEMA.md) (diagram alur & skema data)

---

## 0. Fondasi

- [x] Stack server — Node + Express (`server/src/index.js`).
- [x] **CORS** allowlist dari env `CORS_ORIGINS` (bukan `*`) — `server/src/middleware/security.js`.
- [x] Security headers tingkat aplikasi — `helmet`.
- [x] Rate limiting global (120/mnt) + per-endpoint (login 10/10mnt, booking 5/mnt, consult 20/mnt).
- [x] Batas ukuran body (`express.json({ limit: '32kb' })`).
- [x] Error handler tidak membocorkan stack trace (`server/src/middleware/errors.js`).
- [x] Rahasia di `server/.env` (di-`.gitignore`), contoh di `.env.example`.
- [~] "DB" — penyimpanan JSON file (`server/src/db.js`) dengan tabel `services/customers/orders/
      bookings/gallery/kb/sessions`. **Ganti dengan Postgres/MySQL** untuk produksi (antarmuka `db` sengaja kecil agar mudah ditukar).
- [ ] HTTPS + HSTS + header keamanan di host — pindahkan [`public/_headers`](public/_headers) ke konfigurasi host (SECURITY.md).
- [ ] CI: `npm audit` / Dependabot untuk `server/`.

## 1. Data

- [x] `seed.js` mengisi: 6 layanan, 60 konsumen (sandi di-hash), 117 pesanan, 8 galeri, 12 KB chunk.
- [ ] Ganti data dummy dengan data toko asli (impor dari POS/spreadsheet).
- [ ] Galeri: DB terpisah + alur unggah file sesungguhnya (§5).

## 2. Form Pemesanan — `POST /api/bookings` · `server/src/routes/bookings.js`

- [x] Validasi ulang skema ketat (`zod`): `selectedService` harus id layanan yang ada,
      `quantity` 1–100, `estimatedDate` tidak di masa lalu, panjang field dibatasi.
- [x] Honeypot `website` terisi → diterima diam-diam, tidak disimpan.
- [x] Rate limit 5/menit/IP.
- [x] Simpan booking + `console.log` ref.
- [x] Frontend `BookingForm.jsx` mem-POST ke `VITE_BOOKINGS_API`.
- [~] Anti-CSRF — sekarang hanya bergantung CORS allowlist + `Content-Type: application/json`.
      Tambah token CSRF / cek `Origin` bila nanti pakai cookie sesi.
- [ ] Notifikasi ke admin (email / WhatsApp) — sekarang baru `console.log`.

## 3. Portal Pesanan — `server/src/routes/auth.js`, `orders.js`

### `POST /api/auth/login`  `{phone,password}` → `{token,customer}`
- [x] Kata sandi di-hash **bcrypt** (cost 10); tidak ada plaintext tersimpan.
- [x] Rate limit login 10 percobaan / 10 menit / IP.
- [x] Pesan error seragam ("Nomor HP atau kata sandi salah") + hash-compare dummy saat nomor tak terdaftar (samakan timing).
- [~] Token sesi = string acak 32 byte di tabel `sessions` (mendukung logout server-side), dikirim
      sebagai `Authorization: Bearer`. **Produksi:** cookie `HttpOnly; Secure; SameSite=Lax`.
- [ ] **OTP WhatsApp/SMS** sebagai ganti kata sandi (lebih aman untuk kode 6 digit) — belum.

### `GET /api/my-orders`  (Bearer)
- [x] Query difilter `customerId === session.customerId`; `customerId` tidak pernah dari klien.
- [x] Field pesanan di-*whitelist* (tanpa `customerName`/`ip`).
- [x] Uji akses silang: token konsumen A → hanya pesanannya (diverifikasi).
- [x] `401` saat token invalid/kedaluwarsa → frontend minta login ulang.
- [x] `POST /api/auth/logout` menghapus sesi di server (token lama langsung 401).
- [x] Sweeper sesi kedaluwarsa tiap 15 menit.
- [ ] Impor ± 60 konsumen asli + alur penerbitan kode akses / OTP.

## 4. Konsultasi — `server/src/routes/consult.js`, `lib/claude.js`

### `POST /api/consult`  `{messages}` → `{reply,sources?,functions?,escalate?}`
- [x] Validasi `messages` (peran, panjang ≤4000, jumlah ≤30) + rate limit 20/mnt.
- [x] Panggil **Claude** via `@anthropic-ai/sdk` **di server** bila `ANTHROPIC_API_KEY` diisi;
      API key tidak pernah ke browser.
- [x] 4 tool terimplementasi: `infoLayanan`, `cekStatusPesanan`, `rekomendasiGaleri`, `eskalasiKeAdmin`
      (`server/src/lib/tools.js`) + loop tool (maks 4 hop).
- [x] **RAG** — retriever kata kunci atas `kb.json` (`server/src/lib/rag.js`); potongan yang dipakai
      dikembalikan di `sources`.
- [x] `eskalasiKeAdmin` → diisi ke field **`escalate`** (bukan `functions`); UI menampilkan tombol
      "Chat Admin via WhatsApp" dengan prefix pesan.
- [x] **Fallback** kata kunci lokal saat `ANTHROPIC_API_KEY` kosong (server tetap berfungsi untuk demo).
- [x] System prompt: jawab hanya dari konteks/tool, jangan mengarang harga/tanggal, jangan tampilkan
      data pelanggan lain, eskalasi untuk komplain/sengketa/teknis/di luar cakupan.
- [~] **`cekStatusPesanan` belum verifikasi kepemilikan** — terbuka untuk data dummy.
      Produksi: minta verifikasi (nama + HP atau sesi login) sebelum buka detail.
- [~] Non-streaming (`messages.create`). CHATBOT.md menyarankan streaming untuk produksi.
- [ ] RAG berbasis embedding + vector DB (sekarang bag-of-words) — bila korpus membesar.

## 5. Galeri — `server/src/routes/gallery.js`

- [x] `GET /api/gallery` — daftar item. Sudah disambungkan ke frontend lewat
      `VITE_GALLERY_API` → [`src/config/gallery.js`](src/config/gallery.js) →
      `GalleryPage.jsx` (fallback ke `siteConfig.galleries` bila env kosong).
- [x] `POST /api/gallery` — butuh `Authorization: Bearer <ADMIN_TOKEN>` (dibandingkan waktu-konstan
      via `crypto.timingSafeEqual`, lihat [SECURITY.md](SECURITY.md) §2), validasi `zod`.
- [x] Peringatan di log start server bila `NODE_ENV=production` tapi `ADMIN_TOKEN` masih kosong/nilai contoh.
- [ ] Unggah **file** sesungguhnya: batasi MIME (`image/jpeg|png`) + ukuran, simpan ke object
      storage, nama file digenerate server. Sekarang hanya menerima URL gambar (metadata).
- [ ] Auth admin sungguhan (sekarang: satu token statis dari env).

## 6. Variabel environment

| Var | Sisi | File | Contoh |
|---|---|---|---|
| `VITE_ORDERS_API` | frontend | `.env.local` | `http://localhost:8787/api` |
| `VITE_CONSULT_API` | frontend | `.env.local` | `http://localhost:8787/api/consult` |
| `VITE_BOOKINGS_API` | frontend | `.env.local` | `http://localhost:8787/api/bookings` |
| `PORT`, `NODE_ENV`, `CORS_ORIGINS`, `SESSION_TTL` | server | `server/.env` | lihat `.env.example` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | server | `server/.env` | `sk-ant-...` / `claude-opus-5` |
| `WHATSAPP_BASE` | server | `server/.env` | `https://wa.me/6281234567890` |
| `ADMIN_TOKEN` | server | `server/.env` | ganti di produksi |

Tanpa `VITE_*` (hapus `.env.local`) frontend kembali ke data dummy.
Tanpa `ANTHROPIC_API_KEY` chatbot pakai fallback kata kunci.

## 7. Sebelum produksi (belum)

- [ ] JSON store → DB sungguhan (Postgres) + migrasi.
- [ ] Login: OTP WhatsApp + token sesi jadi cookie `HttpOnly; Secure; SameSite`.
- [ ] `cekStatusPesanan`: verifikasi kepemilikan.
- [ ] HTTPS/HSTS + security headers di host; cek <https://securityheaders.com>.
- [ ] Notifikasi admin untuk booking baru (email/WA).
- [ ] Unggah galeri ke object storage dengan batas MIME/ukuran.
- [ ] CI `npm audit` + uji: spam booking, brute-force login, akses silang pesanan,
      prompt injection & kebocoran data di chatbot.
- [ ] Ganti data dummy dengan data toko asli.
