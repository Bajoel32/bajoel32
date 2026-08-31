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
    // Solid near-black — the primary call to action
    primary:
      'bg-ink-900 text-white border border-ink-900 hover:bg-gold-400 hover:border-gold-400 hover:text-ink-900',
    // Hairline near-black outline that fills on hover
    secondary:
      'bg-white text-ink-900 border border-ink-900 hover:bg-ink-900 hover:text-white',
    // Quiet gold outline
    outline:
      'bg-transparent text-ink-800 border border-gold-400 hover:bg-gold-400 hover:text-ink-900',
    ghost:
      'bg-transparent text-ink-600 border border-transparent hover:text-ink-900',
  };

  const sizes = {
    sm: 'px-6 py-2.5 text-[11px] tracking-[0.16em]',
    md: 'px-9 py-4 text-xs tracking-[0.18em]',
    lg: 'px-10 py-4.5 text-[13px] tracking-[0.2em]',
  };

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} uppercase font-semibold inline-flex items-center justify-center gap-2 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
