# Srikandi — Web Toko Perhiasan

Landing page + halaman pesanan, layanan, dan galeri untuk toko perhiasan.
Dokumen ini dibuat supaya kamu **cepat menemukan file yang perlu diubah** dan
**tahu cara memperbaiki** kalau ada error.

> **Repo ini hanya frontend** (storefront React/Vite) + dokumentasi. Kode backend
> (`server/` — Node + Express, RAG + Claude, admin hub) ada di **repo terpisah**.
> Referensi `server/...` dan tautan `../../server/...` di folder [`docs/`](docs/)
> menunjuk ke repo backend itu, bukan ke sini.

- **Stack:** React 19, Vite 8, Tailwind CSS v4 (backend Node + Express ada di repo terpisah — lihat §9)
- **Sifat:** frontend bisa jalan sendiri (mode dummy) atau tersambung ke backend nyata — lihat [SECURITY.md](docs/konsultasi-ai/SECURITY.md) untuk status keamanan keduanya
- **Bahasa build:** JavaScript (`.jsx`), bukan TypeScript

---

## 1. Menjalankan proyek

```bash
npm install        # sekali saja, atau setelah package.json berubah
npm run dev        # server pengembangan  -> http://localhost:5173
npm run build      # build produksi       -> folder dist/
npm run preview    # cek hasil build dist/ secara lokal
npm run lint       # cek kualitas kode (oxlint)
```

Selalu jalankan `npm run build` sebelum deploy — error yang tak muncul di `npm run dev`
sering ketahuan di sini.

---

## 2. Struktur folder — "mau ubah ini, buka file itu"

```
index.html                     Judul tab, meta, link Google Fonts, meta keamanan
.github/workflows/deploy.yml   CI deploy ke GitHub Pages (push ke main)
public/
  _headers                     Header keamanan (Netlify/Cloudflare — TIDAK dibaca GitHub Pages)
  favicon.svg, icons.svg       Ikon statis
src/
  main.jsx                     Titik masuk React (jarang disentuh)
  index.css                    >>> WARNA & FONT (Tailwind @theme) + helper elegan +
                               utilitas fluid (.fluid-shell / .section-y / .display-* / .auto-grid / .float-card)
  App.css                      Scrollbar, animasi, focus outline, overflow-x guard
  App.jsx                      Router sederhana antar-halaman (home/orders/booking/
                               gallery/consult) + <BottomNav> (mobile). Isi halaman
                               Home (navbar, hero, section, footer) ada di komponen
                               HomePage di file yang sama.
  config/
    site.js                    >>> SEMUA ISI TEKS & DATA (brand, menu, layanan, harga
                               emas demo, pesanan contoh, galeri)
    orders.js                  Login + data pesanan mode dummy (dipakai kalau
                               VITE_ORDERS_API tidak diisi) — lihat ORDERS-AUTH.md
    consultation.js            Kirim pesan ke /api/consult (atau mock lokal bila
                               VITE_CONSULT_API tidak diisi) — lihat CHATBOT.md
    gallery.js                 Ambil GET /api/gallery (atau data statis `site.js`
                               bila VITE_GALLERY_API tidak diisi)
  components/
    Button.jsx                 Tombol (varian: primary / secondary / outline / ghost)
    Card.jsx                   Kartu (opsi `iconTile` untuk ikon kotak berwarna)
    Hero.jsx                   Hero ringkas (opsional judul/deskripsi + 2 tombol)
    BackButton.jsx             Tombol "kembali" di halaman dalaman
    GoldPriceCard.jsx          Kartu "Estimasi Harga Emas" di Home (data demo,
                               BUKAN feed real-time)
    ActionGrid.jsx             Grid 4 shortcut aksi cepat di Home
    PromoCarousel.jsx          Carousel promo di Home (pakai data `galleries`)
    BottomNav.jsx              Tab bar bawah (mobile) — 5 halaman utama
    OrderCard.jsx              Kartu satu pesanan (dipakai OrdersPage)
    OrdersPage.jsx             Halaman "Pesanan Perhiasan" (login + daftar OrderCard)
    BookingPage.jsx            Halaman "Layanan" + FAQ + kontak
    BookingForm.jsx            Form pemesanan (validasi + honeypot anti-bot)
    GalleryPage.jsx            Halaman "Galeri" (cari, filter, modal detail)
    GalleryCard.jsx            Kartu galeri
    SalesPanel.jsx             Panel "Untuk Tim Sales" di bawah Galeri (gerbang sandi lokal)
    ConsultationPage.jsx       Halaman chat "Konsultasi" — lihat CHATBOT.md
    BrandIcons.jsx             Logo Instagram / TikTok / Facebook / WhatsApp (SVG)
tailwind.config.js             Hanya daftar file yang dipindai. Warna/font TIDAK di sini
                               (ada di src/index.css) — lihat catatan di §4
vite.config.js                 Konfigurasi build
server/                        Backend Node + Express — lihat §9 dan server/README.md
```

