import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { metrics } from '../lib/metrics.js';

export function corsMw() {
  return cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl / same-origin / server-to-server
      cb(null, config.corsOrigins.includes(origin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
  });
}

export const helmetMw = helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  // HSTS eksplisit: 1 tahun + subdomain + preload (samakan dengan public/_headers).
  // Header ini hanya dihormati browser lewat HTTPS — aman meski dev jalan di HTTP.
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
});

// Lapis cadangan HTTP->HTTPS. Host (Render/CDN) sudah redirect di edge; ini
// hanya menjaga kalau app diletakkan di belakang proxy yang meneruskan HTTP polos.
// Aktif hanya di produksi, dan hanya bila proxy secara eksplisit menandai 'http'.
export function httpsRedirect(req, res, next) {
  if (config.env !== 'production') return next();
  const proto = (req.get('x-forwarded-proto') || '').split(',')[0].trim();
  if (proto === 'http') {
    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
}

const limiter = (windowMs, max, message, opts = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res /*, next, options */) {
      metrics.inc('rateLimited');
      res.status(429).json({ error: message || 'Terlalu banyak permintaan. Coba lagi nanti.' });
    },
    ...opts,
  });

export const globalLimiter = limiter(60_000, 120);
// 10 percobaan / 10 menit / IP — cukup ketat untuk brute-force kode 6 digit,
// tapi tidak mudah mengunci diri sendiri saat demo. Sesuaikan di produksi.
export const loginLimiter = limiter(10 * 60_000, 10, 'Terlalu banyak percobaan masuk. Coba lagi nanti.');
export const bookingLimiter = limiter(60_000, 5, 'Terlalu banyak permintaan. Coba lagi sebentar.');

// --- /api/consult: berlapis (per-menit/IP + harian/pengirim), lihat routes/consult.js ---
// Burst per menit per IP. Ketat: 1 giliran tanya-jawab ~1 request.
export const consultLimiter = limiter(60_000, 8, 'Terlalu banyak pesan. Mohon jeda sebentar.');
// Plafon harian per PENGIRIM — sesi login bila ada, kalau tidak per IP. Menahan
// abuse tersebar yang lolos dari limiter per-menit (mis. rotasi IP pelan).
export const consultDailyLimiter = limiter(
  24 * 60 * 60_000,
  40,
  'Batas konsultasi harian tercapai. Silakan lanjut besok atau hubungi kami via WhatsApp.',
  {
    // Kunci: token sesi bila login, kalau tidak per-IP. `ip: false` mematikan
    // cek format IP bawaan karena key sudah kita prefiks sendiri.
    validate: { ip: false },
    keyGenerator: (req) => (req.session?.token ? `sess:${req.session.token}` : `ip:${req.ip}`),
  },
);
// Login admin: sedikit lebih longgar dari login konsumen, tapi tetap dibatasi.
export const adminLoginLimiter = limiter(10 * 60_000, 20, 'Terlalu banyak percobaan masuk admin. Coba lagi nanti.');
