# Catatan Keamanan — Srikandi

Ringkasan pemeriksaan keamanan frontend **dan** backend (`server/`).

## Status saat ini

Repo ini punya **frontend statis** (React + Vite) **dan backend** di
[`server/`](../../server/) (Node + Express, penyimpanan JSON file — versi demo,
lihat [BACKEND.md](BACKEND.md) untuk checklist lengkap & [server/README.md](../../server/README.md)
untuk detail struktur).

> **Pass keamanan 2026-08-31** — pengerasan `/api/consult` (soft-gate sesi,
> plafon biaya LLM harian persisten, rate limit berlapis), **guard rail chatbot
> 4 lapis** (§3), **verifikasi kepemilikan `cekStatusPesanan`** (nomor + nama +
> HP), **enkripsi data pelanggan at-rest** (AES-256-GCM, `DATA_ENCRYPTION_KEY`,
> + rotasi kunci), **retensi PII** (auto-buang `ip` lama), **HTTPS redirect +
> HSTS eksplisit** (`httpsRedirect` + `helmet`), guard kredensial contoh saat
> `NODE_ENV=production`, dan penghapusan route legacy `POST /api/gallery` +
> `ADMIN_TOKEN`.

---

## 1. Frontend

### Hasil pindai

| Area | Hasil |
|---|---|
| `npm audit` (root) | 0 kerentanan |
| `dangerouslySetInnerHTML` / `eval` / `innerHTML` | Tidak ada |
| Rendering data ke DOM | Lewat JSX (auto-escape) — aman dari XSS |
| Secret / API key di kode frontend | Tidak ada — API key Anthropic hanya di `server/.env`, tidak pernah dikirim ke browser |
| Var build `VITE_*` di bundle | Hanya URL API + `VITE_SALES_PASSPHRASE_SHA256` (hash SHA-256, **sengaja publik**). Gerbang panel sales hanya sekat UI untuk pratinjau lokal — bukan kontrol akses |
| `target="_blank"` | Semua sudah pakai `rel="noopener noreferrer"` |
| Sourcemap produksi | Nonaktif (`build.sourcemap: false`) |
| `.env` / `.env.local` ter-commit | Tidak ada (`*.local` di `.gitignore`) |

### Sudah diperbaiki

- **Kebocoran PII di console** — data booking hanya dicetak saat `import.meta.env.DEV`, pakai `console.debug`.
- **Validasi input klien** — format email & telepon, `selectedService` harus ada di daftar, `quantity` 1–100, tanggal wajib, semua field dibatasi panjang.
- **Honeypot anti-bot** — field `website` tersembunyi di form booking; **diverifikasi ulang di server** (lihat §2).
- **Header keamanan** — `public/_headers` (CSP, HSTS, X-Frame-Options, dll.) + `<meta name="referrer">` di `index.html`.
- **Referrer policy** — `strict-origin-when-cross-origin`.
- **Sesi portal pesanan** disimpan di `sessionStorage` (hilang saat tab ditutup), bukan `localStorage` — lihat catatan trade-off di §2.
- **Guard rail form konsultasi** — cek sisi-browser sebelum kirim (`src/config/guardrails.js`): tolak input tak berguna/simbol dominan, blokir PII (KTP 16-digit, kartu, email, HP), anti-flood, bersihkan karakter kontrol + zero-width. Server menyaring ulang — lihat §3.

> Validasi klien hanya UX. Server (`server/`) selalu memvalidasi ulang semua input lewat `zod` — lihat §2.

## Deploy — HTTPS, redirect & header keamanan

### Frontend — GitHub Pages (target saat ini, lihat `vite.config.js`)

