const ACTIONS = [
  { icon: '💬', label: 'Konsultasi\nDesain', page: 'consult', tile: 'ink' },
  { icon: '📅', label: 'Buat\nJanji', page: 'booking', tile: 'gold' },
  { icon: '💍', label: 'Katalog\nPerhiasan', page: 'gallery', tile: 'ink' },
  { icon: '📦', label: 'Lihat\nPesanan', page: 'orders', tile: 'gold' },
];

export default function ActionGrid({ onNavigate }) {
  return (
    <div className="fluid-shell grid grid-cols-2 sm:grid-cols-4 gap-[clamp(0.625rem,2vw,1rem)]">
      {ACTIONS.map((a, i) => (
        <button
          key={a.label}
          onClick={() => onNavigate?.(a.page)}
          className={`float-card float-card-${i} flex flex-col items-center gap-2 rounded-2xl border border-cream-200 bg-white px-2 py-[clamp(0.875rem,2.5vw,1.25rem)] hover:-translate-y-0.5 hover:border-gold-400 transition-all`}
        >
          <span
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl ${
              a.tile === 'gold' ? 'bg-gold-400 text-ink-900' : 'bg-ink-900 text-gold-400'
            }`}
          >
            {a.icon}
          </span>
          <span className="text-[0.68rem] sm:text-xs font-semibold text-ink-900 text-center leading-tight whitespace-pre-line">
            {a.label}
          </span>
        </button>
      ))}
    </div>
  );
}
