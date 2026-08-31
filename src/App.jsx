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

/* Numbered section eyebrow: "01 —— Label" */
function SectionEyebrow({ index, label, align = 'center', tone = 'dark' }) {
  const labelColor = tone === 'light' ? 'text-cream-200/70' : 'text-mute';
  return (
    <span
      className={`flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''}`}
    >
      <span className="eyebrow-index">{index}</span>
      <span className="gold-rule" />
      <span className={`eyebrow ${labelColor}`}>{label}</span>
    </span>
  );
}

function HomePage({ setCurrentPage, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <div className="w-full min-h-screen bg-cream-50">
      {/* Announcement bar + Navigation (sticky) */}
      <div className="fixed top-0 w-full z-50">
        <div className="bg-ink-900 flex h-9 items-center justify-center px-4">
          <p className="font-sans text-[0.65rem] sm:text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-cream-100 text-center truncate">
            {siteConfig.brand.tagline}
          </p>
        </div>

        <nav className="w-full bg-cream-50/95 backdrop-blur border-b border-cream-200">
          <div className="fluid-shell py-4 sm:py-5 flex justify-between items-center gap-4">
            <button
              onClick={() => setCurrentPage('home')}
              aria-label={siteConfig.brand.name}
              className="brand-wordmark text-xl sm:text-2xl lg:text-[1.75rem] leading-none"
            >
              {siteConfig.brand.name}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-8 lg:gap-10 items-center flex-1 justify-center">
              {siteConfig.navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="relative text-[0.7rem] uppercase tracking-[0.22em] font-semibold text-ink-600 hover:text-ink-900 transition-colors after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-0 after:bg-gold-400 hover:after:w-full after:transition-all after:duration-300"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Desktop right: CTA + social cluster */}
            <div className="hidden md:flex items-center gap-4 lg:gap-5">
              <Button variant="secondary" size="sm" onClick={() => setCurrentPage('booking')}>
                Buat Janji
              </Button>
              <div className="hidden lg:flex items-center gap-1.5 pl-4 lg:pl-5 border-l border-cream-200">
                <span className="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-mute whitespace-nowrap mr-1">
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
                      className="w-8 h-8 flex items-center justify-center rounded-full text-ink-700 hover:text-ink-900 hover:bg-gold-400/15 transition-colors"
                    >
                      {Icon ? <Icon className="w-4 h-4" /> : s.label}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-ink-800 hover:text-ink-900"
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
            <div className="md:hidden bg-cream-50 border-t border-cream-200">
              <div className="px-4 py-3 space-y-1">
                {siteConfig.navigation.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block px-3 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-ink-600 hover:text-ink-900 border-b border-cream-200 last:border-0 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="px-3 pt-3">
                  <Button
                    variant="secondary"
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
                  <span className="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-mute mr-1">
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
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-cream-200 text-ink-700"
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
      </div>

      {/* Hero Section */}
      <Hero
        subtitle={siteConfig.hero.subtitle}
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

      {/* Quick actions, gold estimate & promo */}
      <div className="space-y-6 sm:space-y-8 py-[clamp(3rem,7vw,5rem)] bg-white border-b border-cream-200">
        <GoldPriceCard onNavigate={setCurrentPage} />
        <ActionGrid onNavigate={setCurrentPage} />
        <PromoCarousel onNavigate={setCurrentPage} />
      </div>

      {/* Features Section */}
      <section id="features" className="section-y bg-cream-50 border-b border-cream-200">
        <div className="fluid-shell">
          <div className="flex flex-col items-center text-center mb-14 sm:mb-16">
            <SectionEyebrow index="02" label="Mengapa Srikandi" />
            <h2 className="display-lg text-ink-900 mt-5 mb-4">
              Keunggulan Kami
            </h2>
            <p className="text-sm sm:text-base text-ink-600 mt-2 max-w-xl mx-auto leading-[1.7]">
              Segala hal yang Anda butuhkan untuk perhiasan yang tampil memesona.
            </p>
          </div>

          <div className="auto-grid [--col-min:9rem] sm:[--col-min:13rem] relative z-10">
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
                padding="p-[clamp(0.875rem,2.5vw,1.75rem)]"
                className={`h-full float-card ${i === 1 ? 'float-card-1' : i === 2 ? 'float-card-2' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="section-y bg-white border-b border-cream-200">
        <div className="fluid-shell">
          <div className="flex flex-col items-center text-center mb-14 sm:mb-16">
            <SectionEyebrow index="03" label="Koleksi" />
            <h2 className="display-lg text-ink-900 mt-5 mb-4">
              Indah &amp; Berkelas
            </h2>
          </div>

          <div className="auto-grid [--col-min:16rem]">
            {siteConfig.showcase.map((item, i) => (
              <div
                key={item.id}
                className={`group float-card ${i === 1 ? 'float-card-1' : ''} rounded-2xl bg-cream-50 border border-cream-200 flex flex-col items-center justify-center text-center hover:border-gold-400 hover:-translate-y-1 transition-all duration-300 py-[clamp(2.5rem,6vw,3.5rem)] px-8`}
              >
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mb-6 transition-transform duration-300 group-hover:scale-105 ${
                    i % 2 === 0 ? 'bg-ink-900 text-gold-400' : 'bg-gold-400 text-ink-900'
                  }`}
                >
                  {item.icon}
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-ink-600 max-w-xs leading-[1.7]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="lokasi" className="section-y bg-cream-50 border-b border-cream-200">
        <div className="fluid-shell">
          <div className="flex flex-col items-center text-center mb-14 sm:mb-16">
            <SectionEyebrow index="04" label="Lokasi" />
            <h2 className="display-lg text-ink-900 mt-5 mb-4">Kunjungi Toko Kami</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] items-stretch">
            <div className="flex flex-col justify-center rounded-2xl bg-white border border-cream-200 p-[clamp(1.5rem,4vw,2.5rem)]">
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 mb-4">
                {siteConfig.location.name}
              </h3>
              <p className="text-ink-600 leading-[1.7]">
                {siteConfig.location.address}
                <br />
                {siteConfig.location.city}
              </p>

              <div className="mt-6">
                <p className="eyebrow mb-2">Jam Buka</p>
                <ul className="space-y-1.5 text-sm">
                  {siteConfig.location.hours.map((h) => (
                    <li key={h.day} className="flex justify-between gap-4 text-ink-700">
                      <span>{h.day}</span>
                      <span className="font-semibold text-ink-900">{h.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(siteConfig.location.coords)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary" size="md">Petunjuk Arah</Button>
                </a>
                <a href={siteConfig.location.mapsUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="md">Buka di Google Maps</Button>
                </a>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-cream-200 bg-white min-h-72">
              <iframe
                title={`Peta lokasi ${siteConfig.location.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(siteConfig.location.coords)}&z=17&output=embed`}
                className="w-full h-full min-h-72 border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="relative section-y bg-ink-900 overflow-hidden">
        <div className="absolute inset-0 bg-gold-grid opacity-60" />
        <div className="fluid-shell relative max-w-3xl flex flex-col items-center text-center">
          <SectionEyebrow index="05" label="Mulai Sekarang" tone="light" />
          <h2 className="display-xl text-cream-50 mt-5 mb-6">
            {siteConfig.cta.title}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-cream-200/70 mb-10 max-w-xl mx-auto leading-[1.7]">
            {siteConfig.cta.subtitle}
          </p>
          <Button
            variant="primary"
            size="xl"
            onClick={() => setCurrentPage('consult')}
            className="cta-pulse bg-cream-50 border-cream-50 text-ink-900 hover:bg-gold-400 hover:border-gold-400"
          >
            {siteConfig.cta.buttonText}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-900 pt-[clamp(4rem,8vw,6rem)] pb-10 overflow-hidden">
        <div className="fluid-shell">
          <div className="flex flex-col sm:flex-row justify-between gap-10 sm:gap-8">
            <div className="max-w-xs">
              <p className="brand-wordmark text-2xl text-cream-50">{siteConfig.brand.name}</p>
              <p className="mt-5 text-[13px] leading-[1.7] text-cream-200/60">
                {siteConfig.brand.description}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <span className="eyebrow text-gold-400">Ikuti Kami</span>
              <div className="flex items-center gap-2">
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
          </div>

          {/* Oversized watermark — ukuran dijaga agar seluruh kata muat (tak terpotong) di layar sempit */}
          <div className="mt-16 border-t border-white/10 pt-8 overflow-hidden">
            <p className="font-display uppercase tracking-[0.04em] text-cream-200/10 leading-[0.8] text-center whitespace-nowrap text-[13vw] sm:text-[14vw] lg:text-[15rem] select-none pointer-events-none">
              {siteConfig.brand.name}
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-cream-200/40">
            <p>{siteConfig.footer.copyright}</p>
            <span className="font-sans tracking-[0.16em] uppercase text-[0.65rem]">
              {siteConfig.brand.tagline}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
