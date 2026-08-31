# Portal Pesanan — Autentikasi Konsumen

Halaman **"Lihat Pesanan"** ([`src/components/OrdersPage.jsx`](../../src/components/OrdersPage.jsx))
privat: konsumen wajib login untuk melihat progres pesanannya **sendiri**.

Backend sungguhan **sudah ada** — [`server/src/routes/auth.js`](../../server/src/routes/auth.js) +
[`server/src/routes/orders.js`](../../server/src/routes/orders.js) (bcrypt, token sesi, otorisasi
per-`customerId`). Frontend memakainya otomatis saat `VITE_ORDERS_API` diisi di `.env.local`
root (lihat [README.md](README.md) §9). **Tanpa** env itu, frontend jatuh ke mode dummy di
bawah — 60 konsumen dibangkitkan lokal di [`src/config/orders.js`](../../src/config/orders.js),
berguna untuk demo UI tanpa menjalankan server.

## Mode dummy (tanpa `VITE_ORDERS_API`)

- 60 konsumen dibangkitkan deterministik (seed tetap → data stabil tiap reload).
- Login: **nomor HP + kata sandi (kode akses 6 digit)**.
- Sesi disimpan di `sessionStorage` (`srikandi_session`) → hilang saat tab ditutup.
- Layar login menampilkan satu **akun demo** yang valid untuk mencoba UI.
- `getMyOrders()` hanya mengembalikan pesanan milik pemegang token.

## Kontrak endpoint (sudah diimplementasikan di `server/`)

Set saat build:

```
VITE_ORDERS_API=/api        # atau https://api.domainmu.com
```

Frontend lalu memanggil endpoint di bawah dan berhenti memakai data dummy
(akun demo juga otomatis disembunyikan).

### `POST {VITE_ORDERS_API}/auth/login`

Request:
```json
{ "phone": "081234567890", "password": "482913" }
```
Frontend menormalkan `phone` (`+62`/`62` → `0`, hapus spasi/strip) sebelum kirim.

Response `200`:
```json
{
  "token": "<opaque session token / JWT>",
  "customer": { "id": 12, "name": "Siti Nurhaliza", "phone": "081234567890" }
}
```
- `401` → UI menampilkan "Nomor HP atau kata sandi salah."
- status lain → "Gagal masuk. Coba lagi nanti."

### `GET {VITE_ORDERS_API}/my-orders`

Header: `Authorization: Bearer <token>`

Response `200`:
```json
{
  "orders": [
    {
      "orderNumber": "SR-012-2026",
      "serviceName": "Custom Cincin",
      "goldPurity": 75,
      "progress": 65,
      "status": "Sedang Dikerjakan",
      "createdDate": "2026-08-05"
    }
  ]
}
```
- `status` ∈ `Belum Dimulai` · `Menunggu Approval` · `Sedang Dikerjakan` · `Selesai`
- `401` → UI minta login ulang.
- **Server hanya boleh mengembalikan pesanan milik pemegang token.** Jangan
  pernah menerima `customerId` dari query string.

## Status keamanan portal ini

Detail & legenda di [SECURITY.md](SECURITY.md) §2. Ringkas untuk portal ini:

- [x] **Tidak ada kata sandi plaintext** — bcrypt (cost 10) di `routes/auth.js`.
- [~] Login pakai kata sandi/kode akses, **bukan** OTP. Lebih aman kalau diganti **OTP
      sekali pakai via WhatsApp/SMS** ke nomor terdaftar — belum diimplementasikan.
- [x] **Rate limit login** — 10 percobaan / 10 menit / IP (`loginLimiter`), mencegah brute force kode 6 digit.
- [~] Token sesi acak (256-bit) dikirim sebagai `Authorization: Bearer`, disimpan di
      `sessionStorage` klien — **bukan** cookie `HttpOnly; Secure; SameSite=Lax`. Trade-off ini
      dijelaskan di SECURITY.md §2 (tidak butuh proteksi CSRF terpisah, tapi rentan bila ada XSS).
- [x] Otorisasi tiap endpoint: `GET /api/my-orders` memfilter `customerId === session.customerId`;
      `customerId` tidak pernah dibaca dari klien. Sudah diuji: token konsumen A hanya melihat pesanannya sendiri.
- [x] Tidak membocorkan apakah nomor HP terdaftar — pesan error seragam + dummy-hash compare
      (lihat SECURITY.md §2) menyamakan waktu respons.
- [x] Logout — `POST /api/auth/logout` menghapus sesi di server (token lama langsung `401`), bukan hanya di klien.
- [x] Log akses tanpa PII mentah.
- [x] CORS: hanya domain di `CORS_ORIGINS`.
- [x] **Enkripsi at-rest** — koleksi `customers`, `orders`, `sessions` disimpan sebagai blob AES-256-GCM bila `DATA_ENCRYPTION_KEY` diset (`lib/datacrypt.js`); plaintext hanya di memori. Lihat [SECURITY.md](SECURITY.md) §2.
- [x] **Retensi PII** — field `ip` di `bookings` dibuang otomatis setelah `DATA_RETENTION_DAYS` (default 90) hari (`lib/retention.js`).

## Impor 60 konsumen asli

Data dummy hanya untuk tampilan. Untuk produksi, isi tabel `customers` +
`orders` dari sistem toko (POS/spreadsheet), lalu buat kode akses / kirim OTP.
Skema kolom minimal ada di contoh response `/my-orders` di atas.
