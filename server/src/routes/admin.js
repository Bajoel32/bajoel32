// Admin hub API — semua di bawah /api/admin, dilindungi requireAdmin
// (kecuali /login). Auth: Bearer token dari POST /api/admin/login.
import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { config, storageMode } from '../config.js';
import { metrics } from '../lib/metrics.js';
import * as llmBudget from '../lib/llmbudget.js';
import { ragConfig } from '../lib/rag.js';
import { bearer } from '../lib/auth.js';
import { adminLoginLimiter } from '../middleware/security.js';
import {
  verifyAdmin,
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
  adminConfigured,
} from '../lib/adminAuth.js';

export const adminRouter = Router();

/* ------------------------------ util ------------------------------ */

const sameId = (a, b) => String(a) === String(b);
const nextNumericId = (rows) => rows.reduce((mx, r) => Math.max(mx, Number(r.id) || 0), 0) + 1;

function parse(schema, req, res) {
  const p = schema.safeParse(req.body);
  if (!p.success) {
    res.status(400).json({
      error: 'Data tidak valid.',
      details: p.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    });
    return null;
  }
  return p.data;
}

/* ---------------------------- skema ---------------------------- */

const loginSchema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1).max(200),
});

const serviceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(8).optional().default('•'),
  description: z.string().trim().max(400).optional().default(''),
});

const kbSchema = z.object({
  title: z.string().trim().min(1).max(160),
  text: z.string().trim().min(1).max(4000),
  url: z.string().trim().url().max(500).optional().or(z.literal('')),
});

const gallerySchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().default(''),
  image: z.string().url().max(500),
  category: z.string().trim().max(40).optional().default(''),
  price: z.coerce.number().int().min(0).optional(),
  tags: z.array(z.string().max(40)).max(12).optional().default([]),
  uploadedBy: z.string().trim().max(80).optional().default('Admin'),
});

const bookingPatch = z.object({ status: z.enum(['baru', 'diproses', 'selesai', 'batal']) });

const orderPatch = z
  .object({
    status: z.string().trim().min(1).max(40).optional(),
    progress: z.coerce.number().int().min(0).max(100).optional(),
  })
  .refine((d) => d.status !== undefined || d.progress !== undefined, 'tidak ada perubahan');

const ragPatch = z.object({
  topK: z.coerce.number().int().min(1).max(12),
  minScore: z.coerce.number().min(0).max(10),
});

/* ---------------------------- auth ---------------------------- */

adminRouter.post('/login', adminLoginLimiter, async (req, res) => {
  const data = parse(loginSchema, req, res);
  if (!data) return;
  if (!adminConfigured()) {
    return res.status(503).json({ error: 'Admin hub belum dikonfigurasi di server.' });
  }
  const ok = await verifyAdmin(data.username, data.password);
  if (!ok) return res.status(401).json({ error: 'Username atau kata sandi salah.' });
  const { token, expiresAt } = createAdminSession();
  res.json({ token, expiresAt, username: config.admin.username });
});

adminRouter.post('/logout', (req, res) => {
  destroyAdminSession(bearer(req));
  res.json({ ok: true });
});

// Semua route di bawah ini butuh sesi admin.
adminRouter.use(requireAdmin);

adminRouter.get('/me', (req, res) => {
  res.json({ username: config.admin.username, expiresAt: req.adminSession.expiresAt });
});

/* --------------------------- statistik --------------------------- */

adminRouter.get('/stats', (req, res) => {
  const m = metrics.snapshot();
  const services = db.all('services');
  const gallery = db.all('gallery');
  const kb = db.all('kb');
  const bookings = db.all('bookings');
  const orders = db.all('orders');
  const customers = db.all('customers');
  const sessions = db.all('sessions');
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);

  const ordersByStatus = {};
  for (const o of orders) ordersByStatus[o.status || '—'] = (ordersByStatus[o.status || '—'] || 0) + 1;

  const rc = ragConfig();

  res.json({
    system: {
      ok: true,
      env: config.env,
      version: config.version,
      storage: storageMode,
      node: process.version,
      uptimeSec: m.uptimeSec,
      startedAt: m.startedAt,
    },
    ai: {
      anthropicConfigured: Boolean(config.anthropicKey),
      model: config.anthropicModel,
      mode: config.anthropicKey ? 'live' : 'fallback',
    },
    content: {
      services: services.length,
      gallery: gallery.length,
      kb: kb.length,
      kbUpdatedAt: db.updatedAt('kb'),
    },
    activity: {
      bookingsTotal: bookings.length,
      bookingsToday: bookings.filter((b) => String(b.createdAt || '').slice(0, 10) === todayStr).length,
      bookingsPending: bookings.filter((b) => !b.status || b.status === 'baru').length,
      ordersTotal: orders.length,
      ordersByStatus,
      customers: customers.length,
    },
    chatbot: {
      consultCalls: m.consultCalls,
      consultToday: m.consultToday,
      llmCallsToday: llmBudget.usedToday(),
      llmDailyBudget: config.consultDailyLlmBudget,
      guardBlocks: m.guardBlocks,
      escalations: m.escalations,
      avgRagSources: m.avgRagSources,
      fallbackMode: !config.anthropicKey,
    },
    security: {
      activeSessions: sessions.filter((s) => s.kind !== 'admin' && s.expiresAt >= now).length,
      adminSessions: sessions.filter((s) => s.kind === 'admin' && s.expiresAt >= now).length,
      rateLimited: m.rateLimited,
      errors5xx: m.errors5xx,
    },
    rag: { topK: rc.topK, minScore: rc.minScore, kbChunks: kb.length },
    generatedAt: new Date().toISOString(),
  });
});

