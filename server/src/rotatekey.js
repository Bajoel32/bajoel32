// Rotasi kunci enkripsi at-rest: re-enkripsi semua koleksi sensitif dengan
// DATA_ENCRYPTION_KEY (baru), mendekripsi yang lama pakai DATA_ENCRYPTION_KEY_OLD.
//
// Pakai:
//   DATA_ENCRYPTION_KEY=<baru> DATA_ENCRYPTION_KEY_OLD=<lama> npm run rotate:datakey
//
// Setelah sukses: hapus DATA_ENCRYPTION_KEY_OLD dari env.
import { config } from './config.js';
import { initDb, flushDb, db } from './db.js';
import { ENCRYPTED_COLLECTIONS, encryptionActive } from './lib/datacrypt.js';

async function main() {
  if (!encryptionActive()) {
    console.error('DATA_ENCRYPTION_KEY (baru) belum diset. Batal.');
    process.exit(1);
  }
  if (!config.dataEncryptionKeyOld) {
    console.error('DATA_ENCRYPTION_KEY_OLD (lama) belum diset. Batal.');
    process.exit(1);
  }

  await initDb();
  let n = 0;
  for (const name of ENCRYPTED_COLLECTIONS) {
    const rows = db.all(name); // didekripsi: coba kunci baru, lalu kunci lama
    db.set(name, rows); // ditulis ulang dengan kunci baru
    console.log(`  ${name}: ${rows.length} baris di-re-enkripsi`);
    n++;
  }
  await flushDb();
  console.log(`Selesai — ${n} koleksi. Sekarang HAPUS DATA_ENCRYPTION_KEY_OLD dari env.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Rotasi gagal:', err.message);
  process.exit(1);
});
