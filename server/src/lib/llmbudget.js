// Plafon panggilan Claude harian, disimpan di `db` (koleksi `counters`) supaya
// TIDAK ter-reset saat proses restart (mis. Render free tier tidur lalu bangun).
// Satu baris: { key: 'llm-budget', day: 'YYYY-MM-DD', count: N }.
import { db } from '../db.js';

const KEY = 'llm-budget';
const dayKey = () => new Date().toISOString().slice(0, 10);

function readRow() {
  const rows = db.all('counters');
  let r = rows.find((x) => x.key === KEY);
  if (!r) {
    r = { key: KEY, day: dayKey(), count: 0 };
    rows.push(r);
  }
  const d = dayKey();
  if (r.day !== d) {
    r.day = d;
    r.count = 0;
  }
  return r;
}

// true (dan pakai 1 jatah) selama count < limit; false bila jatah hari ini habis.
export function tryConsume(limit) {
  const r = readRow();
  if (r.count >= limit) {
    db.set('counters', db.all('counters')); // simpan rollover hari bila terjadi
    return false;
  }
  r.count += 1;
  db.set('counters', db.all('counters'));
  return true;
}

export function usedToday() {
  return readRow().count;
}
