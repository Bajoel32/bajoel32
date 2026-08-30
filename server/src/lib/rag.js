// Retriever RAG ringan: pencocokan kata kunci (bag-of-words) atas koleksi `kb`.
// Cukup untuk skala toko. Untuk korpus besar, ganti dengan embedding + vector DB.
// Parameter `topK` & `minScore` bisa diatur dari admin hub (koleksi `settings`).
import { db } from '../db.js';

const DEFAULTS = { topK: 4, minScore: 0.5 };

export function ragConfig() {
  const row = db.all('settings').find((s) => s.key === 'rag');
  return {
    topK: Number(row?.topK) || DEFAULTS.topK,
    minScore: row?.minScore != null ? Number(row.minScore) : DEFAULTS.minScore,
  };
}

const STOP = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'apa', 'saya', 'ini', 'itu',
  'ada', 'bisa', 'dengan', 'atau', 'apakah', 'berapa', 'the', 'a', 'an',
]);

function tokens(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function retrieve(query, opts = {}) {
  const { topK, minScore } = { ...ragConfig(), ...opts };
  const q = tokens(query);
  if (!q.length) return [];
  const scored = db
    .all('kb')
    .map((c) => {
      const body = new Set(tokens(`${c.title} ${c.text}`));
      const title = new Set(tokens(c.title));
      let score = 0;
      for (const w of q) {
        if (body.has(w)) score += 1;
        if (title.has(w)) score += 0.5;
      }
      return { c, score };
    })
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return scored.map((x) => ({
    title: x.c.title,
    snippet: x.c.text.slice(0, 240),
    url: x.c.url || null,
  }));
}
