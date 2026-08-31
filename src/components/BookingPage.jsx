import Button from './Button';
import BackButton from './BackButton';
import BookingForm from './BookingForm';
import { siteConfig } from '../config/site';
// Logo WhatsApp sengaja tidak dipakai di sini — hanya muncul di dialog Konsultasi saat eskalasi ke admin.

export default function BookingPage({ onBack }) {
  const services = siteConfig.services || [];

  const faqs = [
    {
      q: 'Berapa lama proses pengerjaan?',
      a: 'Waktu pengerjaan tergantung jenis layanan dan kompleksitas pekerjaan, rata-rata 5–14 hari kerja. Anda dapat menentukan tanggal target di formulir pemesanan.',
    },
    {
      q: 'Apakah barang aman saat dikirim?',
      a: 'Ya, kami menjamin barang Anda aman dengan asuransi pengiriman penuh dan packaging premium.',
    },
    {
      q: 'Berapa biaya layanan?',
      a: 'Biaya bersifat penawaran dan bergantung pada jenis pekerjaan, bahan, serta tingkat kerumitan. Tim kami akan memberi estimasi setelah menerima detail barang atau desain Anda melalui formulir di bawah.',
    },
    {
      q: 'Bagaimana jika saya ingin membatalkan pesanan?',
      a: 'Pembatalan dapat dilakukan dalam 24 jam setelah pemesanan dengan pengembalian DP 90%. Hubungi customer service kami untuk detailnya.',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-cream-50 dark:bg-ink-900">
      {/* Header */}
      <div className="relative bg-cream-100 dark:bg-ink-800/40 section-y-sm border-b border-gold-200/70 dark:border-ink-700 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-gold-200/40 dark:bg-gold-600/10 blur-3xl" />
        <div className="relative fluid-shell">
          <BackButton onClick={onBack} className="mb-8" />
          <span className="eyebrow">Layanan Premium</span>
          <h1 className="display-md text-ink-900 dark:text-cream-50 mt-3 mb-3">
            Layanan Perhiasan
          </h1>
          <p className="text-sm sm:text-base text-ink-600 dark:text-cream-200/70 max-w-xl">
            Pesan layanan perawatan dan pengerjaan perhiasan Anda dengan mudah.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="section-y-sm">
        <div className="fluid-shell">
          {/* Services — kompak */}
          <div className="mb-12 sm:mb-14">
            <span className="eyebrow">Pilihan Kami</span>
            <h2 className="display-sm text-ink-900 dark:text-cream-50 mt-2 mb-4">
              Layanan Tersedia
            </h2>

            <div className="auto-grid [--col-min:8rem]">
              {services.map((service, i) => (
                <div
                  key={service.id}
                  className="flex flex-col items-center gap-2 rounded-xl border border-gold-200/70 dark:border-ink-700 bg-white dark:bg-ink-800 px-3 py-3.5 text-center hover:border-gold-400 transition-colors"
                >
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${
                      i % 2 === 0 ? 'bg-ink-900 text-gold-400' : 'bg-linear-to-br from-gold-400 to-gold-600 text-ink-900'
                    }`}
                  >
                    {service.icon}
                  </span>
                  <p className="text-sm font-semibold text-ink-900 dark:text-cream-50 leading-tight">
                    {service.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Form Section */}
          <div className="bg-white dark:bg-ink-800 p-5 sm:p-7 rounded-2xl border border-gold-200/70 dark:border-ink-700 shadow-elegant">
            <span className="eyebrow">Formulir</span>
            <h2 className="display-sm text-ink-900 dark:text-cream-50 mt-2 mb-1.5">
              Buat Janji
            </h2>
            <p className="text-sm text-ink-600 dark:text-cream-200/70 mb-6">
              Isi data di bawah untuk memesan layanan atau membuat pesanan perhiasan.
            </p>

            <BookingForm services={services} />
          </div>

          {/* FAQ Section */}
          <div className="mt-16 sm:mt-20">
            <span className="eyebrow">Pertanyaan Umum</span>
            <h2 className="display-md text-ink-900 dark:text-cream-50 mt-3 mb-8">
              Hal yang Sering Ditanyakan
            </h2>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-gold-200/70 dark:border-ink-700 bg-white dark:bg-ink-800 p-5 cursor-pointer hover:border-gold-400 transition-colors"
                >
                  <summary className="font-display text-lg font-semibold text-ink-900 dark:text-cream-50 flex justify-between items-center gap-4 list-none">
                    {faq.q}
                    <span className="text-gold-500 group-open:rotate-180 transition-transform shrink-0">▾</span>
                  </summary>
                  <p className="mt-4 text-sm text-ink-600 dark:text-cream-200/70 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Contact Section — kompak */}
          <div className="relative mt-12 sm:mt-14 p-5 sm:p-7 rounded-2xl bg-ink-900 overflow-hidden text-center">
            <div className="absolute inset-0 bg-gold-grid opacity-60" />
            <div className="relative">
              <span className="eyebrow text-gold-300">Butuh Bantuan?</span>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-cream-50 mt-1.5 mb-4">
                Pertanyaan atau Konsultasi Desain?
              </h3>
              <div className="flex flex-wrap gap-2.5 justify-center">
                <a href="tel:+6281234567890">
                  <Button variant="primary" size="sm">
                    Hubungi Kami
                  </Button>
                </a>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gold-300/60 text-cream-100! hover:bg-gold-500/10"
                  >
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
