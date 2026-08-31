# Checklist — Mengaktifkan "Mulai Konsultasi" sebagai Chatbot AI

Legenda: `[ ]` belum · `[x]` selesai · `[~]` sebagian / perlu perhatian

Langkah detail + perintah ada di [`LANGKAH-PROSES.md`](LANGKAH-PROSES.md).

---

## A. Persiapan

- [ ] Node.js ≥ 18.17 terpasang (`node -v`)
- [ ] Dependensi server terpasang — `cd server && npm install`
- [ ] Data awal ter-seed — `npm run seed` di folder `server/`
      (membuat `server/data/*.json`: customers, orders, services, gallery, kb, sessions, bookings)
- [ ] Punya **API key Anthropic** (dari console Anthropic). Simpan aman, jangan commit.

## B. Konfigurasi

- [ ] `server/.env` dibuat dari `server/.env.example`
- [ ] `server/.env` → `ANTHROPIC_API_KEY=` **diisi** dengan key asli
- [ ] `server/.env` → `ANTHROPIC_MODEL=` diset (default `claude-opus-5`; bisa `claude-sonnet-5` / `claude-haiku-4-5` untuk hemat)
- [ ] `server/.env` → `CORS_ORIGINS` memuat origin frontend (`http://localhost:5173` untuk dev)
- [ ] `server/.env` → `WHATSAPP_BASE` diisi nomor admin asli (dipakai fitur eskalasi)
- [ ] Root `.env.local` → `VITE_CONSULT_API=http://localhost:8787/api/consult` (dev)
- [ ] `server/.env` **tidak** ter-commit (sudah di `server/.gitignore`)

## C. Menjalankan & verifikasi (dev)

- [ ] Server jalan — `cd server && npm run dev` → log tampil `Srikandi API -> http://localhost:8787`
- [ ] Log **tidak** menampilkan `ANTHROPIC_API_KEY kosong -> ... fallback` (kalau muncul, key belum terbaca)
- [ ] `curl http://localhost:8787/api/health` → `{"ok":true,...}`
- [ ] Frontend jalan — `npm run dev` → `http://localhost:5173`
- [ ] Klik **"Mulai Konsultasi"** → kirim pesan bebas → dapat balasan
- [ ] Cek Network tab: request ke `http://localhost:8787/api/consult` **200** (bukan fallback ke `mockConsult`)
- [ ] Uji tool bawaan:
  - [ ] "Layanan apa saja yang tersedia?" → muncul kartu **Info Layanan**
  - [ ] "Cek status pesanan SR-001-2026" → muncul kartu **Status Pesanan**
  - [ ] "Rekomendasi cincin dong" → muncul kartu **Rekomendasi Galeri**
  - [ ] "Saya mau komplain / bicara dengan admin" → muncul blok **Chat Admin via WhatsApp**
- [ ] Uji RAG: jawaban menyertakan bagian **"N Sumber"** yang relevan
- [ ] Matikan sementara `ANTHROPIC_API_KEY` → pastikan halaman tetap hidup (turun ke fallback), lalu nyalakan lagi

## D. Menyesuaikan isi bot (opsional)

- [ ] `server/data/kb.json` dilengkapi: kebijakan pembatalan, garansi, pengiriman, jam operasional, ringkasan galeri
- [ ] System prompt di `server/src/lib/claude.js` (`const SYSTEM`) disesuaikan nada/aturannya
- [ ] Starter pertanyaan di `consultationConfig.starters` ([`src/config/consultation.js`](../../src/config/consultation.js)) disesuaikan
- [ ] `disclaimer` & `assistantName` di `consultationConfig` disesuaikan

---

## E. Menambah FUNCTION / TOOL sendiri

Untuk tiap function baru, sentuh **3 berkas** (+1 dokumen):

### E1. Implementasi — `server/src/lib/tools.js`

- [ ] Tulis `export function namaTool({ argA, argB } = {}) { ... return <objek/array>; }`
- [ ] Fungsi **murni & defensif**: tangani argumen kosong, jangan lempar error mentah
- [ ] Jangan kembalikan **harga jasa** atau **PII pelanggan lain** (lihat CHATBOT.md)
- [ ] Kalau butuh data, ambil lewat `db.all('<koleksi>')` — jangan baca file langsung
- [ ] Tambahkan label ke `export const LABELS = { ... }` (`namaTool: 'Judul Kartu'`)

### E2. Daftarkan ke Claude — `server/src/lib/claude.js`