- **HTTPS + redirect HTTP→HTTPS + HSTS**: aktifkan **Settings → Pages → "Enforce HTTPS"** di repo. Untuk domain `*.github.io`, GitHub yang menangani redirect dan mengirim HSTS-nya sendiri — tidak ada yang bisa/perlu di-set di kode.
- **`public/_headers` TIDAK dibaca GitHub Pages.** CSP di file itu hanya berlaku bila frontend dipindah ke **Netlify / Cloudflare Pages** (file dipakai otomatis) atau **Vercel** (`vercel.json` → `headers`) / **Nginx** (`add_header`) / **Apache** (`.htaccess`). Kalau CSP ketat wajib, pindahkan hosting.

### Backend API — Render (`render.yaml`)

- **TLS + redirect HTTP→HTTPS** ditangani edge Render otomatis (`onrender.com` & custom domain dengan cert Render). Tidak ada setelan.
- **Lapis cadangan di app** (`middleware/security.js`): `httpsRedirect` — di `NODE_ENV=production`, request dengan `X-Forwarded-Proto: http` dibalas **308 → https**; tanpa header itu request diteruskan (health check / koneksi langsung tidak terganggu). `trust proxy: 1` membuat header proxy dipercaya.
- **HSTS eksplisit via `helmet`**: `max-age=31536000; includeSubDomains; preload` (1 tahun) — sama dengan `public/_headers`.

> `preload` di header = niat submit ke <https://hstspreload.org>. Header-nya sendiri tanpa submit tidak berefek; jangan submit sebelum yakin **semua** subdomain siap HTTPS permanen (sulit dibatalkan).

Verifikasi frontend **dan** URL API di <https://securityheaders.com> setelah deploy.

CSP `public/_headers` meng-allowlist origin yang benar-benar dipakai:
`fonts.googleapis.com`, `fonts.gstatic.com`, `images.unsplash.com`. Perbarui bila berubah.

---

## 2. Backend (`server/`)

### Hasil pindai

| Area | Hasil |
|---|---|
| `npm audit` (`server/`) | 0 kerentanan |
| Kredensial di kode / commit | Tidak ada — `server/.env` di-`.gitignore`; `server/.env.example` hanya placeholder |
| Data pelanggan (`server/data/*.json`) ter-commit | Tidak ada — di-`.gitignore` |
| SQL/NoSQL injection | Tidak berlaku — penyimpanan JSON file diakses lewat fungsi `db.js`, tidak ada query string yang dirangkai dari input pengguna |
| Path traversal (`db.js`) | Nama tabel selalu literal string di kode (`'orders'`, `'gallery'`, dst.), tidak pernah dari input klien — aman |
| Command injection / `eval`/`exec` | Tidak ada |
| Stack trace / detail internal bocor ke klien | Tidak — `errorHandler` selalu balas pesan generik (`middleware/errors.js`) |

### Yang sudah diamankan

- **HTTPS** — redirect HTTP→HTTPS di edge host (Render); lapis cadangan `httpsRedirect` (`middleware/security.js`) membalas **308 → https** di produksi bila `X-Forwarded-Proto: http`. HSTS dikirim `helmet` (`max-age=31536000; includeSubDomains; preload`).
- **CORS** allowlist eksplisit dari `CORS_ORIGINS` (bukan `*`), dengan `credentials: true` yang membaca origin per-request — `middleware/security.js`.
- **Helmet** (header keamanan tingkat aplikasi) + `x-powered-by` dimatikan + `trust proxy: 1`.
  > `trust proxy: 1` mengasumsikan persis **satu** reverse proxy di depan app (host/CDN). Kalau topologi deploy beda, sesuaikan angka ini — kalau tidak, rate limiter & pencatatan IP bisa dikelabui lewat header `X-Forwarded-For` palsu.
