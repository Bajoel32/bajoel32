import { Router } from 'express';
import { db } from '../db.js';

export const galleryRouter = Router();

// Katalog publik untuk storefront. Penulisan galeri lewat admin hub
// (POST/PUT/DELETE /api/admin/gallery, dilindungi requireAdmin).
galleryRouter.get('/', (req, res) => {
  res.json({ items: db.all('gallery') });
});
