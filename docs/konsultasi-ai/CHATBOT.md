# Konsultasi — Arsitektur & Kontrak Backend (asisten AI)

Halaman [`src/components/ConsultationPage.jsx`](src/components/ConsultationPage.jsx)
(dibuka oleh tombol **"Mulai Konsultasi"**) adalah UI chat. Backend-nya **sudah
dibangun** di [`server/src/routes/consult.js`](server/src/routes/consult.js) +
[`server/src/lib/claude.js`](server/src/lib/claude.js) (RAG + function calling
lewat Claude, dengan fallback kata kunci lokal saat `ANTHROPIC_API_KEY` kosong).
Dokumen ini adalah kontrak/arsitekturnya — dipakai sebagai referensi kalau mau
mengubah perilaku bot atau membangun ulang di stack lain.

## Alur

```
Browser (ConsultationPage)
   │  POST /api/consult   { messages: [{role, content}, ...] }
   ▼
Backend  /api/consult
   1. Ambil pertanyaan terakhir pengguna
   2. RAG  → embed pertanyaan → cari potongan relevan di basis pengetahuan
            (layanan, FAQ, kebijakan, ringkasan galeri)
   3. LLM  → panggil Claude dengan: system prompt + konteks RAG + riwayat chat
            + daftar TOOL (function) yang boleh dipanggil
   4. Jika Claude minta tool → jalankan fungsi (query DB harga / pesanan / galeri)
            → kirim hasil balik ke Claude → Claude susun jawaban akhir
   5. Balas ke browser  { reply, sources, functions }
```

## Kontrak API

### Request — `POST /api/consult`

```json
{
  "messages": [
    { "role": "user", "content": "Cek status pesanan SR-001-2026" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "kapan selesai?" }
  ]
}
```

Frontend hanya mengirim `role` `user`/`assistant`, maksimal 20 pesan terakhir,
tiap pesan sudah dipotong ke 1000 karakter. **Backend tetap wajib memvalidasi ulang.**

### Response

```json
{
  "reply": "Pesanan SR-001-2026 atas nama Siti Nurhaliza berstatus \"Sedang Dikerjakan\" (75%).",
  "sources": [
    { "title": "Data pesanan internal", "snippet": "#SR-001-2026", "url": null }
  ],
  "functions": [
    { "name": "cekStatusPesanan", "label": "Status Pesanan", "data": { "...": "..." } }
  ]
}
```

| Field | Wajib | Isi |
|---|---|---|
| `reply` | ya | Jawaban teks. `\n` = baris baru, awali baris dengan `• ` untuk poin. **Teks polos**, bukan HTML. |
| `sources` | tidak | Potongan RAG yang dipakai. `{ title, snippet, url? }`. Ditampilkan sebagai "N Sumber". |
| `functions` | tidak | Hasil function yang dipanggil. `{ name, label, data }` — `data` dirender jadi kartu (lihat di bawah). |
| `escalate` | tidak | **Diisi HANYA saat bot perlu admin/manusia.** `{ reason, channel?, contact? }`. Bila ada, UI menampilkan tombol "Chat Admin via WhatsApp" di bawah jawaban. Lihat §Eskalasi ke admin. |

Streaming (SSE) opsional untuk nanti; UI sekarang menunggu satu respons JSON.

## Function / Tool untuk Claude

Definisikan minimal 3 tool ini (JSON Schema untuk `input_schema`). Nama harus sama
persis supaya kartunya dirender rapi di UI; nama lain tetap tampil sebagai JSON mentah.

> **Catatan harga:** biaya layanan/pesanan **tidak ditampilkan** di web (bersifat
> penawaran). Jangan buat tool yang mengembalikan harga; jika pengguna bertanya harga,
> jawab bahwa biaya dikonfirmasi staf setelah konsultasi.

