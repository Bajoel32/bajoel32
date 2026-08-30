import { metrics } from '../lib/metrics.js';

export function notFound(req, res) {
  res.status(404).json({ error: 'Tidak ditemukan.' });
}

// Tidak membocorkan stack trace / detail internal ke klien.
export function errorHandler(err, req, res, _next) {
  const status = err?.status || 500;
  if (status >= 500) metrics.inc('errors5xx');
  console.error('[error]', err?.message || err);
  res.status(status).json({ error: 'Terjadi kesalahan di server.' });
}
