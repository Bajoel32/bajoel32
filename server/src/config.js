import 'dotenv/config';
import { createRequire } from 'node:module';

const pkg = createRequire(import.meta.url)('../package.json');

const list = (v, fallback) =>
  (v || fallback || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const config = {
  version: pkg.version,
  port: Number(process.env.PORT || 8787),
  env: process.env.NODE_ENV || 'development',

  // Origin storefront + origin admin hub digabung jadi satu allowlist CORS.
  corsOrigins: [
    ...list(process.env.CORS_ORIGINS, 'http://localhost:5173'),
    ...list(process.env.ADMIN_ORIGINS, 'http://localhost:5174'),
  ],

  sessionTtl: Number(process.env.SESSION_TTL || 86400),

  // Kunci enkripsi data pelanggan at-rest (AES-256-GCM). Kosong -> data polos.
  dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY || '',
  // Kunci lama — hanya untuk dekripsi saat rotasi (npm run rotate:datakey).
  dataEncryptionKeyOld: process.env.DATA_ENCRYPTION_KEY_OLD || '',
  // Retensi PII: field `ip` pada bookings/consult_logs dibuang setelah N hari.
  dataRetentionDays: Number(process.env.DATA_RETENTION_DAYS || 90),

  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-opus-5',
  whatsappBase: process.env.WHATSAPP_BASE || 'https://wa.me/6281234567890',

  // Plafon panggilan Claude untuk /api/consult per hari — lindungi tagihan API.
  // Lewat batas: semua konsultasi turun ke fallback kata kunci sampai ganti hari.
  consultDailyLlmBudget: Number(process.env.CONSULT_DAILY_LLM_BUDGET || 300),

  // Admin hub.
  databaseUrl: process.env.DATABASE_URL || '',
  admin: {
    username: process.env.ADMIN_USERNAME || '',
    passwordHash: process.env.ADMIN_PASSWORD_HASH || '',
    sessionTtl: Number(process.env.ADMIN_SESSION_TTL || 43200), // 12 jam
  },
};

export const storageMode = config.databaseUrl ? 'postgres' : 'json-file';