```jsonc
// 1. Info layanan (jenis & estimasi pengerjaan — TANPA harga)
{
  "name": "infoLayanan",
  "description": "Ambil daftar jenis layanan yang tersedia. Kosongkan 'layanan' untuk semua. Tidak mengembalikan harga maupun estimasi waktu (keduanya penawaran, dikonfirmasi staf).",
  "input_schema": {
    "type": "object",
    "additionalProperties": false,
    "properties": { "layanan": { "type": "string", "enum": ["cuci emas", "pasang berlian", "patri emas", "chrome putih", "pemurnian emas", "pesanan"] } },
    "required": []
  }
}

// 2. Status pesanan — verifikasi kepemilikan sebelum membuka detail
{
  "name": "cekStatusPesanan",
  "description": "Ambil status & progres satu pesanan berdasarkan nomor (format SR-NNN-YYYY).",
  "input_schema": {
    "type": "object",
    "additionalProperties": false,
    "properties": { "nomorPesanan": { "type": "string", "pattern": "^SR-\\d{3}-\\d{4}$" } },
    "required": ["nomorPesanan"]
  }
}

// 3. Rekomendasi dari galeri
{
  "name": "rekomendasiGaleri",
  "description": "Cari item galeri berdasarkan kategori dan/atau budget maksimum (rupiah).",
  "input_schema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "kategori": { "type": "string", "enum": ["Cincin", "Kalung", "Gelang", "Anting", "Liontin"] },
      "budgetMax": { "type": "integer", "minimum": 0 }
    },
    "required": []
  }
}

// 4. Eskalasi ke admin manusia
{
  "name": "eskalasiKeAdmin",
  "description": "Panggil bila permintaan butuh tindakan/putusan admin manusia: masalah teknis, pembayaran/sengketa, perubahan atau pembatalan data pesanan, komplain, di luar cakupan pengetahuan, atau pengguna minta bicara dengan staf/manusia. Jangan panggil untuk pertanyaan biasa yang bisa dijawab dari RAG/tool lain.",
  "input_schema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "alasan": { "type": "string", "description": "1 kalimat ringkas, ditampilkan ke pengguna" },
      "ringkasan": { "type": "string", "description": "Ringkasan konteks untuk admin; dipakai sebagai prefill pesan WhatsApp (opsional, tanpa data sensitif)" }
    },
    "required": ["alasan"]
  }
}
```

Bentuk `data` yang diharapkan UI:
- `infoLayanan` → array `{ id, icon, name }` (tanpa harga & tanpa estimasi waktu)
- `cekStatusPesanan` → objek `{ orderNumber, customerName, status, progress, goldPurity }` (atau `{ notFound: "SR-..." }`)
- `rekomendasiGaleri` → array `{ id, title, price, image }` (harga di sini adalah harga katalog galeri, bukan tarif jasa)
- `eskalasiKeAdmin` → **tidak** dirender sebagai kartu `functions`. Backend memetakannya ke field `escalate` pada response (lihat §Eskalasi ke admin).

> **Jangan duplikasi list di `reply`.** Setiap `functions[].data` yang berbentuk daftar (terutama
> `infoLayanan`) sudah dirender UI sebagai kartu tersendiri (lihat `FunctionResult` di
> `ConsultationPage.jsx`). `reply` cukup berisi 1 kalimat pengantar singkat — **jangan** mengulang
> daftar itu sebagai teks/bullet list di `reply`, nanti tampil dobel di chat. System prompt di
> `claude.js` sudah berisi instruksi ini untuk jalur Claude; jalur fallback kata kunci juga sudah
> disesuaikan (`fallbackConsult` di `server/src/lib/claude.js`).

Data contoh untuk ketiganya ada di [`src/config/site.js`](src/config/site.js)
(`services`, `orders`, `galleries`) — di produksi ganti dengan query DB.

## Eskalasi ke admin

Ini "API saat bot perlu admin". Alurnya:

1. LLM memanggil tool `eskalasiKeAdmin` (atau backend memutuskan sendiri lewat heuristik/klasifikasi).
2. Backend **tidak** membalas hasil tool ke `functions`. Sebagai gantinya ia menaruh objek
   `escalate` di response akhir, lalu menutup jawaban dengan `reply` yang sopan.
3. Frontend menampilkan blok "Perlu bantuan admin — {reason}" + tombol **Chat Admin via WhatsApp**
   (satu-satunya tempat logo WhatsApp muncul di seluruh situs).

### Bentuk `escalate`

```json
{
  "reply": "Untuk hal ini Anda perlu terhubung dengan admin kami. Silakan lanjut lewat WhatsApp.",
  "escalate": {
    "reason": "Perlu tindakan admin: perubahan jadwal pengerjaan",
    "channel": "whatsapp",
    "contact": "https://wa.me/6281234567890?text=Halo%20admin%20Srikandi%2C%20saya%20butuh%20bantuan..."
  }
}
```

| Field | Wajib | Isi |
|---|---|---|
| `reason` | ya | 1 kalimat ringkas untuk pengguna (jangan bocorkan data sensitif) |
| `channel` | tidak | Saat ini hanya `"whatsapp"` (default bila kosong) |
| `contact` | tidak | URL `wa.me` lengkap termasuk `?text=` prefill. Bila kosong, frontend memakai `siteConfig.whatsapp` tanpa prefill |

### Kapan LLM harus eskalasi (untuk system prompt)

- Pengguna eksplisit minta bicara dengan manusia/admin/staf/CS.
- Komplain, keluhan, sengketa pembayaran, permintaan refund/pembatalan.
- Permintaan mengubah data pesanan (butuh verifikasi identitas + aksi admin).
- Masalah teknis situs / pembayaran gagal / barang rusak-salah kirim.
- Pertanyaan di luar cakupan RAG yang tidak bisa dijawab dengan benar.

