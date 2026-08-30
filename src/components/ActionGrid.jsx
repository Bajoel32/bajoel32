const ACTIONS = [
  { icon: '💬', label: 'Konsultasi\nDesain', page: 'consult', tile: 'ink' },
  { icon: '📅', label: 'Buat\nJanji', page: 'booking', tile: 'gold' },
  { icon: '💍', label: 'Katalog\nPerhiasan', page: 'gallery', tile: 'ink' },
  { icon: '📦', label: 'Lihat\nPesanan', page: 'orders', tile: 'gold' },
];

export default function ActionGrid({ onNavigate }) {
  return (
    <div className="mx-4 sm:mx-6 max-w-7xl lg:mx-auto lg:w-full grid grid-cols-4 gap-2.5 sm:gap-4">
      {ACTIONS.map((a) => (
        <button
          key={a.label}
          onClick={() => onNavigate?.(a.page)}
          className="flex flex-col items-center gap-2 rounded-2xl border border-gold-200/70 dark:border-ink-700 bg-white dark:bg-ink-800 px-2 py-3.5 sm:py-4 shadow-elegant hover:-translate-y-0.5 hover:border-gold-400 transition-all"
        >
          <span
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-gold ${
              a.tile === 'gold'
                ? 'bg-linear-to-br from-gold-400 to-gold-600 text-ink-900'
                : 'bg-ink-900 text-gold-400'
            }`}
          >
            {a.icon}
          </span>
          <span className="text-[0.68rem] sm:text-xs font-semibold text-ink-900 dark:text-cream-50 text-center leading-tight whitespace-pre-line">
            {a.label}
          </span>
        </button>
      ))}
    </div>
  );
}
