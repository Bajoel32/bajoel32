// Guard rail sisi-server untuk /api/consult — lapis WAJIB (sisi-browser
// src/config/guardrails.js hanya kenyamanan UX, bisa dilewati).
//
//   screenInbound(messages)   -> blokir prompt-injection / jailbreak
//   sanitizeOutbound(result)  -> potong & redaksi balasan model
//   redactPii(str)            -> samarkan data pribadi sebelum masuk log

/* ----------------------------- inbound ------------------------------ */

// Pola upaya membajak instruksi. Dicek pada pesan user TERAKHIR saja.
const INJECTION = [
  /ignore\s+(all\s+|the\s+|any\s+)?(previous|above|prior|earlier)\s+(instruction|prompt|message|rule)/i,
  /disregard\s+(all\s+|the\s+)?(previous|above)?\s*(instruction|rule|prompt)/i,
  /abaikan\s+(semua\s+)?(instruksi|perintah|aturan|arahan)(\s+(sebelumnya|di\s*atas|awal))?/i,
  /(lupakan|hiraukan)\s+(instruksi|perintah|aturan|arahan)/i,
  /(you\s+are\s+now|from\s+now\s+on\s+you\s+are|pretend\s+to\s+be|act\s+as)\s+/i,
  /(kamu|anda)\s+(sekarang|mulai\s+sekarang)\s+(adalah|jadi|berperan)/i,
  /(berperan|bertindak)\s+sebagai\s+.{0,40}(tanpa|tak|tidak)\s+(batas|aturan|filter|sensor)/i,
  /(system|developer)\s+(prompt|message|instruction)/i,
  /prompt\s+sistem|instruksi\s+sistem|aturan\s+sistem/i,
  /(tampilkan|tunjukkan|ungkapkan|bocorkan|cetak|ulangi|repeat|reveal|show|print)\s+.{0,30}(prompt|instruksi|aturan|system)/i,
  /(developer\s+mode|mode\s+pengembang|jailbreak|do\s+anything\s+now)/i,
  /(bypass|override|matikan|nonaktifkan)\s+.{0,20}(filter|guard|rule|aturan|batas|sensor)/i,
  /^\s*(system|assistant|user)\s*:/im,
];

const DEFLECT =
  'Maaf, saya hanya bisa membantu seputar layanan, harga estimasi, status pesanan, ' +
  'dan katalog Srikandi. Ada yang bisa saya bantu soal itu?';

export function screenInbound(messages) {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  if (INJECTION.some((re) => re.test(last))) return { blocked: true, reply: DEFLECT };
  return { blocked: false };
}

/* ------------------------------ logging ---------------------------- */

const REDACT = [
  [/[^\s@]+@[^\s@]+\.[^\s@]{2,}/g, '[email]'],
  [/(?:\+?62|0)8\d[\d -]{6,}\d/g, '[hp]'],
  [/\b\d{12,}\b/g, '[angka]'],
];

export function redactPii(str) {
  let s = String(str || '');
  for (const [re, rep] of REDACT) s = s.replace(re, rep);
  return s;
}

/* ----------------------------- outbound ---------------------------- */

const MAX_REPLY = 2000;

// Pola yang tak boleh muncul di balasan (kunci/token yang bocor).
const LEAK = [
  /sk-ant-[A-Za-z0-9_-]{8,}/g,
  /\bsk-[A-Za-z0-9]{20,}\b/g,
  /\b[0-9a-f]{64}\b/g,
  /ANTHROPIC_API_KEY/g,
];

// Frasa khas SYSTEM prompt (server/src/lib/claude.js) — jaga tetap sinkron.
// Kalau balasan memuat salah satunya, model "membocorkan" instruksinya.
const SYSTEM_TELLTALES = [
  'asisten toko perhiasan Srikandi',
  'panggil eskalasiKeAdmin',
  'Biaya & estimasi waktu selalu ditandai',
];

const GENERIC =
  'Maaf, saya tidak bisa menampilkan itu. Ada yang bisa saya bantu seputar layanan atau pesanan Srikandi?';

export function sanitizeOutbound(result) {
  if (!result || typeof result.reply !== 'string') return result;
  let reply = result.reply;

  if (SYSTEM_TELLTALES.some((t) => reply.includes(t))) reply = GENERIC;
  for (const re of LEAK) reply = reply.replace(re, '[disamarkan]');
  if (reply.length > MAX_REPLY) reply = `${reply.slice(0, MAX_REPLY).trimEnd()}…`;

  return { ...result, reply };
}
