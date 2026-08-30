import { useMemo, useState } from 'react';
import Button from './Button';
import Card from './Card';

// Gerbang sederhana sisi-browser untuk tim sales (bukan auth backend).
// Yang disimpan hanya hash SHA-256 (hex) dari kata sandi, bukan teks aslinya.
// Ganti lewat .env.local: VITE_SALES_PASSPHRASE_SHA256=<hash>.
// Buat hash baru:  node -e "console.log(require('crypto').createHash('sha256').update('SANDI-BARU').digest('hex'))"
const DEFAULT_SALES_SHA256 = '26c7c6543113edc05296e38dd0b78d0ee08dace2db12e19cfd70d299056904da'; // = "sales-demo"
const SALES_PASS_SHA256 = import.meta.env.VITE_SALES_PASSPHRASE_SHA256 || DEFAULT_SALES_SHA256;
// Bila passphrase khusus belum diset, tampilkan sandi demo di form (mirip akun demo portal pesanan).
const SALES_DEMO_PASS = import.meta.env.VITE_SALES_PASSPHRASE_SHA256 ? null : 'sales-demo';

const EMPTY_FORM = { title: '', category: '', image: '', price: '', tags: '', description: '' };
const CATEGORY_FALLBACK = ['Cincin', 'Kalung', 'Gelang', 'Anting', 'Liontin'];
const FIELD_CLS =
  'w-full px-4 py-2.5 rounded-lg border border-gold-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-cream-50 placeholder:text-ink-600/50 dark:placeholder:text-cream-200/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors';

const INFO_CARDS = [
  { icon: '🖼️', tile: 'ink', title: 'Format Gambar', description: 'JPG atau PNG dengan ukuran minimal 800×800px untuk hasil optimal.' },
  { icon: '📋', tile: 'gold', title: 'Data yang Diperlukan', description: 'Nama, kategori, harga, deskripsi, dan spesifikasi perhiasan.' },
];

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Panel "Untuk Tim Sales" di bawah halaman Galeri: gerbang kata sandi lokal +
 * formulir tambah perhiasan. Item baru dikirim lewat `onAdd` (pratinjau lokal —
 * pemanggil yang memutuskan cara menyimpannya).
 *
 * @param {{ categories: string[], onAdd: (item: object) => void }} props
 */
