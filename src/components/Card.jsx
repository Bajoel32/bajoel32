export default function Card({
  children,
  title,
  subtitle,
  description,
  icon,
  iconTile = false,
  tileColor = 'ink', // 'ink' | 'gold' — warna kotak ikon saat iconTile aktif
  image,
  footer,
  hoverable = true,
  onClick,
  className = '',
  textClassName = '',
  padding = 'p-5 sm:p-7',
  variant = 'default',
}) {
  const variants = {
    default: 'bg-white border border-cream-200',
    elevated: 'bg-white border border-cream-200 shadow-elegant',
    outlined: 'bg-transparent border border-gold-300',
  };

  return (
    <div
      className={`
        rounded-2xl overflow-hidden ${variants[variant]} transition-all duration-300
        ${hoverable ? 'hover:-translate-y-1 hover:border-gold-400 hover:shadow-elegant cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {image && (
        <div className="w-full h-44 sm:h-52 bg-cream-100 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div className={padding}>
        <div className="flex items-start gap-3 mb-3">
          {icon && iconTile && (
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center text-lg sm:text-xl ${
                tileColor === 'gold'
                  ? 'bg-gold-400 text-ink-900'
                  : 'bg-ink-900 text-gold-400'
              }`}
            >
              {icon}
            </div>
          )}
          {icon && !iconTile && <div className="text-2xl sm:text-3xl shrink-0 leading-none">{icon}</div>}
          <div className={`min-w-0 flex-1 ${textClassName}`}>
            {title && (
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 line-clamp-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[0.7rem] sm:text-xs font-semibold tracking-[0.18em] uppercase text-mute mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {description && (
          <p className={`text-sm sm:text-[0.95rem] leading-relaxed text-ink-600 mb-4 ${textClassName}`}>
            {description}
          </p>
        )}

        {children && <div>{children}</div>}

        {footer && (
          <div className="mt-4 pt-4 border-t border-cream-200 text-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
