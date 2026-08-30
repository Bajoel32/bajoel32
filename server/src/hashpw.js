// Buat hash bcrypt untuk ADMIN_PASSWORD_HASH.
// Pakai: npm run admin:hash -- "kata-sandi-anda"
import bcrypt from 'bcryptjs';

const pw = process.argv[2];
if (!pw) {
  console.error('Pakai: npm run admin:hash -- "kata-sandi-anda"');
  process.exit(1);
}
console.log(bcrypt.hashSync(pw, 10));
