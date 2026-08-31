// Konfigurasi + "jembatan" ke backend untuk fitur Galeri.
//
// Arsitektur (lihat API-SCHEMA.md §1):
//   Browser  ->  GET /api/gallery  ->  server/data/gallery.json
//
// Selama VITE_GALLERY_API belum diisi, `getGalleryItems()` otomatis memakai
// `siteConfig.galleries` (data statis) supaya halaman tetap bisa dicoba tanpa
// menjalankan server/.

import { siteConfig } from './site';

// Isi lewat .env.local (VITE_GALLERY_API=http://localhost:8787/api/gallery) saat backend siap.
const ENDPOINT = import.meta.env.VITE_GALLERY_API || '';

/**
 * Ambil daftar item galeri.
 * @returns {Promise<Array>} array item `{id, title, description, image, category, price, tags, uploadedBy?, uploadedDate?, details?}`
 */
export async function getGalleryItems() {
  if (!ENDPOINT) return siteConfig.galleries || [];

  try {
    const res = await fetch(ENDPOINT, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch (err) {
    // Backend gagal -> pakai data statis supaya UX tidak mati total saat demo.
    if (import.meta.env.DEV) console.warn('Galeri API gagal, memakai data statis:', err);
    return siteConfig.galleries || [];
  }
}
