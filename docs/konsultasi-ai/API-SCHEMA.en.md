# API Schema & Diagrams — Srikandi

*(English version of [API-SCHEMA.md](API-SCHEMA.md) — the Indonesian file is the
original; keep both in sync if the API changes.)*

A visual map of how the frontend ([`src/`](src/)) connects to the backend
([`server/`](server/)): which env var points to which endpoint, the
request/response shape of each endpoint, the step-by-step flow of each
feature, and the shape of the data in the JSON store. For status/security
checklists, see [BACKEND.md](BACKEND.md) and [SECURITY.md](SECURITY.md) —
this document focuses on **shape & flow**, not done/not-done status.

> Diagrams use [Mermaid](https://mermaid.js.org) — rendered automatically on
> GitHub, in VS Code (with the Markdown Preview Mermaid extension), and in
> Claude Code.

---

## 1. Connection map — env var ↔ file ↔ endpoint

This is the most important part for "wiring things up": every frontend
feature is connected to the backend through **one env var**, read by **one
config file**, calling **one route** on the server. Without the env var set,
the frontend automatically falls back to local dummy data (no error).

| UI feature | Env var (`.env.local`, project root) | Read in | Calls endpoint | If the env var is empty |
|---|---|---|---|---|
| "Buat Janji" booking form ([BookingPage.jsx](src/components/BookingPage.jsx)) | `VITE_BOOKINGS_API` | [BookingForm.jsx](src/components/BookingForm.jsx) | `POST {VITE_BOOKINGS_API}` | Form doesn't submit, just `console.debug`s the payload |
| Login + "Lihat Pesanan" (orders) ([OrdersPage.jsx](src/components/OrdersPage.jsx)) | `VITE_ORDERS_API` | [config/orders.js](src/config/orders.js) | `POST {VITE_ORDERS_API}/auth/login`<br>`GET {VITE_ORDERS_API}/my-orders` | Uses 60 deterministic dummy customers (see ORDERS-AUTH.md) |
| "Konsultasi" chat ([ConsultationPage.jsx](src/components/ConsultationPage.jsx)) | `VITE_CONSULT_API` | [config/consultation.js](src/config/consultation.js) | `POST {VITE_CONSULT_API}` | Uses `mockConsult()` — local keyword matching against `site.js` |
| Gallery ([GalleryPage.jsx](src/components/GalleryPage.jsx)) | `VITE_GALLERY_API` | [config/gallery.js](src/config/gallery.js) | `GET {VITE_GALLERY_API}` | Uses `siteConfig.galleries` (static data in `site.js`) |

The backend itself (`server/.env`) has its own, separate set of env vars —
see §7.

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

## 2. Overall architecture

```mermaid
flowchart TB
    Browser["Browser<br/>React 19 + Vite (static frontend)"]

    subgraph Server["server/ — Node + Express (:8787)"]
        MW["Middleware<br/>helmet · CORS allowlist · rate limit · express.json 32kb"]
        Routes["Routes<br/>bookings · auth · orders · consult · gallery"]
        Lib["lib/<br/>validate (zod) · auth (sessions) · tools · claude · rag · phone"]
        DB[("db.js<br/>one JSON file per table<br/>server/data/*.json")]
    end

    Claude["Anthropic Claude API<br/>(optional — ANTHROPIC_API_KEY)"]
    WA["WhatsApp<br/>wa.me deep link"]

    Browser -->|"fetch JSON (Bearer token if logged in)"| MW --> Routes --> Lib --> DB
    Lib -->|"messages.create() — tool-calling loop"| Claude
    Routes -->|"escalate.contact / eskalasiKeAdmin"| WA
```

---

## 3. Endpoints — request & response shape

Full field definitions live in the `zod` schemas —
[`server/src/lib/validate.js`](server/src/lib/validate.js).

| # | Endpoint | Auth | Rate limit | Request | Success response |
|---|---|---|---|---|---|
| 1 | `GET /api/health` | — | global 120/min | — | `{ ok: true, ts }` |
| 2 | `POST /api/bookings` | — | 5/min/IP | `{customerName, phoneNumber, email, selectedService, serviceDetails, quantity, estimatedDate, notes?, preferredPayment: "DP"\|"FULL", website?}` (honeypot) | `201 { ok: true, ref: "BK-XXXXXXXX" }` |
| 3 | `POST /api/auth/login` | — | 10/10min/IP | `{phone, password}` | `200 { token, customer: {id, name, phone} }` |
| 4 | `POST /api/auth/logout` | Bearer | global | — | `200 { ok: true }` |
| 5 | `GET /api/my-orders` | Bearer | global | — | `200 { orders: [{id, orderNumber, serviceName, goldPurity, progress, status, createdDate}] }` — **only the token holder's own orders** |
| 6 | `POST /api/consult` | — | 20/min/IP | `{messages: [{role: "user"\|"assistant", content}], …}` (max 30 messages, 4000 chars/message) | `200 { reply, sources?, functions?, escalate? }` |
| 7 | `GET /api/gallery` | — | global | — | `200 { items: [...] }` |
| 8 | `POST /api/gallery` | Bearer = `ADMIN_TOKEN` | global | `{title, image, description?, category?, price?, tags?}` | `201 { ok: true, item }` |

Common errors: `400` (validation failed), `401` (auth failed/expired), `404`
(route not found), `429` (rate limited), `500` (`{ error: "Terjadi kesalahan
di server." }` — no stack trace leaked, see SECURITY.md §2).

---

## 4. Per-feature flow (sequence diagrams)

### 4.1 Booking form

```mermaid
sequenceDiagram
    participant U as Visitor
    participant FE as BookingForm.jsx
    participant API as POST /api/bookings
    participant DB as data/bookings.json

    U->>FE: fill form, submit
    FE->>FE: client-side validation (format, maxLength)
    FE->>API: fetch POST (Content-Type: json)
    API->>API: zod validate + check `website` honeypot
    alt honeypot filled (bot)
        API-->>FE: 200 {ok:true, ref:"SKIPPED"} (silently dropped, not stored)
    else valid
        API->>DB: insert booking + ref BK-xxxxxxxx
        API-->>FE: 201 {ok:true, ref}
        FE-->>U: show confirmation + ref
    end
```

### 4.2 Login + view orders

```mermaid
sequenceDiagram
    participant U as Customer
    participant FE as OrdersPage.jsx
    participant AUTH as POST /api/auth/login
    participant ORD as GET /api/my-orders
    participant DB as customers.json / sessions.json / orders.json

    U->>FE: phone number + password
    FE->>AUTH: POST {phone, password}
    AUTH->>DB: find customer by phone
    AUTH->>AUTH: bcrypt.compare (dummy hash if not found, to equalize timing)
    alt wrong
        AUTH-->>FE: 401 "Nomor HP atau kata sandi salah."
    else correct
        AUTH->>DB: insert sessions {token, customerId, expiresAt}
        AUTH-->>FE: 200 {token, customer}
        FE->>FE: store token in sessionStorage
        FE->>ORD: GET, header Authorization: Bearer <token>
        ORD->>DB: getSession(token) → filter orders by customerId
        ORD-->>FE: 200 {orders: [...]}
        FE-->>U: render list of OrderCard
    end
```

### 4.3 Consultation (chatbot, with tool-calling)

```mermaid
sequenceDiagram
    participant U as Visitor
    participant FE as ConsultationPage.jsx
    participant API as POST /api/consult
    participant RAG as lib/rag.js
    participant CL as Claude API
    participant T as lib/tools.js

    U->>FE: send message
    FE->>API: POST {messages}
    API->>RAG: retrieve(last message) → relevant kb.json chunks
    alt ANTHROPIC_API_KEY empty
        API->>API: fallbackConsult() — keyword matching
        API-->>FE: {reply, functions?, escalate?, sources}
    else API key present
        API->>CL: messages.create(system + RAG context + history + TOOLS)
        loop up to 4 hops
            CL-->>API: tool_use? (infoLayanan/cekStatusPesanan/rekomendasiGaleri/eskalasiKeAdmin)
            API->>T: run the local function
            T-->>API: result (from data/*.json)
            API->>CL: send tool_result, ask to continue
        end
        CL-->>API: final answer text
        API-->>FE: {reply, sources, functions, escalate?}
    end
    FE-->>U: render text bubble + function cards + WhatsApp button if escalated
```

> Important UI rule: `reply` **must not** repeat, as text, a list that is
> already present in `functions[].data` — see [CHATBOT.md](CHATBOT.md).

### 4.4 Add a gallery item (admin)

```mermaid
sequenceDiagram
    participant A as Admin/Sales
    participant Tool as curl / Postman / internal panel
    participant API as POST /api/gallery
    participant DB as gallery.json

    A->>Tool: prepare {title, image, ...} + ADMIN_TOKEN
    Tool->>API: POST, header Authorization: Bearer <ADMIN_TOKEN>
    API->>API: timingSafeEqual(token, ADMIN_TOKEN)
    alt wrong/empty token
        API-->>Tool: 401 "Perlu token admin."
    else correct token
        API->>API: zod validate (gallerySchema)
        API->>DB: insert {id: uuid, uploadedDate, ...}
        API-->>Tool: 201 {ok:true, item}
    end
```

---

## 5. Data schema (`server/data/*.json`)

Storage isn't SQL — each "table" is one JSON file holding an array of
objects (`server/src/db.js`). The relationships below are drawn for clarity,
not enforced as real foreign keys.

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
        string selectedService "service id, as string"
        string serviceName "copied from services at insert time"
        string serviceDetails
        int quantity
        string estimatedDate
        string notes
        string preferredPayment "DP · FULL"
        string ip
        string status "baru (new)"
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
        string text "retrieved by RAG via keyword matching"
    }
