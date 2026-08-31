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
    compact: 'py-[clamp(3rem,7vw,6rem)]',
    small: 'py-[clamp(3.5rem,8vw,7rem)]',
    large: 'section-y',
    full: 'min-h-screen flex items-center py-20 sm:py-24 lg:py-0',
  };

  const layoutClasses = {
    centered: 'text-center max-w-3xl mx-auto items-center',
    left: 'text-left max-w-3xl items-start',
    right: 'text-right max-w-3xl ml-auto items-end',
  };

  const content = (
    <div className={`flex flex-col ${layoutClasses[layout]}`}>
      <span className="mb-6 flex items-center gap-3">
        <span className="eyebrow-index">01</span>
        <span className="gold-rule" />
        {subtitle ? <span className="eyebrow">{subtitle}</span> : null}
      </span>
      {title && (
        <h1 className="display-xl text-ink-900 mb-7">
          {title}
        </h1>
      )}
      {description && (
        <p className="text-base sm:text-lg text-ink-600 mb-10 max-w-xl leading-[1.7]">
          {description}
        </p>
      )}
      <div className={`flex flex-col sm:flex-row gap-4 ${layout === 'centered' ? 'justify-center' : layout === 'right' ? 'justify-end' : 'justify-start'}`}>
        <Button variant="primary" size="md" onClick={primaryCTA.onClick}>
          {primaryCTA.text}
        </Button>
        <Button variant="secondary" size="md" onClick={secondaryCTA.onClick}>
          {secondaryCTA.text}
        </Button>
      </div>
    </div>
  );

  return (
    <section className={`relative w-full overflow-hidden bg-cream-50 border-b border-cream-200 mt-26 sm:mt-29 ${sizeClasses[size]}`}>
      <div className="fluid-shell relative">
        {showImage ? (
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
            {imagePosition === 'left' && (
              <div className="w-full lg:flex-1">
                <img src={image} alt="Hero" className="w-full rounded-2xl object-cover" loading="lazy" />
              </div>
            )}
            <div className="w-full lg:flex-1">{content}</div>
            {imagePosition === 'right' && (
              <div className="w-full lg:flex-1">
                <img src={image} alt="Hero" className="w-full rounded-2xl object-cover" loading="lazy" />
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
