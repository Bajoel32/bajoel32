import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { config } from '../config.js';
import { bearer } from './auth.js';

const KIND = 'admin';

export function adminConfigured() {
  return Boolean(config.admin.username && config.admin.passwordHash);
}

export async function verifyAdmin(username, password) {
  if (!adminConfigured()) return false;
  // Bandingkan username waktu-konstan, lalu password bcrypt (selalu jalan agar timing rata).
  const u = Buffer.from(String(username || ''));
  const ref = Buffer.from(config.admin.username);
  const userOk = u.length === ref.length && crypto.timingSafeEqual(u, ref);
  const passOk = await bcrypt.compare(String(password || ''), config.admin.passwordHash);
  return userOk && passOk;
}

export function createAdminSession() {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.insert('sessions', {
    token,
    kind: KIND,
    createdAt: now,
    expiresAt: now + config.admin.sessionTtl * 1000,
  });
  return { token, expiresAt: now + config.admin.sessionTtl * 1000 };
}

export function getAdminSession(token) {
  if (!token) return null;
  const s = db.all('sessions').find((x) => x.token === token && x.kind === KIND);
  if (!s) return null;
  if (s.expiresAt < Date.now()) {
    db.remove('sessions', (x) => x.token === token);
    return null;
  }
  return s;
}

export function destroyAdminSession(token) {
  if (token) db.remove('sessions', (s) => s.token === token && s.kind === KIND);
}

export function requireAdmin(req, res, next) {
  if (!adminConfigured()) {
    return res.status(503).json({ error: 'Admin hub belum dikonfigurasi di server (ADMIN_USERNAME / ADMIN_PASSWORD_HASH).' });
  }
  const s = getAdminSession(bearer(req));
  if (!s) return res.status(401).json({ error: 'Sesi admin tidak valid. Silakan masuk kembali.' });
  req.adminSession = s;
  next();
}

export function countAdminSessions() {
  const now = Date.now();
  return db.all('sessions').filter((s) => s.kind === KIND && s.expiresAt >= now).length;
}