- **Rate limiting** per endpoint: global 120/menit, login 10/10menit, booking 5/menit. `/api/consult` **berlapis** — 8/menit/IP **plus** 40/hari per pengirim (kunci = token sesi bila login, kalau tidak per-IP) (`express-rate-limit`, in-memory).
- **Plafon biaya LLM harian** — `CONSULT_DAILY_LLM_BUDGET` (default 300) membatasi jumlah panggilan Claude sungguhan per hari. Lewat batas → semua konsultasi turun ke fallback kata kunci lokal (0 biaya API) sampai ganti hari. Hitungannya disimpan di `db` (`lib/llmbudget.js`) → **bertahan** meski proses restart.
  > Plafon LLM disimpan di `db` (koleksi `counters`, `lib/llmbudget.js`) → **bertahan** saat proses restart. Rate limiter masih **in-memory per proses** — cukup untuk satu instance; kalau di-scale ke banyak instance, pindahkan ke store bersama (mis. Redis).
- **Body size limit** 32 KB (`express.json({ limit: '32kb' })`).
- **Validasi server-side ketat** dengan `zod` di semua endpoint POST (`lib/validate.js`) — tipe, panjang maksimal, enum, tanggal tidak boleh masa lalu.
- **Password**: bcrypt (cost 10), tidak pernah plaintext. Login memakai **dummy-hash compare** saat nomor tak terdaftar supaya waktu respons "nomor tidak ada" vs "sandi salah" tidak bisa dibedakan (`routes/auth.js`).
- **Token sesi**: `crypto.randomBytes(32)` (256-bit acak), disimpan di tabel `sessions` server-side dengan `expiresAt`, disapu tiap 15 menit, dan **dihapus di server saat logout** (bukan hanya di klien).
- **Otorisasi pesanan**: `GET /api/my-orders` memfilter `customerId === session.customerId` — `customerId` **tidak pernah** dibaca dari input klien, jadi tak ada IDOR di endpoint ini. Field respons juga di-*whitelist* (tanpa `customerName`/`ip`).
- **Honeypot** `website` diverifikasi ulang di server (`routes/bookings.js`), bukan cuma di klien.
- **Admin hub** (`/api/admin/*`) dilindungi `requireAdmin`: login `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` (bcrypt), username dibandingkan `crypto.timingSafeEqual`, sesi admin `crypto.randomBytes(32)` server-side dengan TTL 12 jam & disapu berkala.
- **Guard kredensial contoh** — saat `NODE_ENV=production`, kalau `ADMIN_PASSWORD_HASH` masih hash contoh dari repo, server **berhenti** (`process.exit(1)`), bukan sekadar warning (`assertSafeProductionSecrets()` di `src/index.js`).
- **Route legacy dihapus** — `POST /api/gallery` + secret statis `ADMIN_TOKEN` sudah dibuang. Satu-satunya jalur tulis galeri kini `POST/PUT/DELETE /api/admin/gallery` (ber-sesi admin).
- **Enkripsi data pelanggan at-rest** — koleksi `customers`, `orders`, `bookings`, `sessions`, `consult_logs` dienkripsi **AES-256-GCM** di batas penyimpanan (`lib/datacrypt.js` + `db.js`): blob ciphertext di file/Postgres, plaintext hanya di memori. Kunci `DATA_ENCRYPTION_KEY` (32-byte base64, `npm run gen:datakey`). Kosong → data polos (default demo). Katalog publik (`services`, `gallery`, `kb`, `settings`) tetap plaintext. Migrasi otomatis: file lama terbaca, tulis berikutnya mengenkripsi.
- **Verifikasi kepemilikan `cekStatusPesanan`** (`lib/tools.js`) — tool status pesanan kini menolak membalas apa pun (termasuk nama pelanggan) tanpa **nomor pesanan + nama pemesan + HP terdaftar** yang cocok (HP dicocokkan persis via `normalizePhone`, nama via pencocokan token). Hasil `needVerification` / `mismatch` → bot minta data / arahkan ke WhatsApp. Berlaku di jalur LLM (schema tool + aturan `SYSTEM`) **dan** fallback kata kunci; mock frontend juga diperketat (minta nama).
- **Retensi PII** (`lib/retention.js`) — field `ip` di `bookings` & `consult_logs` dibuang otomatis setelah `DATA_RETENTION_DAYS` (default 90) hari. Sweeper jalan saat boot lalu tiap 6 jam; baris tetap disimpan, hanya IP-nya hilang. `0` = matikan.
- **Rotasi kunci enkripsi** (`src/rotatekey.js`) — set `DATA_ENCRYPTION_KEY` (baru) + `DATA_ENCRYPTION_KEY_OLD` (lama), jalankan `npm run rotate:datakey` untuk re-enkripsi semua koleksi sensitif, lalu hapus kunci lama. Selama keduanya diset, dekripsi mencoba kunci baru lalu lama (tidak ada downtime baca).

