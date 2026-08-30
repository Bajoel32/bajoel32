import { useState, useMemo, useEffect } from 'react';
import Button from './Button';
import BackButton from './BackButton';
import GalleryCard from './GalleryCard';
import SalesPanel from './SalesPanel';
import { getGalleryItems } from '../config/gallery';

export default function GalleryPage({ onBack }) {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getGalleryItems().then((items) => {
      if (!cancelled) {
        setGalleries(items);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const cats = galleries.reduce((acc, item) => {
      if (item.category && !acc.includes(item.category)) acc.push(item.category);
      return acc;
    }, []);
    return ['all', ...cats];
  }, [galleries]);

  const uploadCategories = useMemo(() => categories.filter((c) => c !== 'all'), [categories]);

  // Item baru dari panel sales (pratinjau lokal — tidak dikirim ke server).
  const handleSalesAdd = (item) => {
    setGalleries((prev) => [item, ...prev]);
    setSelectedCategory(item.category);
    setSearchQuery('');
  };

  const filteredGalleries = useMemo(() => {
    return galleries.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [galleries, selectedCategory, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-cream-50 dark:bg-ink-900">
      {/* Header */}
      <div className="relative bg-cream-100 dark:bg-ink-800/40 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-gold-200/70 dark:border-ink-700 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-gold-200/40 dark:bg-gold-600/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto">
          <BackButton onClick={onBack} className="mb-8" />
          <span className="eyebrow">Koleksi Pilihan</span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 dark:text-cream-50 mt-3 mb-3">
            Galeri Perhiasan
          </h1>
          <p className="text-sm sm:text-base text-ink-600 dark:text-cream-200/70 max-w-xl">
            Koleksi perhiasan pilihan kami. Setiap desain dikerjakan dengan detail dan ketelitian.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari perhiasan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-3 rounded-lg border border-gold-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-50 placeholder:text-ink-600/50 dark:placeholder:text-cream-200/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <h3 className="eyebrow mb-3">Filter Kategori</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                    selectedCategory === category
                      ? 'bg-ink-900 text-cream-50 dark:bg-gold-500 dark:text-ink-900'
                      : 'bg-white dark:bg-ink-800 text-ink-600 dark:text-cream-200/70 border border-gold-200/70 dark:border-ink-700 hover:border-gold-400'
                  }`}
                >
                  {category === 'all' ? 'Semua' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-ink-600 dark:text-cream-200/60">
              Menampilkan <strong className="text-ink-900 dark:text-cream-50">{filteredGalleries.length}</strong> dari{' '}
              <strong className="text-ink-900 dark:text-cream-50">{galleries.length}</strong> perhiasan
            </p>
          </div>

          {/* Gallery Grid */}
          {loading ? (
            <p className="text-center text-sm text-ink-600 dark:text-cream-200/60 py-20">Memuat…</p>
          ) : filteredGalleries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredGalleries.map((item) => (
                <GalleryCard
                  key={item.id}
                  {...item}
                  onClick={() => setSelectedImage(item)}
                  hoverable={true}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center rounded-2xl border border-gold-200/70 dark:border-ink-700 bg-white dark:bg-ink-800">
              <div className="text-4xl mb-4 text-gold-400">◇</div>
              <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-cream-50 mb-2">
                Tidak ada hasil
              </h3>
              <p className="text-sm text-ink-600 dark:text-cream-200/70">
                Coba ubah filter atau kata kunci pencarian Anda.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-ink-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-cream-50 dark:bg-ink-800 max-w-4xl w-full max-h-[90vh] overflow-auto rounded-2xl border border-gold-300/60 dark:border-ink-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-5 sm:p-6 border-b border-gold-200/70 dark:border-ink-700 bg-cream-50 dark:bg-ink-800">
              <h2 className="font-display text-lg sm:text-2xl font-semibold text-ink-900 dark:text-cream-50">
                Detail Perhiasan
              </h2>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-ink-600 dark:text-cream-200/70 hover:text-gold-600 text-xl"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-7">
              <div className="mb-6 overflow-hidden rounded-xl bg-cream-100 dark:bg-ink-900 border border-gold-200/60 dark:border-ink-700">
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-96 object-cover"
                  loading="lazy"
                />
              </div>

              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-ink-900 dark:text-cream-50 mb-2">
                      {selectedImage.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-gold-100 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                        {selectedImage.category}
                      </span>
                      {selectedImage.tags?.map((tag) => (
                        <span key={tag} className="bg-white dark:bg-ink-900 border border-gold-200/70 dark:border-ink-700 text-ink-600 dark:text-cream-200/70 px-3 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedImage.price && (
                    <div className="text-right">
                      <p className="eyebrow">Harga</p>
                      <p className="font-display text-2xl font-semibold text-gold-600 dark:text-gold-300 mt-1">
                        Rp {selectedImage.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="eyebrow mb-2">Deskripsi</h4>
                  <p className="text-sm text-ink-600 dark:text-cream-200/70 leading-relaxed">{selectedImage.description}</p>
                </div>

                {selectedImage.details && (
                  <div>
                    <h4 className="eyebrow mb-3">Spesifikasi</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(selectedImage.details).map(([key, value]) => (
                        <div key={key} className="bg-white dark:bg-ink-900 rounded-lg border border-gold-200/60 dark:border-ink-700 p-3">
                          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-gold-700 dark:text-gold-300">{key}</p>
                          <p className="font-medium text-ink-900 dark:text-cream-50 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedImage.uploadedBy && (
                  <div className="bg-white dark:bg-ink-900 rounded-lg border-l-2 border-gold-500 p-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.12em] text-gold-700 dark:text-gold-300">Diunggah oleh</p>
                    <p className="font-medium text-ink-900 dark:text-cream-50 mt-0.5">{selectedImage.uploadedBy}</p>
                    {selectedImage.uploadedDate && (
                      <p className="text-xs text-ink-600 dark:text-cream-200/50 mt-1">
                        {new Date(selectedImage.uploadedDate).toLocaleDateString('id-ID')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gold-200/70 dark:border-ink-700">
                  <Button variant="primary" size="md" className="flex-1" onClick={() => setSelectedImage(null)}>
                    Pesan Sekarang
                  </Button>
                  <Button variant="outline" size="md" className="flex-1" onClick={() => setSelectedImage(null)}>
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SalesPanel categories={uploadCategories} onAdd={handleSalesAdd} />
    </div>
  );
}
