// Penyimpanan koleksi sederhana dengan antarmuka SINKRON (all/set/insert/update/remove).
//
// Dua mode, dipilih otomatis dari env:
//   - DATABASE_URL ada  -> Postgres (Neon). Semua koleksi dimuat ke memori saat boot;
//                          setiap tulis mem-flush blob koleksi itu ke tabel `kv`.
//   - DATABASE_URL kosong -> file JSON di data/ (untuk dev lokal tanpa Neon).
//
// Data toko ini kecil (ratusan baris), jadi menyimpan tiap koleksi sebagai satu
// blob JSONB sudah lebih dari cukup dan menjaga antarmuka lama tetap sinkron.
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, storageMode } from './config.js';
import {
  ENCRYPTED_COLLECTIONS,
  encryptionActive,
  encryptString,
  decryptString,
  isEncrypted,
} from './lib/datacrypt.js';

const USE_PG = storageMode === 'postgres';

/* --------------------- serialisasi (+ enkripsi at-rest) --------------------- */

// Ubah rows -> string yang aman disimpan. Koleksi sensitif dienkripsi.
function serialize(name, rows) {
  const enc = ENCRYPTED_COLLECTIONS.has(name);
  const json = JSON.stringify(rows ?? [], null, enc || USE_PG ? 0 : 2);
  return enc ? encryptString(json) : json;
}

// Kebalikannya. Toleran terhadap 3 bentuk sumber:
//   - array/objek  -> jsonb Postgres lama yang sudah ter-parse (plaintext)
//   - "enc.v1...."  -> ciphertext, perlu didekripsi
//   - string JSON   -> file lama / mode tanpa kunci
function deserialize(raw) {
  if (Array.isArray(raw) || (raw && typeof raw === 'object')) return raw;
  const s = String(raw ?? '');
  if (!s) return [];
  return JSON.parse(isEncrypted(s) ? decryptString(s) : s);
}

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
if (!USE_PG && !existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const filePath = (name) => join(DATA_DIR, `${name}.json`);

const cache = {};
const updatedAt = {}; // name -> ISO string
let pool = null;
const chains = {}; // name -> Promise (serialisasi flush per-koleksi)

/* --------------------------------- JSON --------------------------------- */

function jsonLoad(name) {
  if (cache[name]) return cache[name];
  const p = filePath(name);
  if (existsSync(p)) {
    cache[name] = deserialize(readFileSync(p, 'utf8'));
    if (!updatedAt[name]) updatedAt[name] = new Date(statSync(p).mtimeMs).toISOString();
  } else {
    cache[name] = [];
  }
  return cache[name];
}

function jsonPersist(name) {
  const p = filePath(name);
  const tmp = `${p}.tmp`;
  writeFileSync(tmp, serialize(name, cache[name]));
  renameSync(tmp, p);
  updatedAt[name] = new Date().toISOString();
}

/* -------------------------------- Postgres ----------------------------- */

async function pgInit() {
  const { default: pg } = await import('pg');
  pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 30_000,
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv (
      name       text PRIMARY KEY,
      rows       jsonb NOT NULL DEFAULT '[]'::jsonb,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const { rows } = await pool.query('SELECT name, rows, updated_at FROM kv');
  for (const r of rows) {
    cache[r.name] = deserialize(r.rows);
    updatedAt[r.name] = new Date(r.updated_at).toISOString();
  }
}

function pgPersist(name) {
  updatedAt[name] = new Date().toISOString();
  const ser = serialize(name, cache[name] ?? []);
  // Plaintext: simpan sebagai jsonb apa adanya. Ciphertext: bungkus jadi string jsonb.
  const payload = isEncrypted(ser) ? JSON.stringify(ser) : ser;
  const run = () =>
    pool
      .query(
        `INSERT INTO kv (name, rows, updated_at) VALUES ($1, $2::jsonb, now())
         ON CONFLICT (name) DO UPDATE SET rows = EXCLUDED.rows, updated_at = now()`,
        [name, payload],
      )
      .catch((err) => console.error(`[db] gagal flush "${name}":`, err.message));
  chains[name] = (chains[name] || Promise.resolve()).then(run);
  return chains[name];
}

/* ------------------------------- antarmuka ---------------------------- */

function load(name) {
  if (USE_PG) return (cache[name] ||= []);
  return jsonLoad(name);
}

function persist(name) {
  return USE_PG ? pgPersist(name) : void jsonPersist(name);
}

export async function initDb() {
  if (USE_PG) await pgInit();
  console.log(`[db] mode: ${storageMode}`);
  console.log(
    encryptionActive()
      ? `[db] enkripsi at-rest: AKTIF (${[...ENCRYPTED_COLLECTIONS].join(', ')})`
      : '[db] enkripsi at-rest: nonaktif (DATA_ENCRYPTION_KEY kosong)',
  );
}

// Tunggu semua flush Postgres selesai (dipakai seed & shutdown).
export async function flushDb() {
  await Promise.allSettled(Object.values(chains));
}

export const db = {
  all(name) {
    return load(name);
  },
  set(name, rows) {
    cache[name] = rows;
    persist(name);
  },
  insert(name, row) {
    load(name).push(row);
    persist(name);
    return row;
  },
  update(name, pred, patch) {
    const rows = load(name);
    let n = 0;
    for (const r of rows) if (pred(r)) { Object.assign(r, patch); n++; }
    if (n) persist(name);
    return n;
  },
  remove(name, pred) {
    const rows = load(name);
    const kept = rows.filter((r) => !pred(r));
    const removed = rows.length - kept.length;
    if (removed) { cache[name] = kept; persist(name); }
    return removed;
  },
  // Metadata untuk indikator hub (mis. "KB terakhir diubah").
  updatedAt(name) {
    return updatedAt[name] || null;
  },
};