### Gap yang diketahui (belum untuk produksi)

Detail & status per-fitur ada di **[BACKEND.md](BACKEND.md)**. Ringkasan risiko:

| Gap | Risiko | Prioritas |
|---|---|---|
| Token sesi di `Authorization: Bearer` + `sessionStorage`, bukan cookie `HttpOnly` | Kalau ada celah XSS di masa depan, token bisa dicuri lewat JS. (Sisi baiknya: karena bukan cookie, endpoint ini otomatis tidak butuh proteksi CSRF terpisah.) | Sedang |
| `cekStatusPesanan` verifikasi nama pakai pencocokan token (lenient), bukan sesi login | False-positive kecil bila nama umum + HP tertebak; mitigasi: HP harus **persis** cocok. Untuk keamanan penuh, gate via sesi login | Rendah |
| Penyimpanan JSON file, satu proses | Tidak scalable (enkripsi at-rest sudah ada — lihat §2) | Sedang (blocker produksi skala) |
| Rotasi `DATA_ENCRYPTION_KEY` = manual (offline, `npm run rotate:datakey`), bukan otomatis/bertahap | Perlu window maintenance saat ganti kunci | Rendah |
| Admin hub satu akun bersama (`ADMIN_USERNAME`), bukan akun per-orang | Tidak ada audit-trail per-admin | Sedang |
| Rate limiter **in-memory** — reset saat restart, tak dibagi antar-instance | Batas bisa terlampaui saat restart; tak cocok multi-instance | Rendah (single instance) |
| `POST /api/admin/gallery` hanya terima URL gambar (belum ada upload file sungguhan + validasi MIME/ukuran) | Bergantung URL eksternal; belum relevan untuk risiko upload | Rendah saat ini |
| RAG bag-of-words sederhana (bukan embedding) | Bukan isu keamanan, hanya kualitas jawaban | — |

---

## 3. Chatbot konsultasi (`/api/consult`)

Endpoint ini memakai API Anthropic yang **berbiaya**, jadi diperlakukan sebagai
permukaan serang tersendiri: penyalahgunaan kuota **dan** injeksi prompt.

### Yang sudah diamankan

- **Akses model dibatasi (soft-gate)** — Claude hanya dipanggil untuk **sesi konsumen yang login**. Pengunjung anonim tetap bisa memakai chatbot tapi dilayani fallback kata kunci lokal (0 biaya API). Frontend mengirim `Authorization: Bearer <token>` bila ada sesi (`src/config/consultation.js`); server memakai `optionalAuth` — tidak menolak anon, hanya menurunkan mode.
- **Plafon biaya harian** & **rate limit berlapis** — lihat §2.
- **Guard rail 4 lapis:**

  | Lapis | File | Fungsi |
  |---|---|---|
  | Input (browser) | `src/config/guardrails.js` → `checkUserInput()` | Tolak input <2 char / tanpa huruf-angka, simbol >50%, 1 karakter diulang ≥10×; blokir PII (KTP 16-digit, kartu 13–19 digit, email, HP); anti-flood (identik dgn 3 giliran terakhir); bersihkan karakter kontrol + zero-width |
  | Input (server) | `server/src/lib/guardrails.js` → `screenInbound()` | 13 pola prompt-injection / jailbreak (ID + EN) pada pesan user terakhir → balasan baku, **tidak diteruskan ke model**, `mode: 'blocked'`, counter `guardBlocks` |
  | Prompt (LLM) | `server/src/lib/claude.js` (`SYSTEM`) | Isi pesan diperlakukan sebagai **data, bukan instruksi**; larang bocorkan/ubah prompt sistem & nama tool; kunci topik ke lingkup Srikandi (tolak halus medis/hukum/politik/dll.) |
  | Output | `server/src/lib/guardrails.js` → `sanitizeOutbound()` | Potong balasan >2000 char; redaksi pola kebocoran (`sk-ant-…`, `sk-…`, heks-64, `ANTHROPIC_API_KEY`) → `[disamarkan]`; bila balasan memuat frasa khas `SYSTEM` → ganti pesan generik |