Jangan eskalasi untuk pertanyaan biasa yang bisa dijawab dari RAG atau tool lain.

### Keamanan prefill

`contact`/`ringkasan` masuk ke URL WhatsApp yang dibuka di perangkat pengguna —
**jangan** sertakan nomor pesanan orang lain, data pribadi, atau info internal di situ.

## Pemanggilan Claude (rekomendasi)

- **SDK:** `@anthropic-ai/sdk` di server (Node). Jangan pernah panggil Claude dari browser — API key harus tetap di server.
- **Model:** `claude-opus-5` (default). Untuk menekan biaya, `claude-sonnet-5` atau `claude-haiku-4-5` biasanya cukup untuk Q&A toko — ukur dulu kualitasnya.
- **Thinking:** `thinking: { type: "adaptive" }`.
- **Streaming:** pakai `client.messages.stream(...)` untuk chat (hindari timeout, UX lebih halus). Ambil hasil akhir dengan `.finalMessage()`.
- **Loop tool:** saat `stop_reason === "tool_use"`, jalankan fungsi, kirim `tool_result` (semua dalam satu pesan `user`), ulangi sampai `end_turn`. Atau pakai **tool runner** SDK (`client.beta.messages.toolRunner`) agar loop-nya otomatis.
- **System prompt (garis besar):**
  - Peran: asisten toko perhiasan Srikandi, bahasa Indonesia, sopan & ringkas.
  - Hanya jawab dari konteks RAG + hasil tool. Jika tidak tahu / di luar cakupan → panggil `eskalasiKeAdmin`, jangan mengarang.
  - Jangan mengarang harga/tanggal. Biaya & estimasi waktu selalu ditandai sebagai penawaran yang dikonfirmasi staf.
  - Jangan pernah menampilkan data pelanggan lain.
  - Untuk komplain, sengketa, perubahan/pembatalan pesanan, masalah teknis, atau permintaan bicara dengan manusia → panggil `eskalasiKeAdmin`.

Referensi pola SDK: jalankan `/claude-api` (skill) atau lihat dokumen resmi Anthropic.

## RAG — basis pengetahuan

Isi yang perlu di-index (chunk ± 300–500 kata, simpan embedding di vector DB —
pgvector / SQLite-VSS / layanan pihak ketiga):

- Deskripsi tiap layanan + estimasi + hal yang memengaruhi harga
- FAQ (sudah ada di [`BookingPage.jsx`](src/components/BookingPage.jsx))
- Kebijakan: pembatalan, garansi, pengiriman, cara bayar (DP/penuh)
- Ringkasan tiap item galeri (judul, kategori, material, kisaran harga)
- Info kontak & jam operasional

Saat query: ambil top-k (3–5) potongan, sisipkan ke prompt, dan **kembalikan
potongan itu di `sources`** supaya pengguna bisa menilai jawaban.

## Keamanan

Status implementasi saat ini (detail & legenda `[x]`/`[~]`/`[ ]` di [SECURITY.md](SECURITY.md) §2):

- [x] API key Anthropic hanya di `server/.env`, tidak pernah dikirim ke browser.
- [x] Rate limit `/api/consult` — 20 pesan/menit/IP (`consultLimiter`) + `express.json({ limit: '32kb' })`.
- [x] Validasi ulang `messages` di server — `consultSchema` (zod): peran, panjang ≤4000, jumlah ≤30.
- [~] `cekStatusPesanan`: **belum** verifikasi kepemilikan — siapa pun bisa buka status/nama pelanggan
      hanya dari nomor pesanan. **Wajib diperbaiki sebelum go-live** — lihat SECURITY.md §2 (gap prioritas tinggi).
- [x] Sanitasi output tool: hasil tool dirender lewat JSX (auto-escape) di UI, bukan HTML mentah;
      `escalate.contact`/`ringkasan` sengaja tidak boleh berisi data sensitif (lihat §Keamanan prefill).
- [x] Log tanpa PII mentah — server tidak mencatat isi pesan konsultasi, hanya error generik.
- [x] CORS: hanya domain di `CORS_ORIGINS` (`server/.env`).

## Mengaktifkan di frontend

1. Deploy backend, sediakan endpoint `POST /api/consult` sesuai kontrak di atas.
2. Set env saat build: `VITE_CONSULT_API=https://api.domainmu.com/consult`
   (atau path relatif `/api/consult` bila satu domain).
3. Tanpa env itu, halaman otomatis memakai **mode mock** (`mockConsult()` di
   [`src/config/consultation.js`](src/config/consultation.js)) — pencocokan kata kunci
   sederhana ke data `site.js`, berguna untuk demo & sebagai contoh bentuk respons.
