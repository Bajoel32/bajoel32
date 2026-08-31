// Site configuration - Customize your content here
export const siteConfig = {
  brand: {
    name: 'Srikandi',
    tagline: 'Perhiasan Elegan, Dibuat dengan Cinta',
    description: 'Rumah perhiasan yang merawat, memperbaiki, dan menghadirkan mahakarya emas serta berlian pilihan.',
  },

  navigation: [
    { label: 'Keunggulan', href: '#features' },
    { label: 'Koleksi', href: '#showcase' },
    { label: 'Lokasi', href: '#lokasi' },
    { label: 'Layanan', href: '#contact' },
    { label: 'Kontak', href: '#contact' },
  ],

  hero: {
    subtitle: 'La Maison Srikandi',
    title: 'Dibentuk oleh Cahaya',
    description:
      'Perhiasan emas dan berlian pilihan, dikerjakan tangan pengrajin kami dengan ketelitian dan cinta — untuk setiap momen yang berarti.',
    primaryCTA: { text: 'Lihat Pesanan', action: 'explore' },
    secondaryCTA: { text: 'Jelajahi Galeri', action: 'gallery' },
  },

  features: [
    {
      id: 1,
      icon: '💎',
      title: 'Pengerjaan Presisi',
      description: 'Setiap detail dikerjakan tangan pengrajin berpengalaman puluhan tahun.',
      subtitle: 'Craftsmanship',
    },
    {
      id: 2,
      icon: '🛡️',
      title: 'Bahan Terjamin',
      description: 'Emas dan batu mulia bersertifikat, kadar sesuai dengan yang Anda pesan.',
      subtitle: 'Autentik',
    },
    {
      id: 3,
      icon: '✨',
      title: 'Layanan Personal',
      description: 'Konsultasi desain dan pantau progres pengerjaan Anda secara langsung.',
      subtitle: 'Eksklusif',
    },
  ],

  showcase: [
    {
      id: 1,
      icon: '💍',
      title: 'Cincin & Tunangan',
      description: 'Desain klasik hingga kontemporer untuk momen paling berharga.',
    },
    {
      id: 2,
      icon: '📿',
      title: 'Kalung & Gelang',
      description: 'Rangkaian emas dan berlian dengan sentuhan artistik.',
    },
  ],

  cta: {
    title: 'Wujudkan Perhiasan Impian Anda',
    subtitle: 'Konsultasikan desain, perawatan, atau perbaikan perhiasan Anda bersama pengrajin kami.',
    buttonText: 'Mulai Konsultasi',
  },

  // Lokasi toko — dipakai di section "Lokasi" pada Home (peta + alamat + jam buka).
  // `coords` (dari share-link Google Maps toko) = titik pin peta & tujuan arah.
  // `mapsUrl` = short-link Google Maps resmi (dibuka tombol "Buka di Google Maps").
  location: {
    name: 'Toko Emas Srikandi Palangkaraya',
    address: 'Jl. Sumatra, Pahandut, Kec. Pahandut',
    city: 'Kota Palangka Raya, Kalimantan Tengah 74874',
    hours: [
      { day: 'Senin – Sabtu', time: '09.00 – 16.00' },
      { day: 'Minggu', time: '10.00 – 16.00' },
    ],
    coords: '-2.207947,113.9365328',
    mapsUrl: 'https://maps.app.goo.gl/Ma4mhS7MSWtZ4ymB6',
  },

  // Media sosial — tampil di pojok kanan atas (navbar) dengan label "Follow kami"
  social: [
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/tokoemassrikandipalangkaraya?utm_source=qr&igsi=cmtvdTJlb21ybXE5',
    },
    {
      label: 'TikTok',
      href: 'https://www.tiktok.com/@toko_emas_srikandi?_r=1&_t=ZS-99EUtuZMq05',
    },
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/share/1BQptYVqF8',
    },
  ],

  // Kontak WhatsApp — tampil di header halaman Konsultasi
  whatsapp: 'https://wa.me/6281234567890',

  // Estimasi harga emas — data statis/demo, BUKAN feed harga real-time.
  // Diperbarui manual secara berkala oleh tim. Jangan tampilkan sebagai "LIVE".
  goldRates: [
    { weight: '1gr', buy: 1_412_000, sell: 1_398_000, change: 1.24, sparkline: [94, 92, 93, 95, 94, 97, 98, 100] },
    { weight: '5gr', buy: 7_020_000, sell: 6_950_000, change: 0.87, sparkline: [90, 91, 89, 92, 93, 94, 95, 100] },
    { weight: '10gr', buy: 14_010_000, sell: 13_890_000, change: -0.43, sparkline: [100, 98, 99, 96, 97, 95, 96, 95] },
  ],

  footer: {
    copyright: '© 2026 Srikandi. Hak cipta dilindungi.',
  },

  // Services data - dapat diganti dengan API call ke backend nanti.
  // Harga & estimasi waktu tidak ditampilkan: bersifat penawaran, dikonfirmasi staf setelah konsultasi.
  services: [
    {
      id: 1,
      name: 'Cuci Emas',
      icon: '✨',
      description: 'Pembersihan emas hingga bersih dan berkilau seperti baru',
    },
    {
      id: 2,
      name: 'Pasang Berlian',
      icon: '💎',
      description: 'Pemasangan berlian dan batu mulia dengan presisi tinggi',
    },
    {
      id: 3,
      name: 'Patri Emas',
      icon: '🔥',
      description: 'Penyambungan dan perbaikan emas menggunakan teknik patri profesional',
    },
    {
      id: 4,
      name: 'Chrome Putih',
      icon: '🩶',
      description: 'Pelapisan chrome putih untuk perhiasan dengan durabilitas maksimal',
    },
    {
      id: 6,
      name: 'Pemurnian Emas',
      icon: '⚗️',
      description: 'Pemurnian emas untuk menaikkan kadar dan memisahkan campuran logam lain',
    },
    {
      id: 5,
      name: 'Pesanan',
      icon: '💍',
      description: 'Buat perhiasan baru sesuai desain Anda — konsultasi model dan bahan bersama pengrajin kami',
    },
  ],

  // Sample orders data - dapat diganti dengan API call ke backend nanti
  orders: [
    {
      id: 1,
      orderNumber: 'SR-001-2026',
      customerName: 'Siti Nurhaliza',
      goldPurity: 75,
      progress: 75,
      status: 'Sedang Dikerjakan',
      createdDate: '2026-08-01',
    },
    {
      id: 2,
      orderNumber: 'SR-002-2026',
      customerName: 'Rini Sulistyo',
      goldPurity: 70,
      progress: 100,
      status: 'Selesai',
      createdDate: '2026-07-28',
    },
    {
      id: 3,
      orderNumber: 'SR-003-2026',
      customerName: 'Maya Kusuma',
      goldPurity: 80,
      progress: 50,
      status: 'Sedang Dikerjakan',
      createdDate: '2026-08-05',
    },
    {
      id: 4,
      orderNumber: 'SR-004-2026',
      customerName: 'Dewi Lestari',
      goldPurity: 75,
      progress: 25,
      status: 'Belum Dimulai',
      createdDate: '2026-08-10',
    },
    {
      id: 5,
      orderNumber: 'SR-005-2026',
      customerName: 'Anita Wijaya',
      goldPurity: 70,
      progress: 90,
      status: 'Menunggu Approval',
      createdDate: '2026-08-03',
    },
  ],

  // Gallery data - dapat diganti dengan API call ke backend terpisah nanti
  galleries: [
    {
      id: 1,
      title: 'Gelang Emas Klasik',
      description: 'Gelang emas putih dengan desain klasik yang elegan dan timeless',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop',
      category: 'Gelang',
      price: 2500000,
      tags: ['Emas Putih', 'Klasik', 'Wanita'],
      uploadedBy: 'Budi Sales',
      uploadedDate: '2026-08-10',
      details: {
        'Berat Emas': '5 gram',
        'Kadar': '75 Karat',
        'Ukuran': 'Free Size',
      },
    },
    {
      id: 2,
      title: 'Cincin Berlian Solitaire',
      description: 'Cincin berlian solitaire dengan batu berkualitas VVS1',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop',
      category: 'Cincin',
      price: 15000000,
      tags: ['Berlian', 'Premium', 'Wanita'],
      uploadedBy: 'Siti Sales',
      uploadedDate: '2026-08-09',
      details: {
        'Batu': 'Berlian 1.5 Carat',
        'Kadar Emas': '70 Karat',
        'Sertifikat': 'GIA',
      },
    },
    {
      id: 3,
      title: 'Kalung Emas Panjang',
      description: 'Kalung emas kuning dengan desain mewah dan artistik',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop',
      category: 'Kalung',
      price: 3500000,
      tags: ['Emas Kuning', 'Mewah', 'Wanita'],
      uploadedBy: 'Rina Sales',
      uploadedDate: '2026-08-08',
      details: {
        'Panjang': '45 cm',
        'Berat': '8 gram',
        'Kadar': '70 Karat',
      },
    },
    {
      id: 4,
      title: 'Anting Mutiara Elegan',
      description: 'Anting emas dengan mutiara asli dari laut',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop',
      category: 'Anting',
      price: 1800000,
      tags: ['Mutiara', 'Elegan', 'Wanita'],
      uploadedBy: 'Maya Sales',
      uploadedDate: '2026-08-07',
      details: {
        'Batu': 'Mutiara Asli',
        'Ukuran Mutiara': '10mm',
        'Kadar': '75 Karat',
      },
    },
    {
      id: 5,
      title: 'Liontin Salib Emas',
      description: 'Liontin salib dengan detail ukiran halus',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop',
      category: 'Liontin',
      price: 950000,
      tags: ['Salib', 'Religius', 'Unisex'],
      uploadedBy: 'Andi Sales',
      uploadedDate: '2026-08-06',
      details: {
        'Tinggi': '3 cm',
        'Berat': '2 gram',
        'Kadar': '70 Karat',
      },
    },
    {
      id: 6,
      title: 'Gelang Berlian Modern',
      description: 'Gelang tennis dengan berlian berlapis sempurna',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop',
      category: 'Gelang',
      price: 8500000,
      tags: ['Berlian', 'Modern', 'Wanita'],
      uploadedBy: 'Budi Sales',
      uploadedDate: '2026-08-05',
      details: {
        'Batu': '20 Berlian Total 2 Carat',
        'Kadar': '75 Karat',
        'Panjang': '18 cm',
      },
    },
    {
      id: 7,
      title: 'Cincin Couple Emas',
      description: 'Cincin pasangan dengan desain matching yang romantis',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop',
      category: 'Cincin',
      price: 4200000,
      tags: ['Couple', 'Romantis', 'Pria & Wanita'],
      uploadedBy: 'Siti Sales',
      uploadedDate: '2026-08-04',
      details: {
        'Jumlah': '2 Buah (Pria & Wanita)',
        'Berat': '4 gram per cincin',
        'Kadar': '70 Karat',
      },
    },
    {
      id: 8,
      title: 'Kalung Perak Antik',
      description: 'Kalung perak dengan motif tradisional dan artistik',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop',
      category: 'Kalung',
      price: 650000,
      tags: ['Perak', 'Tradisional', 'Unisex'],
      uploadedBy: 'Rina Sales',
      uploadedDate: '2026-08-03',
      details: {
        'Material': 'Perak 925',
        'Panjang': '50 cm',
        'Berat': '12 gram',
      },
    },
  ],
};
