// Tombol "kembali" ikon-saja — panah kiri dengan animasi nudge halus.
export default function BackButton({ onClick, className = '', label = 'Kembali' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`back-btn inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-500/70 text-ink-800 transition-all duration-300 hover:-translate-x-0.5 hover:border-gold-500 hover:bg-gold-100/60 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 dark:text-cream-100 dark:hover:bg-gold-500/10 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="back-btn__arrow h-5 w-5" aria-hidden="true">
        <path
          d="M15 5l-7 7 7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
