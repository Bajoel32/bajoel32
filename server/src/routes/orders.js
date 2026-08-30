import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../lib/auth.js';

export const ordersRouter = Router();

const PUBLIC_FIELDS = ['id', 'orderNumber', 'serviceName', 'goldPurity', 'progress', 'status', 'createdDate'];
const pick = (o) => Object.fromEntries(PUBLIC_FIELDS.map((k) => [k, o[k]]));

// Hanya pesanan milik pemegang token. customer_id diambil dari sesi, tidak dari klien.
ordersRouter.get('/my-orders', requireAuth, (req, res) => {
  const orders = db
    .all('orders')
    .filter((o) => o.customerId === req.session.customerId)
    .map(pick)
    .sort((a, b) => String(b.createdDate).localeCompare(String(a.createdDate)));
  res.json({ orders });
});
