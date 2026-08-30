// Enkripsi data pelanggan at-rest. Dipakai di batas penyimpanan (db.js):
// blob koleksi dienkripsi sebelum ditulis ke file/Postgres, didekripsi saat
// dibaca. Cache di memori tetap plaintext — kode route tidak berubah.
//
// AES-256-GCM. Kunci dari env DATA_ENCRYPTION_KEY:
//   - base64 tepat 32 byte  -> dipakai apa adanya
//   - selain itu            -> di-hash SHA-256 jadi 32 byte
//   - kosong                -> enkripsi NONAKTIF (data disimpan polos, seperti sebelumnya)
//
// Rotasi kunci: set DATA_ENCRYPTION_KEY (baru) + DATA_ENCRYPTION_KEY_OLD (lama),
// jalankan `npm run rotate:datakey`, lalu hapus DATA_ENCRYPTION_KEY_OLD.
// Selama keduanya diset, dekripsi mencoba kunci baru lalu kunci lama.
//
// Buat kunci: npm run gen:datakey
import crypto from 'node:crypto';
import { config } from '../config.js';

const PREFIX = 'enc.v1.';
const ALGO = 'aes-256-gcm';

// Koleksi berisi data pelanggan / rahasia sesi -> dienkripsi.
// services, gallery, kb, settings = katalog/config publik -> tetap plaintext.
export const ENCRYPTED_COLLECTIONS = new Set([
  'customers',
  'orders',
  'bookings',
  'sessions',
  'consult_logs',
]);

function toKey(raw) {
  if (!raw) return null;
  const b64 = Buffer.from(raw, 'base64');
  return b64.length === 32 ? b64 : crypto.createHash('sha256').update(raw).digest();
}

let keyBuf;
let keyOldBuf;
function key() {
  if (keyBuf === undefined) keyBuf = toKey(config.dataEncryptionKey);
  return keyBuf;
}
function keyOld() {
  if (keyOldBuf === undefined) keyOldBuf = toKey(config.dataEncryptionKeyOld);
  return keyOldBuf;
}

export function encryptionActive() {
  return key() !== null;
}

export function isEncrypted(s) {
  return typeof s === 'string' && s.startsWith(PREFIX);
}

export function encryptString(plain) {
  const k = key();
  if (!k) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, k, iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64');
}

export function decryptString(token) {
  const candidates = [key(), keyOld()].filter(Boolean);
  if (!candidates.length) {
    throw new Error(
      'Data tersimpan terenkripsi tetapi DATA_ENCRYPTION_KEY tidak diset. ' +
        'Set kunci yang benar, atau hapus file data untuk seed ulang.',
    );
  }
  const blob = Buffer.from(String(token).slice(PREFIX.length), 'base64');
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const ct = blob.subarray(28);
  for (const k of candidates) {
    try {
      const decipher = crypto.createDecipheriv(ALGO, k, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    } catch {
      // kunci ini tak cocok — coba berikutnya (dipakai saat rotasi)
    }
  }
  throw new Error('Dekripsi gagal — DATA_ENCRYPTION_KEY / DATA_ENCRYPTION_KEY_OLD tidak cocok dengan data.');
}
