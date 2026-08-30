# Srikandi API

Backend untuk web Srikandi: form pemesanan, portal pesanan (login konsumen), dan
chatbot Konsultasi (RAG + Claude + function calling).

- **Stack:** Node + Express, penyimpanan JSON file (`data/*.json`), tanpa dependensi native.
- **Auth:** nomor HP + kata sandi (bcrypt), token sesi opaque (`Authorization: Bearer`).
- **Chatbot:** pakai Claude bila `ANTHROPIC_API_KEY` diisi; jika kosong, fallback kata kunci lokal.

## Menjalankan

```bash
cd server
cp .env.example .env      # lalu sesuaikan (WHATSAPP_BASE, ADMIN_TOKEN, dst.)
npm install
npm run seed             # isi data dummy: 6 layanan, 60 konsumen, 117 pesanan, galeri, KB
npm run dev              # http://localhost:8787  (atau: npm start)
```

Agar frontend memakainya, root project sudah punya `.env.local`:
```
VITE_ORDERS_API=http://localhost:8787/api
VITE_CONSULT_API=http://localhost:8787/api/consult
VITE_BOOKINGS_API=http://localhost:8787/api/bookings
```
Hapus `.env.local` untuk kembali ke mode dummy tanpa server.

Akun demo dicetak saat `npm run seed`. Contoh: HP `081269151610` · sandi `880575`.

## Endpoint

| Metode | Path | Auth | Fungsi |
|---|---|---|---|
| GET  | `/api/health` | — | cek hidup |
| POST | `/api/bookings` | — | kirim form pemesanan (honeypot `website`, rate limit 5/mnt) |
| POST | `/api/auth/login` | — | `{phone,password}` → `{token,customer}` (rate limit 10/10mnt) |
| POST | `/api/auth/logout` | Bearer | hapus sesi di server |
| GET  | `/api/my-orders` | Bearer | pesanan **milik pemegang token saja** |
| POST | `/api/consult` | — | `{messages}` → `{reply,sources?,functions?,escalate?}` (rate limit 20/mnt) |
| GET  | `/api/gallery` | — | daftar item galeri |
| POST | `/api/gallery` | Bearer = `ADMIN_TOKEN` (dibandingkan waktu-konstan) | tambah metadata item galeri |

### Admin hub — `/api/admin/*` (app terpisah `srikandi-admin`)

Auth: `POST /api/admin/login` `{username,password}` → `{token}` (Bearer). Semua
route lain butuh sesi admin. Aktif hanya bila `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH`
diisi (`npm run admin:hash -- "sandi"`).

| Metode | Path | Fungsi |
|---|---|---|
| POST | `/api/admin/login` · `/logout` | sesi admin (TTL `ADMIN_SESSION_TTL`, default 12 jam) |
| GET | `/api/admin/me` | info sesi |
| GET | `/api/admin/stats` | semua indikator monitoring (sistem, AI, konten, aktivitas, keamanan) |
| GET·POST·PUT·DELETE | `/api/admin/services` `/kb` `/gallery` `[/:id]` | CRUD konten |
| GET·PATCH | `/api/admin/bookings[/:ref]` | lihat + ubah status booking |
| GET·PATCH | `/api/admin/orders[/:id]` | lihat + ubah status/progres pesanan |
| GET | `/api/admin/customers` | daftar konsumen (tanpa hash) |
| GET·DELETE | `/api/admin/consult-logs` | transkrip ringkas chatbot (maks 200) |
| GET·PUT | `/api/admin/rag-config` | parameter retriever RAG (`topK`, `minScore`) |

Kontrak rinci: [../CHATBOT.md](../CHATBOT.md), [../ORDERS-AUTH.md](../ORDERS-AUTH.md),
checklist lengkap: [../BACKEND.md](../BACKEND.md), diagram alur & skema data:
[../API-SCHEMA.md](../API-SCHEMA.md).

## Struktur

```
src/
  index.js            entry + wiring route & middleware (initDb -> ensureSeeded -> listen)
  config.js           baca .env
  db.js               penyimpanan koleksi: Postgres bila DATABASE_URL ada, else JSON file
  seed.js             isi data awal — CLI (npm run seed) + ensureSeeded() saat boot
  hashpw.js           npm run admin:hash -- "sandi"  -> hash bcrypt
  middleware/
    security.js       helmet, CORS allowlist (+ ADMIN_ORIGINS), rate limiter (+ counter)
    errors.js         404 + error handler (tanpa stack trace, hitung 5xx)
  routes/             bookings · auth · orders · consult · gallery · admin
  lib/
    validate.js       skema zod
    auth.js           sesi konsumen + requireAuth
    adminAuth.js      sesi admin + requireAdmin
    metrics.js        counter in-memory untuk /api/admin/stats
    rag.js            retriever kata kunci; topK/minScore dari koleksi settings
    tools.js          infoLayanan · cekStatusPesanan · rekomendasiGaleri · eskalasiKeAdmin
    claude.js         loop tool Claude + fallback kata kunci
    phone.js          normalisasi nomor HP
data/                 *.json (di-gitignore; hanya mode JSON, dibuat oleh seed)
```

### Database

- **Tanpa `DATABASE_URL`** → file JSON di `data/` (dev lokal, seperti sebelumnya).
- **Dengan `DATABASE_URL`** → Postgres (mis. Neon). Tiap koleksi disimpan sebagai
  satu baris blob `jsonb` di tabel `kv`; dimuat ke memori saat boot, di-flush per
  tulis. Cocok untuk skala toko (ratusan baris). Wajib dipakai di Render (disk free
  tier ephemeral). Saat koleksi masih kosong, `ensureSeeded()` mengisi data awal
  otomatis pada boot pertama.

## Sebelum produksi

Lihat [../BACKEND.md](../BACKEND.md) §0 dan §7. Yang paling penting:
ganti JSON store → DB sungguhan, OTP WhatsApp untuk login, token sesi jadi cookie
`HttpOnly`, HTTPS/HSTS di depan, dan verifikasi kepemilikan pada `cekStatusPesanan`.
