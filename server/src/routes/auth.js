import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { loginSchema } from '../lib/validate.js';
import { normalizePhone } from '../lib/phone.js';
import { createSession, destroySession, bearer } from '../lib/auth.js';

export const authRouter = Router();

// Hash dummy untuk menyamakan waktu respons saat nomor tidak terdaftar.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8m3S3Xk3vP8xY7Q1r5eZ2b6a8c0d1e';

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(401).json({ error: 'Nomor HP atau kata sandi salah.' });

  const phone = normalizePhone(parsed.data.phone);
  const customer = db.all('customers').find((c) => c.phone === phone);
  const ok = await bcrypt.compare(parsed.data.password, customer?.passwordHash || DUMMY_HASH);

  if (!customer || !ok) return res.status(401).json({ error: 'Nomor HP atau kata sandi salah.' });

  const token = createSession(customer.id);
  res.json({ token, customer: { id: customer.id, name: customer.name, phone: customer.phone } });
});

authRouter.post('/logout', (req, res) => {
  destroySession(bearer(req));
  res.json({ ok: true });
});
