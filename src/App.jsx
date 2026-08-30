import { useState, useEffect } from 'react';
import './App.css';
import Button from './components/Button';
import Card from './components/Card';
import Hero from './components/Hero';
import GoldPriceCard from './components/GoldPriceCard';
import ActionGrid from './components/ActionGrid';
import PromoCarousel from './components/PromoCarousel';
import BottomNav from './components/BottomNav';
import OrdersPage from './components/OrdersPage';
import BookingPage from './components/BookingPage';
import GalleryPage from './components/GalleryPage';
import ConsultationPage from './components/ConsultationPage';
import { InstagramIcon, TikTokIcon, FacebookIcon } from './components/BrandIcons';
import { siteConfig } from './config/site';

const brandIcons = { Instagram: InstagramIcon, TikTok: TikTokIcon, Facebook: FacebookIcon };

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'orders', 'booking', 'gallery', or 'consult'

  // Cegah menu mobile (hamburger) "bocor" dalam kondisi terbuka saat pindah
  // halaman (mis. lewat BottomNav) lalu kembali ke Home.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPage]);

  let page;
  if (currentPage === 'orders') {
    page = <OrdersPage onBack={() => setCurrentPage('home')} />;
  } else if (currentPage === 'booking') {
    page = <BookingPage onBack={() => setCurrentPage('home')} />;
  } else if (currentPage === 'gallery') {
    page = <GalleryPage onBack={() => setCurrentPage('home')} />;
  } else if (currentPage === 'consult') {
    page = <ConsultationPage onBack={() => setCurrentPage('home')} />;
  } else {
    page = <HomePage currentPage={currentPage} setCurrentPage={setCurrentPage} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />;
  }

  return (
    <>
      <div className="pb-20 md:pb-0">{page}</div>
      <BottomNav current={currentPage} onNavigate={setCurrentPage} />
    </>
  );
}

