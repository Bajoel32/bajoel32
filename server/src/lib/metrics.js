// Counter in-memory untuk indikator hub. Reset saat proses restart
// (di Render free tier itu terjadi tiap kali service "tidur" lalu bangun).
const startedAt = Date.now();

const dayKey = () => new Date().toISOString().slice(0, 10);
let today = dayKey();

const counters = {
  consultCalls: 0, // total sejak restart
  consultToday: 0, // direset tiap ganti hari
  escalations: 0,
  ragQueries: 0,
  ragSourcesTotal: 0, // untuk rata-rata sumber RAG terpakai
  guardBlocks: 0, // pesan diblokir guard rail (prompt-injection) sejak restart
  rateLimited: 0,
  errors5xx: 0,
};

function rollDay() {
  const d = dayKey();
  if (d !== today) {
    today = d;
    counters.consultToday = 0;
  }
}

export const metrics = {
  inc(key, n = 1) {
    rollDay();
    counters[key] = (counters[key] || 0) + n;
  },
  snapshot() {
    rollDay();
    const avgRagSources =
      counters.ragQueries > 0 ? +(counters.ragSourcesTotal / counters.ragQueries).toFixed(2) : 0;
    return {
      ...counters,
      avgRagSources,
      uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
      startedAt,
    };
  },
};
