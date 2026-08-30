// Retensi PII: buang field `ip` dari baris lama di `bookings` & `consult_logs`.
// Barisnya tetap (untuk statistik & rekam bisnis), hanya IP-nya yang hilang.
// Ambang: config.dataRetentionDays (env DATA_RETENTION_DAYS, default 90). 0 = mati.
import { db } from '../db.js';
import { config } from '../config.js';

const DAY = 86_400_000;

function stripOldIps(name, cutoffTs, tsOf) {
  const rows = db.all(name);
  let n = 0;
  for (const r of rows) {
    if (r.ip == null) continue;
    const t = tsOf(r);
    if (t && t < cutoffTs) {
      delete r.ip;
      n++;
    }
  }
  if (n) {
    db.set(name, rows);
    console.log(`[retention] ${name}: ip dibuang dari ${n} baris (> ${config.dataRetentionDays} hari)`);
  }
  return n;
}

export function sweepRetention() {
  const days = config.dataRetentionDays;
  if (!days || days <= 0) return;
  const cutoff = Date.now() - days * DAY;
  stripOldIps('bookings', cutoff, (r) => Date.parse(r.createdAt || ''));
  stripOldIps('consult_logs', cutoff, (r) => Date.parse(r.at || ''));
}
