# Langkah Proses — "Mulai Konsultasi" → Chatbot AI + Function Sendiri

Panduan berurutan. Checklist ringkasnya: [`CHECKLIST.md`](CHECKLIST.md).
Kontrak API lengkap: [`CHATBOT.md`](CHATBOT.md).

Semua perintah diasumsikan dijalankan dari root repo (`c:\SRIKANDI`) kecuali ditulis lain.

---

## Peta alur

```
Browser: ConsultationPage.jsx  (tombol "Mulai Konsultasi")
   │  sendConsultation()  →  POST {VITE_CONSULT_API}   body: { messages: [{role, content}, ...] }
   ▼
server/src/routes/consult.js         → validasi zod (consultSchema)
   ▼
server/src/lib/claude.js  runConsult(messages)
   1. ambil pesan user terakhir
   2. RAG: retrieve() atas server/data/kb.json  (server/src/lib/rag.js)
   3. ADA ANTHROPIC_API_KEY?
        ┌─ ya → Claude (@anthropic-ai/sdk) + system prompt + konteks RAG + TOOLS
        │        loop maks 4 hop: tool_use → jalankan RUNNERS[nama](input) → tool_result → ulang
        └─ tidak → fallbackConsult()  (pencocokan kata kunci, bukan AI)
   4. balas JSON: { reply, sources, functions?, escalate? }
   ▼
Browser render: reply + kartu FunctionCard per functions[] + EscalateCard + daftar Sources
```

Kalau `VITE_CONSULT_API` kosong **atau** request gagal → frontend pakai `mockConsult()`
di [`src/config/consultation.js`](../../src/config/consultation.js) (demo, tanpa server).

---

## BAGIAN 1 — Mengaktifkan AI

### Langkah 1. Pasang & seed backend

```bash
cd server
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run seed
```

`npm run seed` mengisi `server/data/*.json`. Login demo yang ikut dibuat:
`081269151610` / `880575` (Joko Wibowo) — berguna untuk menguji `cekStatusPesanan`.

### Langkah 2. Isi `server/.env`

```dotenv
PORT=8787
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
SESSION_TTL=86400

ANTHROPIC_API_KEY=sk-ant-...          # <-- ISI dengan key asli
ANTHROPIC_MODEL=claude-opus-5         # atau claude-sonnet-5 / claude-haiku-4-5
CONSULT_DAILY_LLM_BUDGET=300          # plafon panggilan Claude/hari (lindungi tagihan)

WHATSAPP_BASE=https://wa.me/62xxxxxxxxxxx   # nomor admin asli (fitur eskalasi)

# Untuk produksi (opsional di dev): npm run gen:datakey lalu tempel di sini.
DATA_ENCRYPTION_KEY=
```

- Key **hanya** di sini. Jangan pernah menaruh key di kode frontend / `.env.local`.
- `server/.env` sudah masuk `server/.gitignore`.
- Daftar env var lengkap (admin hub, Postgres, retensi, rotasi kunci) ada di
  [`server/.env.example`](../../server/.env.example) dan [API-SCHEMA.md](API-SCHEMA.md) §7.

### Langkah 3. Arahkan frontend ke backend

Root [`.env.local`](../../.env.local) (dibaca Vite saat dev/build):

```dotenv
VITE_CONSULT_API=http://localhost:8787/api/consult
```

(File ini sudah ada di repo dengan nilai tersebut. Hapus file untuk kembali ke mode mock.)

### Langkah 4. Jalankan keduanya

Terminal A:

```bash
cd server && npm run dev
```

Harapan log:

```
[db] mode: json-file
[db] enkripsi at-rest: nonaktif (DATA_ENCRYPTION_KEY kosong)
Srikandi API  ->  http://localhost:8787  (env: development, storage: json-file)
  CORS origins: http://localhost:5173, http://localhost:4173, http://localhost:5174
```

> Kalau muncul baris `ANTHROPIC_API_KEY kosong -> /api/consult memakai fallback kata kunci lokal`,
> berarti key belum terbaca — cek ejaan variabel & lokasi file `server/.env`.

Terminal B:

```bash
npm run dev
```

### Langkah 5. Uji dari browser

1. Buka `http://localhost:5173`, klik **"Mulai Konsultasi"**.
2. Kirim: `Layanan apa saja yang tersedia di Srikandi?`
   → balasan + **kartu "Info Layanan"** + bagian **"Sumber"**.
3. Kirim: `Cek status pesanan SR-001-2026` → **kartu "Status Pesanan"**.
4. Kirim: `Saya mau komplain, hubungkan ke admin` → blok **"Chat Admin via WhatsApp"**.
5. Buka DevTools → Network → pastikan `POST http://localhost:8787/api/consult` **200**.

