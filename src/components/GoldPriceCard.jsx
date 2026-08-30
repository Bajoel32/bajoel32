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
        stroke={up ? '#4ADE80' : '#F87171'}
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
    <div className="mx-4 sm:mx-6 max-w-7xl lg:mx-auto lg:w-full">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#F9C6A9] via-[#F6B0B4] to-[#F2A5C6] px-5 py-5 sm:px-7 sm:py-6 shadow-elegant">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full border border-ink-900/10" />
        <div className="pointer-events-none absolute -right-11 -top-11 h-36 w-36 rounded-full border border-ink-900/6" />

        {/* Header */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ink-900/70" />
            <span className="text-[0.65rem] font-sans tracking-[0.18em] text-ink-900/70 font-medium">
              ESTIMASI HARGA EMAS
            </span>
          </div>
          <span className="text-[0.65rem] font-sans text-ink-900/45">Update berkala</span>
        </div>

        {/* Weight tabs */}
        <div className="relative flex gap-2 mb-4">
          {rates.map((g, i) => (
            <button
              key={g.weight}
              onClick={() => setActive(i)}
              className={`rounded-lg px-3 py-1.5 text-[0.7rem] font-sans font-semibold tracking-wide transition-colors ${
                active === i
                  ? 'bg-ink-900/12 text-ink-900 border border-ink-900/25'
                  : 'bg-white/35 text-ink-900/55 border border-transparent hover:bg-white/55'
              }`}
            >
              {g.weight}
            </button>
          ))}
        </div>

        {/* Price row */}
        <div className="relative flex items-end justify-between">
          <div>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 leading-none">
              {fmt(item.buy)}
            </p>
            <p className="text-xs font-sans text-ink-900/55 mt-1.5">Jual: {fmt(item.sell)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Sparkline points={item.sparkline} up={up} />
            <span
              className={`rounded-md px-2 py-0.5 text-[0.7rem] font-sans font-bold ${
                up ? 'bg-emerald-600/15 text-emerald-800' : 'bg-red-600/15 text-red-800'
              }`}
            >
              {up ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
            </span>
          </div>
        </div>

        <p className="relative mt-3 text-[0.68rem] leading-snug text-ink-900/45">
          Bukan harga real-time — konfirmasi harga terkini ke staf kami sebelum bertransaksi.
        </p>

        {/* Actions */}
        <div className="relative flex gap-2.5 mt-4">
          <button
            onClick={() => onNavigate?.('consult')}
            className="flex-1 rounded-xl bg-linear-to-br from-gold-400 to-gold-600 py-2.5 text-[0.7rem] font-sans font-bold uppercase tracking-wider text-ink-900 hover:from-gold-300 hover:to-gold-500 transition-colors"
          >
            Konsultasi Beli
          </button>
          <button
            onClick={() => onNavigate?.('consult')}
            className="flex-1 rounded-xl border border-ink-900/20 bg-white/35 py-2.5 text-[0.7rem] font-sans font-semibold uppercase tracking-wider text-ink-900/80 hover:bg-white/55 transition-colors"
          >
            Konsultasi Jual
          </button>
        </div>
      </div>
    </div>
  );
}
