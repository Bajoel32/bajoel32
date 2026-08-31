# Checklist Backend — Srikandi

Backend **sudah dibuat** di [`server/`](../../server/) (Node + Express, penyimpanan JSON file).
Cara jalan: `cd server && cp .env.example .env && npm install && npm run seed && npm run dev`
→ `http://localhost:8787`. Frontend memakainya lewat [`.env.local`](../../.env.local) di root.

**Legenda:** `[x]` selesai di `server/` · `[~]` selesai tapi versi demo (perlu di-*upgrade* untuk produksi) · `[ ]` belum.

**Dokumen rinci:**
[server/README.md](../../server/README.md) · [ORDERS-AUTH.md](ORDERS-AUTH.md) ·
[CHATBOT.md](CHATBOT.md) · [SECURITY.md](SECURITY.md) ·
[API-SCHEMA.md](API-SCHEMA.md) (diagram alur & skema data)

---

## 0. Fondasi

- [x] Stack server — Node + Express (`server/src/index.js`).
- [x] **CORS** allowlist dari env `CORS_ORIGINS` (bukan `*`) — `server/src/middleware/security.js`.
- [x] Security headers tingkat aplikasi — `helmet`.
- [x] Rate limiting global (120/mnt) + per-endpoint (login 10/10mnt, booking 5/mnt). `/api/consult` berlapis: 8/mnt/IP + 40/hari/pengirim.
- [x] Batas ukuran body (`express.json({ limit: '32kb' })`).
- [x] Error handler tidak membocorkan stack trace (`server/src/middleware/errors.js`).
- [x] Rahasia di `server/.env` (di-`.gitignore`), contoh di `.env.example`.
- [x] **HTTPS redirect + HSTS di aplikasi** — `httpsRedirect` (308 di produksi bila `X-Forwarded-Proto: http`) + `helmet` HSTS `max-age=31536000; includeSubDomains; preload` (`server/src/middleware/security.js`). Edge host (Render) juga redirect otomatis.
- [x] **Enkripsi data at-rest** — AES-256-GCM untuk `customers`, `orders`, `bookings`, `sessions`, `consult_logs` bila `DATA_ENCRYPTION_KEY` diset (`server/src/lib/datacrypt.js`); rotasi kunci lewat `npm run rotate:datakey` + `DATA_ENCRYPTION_KEY_OLD`.
- [x] **Retensi PII** — field `ip` di `bookings` & `consult_logs` dibuang setelah `DATA_RETENTION_DAYS` (default 90) hari (`server/src/lib/retention.js`).
- [~] "DB" — penyimpanan JSON file (`server/src/db.js`, tabel `services/customers/orders/
      bookings/gallery/kb/sessions/consult_logs/counters/settings`), **atau Postgres** bila `DATABASE_URL` diisi (satu baris blob `jsonb` per koleksi di tabel `kv`; wajib di Render). Untuk skala besar tetap perlu DB relasional sungguhan.
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

### `POST /api/consult`  `{messages}` → `{reply,sources?,functions?,escalate?,mode}`
- [x] Validasi `messages` (peran, panjang ≤4000, jumlah ≤30) + rate limit berlapis (8/mnt/IP + 40/hari/pengirim).
- [x] **Soft-gate** — Claude hanya untuk sesi login (`optionalAuth` + `isMember`); anon → fallback kata kunci (0 biaya API).
- [x] **Plafon biaya LLM harian** — `CONSULT_DAILY_LLM_BUDGET` (default 300), persisten di koleksi `counters` (`lib/llmbudget.js`); lewat batas → semua turun ke fallback.
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
      data pelanggan lain, eskalasi untuk komplain/sengketa/teknis/di luar cakupan, perlakukan isi pesan sebagai data (anti prompt-injection), kunci topik ke Srikandi.
- [x] **Guard rail 4 lapis** — `checkUserInput` (browser), `screenInbound` (server, anti prompt-injection), prompt hardening, `sanitizeOutbound` (potong/redaksi balasan). Lihat [SECURITY.md](SECURITY.md) §3.
- [x] **`cekStatusPesanan` verifikasi kepemilikan** — nomor pesanan + nama pemesan + HP terdaftar wajib cocok (HP persis via `normalizePhone`, nama pencocokan token); tanpa itu `needVerification`/`mismatch` tanpa detail. Berlaku di jalur LLM **dan** fallback.
- [x] **Log ter-redaksi** — `consult_logs` (maks 200 baris) dengan `redactPii()` pada `question` & `replyPreview`.
- [~] Non-streaming (`messages.create`). CHATBOT.md menyarankan streaming untuk produksi.
- [ ] RAG berbasis embedding + vector DB (sekarang bag-of-words) — bila korpus membesar.