- [ ] `import { namaTool } from './tools.js'` (gabung ke import yang ada)
- [ ] Tambah schema ke array `TOOLS`:
  - [ ] `name` sama persis dengan nama fungsi
  - [ ] `description` jelas: kapan dipakai, kapan **tidak**
  - [ ] `input_schema` JSON Schema (`type: "object"`, `additionalProperties: false`, `required: [...]`)
- [ ] Tambah ke `const RUNNERS = { ..., namaTool }`
- [ ] (Opsional) Tangani juga di `fallbackConsult()` agar jalan tanpa API key

### E3. Render kartu di UI — `src/components/ConsultationPage.jsx`

- [ ] Di komponen `FunctionCard` (blok `if (fn.name === '...')`), tambah cabang untuk `namaTool`
- [ ] Tanpa cabang khusus, data tetap tampil sebagai JSON mentah (fallback aman) — kartu rapi itu opsional
- [ ] Render lewat JSX biasa (auto-escape) — **jangan** `dangerouslySetInnerHTML`

### E4. Dokumen

- [ ] Tambah schema tool baru ke [`CHATBOT.md`](CHATBOT.md) §"Function / Tool untuk Claude"
- [ ] Catat bentuk `data` yang dikembalikan

### E5. Uji function baru

- [ ] Pancing lewat kalimat natural → Claude memanggil tool → kartu/hasil muncul
- [ ] `curl -X POST http://localhost:8787/api/consult -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"<pemicu>"}]}'` → cek field `functions[]`
- [ ] Uji argumen tidak valid / kosong → tidak 500, bot menjawab wajar
- [ ] Cek loop tidak mentok (maks 4 hop di `runConsult`) untuk permintaan beruntun

---

## F. Keamanan sebelum go-live

- [x] `cekStatusPesanan` verifikasi kepemilikan — nomor pesanan + nama pemesan + HP terdaftar wajib cocok
      (HP persis via `normalizePhone`, nama pencocokan token); tanpa itu `needVerification`/`mismatch` tanpa detail. Berlaku di jalur LLM **dan** fallback. Lihat SECURITY.md §2.
- [ ] Function baru yang menyentuh data pesanan/pelanggan juga menerapkan cek kepemilikan yang sama
- [x] API key hanya di `server/.env`, tidak pernah ke browser — pertahankan
- [x] Soft-gate: Claude hanya untuk sesi login; anon → fallback kata kunci (`optionalAuth` + `isMember`)
- [x] Rate limit `/api/consult` berlapis: 8/menit/IP (`consultLimiter`) + 40/hari/pengirim (`consultDailyLimiter`) + body `express.json({ limit: '32kb' })`
- [x] Plafon biaya LLM harian `CONSULT_DAILY_LLM_BUDGET` (default 300), persisten di `db`
- [x] Guard rail 4 lapis (input browser + input server anti prompt-injection + prompt hardening + output redaksi) — lihat SECURITY.md §3
- [x] Validasi ulang `messages` (zod `consultSchema`: role, panjang ≤4000, jumlah ≤30)
- [ ] `CORS_ORIGINS` di server produksi = domain frontend produksi (bukan `localhost`)
- [x] Tulis galeri hanya lewat sesi admin (`/api/admin/gallery`); route legacy `POST /api/gallery` + `ADMIN_TOKEN` sudah dihapus
- [ ] `escalate.contact` / `ringkasan` tidak memuat data sensitif (masuk URL WhatsApp perangkat pengguna)
- [x] Log `consult_logs` di-redaksi (`redactPii`: HP/email/deret digit ≥12) sebelum disimpan

## G. Produksi / deploy

- [ ] Backend di-deploy; `POST /api/consult` reachable dari domain frontend
- [ ] Build frontend dengan `VITE_CONSULT_API=https://api.domainmu.com/consult` (atau `/api/consult` bila satu domain)
- [ ] Uji: tanpa/putus koneksi ke backend → halaman turun ke `mockConsult` tanpa error fatal
- [x] Opsi Postgres tersedia — set `DATABASE_URL` (mis. Neon); JSON-file tetap default untuk dev. Untuk skala besar, tetap pertimbangkan DB relasional penuh (antarmuka `db` di `server/src/db.js` sengaja kecil agar mudah ditukar)
- [x] Enkripsi data at-rest — set `DATA_ENCRYPTION_KEY` (`npm run gen:datakey`) di produksi
- [ ] (Disarankan) Streaming SSE untuk balasan panjang (`client.messages.stream(...)`) — sekarang non-streaming
- [ ] (Disarankan) RAG upgrade: embedding + vector DB (pgvector / SQLite-VSS) menggantikan retriever kata kunci di `server/src/lib/rag.js`
- [ ] Pantau biaya token & atur `ANTHROPIC_MODEL` sesuai kebutuhan
