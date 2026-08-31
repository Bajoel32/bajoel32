// Data pesanan per-konsumen + autentikasi.
//
// Halaman "Lihat Pesanan" kini PRIVAT: konsumen harus login untuk melihat
// progres pesanannya sendiri. Selama backend belum ada, semuanya dummy —
// 60 konsumen dibangkitkan secara deterministik (stabil setiap reload).
//
// Kontrak backend yang harus dibuat: lihat ORDERS-AUTH.md
//   POST /api/auth/login   { phone, password }        -> { token, customer }
//   GET  /api/my-orders    Authorization: Bearer <t>  -> { orders: [...] }

const AUTH_API = import.meta.env.VITE_ORDERS_API || ''; // mis. "/api" saat backend siap
const SESSION_KEY = 'srikandi_session';

/* ----------------------------- generator dummy ---------------------------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Siti', 'Rini', 'Maya', 'Dewi', 'Anita', 'Budi', 'Andi', 'Rina', 'Putri', 'Sri',
  'Agus', 'Fitri', 'Nia', 'Hendra', 'Yuni', 'Bagus', 'Intan', 'Rizki', 'Sari', 'Dian',
  'Eka', 'Wulan', 'Tono', 'Joko', 'Ratna', 'Ayu', 'Bayu', 'Citra', 'Lestari', 'Wayan',
];
const LAST = [
  'Nurhaliza', 'Sulistyo', 'Kusuma', 'Lestari', 'Wijaya', 'Santoso', 'Pratama', 'Hidayat',
  'Saputra', 'Anggraini', 'Puspita', 'Maharani', 'Permata', 'Halim', 'Gunawan', 'Utami',
  'Wibowo', 'Rahayu', 'Setiawan', 'Firmansyah',
];
const SERVICES = ['Cuci Emas', 'Pasang Berlian', 'Patri Emas', 'Chrome Putih', 'Custom Cincin', 'Reparasi Kalung'];
const PURITY = [70, 75, 80];

const pad = (n, len) => String(n).padStart(len, '0');

function buildCustomers() {
  const list = [];
  let orderSeq = 1;

  for (let i = 0; i < 60; i++) {
    const rng = mulberry32(1000 + i);
    const name = `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`;
    const phone = `0812${pad(Math.floor(rng() * 1e8), 8)}`;
    const password = pad(Math.floor(rng() * 1e6), 6); // kode akses 6 digit (dummy)

    const nOrders = 1 + Math.floor(rng() * 3);
    const orders = [];
    for (let k = 0; k < nOrders; k++) {
      const r = rng();
      let status;
      let progress;
      if (r < 0.18) {
        status = 'Belum Dimulai';
        progress = 0;
      } else if (r < 0.34) {
        status = 'Menunggu Approval';
        progress = 10 + Math.floor(rng() * 15);
      } else if (r < 0.78) {
        status = 'Sedang Dikerjakan';
        progress = 30 + Math.floor(rng() * 60);
      } else {
        status = 'Selesai';
        progress = 100;
      }
      const month = 6 + Math.floor(rng() * 3); // Jun–Aug 2026
      const day = 1 + Math.floor(rng() * 27);
      orders.push({
        id: orderSeq,
        orderNumber: `SR-${pad(orderSeq, 3)}-2026`,
        serviceName: SERVICES[Math.floor(rng() * SERVICES.length)],
        goldPurity: PURITY[Math.floor(rng() * PURITY.length)],
        progress,
        status,
        createdDate: `2026-${pad(month, 2)}-${pad(day, 2)}`,
      });
      orderSeq++;
    }
    orders.sort((a, b) => b.createdDate.localeCompare(a.createdDate));

    list.push({ id: i + 1, name, phone, password, orders });
  }
  return list;
}

const CUSTOMERS = buildCustomers();

// Akun demo untuk mencoba UI (tampil di layar login saat mode dummy).
export const demoAccount = AUTH_API
  ? null
  : { phone: CUSTOMERS[0].phone, password: CUSTOMERS[0].password, name: CUSTOMERS[0].name };

export const dummyStats = { customers: CUSTOMERS.length };

/* ------------------------------- helpers --------------------------------- */

function normalizePhone(input) {
  let p = String(input).replace(/[\s-]/g, '');
  if (p.startsWith('+62')) p = `0${p.slice(3)}`;
  else if (p.startsWith('62')) p = `0${p.slice(2)}`;
  return p;
}

function publicCustomer(c) {
  return { id: c.id, name: c.name, phone: c.phone };
}

/* ------------------------------- session --------------------------------- */

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* private mode / storage penuh — abaikan, sesi hanya di memori */
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* abaikan */
  }
}

/* --------------------------------- API ----------------------------------- */

/**
 * @returns {Promise<{token:string, customer:{id:number,name:string,phone:string}}>}
 */
export async function loginCustomer({ phone, password }) {
  const p = normalizePhone(phone);
  const pass = String(password).trim();

  if (AUTH_API) {
    const res = await fetch(`${AUTH_API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ phone: p, password: pass }),
    });
    if (res.status === 401) throw new Error('Nomor HP atau kata sandi salah.');
    if (!res.ok) throw new Error('Gagal masuk. Coba lagi nanti.');
    const data = await res.json();
    saveSession(data);
    return data;
  }

  // dummy
  await new Promise((r) => setTimeout(r, 350)); // tiru latensi jaringan
  const match = CUSTOMERS.find((c) => c.phone === p && c.password === pass);
  if (!match) throw new Error('Nomor HP atau kata sandi salah.');
  const session = { token: `dummy.${match.id}`, customer: publicCustomer(match) };
  saveSession(session);
  return session;
}

/**
 * @returns {Promise<Array>} pesanan milik pemegang token (hanya miliknya).
 */
export async function getMyOrders(session) {
  if (!session?.token) throw new Error('Sesi tidak valid. Silakan masuk kembali.');

  if (AUTH_API) {
    const res = await fetch(`${AUTH_API}/my-orders`, {
      headers: { Authorization: `Bearer ${session.token}` },
      credentials: 'same-origin',
    });
    if (res.status === 401) throw new Error('Sesi berakhir. Silakan masuk kembali.');
    if (!res.ok) throw new Error('Gagal memuat pesanan.');
    const data = await res.json();
    return data.orders || [];
  }

  // dummy
  await new Promise((r) => setTimeout(r, 300));
  const id = Number(String(session.token).split('.')[1]);
  const customer = CUSTOMERS.find((c) => c.id === id);
  return customer ? customer.orders : [];
}
