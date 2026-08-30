import { useEffect, useRef, useState } from 'react';
import { siteConfig } from '../config/site';

export default function PromoCarousel({ onNavigate }) {
  const items = (siteConfig.galleries || []).slice(0, 3);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (items.length < 2) return;
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % items.length), 4500);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="mx-4 sm:mx-6 max-w-7xl lg:mx-auto lg:w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-base sm:text-lg font-semibold text-ink-900 dark:text-cream-50">
          Koleksi Pilihan
        </span>
        <button
          onClick={() => onNavigate?.('gallery')}
          className="text-xs font-semibold text-gold-600 dark:text-gold-300 hover:text-gold-700"
        >
          Lihat Semua →
        </button>
      </div>

      <div className="relative h-40 sm:h-48 rounded-2xl overflow-hidden bg-ink-900 shadow-elegant">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? 'auto' : 'none' }}
          >
            <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-55" loading="lazy" />
            <div className="absolute inset-0 bg-linear-to-r from-ink-900/90 via-ink-900/40 to-transparent" />
            <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-center max-w-xs">
              <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-gold-300 uppercase mb-1.5">
                ✦ {item.category}
              </span>
              <h3 className="font-display text-base sm:text-lg font-semibold text-cream-50 leading-snug mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs text-cream-100/65 mb-3 line-clamp-2">{item.description}</p>
              <button
                onClick={() => onNavigate?.('gallery')}
                className="self-start rounded-lg bg-linear-to-br from-gold-400 to-gold-600 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-wide text-ink-900 hover:from-gold-300 hover:to-gold-500 transition-colors"
              >
                Lihat Detail →
              </button>
            </div>
          </div>
        ))}

        {items.length > 1 && (
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === idx ? 18 : 6,
                  background: i === idx ? '#D4AF37' : 'rgba(249,247,241,0.35)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