### Langkah 6. Uji dari terminal (opsional)

```bash
curl -s -X POST http://localhost:8787/api/consult \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Layanan apa saja yang tersedia?"}]}'
```

Perhatikan field `reply`, `functions[]`, `sources[]`.

### Langkah 7. Sesuaikan isi bot (opsional)

- **Pengetahuan**: tambah entri di `server/data/kb.json` — bentuknya `{ "id", "title", "text", "url"? }`.
  Retriever ([`server/src/lib/rag.js`](../../server/src/lib/rag.js)) hanya cocok kata kunci; tulis `title`/`text` memakai istilah yang biasa ditanyakan pelanggan.
- **Perilaku**: ubah `const SYSTEM` di [`server/src/lib/claude.js`](../../server/src/lib/claude.js).
- **UI**: `consultationConfig` di [`src/config/consultation.js`](../../src/config/consultation.js) — `assistantName`, `intro`, `disclaimer`, `starters`, `maxChars` (1000), `maxHistory` (20).

---

## BAGIAN 2 — Menambah function / tool sendiri

Contoh yang dipakai di bawah: **`infoJamOperasional`** — mengembalikan jam buka toko
per hari. Read-only, tanpa PII, cocok sebagai contoh aman. Pola yang sama berlaku
untuk tool lain.

### Langkah 8. Implementasi fungsi — `server/src/lib/tools.js`

Tambahkan di akhir file (sebelum atau sesudah `LABELS`):

```js
// Jam operasional toko. Sumber data: server/data/jamOperasional.json
// (buat file itu, array of { hari, buka, tutup } atau { hari, libur: true }).
export function infoJamOperasional({ hari } = {}) {
  const semua = db.all('jamOperasional'); // db otomatis memuat file jamOperasional.json
  if (!semua.length) {
    return { catatan: 'Jadwal belum dikonfigurasi. Konfirmasi ke staf.' };
  }
  const norm = String(hari || '').trim().toLowerCase();
  const list = norm
    ? semua.filter((j) => j.hari.toLowerCase() === norm)
    : semua;
  return (list.length ? list : semua).map((j) => ({
    hari: j.hari,
    jam: j.libur ? 'Tutup' : `${j.buka}–${j.tutup}`,
  }));
}
```

Lalu daftarkan labelnya:

```js
export const LABELS = {
  infoLayanan: 'Info Layanan',
  cekStatusPesanan: 'Status Pesanan',
  rekomendasiGaleri: 'Rekomendasi Galeri',
  infoJamOperasional: 'Jam Operasional', // <-- baru
};
```

Buat datanya — `server/data/jamOperasional.json`:

```json
[
  { "hari": "Senin",  "buka": "09:00", "tutup": "17:00" },
  { "hari": "Selasa", "buka": "09:00", "tutup": "17:00" },
  { "hari": "Rabu",   "buka": "09:00", "tutup": "17:00" },
  { "hari": "Kamis",  "buka": "09:00", "tutup": "17:00" },
  { "hari": "Jumat",  "buka": "09:00", "tutup": "17:00" },
  { "hari": "Sabtu",  "buka": "09:00", "tutup": "14:00" },
  { "hari": "Minggu", "libur": true }
]
```

> `db` di [`server/src/db.js`](../../server/src/db.js) memuat file `<nama>.json` on-demand
> lewat `db.all('<nama>')`. Tidak perlu mengubah `db.js`. Untuk data statis seperti ini,
> tidak perlu di-seed.

### Langkah 9. Daftarkan tool ke Claude — `server/src/lib/claude.js`

**9a.** Tambah `infoJamOperasional` ke daftar import dari `./tools.js`:

```js
import {
  infoLayanan,
  cekStatusPesanan,
  rekomendasiGaleri,
  eskalasiKeAdmin,
  infoJamOperasional, // <-- baru
  LABELS,
} from './tools.js';
```

**9b.** Tambah schema ke array `TOOLS`:

```js
{
  name: 'infoJamOperasional',
  description:
    'Jam buka toko Srikandi. Kosongkan "hari" untuk semua hari, atau isi salah satu: ' +
    'Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      hari: {
        type: 'string',
        enum: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
      },
    },
  },
},
```

**9c.** Tambah ke map `RUNNERS`:

```js
const RUNNERS = {
  infoLayanan,
  cekStatusPesanan,
  rekomendasiGaleri,
  eskalasiKeAdmin,
  infoJamOperasional, // <-- baru
};
```

Setelah ini jalur Claude sudah lengkap: `runConsult()` akan mengeksekusi
`RUNNERS['infoJamOperasional'](input)`, membungkus hasilnya jadi
`{ name, label: LABELS[name] || name, data }`, dan menaruhnya di `functions[]`.

