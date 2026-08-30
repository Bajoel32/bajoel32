export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  className = '',
  ...props
}) {
  const variants = {
    // Bright gold diagonal gradient — the primary call to action
    primary:
      'bg-linear-to-br from-gold-400 to-gold-600 text-ink-900 shadow-gold hover:from-gold-300 hover:to-gold-500 hover:shadow-[0_14px_40px_-10px_rgba(212,175,55,0.55)]',
    // Solid ink — quiet but confident
    secondary:
      'bg-ink-900 text-cream-50 hover:bg-ink-800 dark:bg-cream-50 dark:text-ink-900 dark:hover:bg-cream-100',
    // Hairline gold outline
    outline:
      'border border-gold-500/70 text-ink-800 hover:border-gold-500 hover:bg-gold-100/60 dark:text-cream-100 dark:hover:bg-gold-500/10',
    ghost:
      'text-ink-600 hover:text-gold-600 dark:text-cream-200 dark:hover:text-gold-300',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs tracking-[0.18em]',
    md: 'px-7 py-3 text-xs tracking-[0.2em]',
    lg: 'px-9 py-4 text-sm tracking-[0.22em]',
  };

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} rounded-xl uppercase font-semibold inline-flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="flex items-center">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="flex items-center">{icon}</span>}
    </button>
  );
}