---

## 3. Cara mengganti ISI (teks, harga, data)

Hampir semua ada di **`src/config/site.js`**. Tidak perlu sentuh komponen.

| Mau ubah | Bagian di `site.js` |
|---|---|
| Nama toko, tagline | `brand` |
| Menu navigasi atas | `navigation` (label + `href` ke `#id-section`) |
| Judul & teks hero (opsional) + tulisan 2 tombol | `hero` |
| Angka "Estimasi Harga Emas" di Home (data demo, bukan live feed) | `goldRates` |
| Kotak "Keunggulan Kami" | `features` |
| Kotak "Koleksi" | `showcase` |
| Teks ajakan di bagian gelap | `cta` |
| Copyright + link sosial media | `footer` (label `Instagram` / `WhatsApp` otomatis jadi logo) |
| Daftar jenis layanan di halaman Booking (Cuci Emas, Pasang Berlian, Patri Emas, Chrome Putih, Pemurnian Emas, Pesanan); tanpa harga & tanpa estimasi waktu | `services` |
| Data contoh di halaman Pesanan | `orders` |
| Isi galeri (foto, harga, spesifikasi) | `galleries` |

Nomor WhatsApp ada 3 tempat: `site.js` (`footer.links`), dan di
[BookingPage.jsx](src/components/BookingPage.jsx) (tautan `tel:` dan `wa.me`).
Cari `6281234567890` lalu ganti semua.

Foto galeri sekarang memakai URL Unsplash. Kalau ganti ke domain lain,
**wajib** tambahkan domain itu ke `img-src` di [public/_headers](public/_headers),
kalau tidak gambar akan diblokir setelah deploy.

---

## 4. Cara mengubah TAMPILAN

### Warna & font

Semua "token" ada di blok `@theme` dalam **`src/index.css`**:

```css
@theme {
  --color-gold-400: #c5a880;   /* emas antik teredam (aksen utama)          */
  --color-cream-50: #faf8f5;   /* latar kertas hangat                       */
  --color-ink-900:  #1c1c1c;   /* tinta nyaris-hitam (nav, footer, CTA)     */
  --font-display: "Cormorant Garamond", ui-serif, Georgia, serif;  /* font judul */
  --font-sans:    "Manrope", system-ui, sans-serif;               /* font teks  */
}
```

Ubah nilainya → otomatis berlaku ke seluruh situs (`bg-gold-500`, `text-ink-900`, dll).
Kalau menambah **font baru**, tambahkan juga `<link>`-nya di `<head>` pada `index.html`.

> **Penting soal Tailwind v4:** proyek ini pakai `@theme` di `src/index.css`, **bukan**
> `tailwind.config.js`. Menamb-nambah `theme.extend` di `tailwind.config.js` **tidak akan
> berpengaruh**. Semua kustomisasi warna/font/breakpoint lewat `@theme`.

### Komponen