```

`ORDERS.orderNumber` is used by the chatbot (`cekStatusPesanan`) to look up
an order **across all customers** — there's no `customerId` check on this
path, unlike `GET /api/my-orders` which is already safe. Risk details in
[SECURITY.md](SECURITY.md) §2.

---

## 6. Session lifecycle (auth)

```mermaid
stateDiagram-v2
    [*] --> LoggedOut
    LoggedOut --> LoggingIn: POST /api/auth/login (correct)
    LoggingIn --> LoggedIn: token stored in sessionStorage (client)\n+ row in sessions.json (server)
    LoggedIn --> LoggedIn: GET /api/my-orders (valid Bearer)
    LoggedIn --> LoggedOut: POST /api/auth/logout\n(deleted on server + client)
    LoggedIn --> LoggedOut: token expired (past expiresAt)\nor tab closed (sessionStorage lost)
    note right of LoggedIn
        Sweeper (server/src/lib/auth.js)
        removes expired sessions every 15 minutes
    end note
```

---

## 7. Environment variables — full map

### Frontend (`.env.local`, project root)

| Var | Example | Used in |
|---|---|---|
| `VITE_ORDERS_API` | `http://localhost:8787/api` | `config/orders.js` |
| `VITE_CONSULT_API` | `http://localhost:8787/api/consult` | `config/consultation.js` |
| `VITE_BOOKINGS_API` | `http://localhost:8787/api/bookings` | `components/BookingForm.jsx` |
| `VITE_GALLERY_API` | `http://localhost:8787/api/gallery` | `config/gallery.js` |

