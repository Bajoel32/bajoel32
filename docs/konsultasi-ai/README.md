> **Status dokumen (14 Sep 2026).** Folder ini menjelaskan backend lama `server/` (Node + Express + Anthropic Claude) yang **sudah tidak dipakai lagi**. Sistem yang berjalan sekarang: PostgreSQL + satu Edge Function `api` di Supabase, repo [`Bajoel32/srikandi-backend`](https://github.com/Bajoel32/srikandi-backend). Asisten AI memakai **Google Gemini** (`gemini-3.5-flash`), base URL endpoint `https://<project-ref>.supabase.co/functions/v1/api`, dan **tidak ada admin hub** (`/api/admin/*`) — operasional harian dilakukan lewat dashboard Supabase. Tool `cekStatusPesanan` kini **wajib sesi login konsumen**, bukan verifikasi nama + HP. Isi di bawah disimpan sebagai catatan desain, bukan deskripsi sistem yang berjalan.

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

- Backend chatbot **sudah ada** di `server/` (Node + Express).
  Endpoint: `POST /api/consult` → `server/src/routes/consult.js`
  → `runConsult()` di `server/src/lib/claude.js`.
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
- `server/README.md` — struktur folder server.
