// Buat kunci acak 32-byte (base64) untuk DATA_ENCRYPTION_KEY.
// Pakai: npm run gen:datakey
import crypto from 'node:crypto';

console.log(crypto.randomBytes(32).toString('base64'));
