// Implementasi function/tool untuk chatbot. Dipakai baik oleh loop Claude
// maupun oleh fallback kata kunci.
import { db } from '../db.js';
import { config } from '../config.js';
import { normalizePhone } from './phone.js';

export function infoLayanan({ layanan } = {}) {
  const all = db.all('services');
  const list = layanan
    ? all.filter((s) => s.name.toLowerCase().includes(String(layanan).toLowerCase()))
    : all;
  return (list.length ? list : all).map((s) => ({ id: s.id, icon: s.icon, name: s.name }));
}

const normName = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Cocok bila kata-kata `given` semuanya ada di `actual`, ATAU sebaliknya.
// Arah kedua menampung kasus fallback (seluruh isi pesan dilewatkan sebagai `given`).
function nameMatches(given, actual) {
  const g = normName(given).split(' ').filter(Boolean);
  const a = normName(actual).split(' ').filter(Boolean);
  if (!g.length || !a.length) return false;
  const gs = new Set(g);
  const as = new Set(a);
  return a.every((t) => gs.has(t)) || g.every((t) => as.has(t));
}

// Verifikasi kepemilikan WAJIB: nomor pesanan + nama pemesan + HP terdaftar.
// Tanpa ketiganya cocok, TIDAK mengembalikan detail apa pun (termasuk nama).
export function cekStatusPesanan({ nomorPesanan, nama, hp } = {}) {
  const num = String(nomorPesanan || '').trim();
  if (!num) return { needVerification: true };

  const o = db.all('orders').find((x) => x.orderNumber.toLowerCase() === num.toLowerCase());
  if (!o) return { notFound: num };

  if (!nama || !hp) return { needVerification: true, orderNumber: o.orderNumber };

  const cust = db.all('customers').find((c) => c.id === o.customerId);
  const okName = nameMatches(nama, o.customerName);
  const okPhone = Boolean(cust) && normalizePhone(hp) === cust.phone;
  if (!okName || !okPhone) return { mismatch: true, orderNumber: o.orderNumber };

  return {
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    status: o.status,
    progress: o.progress,
    goldPurity: o.goldPurity,
  };
}

export function rekomendasiGaleri({ kategori, budgetMax } = {}) {
  let items = db.all('gallery');
  if (kategori) items = items.filter((g) => (g.category || '').toLowerCase() === String(kategori).toLowerCase());
  if (budgetMax) items = items.filter((g) => !g.price || g.price <= budgetMax * 1.1);
  return items.slice(0, 3).map((g) => ({ id: g.id, title: g.title, price: g.price, image: g.image }));
}

export function eskalasiKeAdmin({ alasan, ringkasan } = {}) {
  const base = config.whatsappBase;
  const text = encodeURIComponent(
    `Halo admin Srikandi, saya butuh bantuan.\n${ringkasan || alasan || ''}`.trim(),
  );
  return {
    reason: alasan || 'Perlu bantuan admin',
    channel: 'whatsapp',
    contact: base ? `${base}${base.includes('?') ? '&' : '?'}text=${text}` : null,
  };
}

export const LABELS = {
  infoLayanan: 'Info Layanan',
  cekStatusPesanan: 'Status Pesanan',
  rekomendasiGaleri: 'Rekomendasi Galeri',
};
