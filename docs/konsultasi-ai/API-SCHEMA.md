# Skema & Diagram API — Srikandi

Peta visual bagaimana frontend ([`src/`](src/)) terhubung ke backend
([`server/`](server/)): env var apa mengarah ke endpoint apa, bentuk
request/response tiap endpoint, alur tiap fitur langkah-demi-langkah, dan
bentuk data di penyimpanan JSON. Untuk checklist status & keamanan, lihat
[BACKEND.md](BACKEND.md) dan [SECURITY.md](SECURITY.md) — dokumen ini fokus
ke **bentuk & alur**, bukan status selesai/belum.

> Diagram pakai [Mermaid](https://mermaid.js.org) — tampil otomatis di GitHub,
> VS Code (ekstensi Markdown Preview Mermaid), dan Claude Code.

---

## 1. Peta koneksi — env var ↔ file ↔ endpoint

Ini bagian paling penting untuk "menghandel & mengkoneksikan": tiap fitur
frontend dihubungkan ke backend lewat **satu env var**, dibaca oleh **satu
file config**, memanggil **satu route** di server. Tanpa env var-nya diisi,
frontend otomatis jatuh ke data dummy lokal (tidak error).

| Fitur UI | Env var (`.env.local` root) | Dibaca di | Memanggil endpoint | Kalau env var kosong |
|---|---|---|---|---|
| Form "Buat Janji" ([BookingPage.jsx](src/components/BookingPage.jsx)) | `VITE_BOOKINGS_API` | [BookingForm.jsx](src/components/BookingForm.jsx) | `POST {VITE_BOOKINGS_API}` | Form tidak mengirim, cuma `console.debug` payload |
| Login + "Lihat Pesanan" ([OrdersPage.jsx](src/components/OrdersPage.jsx)) | `VITE_ORDERS_API` | [config/orders.js](src/config/orders.js) | `POST {VITE_ORDERS_API}/auth/login`<br>`GET {VITE_ORDERS_API}/my-orders` | Pakai 60 konsumen dummy deterministik (lihat ORDERS-AUTH.md) |
| Chat "Konsultasi" ([ConsultationPage.jsx](src/components/ConsultationPage.jsx)) | `VITE_CONSULT_API` | [config/consultation.js](src/config/consultation.js) | `POST {VITE_CONSULT_API}` | Pakai `mockConsult()` — pencocokan kata kunci lokal ke `site.js` |
| Galeri ([GalleryPage.jsx](src/components/GalleryPage.jsx)) | `VITE_GALLERY_API` | [config/gallery.js](src/config/gallery.js) | `GET {VITE_GALLERY_API}` | Pakai `siteConfig.galleries` (data statis di `site.js`) |

Backend sendiri (`server/.env`) punya env var terpisah — lihat §5.

```mermaid
flowchart LR
    subgraph Frontend["Browser — React (Vite :5173)"]
        BF[BookingForm.jsx]
        OC[config/orders.js]
        CC[config/consultation.js]
    end

    subgraph EnvLocal[".env.local (root)"]
        E1[VITE_BOOKINGS_API]
        E2[VITE_ORDERS_API]
        E3[VITE_CONSULT_API]
        E4[VITE_GALLERY_API]
    end

    subgraph Backend["server/ — Express (:8787)"]
        RB["POST /api/bookings"]
        RA["POST /api/auth/login"]
        RO["GET /api/my-orders"]
        RC["POST /api/consult"]
        RG["GET /api/gallery"]
    end

    GC[config/gallery.js]

    BF -.reads.-> E1 -->|fetch| RB
    OC -.reads.-> E2 -->|fetch| RA
    OC -.reads.-> E2 -->|fetch| RO
    CC -.reads.-> E3 -->|fetch| RC
    GC -.reads.-> E4 -->|fetch| RG
```

---

## 2. Arsitektur keseluruhan

```mermaid
flowchart TB
    Browser["Browser<br/>React 19 + Vite (frontend statis)"]

    subgraph Server["server/ — Node + Express (:8787)"]
        MW["Middleware<br/>helmet · CORS allowlist · rate limit · express.json 32kb"]
        Routes["Routes<br/>bookings · auth · orders · consult · gallery"]
        Lib["lib/<br/>validate (zod) · auth (sesi) · tools · claude · rag · phone"]
        DB[("db.js<br/>JSON file per tabel<br/>server/data/*.json")]
    end

    Claude["Anthropic Claude API<br/>(opsional — ANTHROPIC_API_KEY)"]
    WA["WhatsApp<br/>wa.me deep link"]

    Browser -->|"fetch JSON (Bearer token bila login)"| MW --> Routes --> Lib --> DB
    Lib -->|"messages.create() — tool-calling loop"| Claude
    Routes -->|"escalate.contact / eskalasiKeAdmin"| WA
```

---

## 3. Endpoint — bentuk request & response

Field lengkap ada di skema `zod` — [`server/src/lib/validate.js`](server/src/lib/validate.js).

| # | Endpoint | Auth | Rate limit | Request | Response sukses |
|---|---|---|---|---|---|
| 1 | `GET /api/health` | — | global 120/mnt | — | `{ ok: true, ts }` |
| 2 | `POST /api/bookings` | — | 5/mnt/IP | `{customerName, phoneNumber, email, selectedService, serviceDetails, quantity, estimatedDate, notes?, preferredPayment: "DP"\|"FULL", website?}` (honeypot) | `201 { ok: true, ref: "BK-XXXXXXXX" }` |
| 3 | `POST /api/auth/login` | — | 10/10mnt/IP | `{phone, password}` | `200 { token, customer: {id, name, phone} }` |
| 4 | `POST /api/auth/logout` | Bearer | global | — | `200 { ok: true }` |
| 5 | `GET /api/my-orders` | Bearer | global | — | `200 { orders: [{id, orderNumber, serviceName, goldPurity, progress, status, createdDate}] }` — **hanya milik pemegang token** |
| 6 | `POST /api/consult` | — | 20/mnt/IP | `{messages: [{role: "user"\|"assistant", content}], …}` (maks 30 pesan, 4000 char/pesan) | `200 { reply, sources?, functions?, escalate? }` |
| 7 | `GET /api/gallery` | — | global | — | `200 { items: [...] }` |
| 8 | `POST /api/gallery` | Bearer = `ADMIN_TOKEN` | global | `{title, image, description?, category?, price?, tags?}` | `201 { ok: true, item }` |

Error umum: `400` (validasi gagal), `401` (auth gagal/kedaluwarsa), `404`
(route tak ada), `429` (rate limit), `500` (`{ error: "Terjadi kesalahan di
server." }` — tanpa stack trace, lihat SECURITY.md §2).

---

## 4. Alur tiap fitur (sequence diagram)

### 4.1 Form pemesanan

```mermaid
sequenceDiagram
    participant U as Pengunjung
    participant FE as BookingForm.jsx
    participant API as POST /api/bookings
    participant DB as data/bookings.json

    U->>FE: isi form, submit
    FE->>FE: validasi klien (format, maxLength)
    FE->>API: fetch POST (Content-Type: json)
    API->>API: zod validate + cek honeypot `website`
    alt honeypot terisi (bot)
        API-->>FE: 200 {ok:true, ref:"SKIPPED"} (diam-diam tak disimpan)
    else valid
        API->>DB: insert booking + ref BK-xxxxxxxx
        API-->>FE: 201 {ok:true, ref}
        FE-->>U: tampilkan konfirmasi + ref
    end
```

### 4.2 Login + lihat pesanan

```mermaid
sequenceDiagram
    participant U as Konsumen
    participant FE as OrdersPage.jsx
    participant AUTH as POST /api/auth/login
    participant ORD as GET /api/my-orders
    participant DB as customers.json / sessions.json / orders.json

    U->>FE: nomor HP + kata sandi
    FE->>AUTH: POST {phone, password}
    AUTH->>DB: cari customer by phone
    AUTH->>AUTH: bcrypt.compare (dummy-hash bila tak ketemu, samakan timing)
    alt salah
        AUTH-->>FE: 401 "Nomor HP atau kata sandi salah."
    else benar
        AUTH->>DB: insert sessions {token, customerId, expiresAt}
        AUTH-->>FE: 200 {token, customer}
        FE->>FE: simpan token di sessionStorage
        FE->>ORD: GET, header Authorization: Bearer <token>
        ORD->>DB: getSession(token) → filter orders by customerId
        ORD-->>FE: 200 {orders: [...]}
        FE-->>U: render daftar OrderCard
    end
```

### 4.3 Konsultasi (chatbot, dengan tool-calling)

```mermaid
sequenceDiagram
    participant U as Pengunjung
    participant FE as ConsultationPage.jsx
    participant API as POST /api/consult
    participant RAG as lib/rag.js
    participant CL as Claude API
    participant T as lib/tools.js

    U->>FE: kirim pesan
    FE->>API: POST {messages}
    API->>RAG: retrieve(pesan terakhir) → potongan kb.json relevan
    alt ANTHROPIC_API_KEY kosong
        API->>API: fallbackConsult() — cocokkan kata kunci
        API-->>FE: {reply, functions?, escalate?, sources}
    else ada API key
        API->>CL: messages.create(system + konteks RAG + riwayat + TOOLS)
        loop maks 4 hop
            CL-->>API: tool_use? (infoLayanan/cekStatusPesanan/rekomendasiGaleri/eskalasiKeAdmin)
            API->>T: jalankan fungsi lokal
            T-->>API: hasil (dari data/*.json)
            API->>CL: kirim tool_result, minta lanjut
        end
        CL-->>API: teks jawaban akhir
        API-->>FE: {reply, sources, functions, escalate?}
    end
    FE-->>U: render bubble teks + kartu functions + tombol WhatsApp bila escalate
```

> Catatan penting UI: `reply` **tidak boleh** mengulang daftar yang sudah ada
> di `functions[].data` sebagai teks — lihat [CHATBOT.md](CHATBOT.md).

### 4.4 Tambah item galeri (admin)

```mermaid
sequenceDiagram
    participant A as Admin/Sales
    participant Tool as curl / Postman / panel internal
    participant API as POST /api/gallery
    participant DB as gallery.json

    A->>Tool: siapkan {title, image, ...} + token ADMIN_TOKEN
    Tool->>API: POST, header Authorization: Bearer <ADMIN_TOKEN>
    API->>API: timingSafeEqual(token, ADMIN_TOKEN)
    alt token salah/kosong
        API-->>Tool: 401 "Perlu token admin."
    else token benar
        API->>API: zod validate (gallerySchema)
        API->>DB: insert {id: uuid, uploadedDate, ...}
        API-->>Tool: 201 {ok:true, item}
    end
```

---

## 5. Skema data (`server/data/*.json`)

Penyimpanan bukan SQL — tiap "tabel" adalah satu file JSON berisi array objek
(`server/src/db.js`). Relasi digambar di bawah untuk gambaran, bukan foreign
key sungguhan.

```mermaid
erDiagram
    CUSTOMERS ||--o{ ORDERS : "customerId"
    CUSTOMERS ||--o{ SESSIONS : "customerId"
    SERVICES  ||--o{ BOOKINGS : "selectedService (id, string)"

    CUSTOMERS {
        int id
        string name
        string phone
        string passwordHash "bcrypt"
    }
    ORDERS {
        int id
        int customerId
        string customerName
        string orderNumber "SR-NNN-YYYY"
        string serviceName
        int goldPurity
        int progress "0-100"
        string status "Belum Dimulai · Menunggu Approval · Sedang Dikerjakan · Selesai"
        string createdDate
    }
    SESSIONS {
        string token "PK, 256-bit random hex"
        int customerId
        number createdAt
        number expiresAt
    }
    SERVICES {
        int id
        string name
        string icon
        string description
    }
    BOOKINGS {
        string ref "PK, BK-XXXXXXXX"
        string createdAt
        string customerName
        string phoneNumber
        string email
        string selectedService "id layanan, string"
        string serviceName "disalin dari services saat insert"
        string serviceDetails
        int quantity
        string estimatedDate
        string notes
        string preferredPayment "DP · FULL"
        string ip
        string status "baru"
    }
    GALLERY {
        string id "PK, uuid"
        string title
        string description
        string image "URL"
        string category
        int price
        string_array tags
        string uploadedDate
    }
    KB {
        int id
        string title
        string text "di-retrieve RAG lewat kecocokan kata kunci"
    }
```

`ORDERS.orderNumber` dipakai chatbot (`cekStatusPesanan`) untuk mencari
pesanan **lintas semua konsumen** — belum ada pengecekan `customerId` di jalur
ini, beda dengan `GET /api/my-orders` yang sudah aman. Detail risikonya di
[SECURITY.md](SECURITY.md) §2.

---

## 6. Siklus hidup sesi (auth)

```mermaid
stateDiagram-v2
    [*] --> TidakLogin
    TidakLogin --> Login: POST /api/auth/login (benar)
    Login --> AdaSesi: token disimpan di sessionStorage (klien)\n+ baris di sessions.json (server)
    AdaSesi --> AdaSesi: GET /api/my-orders (Bearer valid)
    AdaSesi --> TidakLogin: POST /api/auth/logout\n(hapus di server + klien)
    AdaSesi --> TidakLogin: token kedaluwarsa (expiresAt lewat)\natau tab ditutup (sessionStorage hilang)
    note right of AdaSesi
        Sweeper (server/src/lib/auth.js)
        hapus sesi kedaluwarsa tiap 15 menit
    end note
```

---

## 7. Variabel environment — peta lengkap

### Frontend (`.env.local` di root project)

| Var | Contoh | Dipakai di |
|---|---|---|
| `VITE_ORDERS_API` | `http://localhost:8787/api` | `config/orders.js` |
| `VITE_CONSULT_API` | `http://localhost:8787/api/consult` | `config/consultation.js` |
| `VITE_BOOKINGS_API` | `http://localhost:8787/api/bookings` | `components/BookingForm.jsx` |
| `VITE_GALLERY_API` | `http://localhost:8787/api/gallery` | `config/gallery.js` |

### Backend (`server/.env`, contoh di `server/.env.example`)

| Var | Contoh | Dipakai di | Efek |
|---|---|---|---|
| `PORT` | `8787` | `config.js` | Port server |
| `NODE_ENV` | `development` / `production` | `config.js`, `index.js` | `production` mengaktifkan peringatan `ADMIN_TOKEN` default |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:4173` | `middleware/security.js` | Whitelist origin yang boleh fetch API |
| `SESSION_TTL` | `86400` (detik) | `lib/auth.js` | Masa berlaku token sesi |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (kosongkan untuk fallback) | `lib/claude.js` | Aktifkan Claude; kosong → jawaban kata kunci lokal |
| `ANTHROPIC_MODEL` | `claude-opus-5` | `lib/claude.js` | Model yang dipanggil |
| `WHATSAPP_BASE` | `https://wa.me/6281234567890` | `lib/tools.js` (`eskalasiKeAdmin`) | Tujuan deep-link eskalasi admin |
| `ADMIN_TOKEN` | ganti dari contoh! | `routes/gallery.js` | Bearer token untuk `POST /api/gallery` |

**Alur setup dari nol:**

```bash
# 1) Backend
cd server
cp .env.example .env      # isi ADMIN_TOKEN sungguhan, dst.
npm install
npm run seed               # isi data dummy + cetak akun demo
npm run dev                # -> http://localhost:8787

# 2) Frontend (terminal lain, dari root project)
# buat .env.local berisi 4 var VITE_* di tabel §7 di atas (tidak ada file .example-nya)
npm install
npm run dev                # -> http://localhost:5173
```

Tanpa `.env.local` di root, frontend tetap jalan penuh dengan data dummy
(tidak error) — cocok untuk demo UI tanpa menjalankan `server/` sama sekali.
