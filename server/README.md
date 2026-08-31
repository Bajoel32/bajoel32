# Srikandi API

Backend untuk web Srikandi: form pemesanan, portal pesanan (login konsumen), dan
chatbot Konsultasi (RAG + Claude + function calling).

- **Stack:** Node + Express, penyimpanan JSON file (`data/*.json`), tanpa dependensi native.
- **Auth:** nomor HP + kata sandi (bcrypt), token sesi opaque (`Authorization: Bearer`).
- **Chatbot:** pakai Claude bila `ANTHROPIC_API_KEY` diisi; jika kosong, fallback kata kunci lokal.

## Menjalankan

```bash
cd server
cp .env.example .env      # lalu sesuaikan (ANTHROPIC_API_KEY, WHATSAPP_BASE, dst.)
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
| POST | `/api/consult` | opsional (Bearer) | `{messages}` → `{reply,sources?,functions?,escalate?,mode}`. Soft-gate: sesi login → Claude, anon → fallback kata kunci. Rate limit 8/mnt/IP + 40/hari/pengirim |
| GET  | `/api/gallery` | — | daftar item galeri (baca; tulis lewat `/api/admin/gallery`) |

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

Kontrak rinci: [CHATBOT.md](../docs/konsultasi-ai/CHATBOT.md),
[ORDERS-AUTH.md](../docs/konsultasi-ai/ORDERS-AUTH.md), checklist lengkap:
[BACKEND.md](../docs/konsultasi-ai/BACKEND.md), diagram alur & skema data:
[API-SCHEMA.md](../docs/konsultasi-ai/API-SCHEMA.md).

## Struktur

```
src/
  index.js            entry + wiring route & middleware (initDb -> ensureSeeded -> listen)
  config.js           baca .env
  db.js               penyimpanan koleksi: Postgres bila DATABASE_URL ada, else JSON file;
                      enkripsi at-rest untuk koleksi sensitif (lib/datacrypt.js)
  seed.js             isi data awal — CLI (npm run seed) + ensureSeeded() saat boot
  hashpw.js           npm run admin:hash -- "sandi"  -> hash bcrypt
  genkey.js           npm run gen:datakey            -> kunci enkripsi 32-byte base64
  rotatekey.js        npm run rotate:datakey         -> re-enkripsi koleksi dengan kunci baru
  middleware/
    security.js       helmet + HSTS, httpsRedirect, CORS allowlist (+ ADMIN_ORIGINS), rate limiter
    errors.js         404 + error handler (tanpa stack trace, hitung 5xx)
  routes/             bookings · auth · orders · consult · gallery · admin
  lib/
    validate.js       skema zod
    auth.js           sesi konsumen + requireAuth + optionalAuth
    adminAuth.js      sesi admin + requireAdmin
    metrics.js        counter in-memory untuk /api/admin/stats
    llmbudget.js      plafon panggilan Claude harian, persisten di koleksi `counters`
    guardrails.js     guard rail chatbot: screenInbound / sanitizeOutbound / redactPii
    datacrypt.js      AES-256-GCM enkripsi/dekripsi string + daftar koleksi sensitif
    retention.js      sweeper PII: buang field `ip` lama (DATA_RETENTION_DAYS)
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

Lihat [BACKEND.md](../docs/konsultasi-ai/BACKEND.md) §0 dan §7. Yang sudah beres:
enkripsi data at-rest (`DATA_ENCRYPTION_KEY`), verifikasi kepemilikan `cekStatusPesanan`
(nama + HP), HTTPS redirect + HSTS, guard rail chatbot, plafon biaya LLM harian.
Yang masih tersisa: OTP WhatsApp untuk login, token sesi jadi cookie `HttpOnly`,
rate limiter berbagi (mis. Redis) bila di-scale ke banyak instance.
