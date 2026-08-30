import crypto from 'node:crypto';
import { db } from '../db.js';
import { config } from '../config.js';

export function createSession(customerId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.insert('sessions', {
    token,
    customerId,
    createdAt: now,
    expiresAt: now + config.sessionTtl * 1000,
  });
  return token;
}

export function destroySession(token) {
  if (token) db.remove('sessions', (s) => s.token === token);
}

export function getSession(token) {
  if (!token) return null;
  const s = db.all('sessions').find((x) => x.token === token);
  if (!s) return null;
  if (s.expiresAt < Date.now()) {
    db.remove('sessions', (x) => x.token === token);
    return null;
  }
  return s;
}

export function bearer(req) {
  const h = req.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

export function requireAuth(req, res, next) {
  const s = getSession(bearer(req));
  if (!s) return res.status(401).json({ error: 'Sesi tidak valid. Silakan masuk kembali.' });
  req.session = s;
  next();
}

// Seperti requireAuth tapi tidak menolak: set req.session bila token valid,
// selain itu lanjut sebagai anonim. Dipakai /api/consult (anon -> fallback).
export function optionalAuth(req, res, next) {
  const s = getSession(bearer(req));
  if (s) req.session = s;
  next();
}

export function sweepSessions() {
  const now = Date.now();
  db.remove('sessions', (s) => s.expiresAt < now);
}