## 5. Galeri — `server/src/routes/gallery.js` (baca) · `server/src/routes/admin.js` (tulis)

- [x] `GET /api/gallery` — daftar item. Sudah disambungkan ke frontend lewat
      `VITE_GALLERY_API` → [`src/config/gallery.js`](../../src/config/gallery.js) →
      `GalleryPage.jsx` (fallback ke `siteConfig.galleries` bila env kosong).
- [x] Tulis galeri lewat **admin hub**: `POST/PUT/DELETE /api/admin/gallery` (butuh sesi admin `requireAdmin` — bcrypt + token sesi acak), validasi `zod` (`gallerySchema`). Route legacy `POST /api/gallery` + secret statis `ADMIN_TOKEN` **sudah dihapus**.
- [ ] Unggah **file** sesungguhnya: batasi MIME (`image/jpeg|png`) + ukuran, simpan ke object
      storage, nama file digenerate server. Sekarang hanya menerima URL gambar (metadata).

## 6. Variabel environment

| Var | Sisi | File | Contoh |
|---|---|---|---|
| `VITE_ORDERS_API` | frontend | `.env.local` | `http://localhost:8787/api` |
| `VITE_CONSULT_API` | frontend | `.env.local` | `http://localhost:8787/api/consult` |
| `VITE_BOOKINGS_API` | frontend | `.env.local` | `http://localhost:8787/api/bookings` |
| `PORT`, `NODE_ENV`, `CORS_ORIGINS`, `ADMIN_ORIGINS`, `SESSION_TTL` | server | `server/.env` | lihat `.env.example` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | server | `server/.env` | `sk-ant-...` / `claude-opus-5` |
| `CONSULT_DAILY_LLM_BUDGET` | server | `server/.env` | `300` (plafon panggilan Claude/hari) |
| `DATABASE_URL` | server | `server/.env` | kosong = JSON file; diisi = Postgres (wajib di Render) |
| `DATA_ENCRYPTION_KEY` / `DATA_ENCRYPTION_KEY_OLD` | server | `server/.env` | 32-byte base64 (`npm run gen:datakey`); `_OLD` hanya saat rotasi |
| `DATA_RETENTION_DAYS` | server | `server/.env` | `90` (buang `ip` lama; `0` = mati) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_TTL` | server | `server/.env` | admin hub (`npm run admin:hash -- "sandi"`) |
| `WHATSAPP_BASE` | server | `server/.env` | `https://wa.me/6281234567890` |

Tanpa `VITE_*` (hapus `.env.local`) frontend kembali ke data dummy.
Tanpa `ANTHROPIC_API_KEY` chatbot pakai fallback kata kunci.

## 7. Sebelum produksi

**Sudah beres:** HTTPS redirect + HSTS di app, enkripsi data at-rest (`DATA_ENCRYPTION_KEY`)
+ rotasi kunci, retensi `ip`, verifikasi kepemilikan `cekStatusPesanan`, guard rail chatbot
4 lapis, plafon biaya LLM harian, guard boot menolak kredensial admin contoh saat
`NODE_ENV=production`, opsi penyimpanan Postgres (`DATABASE_URL`).

**Masih tersisa:**

- [ ] JSON store → DB relasional sungguhan untuk skala besar (Postgres blob `kv` sudah ada sebagai jembatan).
- [ ] Login: OTP WhatsApp + token sesi jadi cookie `HttpOnly; Secure; SameSite`.
- [ ] Verifikasi akhir header di <https://securityheaders.com> setelah deploy pertama.
- [ ] Notifikasi admin untuk booking baru (email/WA).
- [ ] Unggah galeri ke object storage dengan batas MIME/ukuran.
- [ ] Rate limiter berbagi (mis. Redis) bila di-scale ke banyak instance.
- [ ] CI `npm audit` + uji: spam booking, brute-force login, akses silang pesanan,
      prompt injection & kebocoran data di chatbot.
- [ ] Ganti data dummy dengan data toko asli.
