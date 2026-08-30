// Isi data awal (dummy). Jalankan: npm run seed
// - services  : 6 jenis layanan (tanpa harga/estimasi)
// - customers : 60 konsumen deterministik (kata sandi di-hash bcrypt)
// - orders    : 1-3 pesanan per konsumen
// - gallery   : katalog contoh
// - kb        : potongan basis pengetahuan untuk RAG chatbot
import bcrypt from 'bcryptjs';
import { db, initDb, flushDb } from './db.js';

/* ---- generator konsumen (samakan urutan rng dengan src/config/orders.js) ---- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Siti', 'Rini', 'Maya', 'Dewi', 'Anita', 'Budi', 'Andi', 'Rina', 'Putri', 'Sri',
  'Agus', 'Fitri', 'Nia', 'Hendra', 'Yuni', 'Bagus', 'Intan', 'Rizki', 'Sari', 'Dian',
  'Eka', 'Wulan', 'Tono', 'Joko', 'Ratna', 'Ayu', 'Bayu', 'Citra', 'Lestari', 'Wayan',
];
const LAST = [
  'Nurhaliza', 'Sulistyo', 'Kusuma', 'Lestari', 'Wijaya', 'Santoso', 'Pratama', 'Hidayat',
  'Saputra', 'Anggraini', 'Puspita', 'Maharani', 'Permata', 'Halim', 'Gunawan', 'Utami',
  'Wibowo', 'Rahayu', 'Setiawan', 'Firmansyah',
];
const ORDER_SVC = ['Cuci Emas', 'Pasang Berlian', 'Patri Emas', 'Chrome Putih', 'Custom Cincin', 'Reparasi Kalung'];
const PURITY = [70, 75, 80];
const pad = (n, l) => String(n).padStart(l, '0');

function buildCustomers() {
  const customers = [];
  const orders = [];
  let seq = 1;

  for (let i = 0; i < 60; i++) {
    const rng = mulberry32(1000 + i);
    const name = `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`;
    const phone = `0812${pad(Math.floor(rng() * 1e8), 8)}`;
    const password = pad(Math.floor(rng() * 1e6), 6);

    const n = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < n; k++) {
      const r = rng();
      let status;
      let progress;
      if (r < 0.18) {
        status = 'Belum Dimulai';
        progress = 0;
      } else if (r < 0.34) {
        status = 'Menunggu Approval';
        progress = 10 + Math.floor(rng() * 15);
      } else if (r < 0.78) {
        status = 'Sedang Dikerjakan';
        progress = 30 + Math.floor(rng() * 60);
      } else {
        status = 'Selesai';
        progress = 100;
      }
      const month = 6 + Math.floor(rng() * 3);
      const day = 1 + Math.floor(rng() * 27);
      orders.push({
        id: seq,
        customerId: i + 1,
        customerName: name,
        orderNumber: `SR-${pad(seq, 3)}-2026`,
        serviceName: ORDER_SVC[Math.floor(rng() * ORDER_SVC.length)],
        goldPurity: PURITY[Math.floor(rng() * PURITY.length)],
        progress,
        status,
        createdDate: `2026-${pad(month, 2)}-${pad(day, 2)}`,
      });
      seq++;
    }
    customers.push({ id: i + 1, name, phone, password });
  }
  return { customers, orders };
}

/* ------------------------------ data statis ------------------------------ */

const SERVICES = [
  { id: 1, name: 'Cuci Emas', icon: '✨', description: 'Pembersihan emas hingga bersih dan berkilau seperti baru' },
  { id: 2, name: 'Pasang Berlian', icon: '💎', description: 'Pemasangan berlian dan batu mulia dengan presisi tinggi' },
  { id: 3, name: 'Patri Emas', icon: '🔥', description: 'Penyambungan dan perbaikan emas menggunakan teknik patri profesional' },
  { id: 4, name: 'Chrome Putih', icon: '🩶', description: 'Pelapisan chrome putih untuk perhiasan dengan durabilitas maksimal' },
  { id: 6, name: 'Pemurnian Emas', icon: '⚗️', description: 'Pemurnian emas untuk menaikkan kadar dan memisahkan campuran logam lain' },
  { id: 5, name: 'Pesanan', icon: '💍', description: 'Buat perhiasan baru sesuai desain Anda — konsultasi model dan bahan bersama pengrajin kami' },
];