- Bentuk/warna tombol → [Button.jsx](src/components/Button.jsx) objek `variants` & `sizes`
- Sudut membulat → cari `rounded-2xl` / `rounded-lg` / `rounded-full` di komponen terkait
- Mode gelap: otomatis ikut setelan sistem. Setiap kelas `dark:...` di JSX mengatur
  tampilan gelapnya — ubah berpasangan dengan versi terangnya.

---

## 5. Menambah halaman baru (mis. "Tentang Kami")

Proyek ini tidak memakai React Router — perpindahan halaman diatur `useState` di
[App.jsx](src/App.jsx).

1. Buat `src/components/AboutPage.jsx` (contoh pola: lihat `OrdersPage.jsx`, terima prop `onBack`).
2. Di `App.jsx`: `import`, lalu tambahkan cabang di rantai `if/else if` yang menyusun `page`:
   `else if (currentPage === 'about') page = <AboutPage onBack={() => setCurrentPage('home')} />;`
3. Panggil `setCurrentPage('about')` dari tombol/menu mana pun.
4. (Opsional) kalau halaman ini perlu jadi salah satu tab utama, tambahkan juga entrinya di
   `TABS` — `src/components/BottomNav.jsx` — supaya muncul di tab bar bawah versi mobile.

---

## 6. Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `npm run dev` / `build` gagal, "Cannot find module" | dependency belum ter-install / berubah | `npm install` |
| `build` error `manualChunks is not a function` | format lama config Vite | sudah diperbaiki di `vite.config.js`; `manualChunks` harus berupa **fungsi** |
| `build` error `terser not found` | Vite 8 tak pakai terser | di `vite.config.js` pakai `minify: 'oxc'` (sudah diset) |
| `build` error `transformWithEsbuild ... esbuild` | sama seperti di atas | pastikan `minify: 'oxc'`, jangan `'terser'` / `'esbuild'` |
| Warna `gold`/`cream`/`ink` tidak muncul | token diedit di tempat salah | edit `@theme` di `src/index.css`, **bukan** `tailwind.config.js`. Restart `npm run dev` |
| Font judul jadi font biasa | gagal muat Google Fonts | cek koneksi & `<link>` di `index.html`; nama di `--font-display` harus sama persis |
| Kelas Tailwind baru "tidak jalan" | file di luar cakupan pindai | pastikan file ada di `src/**` (lihat `content` di `tailwind.config.js`), lalu restart dev server |
| Gambar galeri kosong setelah deploy | domain gambar diblokir CSP | tambahkan domain ke `img-src` di `public/_headers` |
| Setelah deploy semua "rusak"/blank | header/CSP host lain | sesuaikan `public/_headers` ke format host (Vercel: `vercel.json`), atau nonaktifkan sementara untuk isolasi masalah |
| Perubahan tak terlihat di browser | cache | hard-refresh (Ctrl+Shift+R); untuk build lama hapus folder `dist/` |
| Form pesanan / login / konsultasi tidak terkirim ke mana-mana, atau gagal fetch | `.env.local` (root) tidak diisi, atau backend `server/` tidak dijalankan | isi `VITE_ORDERS_API`/`VITE_CONSULT_API`/`VITE_BOOKINGS_API` di `.env.local` **dan** jalankan `cd server && npm run dev` (§9). Tanpa `.env.local`, frontend memang sengaja pakai data dummy — itu normal |
| Peringatan `oxlint` | gaya kode | `npm run lint` menampilkan file:baris; umumnya aman, rapikan bila sempat |

Kalau mentok: hapus `node_modules` + `dist`, lalu `npm install` ulang.

```bash
rm -rf node_modules dist
npm install
npm run build
```

---

## 7. Deploy