/* ------------------------- CRUD generik ------------------------- */

// services & kb: id numerik auto-increment.
function mountNumericCrud(path, collection, schema) {
  adminRouter.get(path, (req, res) => res.json({ items: db.all(collection) }));

  adminRouter.post(path, (req, res) => {
    const data = parse(schema, req, res);
    if (!data) return;
    const item = { id: nextNumericId(db.all(collection)), ...data };
    db.insert(collection, item);
    res.status(201).json({ item });
  });

  adminRouter.put(`${path}/:id`, (req, res) => {
    const data = parse(schema.partial(), req, res);
    if (!data) return;
    const n = db.update(collection, (r) => sameId(r.id, req.params.id), data);
    if (!n) return res.status(404).json({ error: 'Item tidak ditemukan.' });
    res.json({ item: db.all(collection).find((r) => sameId(r.id, req.params.id)) });
  });

  adminRouter.delete(`${path}/:id`, (req, res) => {
    const n = db.remove(collection, (r) => sameId(r.id, req.params.id));
    if (!n) return res.status(404).json({ error: 'Item tidak ditemukan.' });
    res.json({ ok: true });
  });
}

mountNumericCrud('/services', 'services', serviceSchema);
mountNumericCrud('/kb', 'kb', kbSchema);

/* ---------------------------- galeri ---------------------------- */

adminRouter.get('/gallery', (req, res) => res.json({ items: db.all('gallery') }));

adminRouter.post('/gallery', (req, res) => {
  const data = parse(gallerySchema, req, res);
  if (!data) return;
  const item = { id: crypto.randomUUID(), uploadedDate: new Date().toISOString().slice(0, 10), ...data };
  db.insert('gallery', item);
  res.status(201).json({ item });
});

adminRouter.put('/gallery/:id', (req, res) => {
  const data = parse(gallerySchema.partial(), req, res);
  if (!data) return;
  const n = db.update('gallery', (r) => sameId(r.id, req.params.id), data);
  if (!n) return res.status(404).json({ error: 'Item tidak ditemukan.' });
  res.json({ item: db.all('gallery').find((r) => sameId(r.id, req.params.id)) });
});

adminRouter.delete('/gallery/:id', (req, res) => {
  const n = db.remove('gallery', (r) => sameId(r.id, req.params.id));
  if (!n) return res.status(404).json({ error: 'Item tidak ditemukan.' });
  res.json({ ok: true });
});

/* --------------------------- bookings --------------------------- */

adminRouter.get('/bookings', (req, res) => {
  const items = [...db.all('bookings')].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json({ items });
});

adminRouter.patch('/bookings/:ref', (req, res) => {
  const data = parse(bookingPatch, req, res);
  if (!data) return;
  const n = db.update('bookings', (b) => b.ref === req.params.ref, { status: data.status });
  if (!n) return res.status(404).json({ error: 'Booking tidak ditemukan.' });
  res.json({ ok: true });
});

/* ---------------------------- orders --------------------------- */

adminRouter.get('/orders', (req, res) => {
  const items = [...db.all('orders')].sort((a, b) => String(b.createdDate).localeCompare(String(a.createdDate)));
  res.json({ items });
});

adminRouter.patch('/orders/:id', (req, res) => {
  const data = parse(orderPatch, req, res);
  if (!data) return;
  const n = db.update('orders', (o) => sameId(o.id, req.params.id), data);
  if (!n) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  res.json({ item: db.all('orders').find((o) => sameId(o.id, req.params.id)) });
});

/* --------------------------- customers ------------------------- */

adminRouter.get('/customers', (req, res) => {
  const orders = db.all('orders');
  const items = db.all('customers').map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    orders: orders.filter((o) => o.customerId === c.id).length,
  }));
  res.json({ items });
});

/* ------------------------- consult logs ------------------------ */

adminRouter.get('/consult-logs', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const items = [...db.all('consult_logs')].reverse().slice(0, limit);
  res.json({ items, total: db.all('consult_logs').length });
});

adminRouter.delete('/consult-logs', (req, res) => {
  db.set('consult_logs', []);
  res.json({ ok: true });
});

/* -------------------------- rag config ------------------------ */

adminRouter.get('/rag-config', (req, res) => res.json(ragConfig()));

adminRouter.put('/rag-config', (req, res) => {
  const data = parse(ragPatch, req, res);
  if (!data) return;
  db.set('settings', [{ key: 'rag', topK: data.topK, minScore: data.minScore }]);
  res.json(ragConfig());
});
