// Konfigurasi + "jembatan" ke backend untuk fitur Konsultasi (asisten AI).
//
// Arsitektur target (lihat CHATBOT.md):
//   Browser  ->  POST /api/consult  ->  [RAG: ambil konteks dari basis pengetahuan]
//                                   ->  [LLM Claude + function calling]
//                                   ->  [eksekusi function: cek harga / status / galeri]
//                                   ->  jawaban akhir + daftar sumber
//
// Selama backend belum ada, `sendConsultation()` otomatis memakai `mockConsult()`
// supaya halaman tetap bisa dicoba & jadi contoh bentuk data yang diharapkan.

import { siteConfig } from './site';
import { loadSession } from './orders';

// Isi lewat .env (VITE_CONSULT_API=https://api.tokomu.com/consult) saat backend siap.
const ENDPOINT = import.meta.env.VITE_CONSULT_API || '';

export const consultationConfig = {
  assistantName: 'Asisten Srikandi',
  whatsapp: siteConfig.whatsapp,
  intro:
    'Halo! Saya asisten AI Srikandi. Tanyakan apa saja soal layanan, ' +
    'status pesanan, atau minta rekomendasi perhiasan dari galeri kami.',
  disclaimer:
    'Jawaban dihasilkan AI dan bisa keliru. Konfirmasi biaya, estimasi waktu, & ketersediaan akhir dengan staf kami.',
  starters: [
    'Layanan apa saja yang tersedia di Srikandi?',
    'Cek status pesanan SR-001-2026',
    'Saya ingin memesan cincin custom, apa saja yang perlu disiapkan?',
    'Apa perbedaan patri emas dan chrome putih?',
  ],
  // Batas aman input pengguna (server tetap wajib memvalidasi ulang).
  maxChars: 1000,
  maxHistory: 20,
};

/**
 * Kirim percakapan ke backend konsultasi.
 * @param {{messages: Array<{role:'user'|'assistant', content:string}>, signal?: AbortSignal}} args
 * @returns {Promise<{
 *   reply: string,
 *   sources?: Array,
 *   functions?: Array,
 *   escalate?: { reason: string, channel?: 'whatsapp', contact?: string }
 * }>}
 *
 * `escalate` diisi backend HANYA saat bot perlu admin/manusia (mis. masalah
 * teknis, komplain, perubahan data pesanan, di luar cakupan, user minta staf).
 * Bila ada, UI menampilkan tombol "Chat Admin via WhatsApp". Lihat CHATBOT.md.
 */
export async function sendConsultation({ messages, signal }) {
  const history = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-consultationConfig.maxHistory)
    .map((m) => ({ role: m.role, content: m.content }));

  if (!ENDPOINT) return mockConsult(history);

  // Kirim token sesi bila konsumen sudah login — hanya user login yang dilayani
  // Claude (AI). Tanpa token, server menjawab dengan fallback kata kunci.
  const headers = { 'Content-Type': 'application/json' };
  const token = loadSession()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      signal,
      body: JSON.stringify({ messages: history }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    // Backend gagal -> pakai mock supaya UX tidak mati total saat demo.
    if (import.meta.env.DEV) console.warn('Konsultasi API gagal, memakai mock:', err);
    return mockConsult(history);
  }
}

// --------------------------------------------------------------------------
// Mock lokal — meniru hasil RAG + function calling. Bukan AI sungguhan;
// hanya pencocokan kata kunci sederhana terhadap data di src/config/site.js.
// Berguna sebagai contoh kontrak data untuk tim backend.
// --------------------------------------------------------------------------
function buildEscalation(reason, ringkasan) {
  const base = consultationConfig.whatsapp || '';
  const text = encodeURIComponent(`Halo admin Srikandi, saya butuh bantuan.\n${ringkasan || reason}`);
  return {
    reason,
    channel: 'whatsapp',
    contact: base ? `${base}${base.includes('?') ? '&' : '?'}text=${text}` : null,
  };
}