**Target saat ini: GitHub Pages** (user site `bajoel32.github.io`, `base: '/'` di
`vite.config.js`). Alurnya otomatis lewat [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. Push ke `main` → workflow jalan `npm ci` + `npm run build` + `actions/deploy-pages`.
2. Di repo: **Settings → Pages → "Enforce HTTPS"** (GitHub menangani redirect HTTP→HTTPS + HSTS untuk `*.github.io`).
3. (Opsional) set secret `VITE_SALES_PASSPHRASE_SHA256` untuk gerbang panel sales.

> **`public/_headers` TIDAK dibaca GitHub Pages.** CSP di file itu hanya berlaku bila
> dipindah ke **Netlify / Cloudflare Pages** (dipakai otomatis), **Vercel** (`vercel.json` →
> `headers`), atau **Nginx/Apache** (`add_header` / `.htaccess`). Detail: [SECURITY.md](docs/konsultasi-ai/SECURITY.md).

Manual (hosting lain): `npm run build`, lalu upload isi `dist/`. Cek header di <https://securityheaders.com>.

---

## 8. Keamanan

Hasil audit frontend + backend, apa yang sudah diamankan, dan **checklist gap yang
masih terbuka** ada di **[SECURITY.md](docs/konsultasi-ai/SECURITY.md)**.

Intinya: form punya validasi klien + honeypot, dan `server/` memvalidasi ulang semua
input (`zod`), pakai CORS allowlist, rate limit per endpoint, bcrypt, token sesi acak,
enkripsi data pelanggan at-rest (AES-256-GCM), guard rail 4 lapis di chatbot, dan
verifikasi kepemilikan (nama + HP) pada `cekStatusPesanan`. Gap terbesar yang masih
terbuka: sesi masih Bearer token di `sessionStorage` (bukan cookie `HttpOnly`), dan
penyimpanan masih JSON file / Postgres satu proses — detail & prioritas di
[SECURITY.md](docs/konsultasi-ai/SECURITY.md) §2.

## 9. Backend

Backend **sudah ada** di [`server/`](server/) (Node + Express; penyimpanan JSON file
untuk dev lokal, atau Postgres bila `DATABASE_URL` diisi — mis. di Render).

```bash
cd server
cp .env.example .env
npm install
npm run seed          # isi data dummy (60 konsumen dll.) — cetak akun demo
npm run dev           # http://localhost:8787
```

Frontend otomatis memakainya lewat [`.env.local`](.env.local) di root
(`VITE_ORDERS_API`, `VITE_CONSULT_API`, `VITE_BOOKINGS_API`, `VITE_GALLERY_API`).
Hapus `.env.local` untuk kembali ke mode dummy tanpa server. Chatbot memakai
Claude bila `ANTHROPIC_API_KEY` diisi di `server/.env`; jika kosong → fallback kata kunci.

| Fitur | Endpoint | Status & dokumen |
|---|---|---|
| Form pemesanan | `POST /api/bookings` | ✅ jalan — [BACKEND.md](docs/konsultasi-ai/BACKEND.md) §2 |
| Portal pesanan (login) | `POST /api/auth/login`, `GET /api/my-orders` | ✅ jalan (bcrypt, bukan OTP) — [ORDERS-AUTH.md](docs/konsultasi-ai/ORDERS-AUTH.md) |
| Chatbot Konsultasi (RAG + Claude) | `POST /api/consult` | ✅ jalan (soft-gate: Claude untuk sesi login, fallback kata kunci untuk anon) — [CHATBOT.md](docs/konsultasi-ai/CHATBOT.md) |
| Galeri | `GET /api/gallery` (baca) · `POST/PUT/DELETE /api/admin/gallery` (tulis, sesi admin) | ✅ jalan (tampil di `GalleryPage.jsx`); unggah masih metadata-only (URL gambar, belum upload file) |
| Admin hub | `/api/admin/*` | ✅ jalan (app terpisah `srikandi-admin`) — [server/README.md](server/README.md) |
| Header & keamanan host | — | [SECURITY.md](docs/konsultasi-ai/SECURITY.md) |

Checklist lengkap (apa yang selesai vs. sisa untuk produksi): **[BACKEND.md](docs/konsultasi-ai/BACKEND.md)**,
detail server: **[server/README.md](server/README.md)**, diagram alur & skema
data (cara semua terhubung): **[API-SCHEMA.md](docs/konsultasi-ai/API-SCHEMA.md)**.
