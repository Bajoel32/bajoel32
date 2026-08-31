import { useState } from 'react';
import { siteConfig } from '../config/site';

function fmt(n) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}Jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}Rb`;
  return `Rp ${n}`;
}

function Sparkline({ points, up }) {
  const w = 56;
  const h = 26;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((v) => h - ((v - min) / (max - min + 0.001)) * h);
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
      <path
        d={d}
        stroke={up ? '#4f7a4f' : '#a8564e'}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function GoldPriceCard({ onNavigate }) {
  const rates = siteConfig.goldRates || [];
  const [active, setActive] = useState(0);
  const item = rates[active];
  if (!item) return null;
  const up = item.change >= 0;

  return (
    <div className="fluid-shell">
      <div className="float-card relative overflow-hidden rounded-2xl bg-cream-100 border border-cream-200 px-[clamp(1.25rem,4vw,1.75rem)] py-[clamp(1.25rem,3.5vw,1.5rem)]">
        {/* Header */}
        <div className="relative flex items-center justify-between mb-4">
          <span className="flex items-center gap-3">
            <span className="gold-rule" />
            <span className="eyebrow">Estimasi Harga Emas</span>
          </span>
          <span className="text-[0.65rem] font-sans text-mute">Update berkala</span>
        </div>

        {/* Weight tabs */}
        <div className="relative flex gap-2 mb-4">
          {rates.map((g, i) => (
            <button
              key={g.weight}
              onClick={() => setActive(i)}
              className={`rounded-lg px-3 py-1.5 text-[0.7rem] font-sans font-semibold tracking-wide transition-colors ${
                active === i
                  ? 'bg-ink-900 text-cream-50 border border-ink-900'
                  : 'bg-white text-ink-600 border border-cream-200 hover:border-gold-400'
              }`}
            >
              {g.weight}
            </button>
          ))}
        </div>

        {/* Price row */}
        <div className="relative flex items-end justify-between">
          <div>
            <p className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-semibold text-ink-900 leading-none">
              {fmt(item.buy)}
            </p>
            <p className="text-xs font-sans text-ink-600 mt-1.5">Jual: {fmt(item.sell)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Sparkline points={item.sparkline} up={up} />
            <span
              className={`rounded-md px-2 py-0.5 text-[0.7rem] font-sans font-bold ${
                up ? 'bg-[#4f7a4f]/12 text-[#3d5f3d]' : 'bg-[#a8564e]/12 text-[#7d3f39]'
              }`}
            >
              {up ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
            </span>
          </div>
        </div>

        <p className="relative mt-3 text-[0.68rem] leading-snug text-mute">
          Bukan harga real-time — konfirmasi harga terkini ke staf kami sebelum bertransaksi.
        </p>

        {/* Actions */}
        <div className="relative flex flex-col xs:flex-row gap-2.5 mt-4">
          <button
            onClick={() => onNavigate?.('consult')}
            className="flex-1 min-w-0 rounded-xl bg-ink-900 py-2.5 text-[0.7rem] font-sans font-bold uppercase tracking-[0.14em] text-cream-50 hover:bg-gold-400 hover:text-ink-900 transition-colors"
          >
            Konsultasi Beli
          </button>
          <button
            onClick={() => onNavigate?.('consult')}
            className="flex-1 min-w-0 rounded-xl border border-ink-900 bg-white py-2.5 text-[0.7rem] font-sans font-semibold uppercase tracking-[0.14em] text-ink-900 hover:bg-ink-900 hover:text-cream-50 transition-colors"
          >
            Konsultasi Jual
          </button>
        </div>
      </div>
    </div>
  );
}