const IMG_A = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop';
const IMG_B = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop';

const GALLERY = [
  { id: 1, title: 'Gelang Emas Klasik', description: 'Gelang emas putih dengan desain klasik yang elegan dan timeless', image: IMG_A, category: 'Gelang', price: 2500000, tags: ['Emas Putih', 'Klasik'], uploadedBy: 'Budi Sales', uploadedDate: '2026-08-10' },
  { id: 2, title: 'Cincin Berlian Solitaire', description: 'Cincin berlian solitaire dengan batu berkualitas VVS1', image: IMG_A, category: 'Cincin', price: 15000000, tags: ['Berlian', 'Premium'], uploadedBy: 'Siti Sales', uploadedDate: '2026-08-09' },
  { id: 3, title: 'Kalung Emas Panjang', description: 'Kalung emas kuning dengan desain mewah dan artistik', image: IMG_B, category: 'Kalung', price: 3500000, tags: ['Emas Kuning', 'Mewah'], uploadedBy: 'Rina Sales', uploadedDate: '2026-08-08' },
  { id: 4, title: 'Anting Mutiara Elegan', description: 'Anting emas dengan mutiara asli dari laut', image: IMG_A, category: 'Anting', price: 1800000, tags: ['Mutiara', 'Elegan'], uploadedBy: 'Maya Sales', uploadedDate: '2026-08-07' },
  { id: 5, title: 'Liontin Salib Emas', description: 'Liontin salib dengan detail ukiran halus', image: IMG_A, category: 'Liontin', price: 950000, tags: ['Religius', 'Unisex'], uploadedBy: 'Andi Sales', uploadedDate: '2026-08-06' },
  { id: 6, title: 'Gelang Berlian Modern', description: 'Gelang tennis dengan berlian berlapis sempurna', image: IMG_A, category: 'Gelang', price: 8500000, tags: ['Berlian', 'Modern'], uploadedBy: 'Budi Sales', uploadedDate: '2026-08-05' },
  { id: 7, title: 'Cincin Couple Emas', description: 'Cincin pasangan dengan desain matching yang romantis', image: IMG_A, category: 'Cincin', price: 4200000, tags: ['Couple', 'Romantis'], uploadedBy: 'Siti Sales', uploadedDate: '2026-08-04' },
  { id: 8, title: 'Kalung Perak Antik', description: 'Kalung perak dengan motif tradisional dan artistik', image: IMG_B, category: 'Kalung', price: 650000, tags: ['Perak', 'Tradisional'], uploadedBy: 'Rina Sales', uploadedDate: '2026-08-03' },
];

