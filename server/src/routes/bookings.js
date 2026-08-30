import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { bookingSchema } from '../lib/validate.js';

export const bookingsRouter = Router();

bookingsRouter.post('/', (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Data tidak valid.',
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }
  const data = parsed.data;

  // Honeypot: terima diam-diam, jangan simpan.
  if (data.website) return res.status(200).json({ ok: true, ref: 'SKIPPED' });

  const svc = db.all('services').find((s) => String(s.id) === data.selectedService);
  if (!svc) return res.status(400).json({ error: 'Layanan tidak dikenal.' });

  const ref = `BK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const clean = { ...data };
  delete clean.website;
  db.insert('bookings', {
    ref,
    createdAt: new Date().toISOString(),
    ...clean,
    serviceName: svc.name,
    ip: req.ip,
    status: 'baru',
  });

  // TODO produksi: notifikasi admin (email / WhatsApp).
  console.log(`[booking] ${ref} — ${data.customerName} · ${svc.name}`);

  res.status(201).json({ ok: true, ref });
});