### Backend (`server/.env`, example in `server/.env.example`)

| Var | Example | Used in | Effect |
|---|---|---|---|
| `PORT` | `8787` | `config.js` | Server port |
| `NODE_ENV` | `development` / `production` | `config.js`, `index.js` | `production` enables the default-`ADMIN_TOKEN` startup warning |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:4173` | `middleware/security.js` | Allowlist of origins permitted to call the API |
| `SESSION_TTL` | `86400` (seconds) | `lib/auth.js` | Session token lifetime |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (leave empty for fallback) | `lib/claude.js` | Enables Claude; empty → local keyword-based answers |
| `ANTHROPIC_MODEL` | `claude-opus-5` | `lib/claude.js` | Model to call |
| `WHATSAPP_BASE` | `https://wa.me/6281234567890` | `lib/tools.js` (`eskalasiKeAdmin`) | Target of the admin-escalation deep link |
| `ADMIN_TOKEN` | change from the example! | `routes/gallery.js` | Bearer token for `POST /api/gallery` |

**Setup from scratch:**

```bash
# 1) Backend
cd server
cp .env.example .env      # fill in a real ADMIN_TOKEN, etc.
npm install
npm run seed               # populate dummy data + print demo accounts
npm run dev                # -> http://localhost:8787

# 2) Frontend (separate terminal, from the project root)
# create .env.local with the 4 VITE_* vars from the §7 table above (no .example file for it)
npm install
npm run dev                # -> http://localhost:5173
```

Without `.env.local` in the root, the frontend still runs fully on dummy
data (no errors) — handy for demoing the UI without running `server/` at
all.