export default function SalesPanel({ categories = [], onAdd }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [addedMsg, setAddedMsg] = useState('');

  const catOptions = useMemo(
    () => (categories.length ? categories : CATEGORY_FALLBACK),
    [categories],
  );

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleUnlock = async (e) => {
    e.preventDefault();
    let digest;
    try {
      digest = await sha256Hex(pass.trim());
    } catch {
      // crypto.subtle hanya tersedia di secure context (https / localhost).
      setErr('Perangkat atau koneksi ini tidak mendukung verifikasi. Buka lewat https atau localhost.');
      return;
    }
    if (digest !== SALES_PASS_SHA256) {
      setErr('Kata sandi salah.');
      return;
    }
    setUnlocked(true);
    setPass('');
    setErr('');
  };

  const handleLock = () => {
    setUnlocked(false);
    setForm(EMPTY_FORM);
    setAddedMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const title = form.title.trim();
    const image = form.image.trim();
    if (!title || !image || !form.category) return;

    onAdd?.({
      id: `local-${Date.now()}`,
      title,
      description: form.description.trim(),
      image,
      category: form.category,
      price: form.price ? Number(form.price) : undefined,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      uploadedBy: 'Tim Sales (pratinjau)',
      uploadedDate: new Date().toISOString().slice(0, 10),
    });
    setAddedMsg(title);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="py-14 px-4 sm:px-6 lg:px-8 bg-cream-100 dark:bg-ink-800/40 border-t border-gold-200/70 dark:border-ink-700">
      <div className="max-w-7xl mx-auto">
        <span className="eyebrow">Untuk Tim Sales</span>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 dark:text-cream-50 mt-3 mb-6">
          Upload Katalog
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
          {INFO_CARDS.map((c) => (
            <Card
              key={c.title}
              icon={c.icon}
              iconTile
              tileColor={c.tile}
              title={c.title}
              description={c.description}
              hoverable={false}
            />
          ))}

          {/* Gerbang kata sandi (cek sisi-browser) */}
          <div className="rounded-2xl border border-gold-200/70 dark:border-ink-700 bg-white dark:bg-ink-800 p-6">
            {unlocked ? (
              <div className="space-y-3">
                <div className="text-2xl text-gold-500">🔓</div>
                <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-cream-50">
                  Masuk sebagai Sales
                </h3>
                <p className="text-sm text-ink-600 dark:text-cream-200/70">
                  Formulir tambah perhiasan aktif di bawah.
                </p>
                <Button variant="outline" size="sm" onClick={handleLock}>
                  Kunci
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUnlock} className="space-y-3">
                <div className="text-2xl text-gold-500">🔒</div>
                <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-cream-50">
                  Login Sales
                </h3>
                <p className="text-sm text-ink-600 dark:text-cream-200/70">
                  Masukkan kata sandi sales untuk menambah item galeri.
                </p>
                <input
                  type="password"
                  autoComplete="off"
                  placeholder="Kata sandi sales"
                  value={pass}
                  onChange={(e) => {
                    setPass(e.target.value);
                    setErr('');
                  }}
                  className={FIELD_CLS}
                />
                {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
                <Button type="submit" variant="primary" size="sm" fullWidth>
                  Masuk
                </Button>

                {SALES_DEMO_PASS && (
                  <div className="rounded-xl border border-dashed border-gold-300 dark:border-gold-700/60 bg-gold-100/40 dark:bg-gold-500/5 px-3 py-2.5 text-xs text-ink-700 dark:text-cream-200/70">
                    <p className="font-semibold text-gold-700 dark:text-gold-300 mb-0.5">Mode demo</p>
                    <p>
                      Kata sandi: <code className="font-mono">{SALES_DEMO_PASS}</code>
                    </p>
                    <p className="mt-1 opacity-70">
                      Item yang ditambahkan hanya pratinjau lokal, tidak tersimpan ke server. Set{' '}
                      <code className="font-mono">VITE_SALES_PASSPHRASE_SHA256</code> untuk sandi asli.
                    </p>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Formulir upload (pratinjau lokal, belum tersimpan ke server) */}
        {unlocked && (
          <div className="mt-6 rounded-2xl border border-gold-200/70 dark:border-ink-700 bg-white dark:bg-ink-800 p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold text-ink-900 dark:text-cream-50 mb-1">
              Tambah Perhiasan ke Galeri
            </h3>
            <p className="text-sm text-ink-600 dark:text-cream-200/70 mb-6">
              Pratinjau lokal — item muncul di galeri untuk sesi ini, belum tersimpan ke server.
            </p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="eyebrow mb-1.5 block">Nama Perhiasan *</span>
                <input
                  required
                  value={form.title}
                  onChange={setField('title')}
                  className={FIELD_CLS}
                  placeholder="mis. Cincin Berlian Solitaire"
                />
              </label>

              <label className="block">
                <span className="eyebrow mb-1.5 block">Kategori *</span>
                <select required value={form.category} onChange={setField('category')} className={FIELD_CLS}>
                  <option value="">Pilih kategori…</option>
                  {catOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="eyebrow mb-1.5 block">URL Gambar *</span>
                <input
                  required
                  type="url"
                  value={form.image}
                  onChange={setField('image')}
                  className={FIELD_CLS}
                  placeholder="https://…"
                />
              </label>

              <label className="block">
                <span className="eyebrow mb-1.5 block">Harga (Rp)</span>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={setField('price')}
                  className={FIELD_CLS}
                  placeholder="mis. 5000000"
                />
              </label>

              <label className="block">
                <span className="eyebrow mb-1.5 block">Tag (pisahkan koma)</span>
                <input
                  value={form.tags}
                  onChange={setField('tags')}
                  className={FIELD_CLS}
                  placeholder="berlian, emas putih"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="eyebrow mb-1.5 block">Deskripsi</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={setField('description')}
                  className={FIELD_CLS}
                  placeholder="Deskripsi singkat perhiasan…"
                />
              </label>

              {form.image && (
                <div className="sm:col-span-2">
                  <span className="eyebrow mb-1.5 block">Pratinjau Gambar</span>
                  <img
                    src={form.image}
                    alt="Pratinjau"
                    className="h-40 w-40 object-cover rounded-xl border border-gold-200/60 dark:border-ink-700"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
                <Button type="submit" variant="primary" size="md">
                  Tambah ke Galeri
                </Button>
                <Button type="button" variant="outline" size="md" onClick={() => setForm(EMPTY_FORM)}>
                  Reset
                </Button>
              </div>
            </form>

            {addedMsg && (
              <p className="mt-4 text-sm text-green-700 dark:text-green-400">
                ✓ “{addedMsg}” ditambahkan ke pratinjau galeri (sesi ini).
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