const KB = [
  { title: 'Layanan Cuci Emas', text: 'Cuci emas adalah pembersihan perhiasan emas agar kembali bersih dan berkilau seperti baru. Bawa perhiasan ke toko atau kirim untuk dikerjakan. Biaya bersifat penawaran, dikonfirmasi staf.' },
  { title: 'Layanan Pasang Berlian', text: 'Pemasangan berlian atau batu mulia pada cincin, liontin, atau anting dengan presisi tinggi. Estimasi biaya diberikan setelah barang dan batu diperiksa.' },
  { title: 'Layanan Patri Emas', text: 'Patri emas untuk menyambung atau memperbaiki rantai, cincin, dan gelang yang putus atau retak menggunakan teknik patri profesional.' },
  { title: 'Layanan Chrome Putih', text: 'Pelapisan chrome atau rhodium putih agar perhiasan emas tampak seperti emas putih dan lebih tahan gores. Cocok untuk memperbarui tampilan perhiasan lama.' },
  { title: 'Layanan Pemurnian Emas', text: 'Pemurnian emas menaikkan kadar dengan memisahkan campuran logam lain. Kadar akhir dikonfirmasi setelah proses selesai.' },
  { title: 'Pesanan Perhiasan Custom', text: 'Pesan perhiasan baru sesuai desain Anda. Prosesnya: konsultasi model dan bahan dengan pengrajin melalui form Buat Janji, lalu pengerjaan setelah desain dan DP disepakati.' },
  { title: 'Kebijakan Pembatalan', text: 'Pembatalan pesanan dapat dilakukan dalam 24 jam setelah pemesanan dengan pengembalian DP 90 persen. Hubungi customer service untuk memprosesnya.' },
  { title: 'Kebijakan Pengiriman dan Keamanan', text: 'Barang dikirim dengan asuransi pengiriman penuh dan kemasan premium. Rata-rata pengerjaan 5 sampai 14 hari kerja tergantung jenis dan kerumitan pekerjaan.' },
  { title: 'Metode Pembayaran', text: 'Pembayaran bisa DP (bayar sebagian dulu) atau penuh. Harga final dikonfirmasi setelah kami menerima detail barang atau desain Anda. Harga jasa tidak dipublikasikan karena bersifat penawaran.' },
  { title: 'Kontak dan Lokasi', text: 'Srikandi adalah toko emas di Palangka Raya. Untuk janji temu, komplain, perubahan pesanan, atau pertanyaan yang butuh admin, hubungi kami lewat WhatsApp.' },
  { title: 'Portal Pantau Pesanan', text: 'Konsumen dapat memantau progres pesanan secara mandiri dengan login memakai nomor HP terdaftar dan kode akses di halaman Lihat Pesanan. Data pesanan bersifat pribadi.' },
  { title: 'Media Sosial', text: 'Ikuti Srikandi di Instagram (tokoemassrikandipalangkaraya), TikTok (toko_emas_srikandi), dan Facebook untuk katalog dan promo terbaru.' },
];

/* --------------------------------- run --------------------------------- */

// Isi semua koleksi dengan data awal. `initDb()` harus sudah dipanggil.
export async function seed({ quiet = false } = {}) {
  const { customers, orders } = buildCustomers();
  const hashed = [];
  for (const c of customers) {
    hashed.push({ id: c.id, name: c.name, phone: c.phone, passwordHash: await bcrypt.hash(c.password, 10) });
  }

  db.set('services', SERVICES);
  db.set('customers', hashed);
  db.set('orders', orders);
  db.set('gallery', GALLERY);
  db.set('kb', KB.map((c, i) => ({ id: i + 1, ...c })));
  db.set('bookings', []);
  db.set('sessions', []);
  db.set('consult_logs', []);
  db.set('settings', [{ key: 'rag', topK: 4, minScore: 0.5 }]);
  await flushDb();

  if (!quiet) {
    console.log(`Seed OK — ${hashed.length} konsumen · ${orders.length} pesanan · ${GALLERY.length} galeri · ${KB.length} KB chunk`);
    console.log('Akun demo (HP · sandi):');
    for (const c of customers.slice(0, 3)) console.log(`  ${c.phone} · ${c.password}  (${c.name})`);
  }
  return { customers: hashed.length, orders: orders.length };
}

// Seed hanya bila koleksi inti masih kosong (dipakai saat boot di Render).
export async function ensureSeeded() {
  if (db.all('services').length === 0) {
    console.log('[seed] koleksi kosong — mengisi data awal...');
    await seed({ quiet: true });
  }
}

// Jalankan sebagai skrip: `npm run seed`
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.js')) {
  initDb().then(() => seed()).then(() => process.exit(0));
}
