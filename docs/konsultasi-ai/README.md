# Dokumentasi: Form "Mulai Konsultasi" sebagai Chatbot AI

> **Catatan repo:** repo ini hanya berisi **frontend** + dokumentasi. Tautan
> `../../server/...` di bawah menunjuk ke **repo backend terpisah** (Node + Express).
> File `../../src/...` tetap valid (ada di repo ini).

Folder ini berisi panduan untuk **mengaktifkan** halaman konsultasi
([`src/components/ConsultationPage.jsx`](../../src/components/ConsultationPage.jsx),
dibuka oleh tombol **"Mulai Konsultasi"**) sebagai chatbot AI sungguhan
(Claude + RAG + function calling), lalu **menambah function/tool buatan sendiri**.

| File | Isi |
|---|---|
| [`CHECKLIST.md`](CHECKLIST.md) | Daftar centang ringkas — dari nol sampai siap produksi, plus checklist menambah function sendiri. |
| [`LANGKAH-PROSES.md`](LANGKAH-PROSES.md) | Langkah proses berurutan + perintah terminal + contoh kode function baru dari ujung ke ujung. |

## Konteks singkat

- Backend chatbot **sudah ada** di [`server/`](../../server/) (Node + Express).
  Endpoint: `POST /api/consult` → [`server/src/routes/consult.js`](../../server/src/routes/consult.js)
  → `runConsult()` di [`server/src/lib/claude.js`](../../server/src/lib/claude.js).
- Dua mode otomatis:
  - `ANTHROPIC_API_KEY` **diisi** → Claude asli (`@anthropic-ai/sdk`) + RAG atas
    `server/data/kb.json` + 4 tool.
  - `ANTHROPIC_API_KEY` **kosong** → `fallbackConsult()`, pencocokan kata kunci (bukan AI).
- Frontend sudah terhubung lewat `VITE_CONSULT_API`. Bila endpoint tidak diset atau
  gagal, halaman memakai `mockConsult()` di
  [`src/config/consultation.js`](../../src/config/consultation.js).

## Dokumen terkait (folder ini)

- [`CHATBOT.md`](CHATBOT.md) — kontrak API & arsitektur lengkap (request/response, schema tool, eskalasi, RAG, keamanan).
- [`BACKEND.md`](BACKEND.md) — checklist kesiapan backend secara umum.
- [`SECURITY.md`](SECURITY.md) — postur keamanan + gap prioritas (§2).
- [`server/README.md`](../../server/README.md) — struktur folder server.
