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
    <div className="fluid-shell">
      <div className="flex items-end justify-between mb-4">
        <span className="flex items-center gap-3">
          <span className="gold-rule" />
          <span className="eyebrow">Koleksi Pilihan</span>
        </span>
        <button
          onClick={() => onNavigate?.('gallery')}
          className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-900 hover:text-gold-600"
        >
          Lihat Semua →
        </button>
      </div>

      <div className="float-card relative h-[clamp(10rem,28vw,15rem)] rounded-2xl overflow-hidden bg-ink-900">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? 'auto' : 'none' }}
          >
            <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-55" loading="lazy" />
            <div className="absolute inset-0 bg-linear-to-r from-ink-900/90 via-ink-900/40 to-transparent" />
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center max-w-xs">
              <span className="text-[0.6rem] font-bold tracking-[0.2em] text-gold-400 uppercase mb-2">
                {item.category}
              </span>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-cream-50 leading-snug mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs text-cream-100/65 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
              <button
                onClick={() => onNavigate?.('gallery')}
                className="self-start rounded-lg bg-cream-50 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink-900 hover:bg-gold-400 transition-colors"
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
                className="h-1 rounded-full transition-all"
                style={{
                  width: i === idx ? 20 : 8,
                  background: i === idx ? '#c5a880' : 'rgba(249,247,241,0.35)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