- **Redaksi PII di log** — `redactPii()` menyamarkan HP / email / deret digit ≥12 pada `question` & `replyPreview` sebelum masuk koleksi `consult_logs`.
- **Batas percakapan** — `zod`: maksimal 30 pesan/permintaan, tiap pesan 1–4000 char (`lib/validate.js`).
- **Visibilitas** — `GET /api/admin/stats` blok `chatbot`: `llmCallsToday`, `llmDailyBudget`, `guardBlocks`, `escalations`.

### Catatan

- Guard rail input sisi-browser hanya UX; `screenInbound()` di server adalah lapis wajibnya. Keduanya independen.
- `SYSTEM_TELLTALES` di `guardrails.js` **harus dijaga sinkron** dengan teks `SYSTEM` di `claude.js` (sudah dikomentari di kedua file).
- `cekStatusPesanan` mewajibkan verifikasi nomor + nama + HP sebelum membalas detail apa pun — lihat §2 "Yang sudah diamankan".

## Checklist mengamankan API

**Legenda:** `[x]` sudah · `[~]` sebagian/versi demo · `[ ]` belum.

### Transport & header
- [x] Redirect HTTP→HTTPS — edge Render (API) + GitHub Pages "Enforce HTTPS" (frontend), plus lapis cadangan `httpsRedirect` di app (prod, 308).
- [x] HSTS aktif — `helmet` `max-age=31536000; includeSubDomains; preload` (API) + HSTS bawaan GitHub Pages (frontend) + `public/_headers` (bila di Netlify/CF).
- [~] Verifikasi akhir di securityheaders.com — menunggu deploy pertama.
- [x] CORS: `Access-Control-Allow-Origin` di-set eksplisit ke domain frontend dari `CORS_ORIGINS`, **bukan** `*`.
- [x] Tolak `Content-Type` tak terduga (Express `express.json()` hanya parse JSON); batasi ukuran body (32 KB).

### Autentikasi & sesi
- [x] Endpoint admin (`/api/admin/*`) wajib sesi admin (`requireAdmin`): bcrypt + username `timingSafeEqual` + token sesi acak server-side. Route legacy `POST /api/gallery` + `ADMIN_TOKEN` sudah dihapus.
- [x] Boot ditolak (`process.exit(1)`) saat `NODE_ENV=production` bila `ADMIN_PASSWORD_HASH` masih hash contoh dari repo.
- [ ] Session pakai cookie `HttpOnly; Secure; SameSite=Lax` — saat ini Bearer token di `sessionStorage` (lihat gap di atas).
- [x] Tidak butuh CSRF token terpisah selama tetap Bearer (bukan cookie); **kalau nanti pindah ke cookie, wajib tambah proteksi CSRF.**

