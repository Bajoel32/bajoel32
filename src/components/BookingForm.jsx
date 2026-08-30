import { useState } from 'react';
import Button from './Button';

const FIELD =
  'w-full px-3.5 py-2 rounded-lg border border-gold-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-cream-50 placeholder:text-ink-600/50 dark:placeholder:text-cream-200/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors';
const LABEL =
  'block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-300 mb-1.5';
const SECTION_TITLE =
  'font-display text-base font-semibold text-ink-900 dark:text-cream-50';

// Input hardening — cap every field so a crafted payload can't bloat a request.
const MAX = {
  customerName: 100,
  phoneNumber: 20,
  email: 150,
  serviceDetails: 1000,
  notes: 1000,
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9()+\-\s]{7,20}$/;

const EMPTY = {
  customerName: '',
  phoneNumber: '',
  email: '',
  selectedService: '',
  serviceDetails: '',
  quantity: 1,
  estimatedDate: '',
  notes: '',
  preferredPayment: 'DP',
  website: '', // honeypot — real users never fill this
};

function validate(data, services) {
  if (!data.customerName.trim()) return 'Nama lengkap wajib diisi.';
  if (!PHONE_RE.test(data.phoneNumber.trim())) return 'Nomor telepon tidak valid.';
  if (!EMAIL_RE.test(data.email.trim())) return 'Alamat email tidak valid.';
  if (!services.some((s) => String(s.id) === String(data.selectedService)))
    return 'Silakan pilih layanan yang tersedia.';
  if (!data.serviceDetails.trim()) return 'Detail layanan wajib diisi.';
  const qty = Number(data.quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 100) return 'Jumlah item harus antara 1 dan 100.';
  if (!data.estimatedDate) return 'Tanggal target selesai wajib diisi.';
  return null;
}

export default function BookingForm({ services = [] }) {
  const [formData, setFormData] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    const capped = MAX[name] ? value.slice(0, MAX[name]) : value;
    setFormData((prev) => ({ ...prev, [name]: capped }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Bot trap: silently accept and reset, never hit the backend.
    if (formData.website) {
      setSubmitted(true);
      setFormData(EMPTY);
      return;
    }

    const problem = validate(formData, services);
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      delete payload.website;

      const endpoint = import.meta.env.VITE_BOOKINGS_API;
      if (endpoint) {
        // Backend tetap WAJIB memvalidasi & meng-escape ulang, rate-limit, cek honeypot.
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else if (import.meta.env.DEV) {
        console.debug('VITE_BOOKINGS_API belum diset — pesanan tidak dikirim:', payload);
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData(EMPTY);
      }, 3000);
    } catch {
      setError('Gagal mengirim pesanan. Silakan coba lagi atau hubungi kami langsung.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Honeypot — hidden from users, catches bots. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formData.website}
            onChange={handleChange}
          />
        </label>
      </div>

      {/* Success Message */}
      {submitted && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-l-2 border-emerald-500">
          <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
            Pesanan berhasil dikirim. Tim kami akan segera menghubungi Anda.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500" role="alert">
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Customer Info Section */}
      <div className="space-y-3">
        <h3 className={SECTION_TITLE}>Informasi Pelanggan</h3>

        <div>
          <label className={LABEL}>Nama Lengkap *</label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            required
            maxLength={MAX.customerName}
            autoComplete="name"
            className={FIELD}
            placeholder="Masukkan nama lengkap Anda"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>No. Telepon *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              maxLength={MAX.phoneNumber}
              inputMode="tel"
              autoComplete="tel"
              className={FIELD}
              placeholder="08123456789"
            />
          </div>

          <div>
            <label className={LABEL}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              maxLength={MAX.email}
              autoComplete="email"
              className={FIELD}
              placeholder="email@example.com"
            />
          </div>
        </div>
      </div>

      {/* Service Selection Section */}
      <div className="space-y-3">
        <h3 className={SECTION_TITLE}>Pilih Layanan</h3>

        <div>
          <label className={LABEL}>Jenis Layanan *</label>
          <select
            name="selectedService"
            value={formData.selectedService}
            onChange={handleChange}
            required
            className={FIELD}
          >
            <option value="">-- Pilih Layanan --</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.icon} {service.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>Detail Layanan *</label>
          <textarea
            name="serviceDetails"
            value={formData.serviceDetails}
            onChange={handleChange}
            required
            rows="2"
            maxLength={MAX.serviceDetails}
            className={FIELD}
            placeholder="Deskripsikan detail layanan yang Anda inginkan (berat emas, ukuran berlian, dll)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Jumlah Item</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              max="100"
              step="1"
              className={FIELD}
            />
          </div>

          <div>
            <label className={LABEL}>Tanggal Target Selesai *</label>
            <input
              type="date"
              name="estimatedDate"
              value={formData.estimatedDate}
              onChange={handleChange}
              required
              className={FIELD}
            />
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="space-y-3">
        <h3 className={SECTION_TITLE}>Informasi Tambahan</h3>

        <div>
          <label className={LABEL}>Catatan / Permintaan Khusus</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            maxLength={MAX.notes}
            className={FIELD}
            placeholder="Informasi tambahan atau permintaan khusus..."
          />
        </div>

        <div>
          <label className={LABEL}>Metode Pembayaran Awal *</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-sm text-ink-700 dark:text-cream-200/80">
              <input
                type="radio"
                name="preferredPayment"
                value="DP"
                checked={formData.preferredPayment === 'DP'}
                onChange={handleChange}
                className="w-4 h-4 accent-gold-500"
              />
              Down Payment (DP) — Bayar sebagian dulu
            </label>
            <label className="flex items-center gap-2.5 text-sm text-ink-700 dark:text-cream-200/80">
              <input
                type="radio"
                name="preferredPayment"
                value="FULL"
                checked={formData.preferredPayment === 'FULL'}
                onChange={handleChange}
                className="w-4 h-4 accent-gold-500"
              />
              Pembayaran Penuh
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-5 border-t border-gold-200/70 dark:border-ink-700">
        <Button type="submit" variant="primary" size="md" disabled={loading} className="flex-1">
          {loading ? 'Mengirim...' : 'Kirim Pesanan'}
        </Button>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-cream-100 dark:bg-ink-900/60 border-l-2 border-gold-500">
        <p className="text-xs sm:text-sm text-ink-600 dark:text-cream-200/70">
          <strong className="text-ink-900 dark:text-cream-50">Info:</strong> Kami akan menghubungi Anda dalam 24 jam untuk konfirmasi pesanan dan diskusi detail.
        </p>
      </div>
    </form>
  );
}
