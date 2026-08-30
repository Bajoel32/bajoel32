import Button from './Button';

export default function Hero({
  title,
  subtitle,
  description,
  image,
  primaryCTA = { text: 'Get Started', onClick: () => {} },
  secondaryCTA = { text: 'Learn More', onClick: () => {} },
  layout = 'centered', // 'centered', 'left', 'right', 'full'
  size = 'large', // 'small', 'large', 'full'
  imagePosition = 'right',
  showImage = false,
}) {
  const sizeClasses = {
    compact: 'py-10 sm:py-14 lg:py-16',
    small: 'py-14 sm:py-20 lg:py-24',
    large: 'py-16 sm:py-24 lg:py-28',
    full: 'min-h-screen flex items-center py-20 sm:py-24 lg:py-0',
  };

  const layoutClasses = {
    centered: 'text-center max-w-3xl mx-auto items-center',
    left: 'text-left max-w-3xl items-start',
    right: 'text-right max-w-3xl ml-auto items-end',
  };

  const content = (
    <div className={`flex flex-col ${layoutClasses[layout]}`}>
      {subtitle && (
        <span className="eyebrow mb-5 flex items-center gap-3">
          <span className="gold-rule" />
          {subtitle}
          <span className="gold-rule" />
        </span>
      )}
      {!subtitle && !title && (
        <span className="mb-6 flex items-center gap-3">
          <span className="gold-rule" />
          <span className="text-gold-500 dark:text-gold-400 text-sm leading-none">✦</span>
          <span className="gold-rule" />
        </span>
      )}
      {title && (
        <h1 className="font-display text-4xl xs:text-5xl sm:text-6xl lg:text-7xl font-semibold text-ink-900 dark:text-cream-50 mb-6 leading-[1.05]">
          {title}
        </h1>
      )}
      {description && (
        <p className="text-base sm:text-lg lg:text-xl text-ink-600 dark:text-cream-200/80 mb-9 max-w-xl leading-relaxed">
          {description}
        </p>
      )}
      <div className={`flex flex-col sm:flex-row gap-4 ${layout === 'centered' ? 'justify-center' : layout === 'right' ? 'justify-end' : 'justify-start'}`}>
        <Button variant="primary" size="md" onClick={primaryCTA.onClick}>
          {primaryCTA.text}
        </Button>
        <Button variant="outline" size="md" onClick={secondaryCTA.onClick}>
          {secondaryCTA.text}
        </Button>
      </div>
    </div>
  );

  return (
    <section className={`relative w-full px-4 sm:px-6 lg:px-8 overflow-hidden bg-linear-to-b from-cream-50 via-cream-50 to-cream-100 dark:from-ink-900 dark:via-ink-900 dark:to-ink-800 mt-16 ${sizeClasses[size]}`}>
      {/* soft gold halo */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-152 rounded-full bg-gold-200/35 dark:bg-gold-600/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto">
        {showImage ? (
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-16">
            {imagePosition === 'left' && (
              <div className="w-full lg:flex-1">
                <img src={image} alt="Hero" className="w-full rounded-2xl shadow-elegant ring-1 ring-gold-200/70" loading="lazy" />
              </div>
            )}
            <div className="w-full lg:flex-1">{content}</div>
            {imagePosition === 'right' && (
              <div className="w-full lg:flex-1">
                <img src={image} alt="Hero" className="w-full rounded-2xl shadow-elegant ring-1 ring-gold-200/70" loading="lazy" />
              </div>
            )}
          </div>
        ) : (
          content
        )}
      </div>
    </section>
  );
}
