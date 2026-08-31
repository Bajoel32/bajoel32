import { useState } from 'react';

export default function GalleryCard({
  image,
  title,
  description,
  category,
  price,
  onClick,
  showPrice = true,
  hoverable = true,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`group relative bg-white dark:bg-ink-800 rounded-2xl border border-gold-200/70 dark:border-ink-700 overflow-hidden transition-all duration-300 ${
        hoverable ? 'cursor-pointer hover:border-gold-400 hover:shadow-elegant hover:-translate-y-1' : ''
      }`}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-cream-100 dark:bg-ink-900 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-linear-to-br from-cream-100 to-cream-200 dark:from-ink-800 dark:to-ink-900 animate-pulse" />
        )}

        {!imageError ? (
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-2 opacity-50">◈</div>
              <p className="text-xs text-ink-600 dark:text-cream-200/50">Gambar tidak tersedia</p>
            </div>
          </div>
        )}

        {/* Category Badge */}
        {category && (
          <div className="absolute top-3 left-3 bg-ink-900/85 text-cream-50 px-3 py-1 rounded-lg text-[0.65rem] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm">
            {category}
          </div>
        )}

        {/* Price Badge */}
        {showPrice && price && (
          <div className="absolute bottom-3 right-3 bg-cream-50/95 text-ink-900 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold backdrop-blur-sm">
            Rp {price.toLocaleString('id-ID')}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 sm:p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-cream-50 mb-1 line-clamp-2 text-base sm:text-lg">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-ink-600 dark:text-cream-200/70 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
