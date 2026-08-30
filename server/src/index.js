import express from 'express';
import { config, storageMode } from './config.js';
import { initDb, flushDb, db } from './db.js';
import { ensureSeeded } from './seed.js';
import {
  corsMw,
  helmetMw,
  httpsRedirect,
  globalLimiter,
  loginLimiter,
  bookingLimiter,
  consultLimiter,
} from './middleware/security.js';
import { notFound, errorHandler } from './middleware/errors.js';
import { bookingsRouter } from './routes/bookings.js';
import { authRouter } from './routes/auth.js';
import { ordersRouter } from './routes/orders.js';
import { consultRouter } from './routes/consult.js';
import { galleryRouter } from './routes/gallery.js';
import { adminRouter } from './routes/admin.js';
import { sweepSessions } from './lib/auth.js';
import { sweepRetention } from './lib/retention.js';
import { adminConfigured } from './lib/adminAuth.js';

// Hash bcrypt contoh yang ADA DI REPO (server/.env.example & sandi dev
// "rahasia-lokal-123"). Plaintext-nya publik, jadi haram dipakai di produksi.
const EXAMPLE_ADMIN_HASHES = new Set([
  '$2a$10$IeBXcmd8.QG5vNf3r7gDW.9BnRYlR1ARKtAKC7Hc2IocSx./dB0Wq',
  '$2a$10$4NjVcv7tNMtDvQwss3AENeDxfZlmRX/gTVbUfi/ersomcMHDDclwi',
]);

// Cegah boot produksi dengan kredensial contoh. Fatal, bukan sekadar warning:
// admin hub dengan sandi yang bisa dibaca siapa saja = pintu terbuka.
function assertSafeProductionSecrets() {
  if (config.env !== 'production') return;
  const problems = [];
  if (EXAMPLE_ADMIN_HASHES.has(config.admin.passwordHash)) {
    problems.push('ADMIN_PASSWORD_HASH masih hash contoh dari repo — buat baru: npm run admin:hash -- "<sandi-kuat>"');
  }
  if (problems.length) {
    console.error('\n[FATAL] Kredensial contoh terdeteksi saat NODE_ENV=production:');
    for (const p of problems) console.error(`  - ${p}`);
    console.error('Server dihentikan demi keamanan.\n');
    process.exit(1);
  }
}

async function start() {
  assertSafeProductionSecrets();
  await initDb();
  await ensureSeeded();

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(httpsRedirect); // sebelum apa pun — jangan proses request HTTP polos
  app.use(helmetMw);
  app.use(corsMw());
  app.use(express.json({ limit: '32kb' }));
  app.use(globalLimiter);

  app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now(), version: config.version }));

  app.use('/api/bookings', bookingLimiter, bookingsRouter);
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth', authRouter);
  app.use('/api', ordersRouter); // GET /api/my-orders
  app.use('/api/consult', consultLimiter, consultRouter);
  app.use('/api/gallery', galleryRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  setInterval(sweepSessions, 15 * 60_000).unref();
  sweepRetention();
  setInterval(sweepRetention, 6 * 3600_000).unref();

  const server = app.listen(config.port, () => {
    console.log(`Srikandi API  ->  http://localhost:${config.port}  (env: ${config.env}, storage: ${storageMode})`);
    console.log(`  CORS origins: ${config.corsOrigins.join(', ') || '(none)'}`);
    if (!config.anthropicKey) {
      console.log('  ANTHROPIC_API_KEY kosong  ->  /api/consult memakai fallback kata kunci lokal');
    }
    if (!adminConfigured()) {
      console.warn('  Admin hub NONAKTIF — set ADMIN_USERNAME & ADMIN_PASSWORD_HASH (npm run admin:hash <sandi>).');
    }
    if (config.env === 'production' && !config.dataEncryptionKey) {
      console.warn('  DATA_ENCRYPTION_KEY kosong — data pelanggan tersimpan TANPA enkripsi at-rest (npm run gen:datakey).');
    }
  });

  const shutdown = async (sig) => {
    console.log(`\n${sig} — menutup server...`);
    server.close();
    try {
      db.set('sessions', db.all('sessions')); // pastikan versi terakhir ter-antre
      await flushDb();
    } catch (e) {
      console.error('[shutdown] flush gagal:', e.message);
    }
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Gagal start server:', err);
  process.exit(1);
});