### Validasi & sanitasi input (server-side)
- [x] Skema ketat (`zod`): tipe, panjang maksimal, whitelist enum (`preferredPayment`, dll.).
- [x] `quantity` integer 1–100; `estimatedDate` tanggal valid & tidak di masa lalu.
- [x] Tidak ada query DB string-rangkai (penyimpanan JSON file, bukan SQL).
- [x] Field API di-whitelist sebelum dikirim ke klien (`PUBLIC_FIELDS` di `routes/orders.js`).

### Anti-abuse
- [x] Rate limit per IP per endpoint (lihat tabel di atas).
- [x] Verifikasi honeypot `website` kosong di server; terisi → diterima diam-diam, tidak disimpan.
- [ ] CAPTCHA — belum, pertimbangkan bila spam berlanjut.
- [x] Logging tanpa PII mentah — `errorHandler` & log booking hanya mencetak ref/ringkasan; `consult_logs` di-redaksi (`redactPii`) untuk HP/email/angka panjang.

### Chatbot / LLM (`/api/consult`)
- [x] Akses model AI hanya untuk sesi login; anonim → fallback kata kunci (0 biaya API).
- [x] Plafon panggilan LLM harian global (`CONSULT_DAILY_LLM_BUDGET`, default 300) → lewat batas semua turun ke fallback.
- [x] Rate limit berlapis: 8/menit/IP + 40/hari per pengirim (sesi atau IP).
- [x] Guard rail input (browser): tolak gibberish/simbol dominan, blokir PII (KTP/kartu/email/HP), anti-flood, bersihkan karakter kontrol.
- [x] Guard rail input (server): deteksi prompt-injection / jailbreak → jawaban baku, tidak diteruskan ke model.
- [x] Prompt hardening: pesan = data bukan instruksi; larang bocorkan prompt/tool; kunci topik ke Srikandi.
- [x] Guard rail output: potong balasan >2000 char; redaksi `sk-ant-…` / token / `ANTHROPIC_API_KEY`; ganti generik bila balasan membocorkan prompt sistem.
- [x] Redaksi PII (HP/email/deret digit ≥12) sebelum masuk `consult_logs`.
- [x] Plafon LLM harian persisten di `db` (`lib/llmbudget.js`) — bertahan saat restart.
- [ ] Rate limiter pakai store bersama (kini in-memory; cukup untuk single instance).
- [x] `cekStatusPesanan` verifikasi kepemilikan — nomor pesanan + nama + HP terdaftar wajib cocok; tanpa itu tidak ada detail yang dibalas (LLM + fallback).

### Data & rahasia
- [x] Kredensial (Anthropic key, kredensial admin hub) di env var, tak pernah di repo; guard menolak boot produksi dengan hash admin contoh.
- [ ] Prinsip least-privilege untuk kredensial DB — belum relevan (belum pakai DB sungguhan).
- [x] Enkripsi data pelanggan at-rest — AES-256-GCM untuk `customers`, `orders`, `bookings`, `sessions`, `consult_logs` (`lib/datacrypt.js`); kunci `DATA_ENCRYPTION_KEY`. Aktif bila kunci diset (wajib di produksi — server memperingatkan bila kosong).
- [x] Rotasi kunci enkripsi — `DATA_ENCRYPTION_KEY_OLD` + `npm run rotate:datakey` (re-enkripsi semua koleksi sensitif dengan kunci baru).
- [x] Retensi PII — field `ip` di `bookings` & `consult_logs` dibuang setelah `DATA_RETENTION_DAYS` (default 90) hari; sweeper tiap 6 jam + saat boot (`lib/retention.js`).
- [ ] Kebijakan retensi menyeluruh (hapus/anonimkan baris lama, bukan hanya IP) — belum.

### Rilis
- [x] `npm audit` bersih (root & `server/`) — dicek manual; **belum** di CI otomatis.
- [x] Error handler tak membocorkan stack trace ke klien.
- [ ] Endpoint upload galeri (`POST /api/admin/gallery`): baru terima URL, belum ada upload file + batas MIME/ukuran + object storage.