function mockConsult(history) {
  const last = [...history].reverse().find((m) => m.role === 'user')?.content || '';
  const q = last.toLowerCase();
  const rupiah = (n) => `Rp${n.toLocaleString('id-ID')}`;

  // escalate: bot perlu admin/manusia
  if (
    /\b(admin|manusia|orang|staf|staff|petugas|cs|customer service|komplain|keluhan|protes|refund|pengembalian dana|uang kembali|dibatalkan|batalkan pesanan|ubah pesanan|ganti jadwal|salah|rusak|error|tidak bisa|gak bisa|nggak bisa|gagal|bermasalah|bicara dengan)\b/i.test(
      last,
    )
  ) {
    return {
      reply:
        'Untuk hal ini Anda perlu terhubung langsung dengan admin kami. ' +
        'Silakan lanjutkan lewat WhatsApp — tim kami akan membantu.',
      escalate: buildEscalation('Perlu tindakan admin', last.slice(0, 200)),
    };
  }

  // function: cekStatusPesanan
  const orderMatch = last.match(/SR-\d{3}-\d{4}/i);
  if (orderMatch) {
    const order = siteConfig.orders.find(
      (o) => o.orderNumber.toLowerCase() === orderMatch[0].toLowerCase(),
    );
    if (order) {
      // Verifikasi ringan (mode demo tanpa backend): nama pemesan harus disebut
      // di pesan. HP tidak ada di data mock ini — backend memeriksa nama + HP.
      const nameOk = order.customerName
        .toLowerCase()
        .split(' ')
        .every((t) => q.includes(t));
      if (!nameOk) {
        return {
          reply: `Untuk melihat status pesanan ${order.orderNumber}, sebutkan juga nama pemesan dan nomor HP yang terdaftar.`,
          functions: [
            {
              name: 'cekStatusPesanan',
              label: 'Status Pesanan',
              data: { needVerification: true, orderNumber: order.orderNumber },
            },
          ],
        };
      }
      return {
        reply:
          `Pesanan ${order.orderNumber} atas nama ${order.customerName} berstatus ` +
          `"${order.status}" dengan progres ${order.progress}%. ` +
          `Kadar emas ${order.goldPurity}K.`,
        functions: [
          { name: 'cekStatusPesanan', label: 'Status Pesanan', data: order },
        ],
        sources: [{ title: 'Data pesanan internal', snippet: `#${order.orderNumber}` }],
      };
    }
    return {
      reply: `Maaf, nomor pesanan ${orderMatch[0]} tidak ditemukan. Mohon periksa kembali.`,
      functions: [{ name: 'cekStatusPesanan', label: 'Status Pesanan', data: { notFound: orderMatch[0] } }],
    };
  }

  // function: infoLayanan (tanpa harga & tanpa estimasi waktu — keduanya penawaran)
  const svc = siteConfig.services.find((s) => q.includes(s.name.toLowerCase().split(' ')[0]));
  if (svc || /harga|biaya|tarif|berapa lama|estimasi|layanan/.test(q)) {
    const list = svc ? [svc] : siteConfig.services;
    const note =
      'Biaya dan estimasi waktu bersifat penawaran, dikonfirmasi staf setelah melihat detail barang/desain Anda.';
    return {
      reply: svc
        ? `${svc.name}: ${svc.description}. ${note}`
        : 'Layanan yang tersedia:\n' +
          list.map((s) => `• ${s.name}`).join('\n') +
          `\n\n${note}`,
      functions: [{ name: 'infoLayanan', label: 'Info Layanan', data: list }],
      sources: [{ title: 'Daftar layanan Srikandi', snippet: 'config/site.js › services' }],
    };
  }

  // function: rekomendasiGaleri
  if (/cincin|kalung|gelang|anting|liontin|rekomendasi|lamaran|tunangan|kado|hadiah/.test(q)) {
    const budget = parseBudget(q);
    let items = siteConfig.galleries;
    if (/cincin/.test(q)) items = items.filter((g) => g.category === 'Cincin');
    if (/kalung/.test(q)) items = items.filter((g) => g.category === 'Kalung');
    if (/gelang/.test(q)) items = items.filter((g) => g.category === 'Gelang');
    if (budget) items = items.filter((g) => g.price <= budget * 1.1);
    items = items.slice(0, 3);
    return {
      reply: items.length
        ? `Beberapa pilihan${budget ? ` di kisaran ${rupiah(budget)}` : ''}:\n` +
          items.map((g) => `• ${g.title} — ${rupiah(g.price)}`).join('\n')
        : 'Belum ada item galeri yang cocok dengan kriteria itu. Coba longgarkan budget atau kategori.',
      functions: [{ name: 'rekomendasiGaleri', label: 'Rekomendasi Galeri', data: items }],
      sources: items.map((g) => ({ title: g.title, snippet: g.description })),
    };
  }

  return {
    reply:
      'Saya bisa bantu soal jenis layanan, cek status pesanan (sebutkan nomor ' +
      'seperti SR-001-2026), atau rekomendasi perhiasan dari galeri. Untuk hal ' +
      'lain yang perlu ditangani admin, ketik "hubungi admin". Silakan perjelas kebutuhan Anda.',
  };
}

function parseBudget(text) {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(jt|juta|ribu|rb|k)?/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(',', '.'));
  const unit = (m[2] || '').toLowerCase();
  if (unit.startsWith('j')) n *= 1_000_000;
  else if (unit === 'ribu' || unit === 'rb' || unit === 'k') n *= 1_000;
  return n > 1000 ? n : null;
}
