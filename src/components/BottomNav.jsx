const TABS = [
  { icon: '🏠', label: 'Beranda', page: 'home' },
  { icon: '💍', label: 'Katalog', page: 'gallery' },
  { icon: '💬', label: 'Konsultasi', page: 'consult' },
  { icon: '📦', label: 'Pesanan', page: 'orders' },
  { icon: '📅', label: 'Booking', page: 'booking' },
];

export default function BottomNav({ current, onNavigate }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-cream-50 border-t border-cream-200 flex justify-around pt-2"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {TABS.map((tab) => {
        const active = current === tab.page;
        return (
          <button
            key={tab.page}
            onClick={() => onNavigate(tab.page)}
            className="flex flex-col items-center gap-1 px-2 py-1 min-w-14"
            aria-current={active ? 'page' : undefined}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span
              className={`text-[0.62rem] uppercase tracking-[0.12em] ${
                active ? 'font-bold text-ink-900' : 'font-medium text-ink-500'
              }`}
            >
              {tab.label}
            </span>
            {active && <span className="w-4 h-0.5 bg-gold-400 -mt-0.5" />}
          </button>
        );
      })}
    </nav>
  );
}