function HomePage({ setCurrentPage, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <div className="w-full min-h-screen bg-cream-50 dark:bg-ink-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-ink-900 border-b border-white/10 shadow-[0_1px_20px_-8px_rgba(15,56,44,0.4)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center gap-4">
          <button
            onClick={() => setCurrentPage('home')}
            aria-label={siteConfig.brand.name}
            className="brand-wordmark font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-none"
          >
            {siteConfig.brand.name}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8 lg:gap-10 items-center flex-1 justify-center">
            {siteConfig.navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative text-[0.7rem] uppercase tracking-[0.22em] font-semibold text-cream-200/80 hover:text-gold-300 transition-colors after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-0 after:bg-gold-400 hover:after:w-full after:transition-all after:duration-300"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop right: CTA + social cluster (pojok kanan atas) */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5">
            <Button variant="primary" size="sm" onClick={() => setCurrentPage('booking')}>
              Buat Janji
            </Button>
            <div className="hidden lg:flex items-center gap-1.5 pl-4 lg:pl-5 border-l border-white/15">
              <span className="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-cream-200/50 whitespace-nowrap mr-1">
                Follow kami
              </span>
              {siteConfig.social.map((s) => {
                const Icon = brandIcons[s.label];
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-cream-50 hover:bg-gold-400/15 transition-colors"
                  >
                    {Icon ? <Icon className="w-4 h-4" /> : s.label}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-cream-100 hover:text-gold-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-ink-800 border-t border-white/10">
            <div className="px-4 py-3 space-y-1">
              {siteConfig.navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block px-3 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-cream-200/80 hover:text-gold-300 border-b border-white/10 last:border-0 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="px-3 pt-3">
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCurrentPage('booking');
                  }}
                >
                  Buat Janji
                </Button>
              </div>
              <div className="px-3 pt-4 flex items-center gap-2">
                <span className="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-cream-200/50 mr-1">
                  Follow kami
                </span>
                {siteConfig.social.map((s) => {
                  const Icon = brandIcons[s.label];
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="w-9 h-9 flex items-center justify-center rounded-full border border-white/15 text-cream-50"
                    >
                      {Icon ? <Icon className="w-4.5 h-4.5" /> : s.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <Hero
        title={siteConfig.hero.title}
        description={siteConfig.hero.description}
        primaryCTA={{
          text: siteConfig.hero.primaryCTA.text,
          onClick: () => setCurrentPage('orders'),
        }}
        secondaryCTA={{
          text: siteConfig.hero.secondaryCTA.text,
          onClick: () => setCurrentPage('gallery'),
        }}
        size="compact"
        layout="centered"
      />

      {/* Quick actions, gold estimate & promo — layout mengikuti dashboard Figma */}
      <div className="space-y-6 sm:space-y-8 pb-16 sm:pb-24 lg:pb-28">
        <GoldPriceCard onNavigate={setCurrentPage} />
        <ActionGrid onNavigate={setCurrentPage} />
        <PromoCarousel onNavigate={setCurrentPage} />
      </div>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-cream-100 dark:bg-ink-800/40 border-y border-gold-200/60 dark:border-ink-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="eyebrow">Mengapa Srikandi</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 dark:text-cream-50 mt-4 mb-4">
              Keunggulan Kami
            </h2>
            <span className="gold-rule" />
            <p className="text-sm sm:text-base text-ink-600 dark:text-cream-200/70 mt-5 max-w-xl mx-auto">
              Segala hal yang Anda butuhkan untuk perhiasan yang tampil memesona.
            </p>
          </div>

          {/* Ketiga keunggulan: selalu sejajar 1 baris di semua ukuran layar,
              dengan tampilan "floating" — terangkat & berbayang di atas latar,
              dan teks isinya bergerak mengambang (float-text, di-stagger). */}
          <div className="relative z-10 -mt-4 grid grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
            {siteConfig.features.map((item, i) => (
              <Card
                key={item.id}
                icon={item.icon}
                iconTile
                tileColor={item.id % 2 === 1 ? 'ink' : 'gold'}
                title={item.title}
                subtitle={item.subtitle}
                description={item.description}
                hoverable={true}
                variant="elevated"
                padding="p-3.5 sm:p-6 lg:p-7"
                className="h-full -translate-y-1 shadow-elegant hover:-translate-y-2 hover:shadow-gold"
                textClassName={`float-text ${i === 1 ? 'float-text-1' : i === 2 ? 'float-text-2' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="eyebrow">Koleksi</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 dark:text-cream-50 mt-4 mb-4">
              Indah &amp; Berkelas
            </h2>
            <span className="gold-rule" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {siteConfig.showcase.map((item, i) => (
              <div
                key={item.id}
                className="group rounded-2xl bg-white dark:bg-ink-800 border border-gold-200/70 dark:border-ink-700 flex flex-col items-center justify-center text-center hover:border-gold-400 hover:shadow-elegant hover:-translate-y-1 transition-all duration-300 py-12 px-8"
              >
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mb-6 shadow-gold transition-transform duration-300 group-hover:scale-105 ${
                    i % 2 === 0 ? 'bg-ink-900 text-gold-400' : 'bg-linear-to-br from-gold-400 to-gold-600 text-ink-900'
                  }`}
                >
                  {item.icon}
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 dark:text-cream-50 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-ink-600 dark:text-cream-200/70 max-w-xs">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 bg-ink-900 overflow-hidden">
        <div className="absolute inset-0 bg-gold-grid opacity-60" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 h-96 w-160 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="eyebrow text-gold-300">Mulai Sekarang</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-cream-50 mt-4 mb-6">
            {siteConfig.cta.title}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-cream-200/70 mb-9 max-w-xl mx-auto">
            {siteConfig.cta.subtitle}
          </p>
          <Button variant="primary" size="lg" onClick={() => setCurrentPage('consult')}>
            {siteConfig.cta.buttonText}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 bg-ink-900 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="font-display text-lg text-cream-50">
            {siteConfig.brand.name}<span className="text-gold-400">.</span>
            <span className="block sm:inline text-xs font-sans tracking-[0.16em] uppercase text-cream-200/60 sm:ml-3">
              {siteConfig.footer.copyright}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-cream-200/50 mr-1">
              Follow kami
            </span>
            {siteConfig.social.map((s) => {
              const Icon = brandIcons[s.label];
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-white/15 text-cream-50 hover:border-gold-400 hover:bg-gold-400/10 transition-colors"
                >
                  {Icon ? <Icon className="w-4.5 h-4.5" /> : s.label}
                </a>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}