**9d. (opsional) Jalur tanpa API key.** Bila ingin tetap berfungsi saat
`ANTHROPIC_API_KEY` kosong, tambahkan cabang di `fallbackConsult()`:

```js
if (/jam buka|jam operasional|buka jam|tutup jam|hari apa buka/.test(q)) {
  const data = infoJamOperasional({});
  return {
    reply: 'Berikut jam operasional toko kami.',
    functions: [{ name: 'infoJamOperasional', label: LABELS.infoJamOperasional, data }],
    sources,
  };
}
```

### Langkah 10. Render kartu di UI — `src/components/ConsultationPage.jsx`

Cari komponen `FunctionCard` (deret `if (fn.name === '...')`). Tambah cabang:

```jsx
if (fn.name === 'infoJamOperasional' && Array.isArray(fn.data)) {
  return (
    <div className="mt-2 rounded-xl border border-gold-200/70 dark:border-ink-700 overflow-hidden text-sm">
      {fn.data.map((j) => (
        <div
          key={j.hari}
          className="flex justify-between px-3 py-2 border-b border-gold-200/50 dark:border-ink-700/60 last:border-0"
        >
          <span className="text-ink-700 dark:text-cream-200/80">{j.hari}</span>
          <span className="font-semibold text-ink-900 dark:text-cream-50">{j.jam}</span>
        </div>
      ))}
    </div>
  );
}
```

Tanpa cabang ini pun aman: `FunctionCard` punya fallback yang menampilkan
`JSON.stringify(fn.data, null, 2)`. Kartu rapi hanya soal tampilan.

Aturan: render lewat JSX (auto-escape). Jangan `dangerouslySetInnerHTML`.

### Langkah 11. Uji function baru

Restart server (`npm run dev` di `server/` — mode `--watch` reload otomatis).

**Lewat browser:** buka konsultasi, kirim `Toko buka jam berapa hari Sabtu?`
→ Claude memanggil `infoJamOperasional({ hari: "Sabtu" })` → kartu muncul.

**Lewat terminal:**

```bash
curl -s -X POST http://localhost:8787/api/consult \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"jam operasional toko"}]}' | jq '.functions'
```

Cek juga:

- Argumen aneh (`hari: "Kemarin"`) → tidak 500; fungsi mengembalikan seluruh daftar / catatan.
- File `jamOperasional.json` tidak ada → `db.all` mengembalikan `[]` → cabang `!semua.length` jalan.

### Langkah 12. Dokumentasikan

Tambah schema `infoJamOperasional` ke [`CHATBOT.md`](CHATBOT.md)
bagian **"Function / Tool untuk Claude"**, dan catat bentuk `data`-nya
(array `{ hari, jam }`).

---

## BAGIAN 3 — Sebelum produksi

1. **`cekStatusPesanan` — SUDAH ada verifikasi kepemilikan** (nomor pesanan + nama pemesan +
   HP terdaftar wajib cocok; jalur LLM & fallback). Untuk setiap tool baru yang menyentuh
   data pesanan/pelanggan, terapkan cek yang sama. Lihat [`SECURITY.md`](SECURITY.md) §2.
2. **CORS**: `CORS_ORIGINS` (+ `ADMIN_ORIGINS`) di server produksi = domain frontend produksi.
3. **Build frontend** dengan `VITE_CONSULT_API=https://api.domainmu.com/consult`
   (atau `/api/consult` bila satu domain).
4. **Rate limit & ukuran body** sudah ada (`consultLimiter` 8/menit/IP + `consultDailyLimiter`
   40/hari/pengirim, body 32kb, plafon LLM harian `CONSULT_DAILY_LLM_BUDGET`) — sesuaikan bila perlu.
5. **Database**: opsi Postgres sudah ada (`DATABASE_URL`); JSON-file default untuk dev.
   Antarmuka `db` (`all/insert/update/remove/set`) di [`server/src/db.js`](../../server/src/db.js)
   sengaja kecil supaya mudah ditukar ke DB relasional penuh.
6. **Streaming (disarankan)**: `runConsult` sekarang non-streaming. Untuk balasan panjang,
   pindah ke `client.messages.stream(...)` + SSE ke frontend.
7. **RAG (disarankan)**: ganti retriever kata kunci di
   [`server/src/lib/rag.js`](../../server/src/lib/rag.js) dengan embedding + vector DB
   bila korpus `kb.json` membesar.
8. **Biaya**: pantau pemakaian token; turunkan `ANTHROPIC_MODEL` bila kualitas masih cukup.
