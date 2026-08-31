import { useEffect, useState } from 'react';
import Button from './Button';
import BackButton from './BackButton';
import Card from './Card';
import OrderCard from './OrderCard';
import {
  loginCustomer,
  getMyOrders,
  loadSession,
  clearSession,
  demoAccount,
  dummyStats,
} from '../config/orders';

const STATUS_STYLE = {
  'Belum Dimulai': 'bg-cream-200 text-ink-700 dark:bg-ink-700 dark:text-cream-200',
  'Sedang Dikerjakan': 'bg-gold-100 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300',
  'Menunggu Approval': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Selesai: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export default function OrdersPage({ onBack }) {
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const [booting, setBooting] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Restore sesi (sessionStorage) saat halaman dibuka.
  useEffect(() => {
    const saved = loadSession();
    if (!saved) {
      setBooting(false);
      return;
    }
    setSession(saved);
    setLoadingOrders(true);
    getMyOrders(saved)
      .then(setOrders)
      .catch(() => {
        clearSession();
        setSession(null);
      })
      .finally(() => {
        setLoadingOrders(false);
        setBooting(false);
      });
  }, []);

  const handleLoggedIn = async (newSession) => {
    setSession(newSession);
    setLoadingOrders(true);
    try {
      setOrders(await getMyOrders(newSession));
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setOrders([]);
  };

  return (
    <div className="w-full min-h-screen bg-cream-50 dark:bg-ink-900">
      {/* Header */}
      <div className="relative bg-cream-100 dark:bg-ink-800/40 section-y-sm border-b border-gold-200/70 dark:border-ink-700 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-gold-200/40 dark:bg-gold-600/10 blur-3xl" />
        <div className="relative fluid-shell max-w-5xl">
          <div className="flex items-center justify-between gap-4 mb-8">
            <BackButton onClick={onBack} />
            {session && (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Keluar
              </Button>
            )}
          </div>
          <span className="eyebrow">Area Konsumen</span>
          <h1 className="display-md text-ink-900 dark:text-cream-50 mt-3 mb-3">
            {session ? `Halo, ${session.customer.name.split(' ')[0]}` : 'Lihat Pesanan Anda'}
          </h1>
          <p className="text-sm sm:text-base text-ink-600 dark:text-cream-200/70 max-w-xl">
            {session
              ? 'Berikut progres pengerjaan pesanan atas nama Anda.'
              : 'Masuk dengan nomor HP terdaftar untuk memantau progres pesanan. Data pesanan bersifat pribadi.'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="section-y-sm">
        <div className="fluid-shell max-w-5xl">
          {booting ? (
            <p className="text-center text-sm text-ink-600 dark:text-cream-200/60 py-16">Memuat…</p>
          ) : session ? (
            <LoggedInView orders={orders} loading={loadingOrders} customer={session.customer} />
          ) : (
            <LoginView onLoggedIn={handleLoggedIn} />
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- login -------------------------------- */

function LoginView({ onLoggedIn }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await loginCustomer({ phone, password });
      await onLoggedIn(session);
    } catch (err) {
      setError(err?.message || 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={submit} className="bg-white dark:bg-ink-800 rounded-2xl border border-gold-200/70 dark:border-ink-700 shadow-elegant p-6 sm:p-8 space-y-5">
        <div>
          <span className="eyebrow">Masuk</span>
          <h2 className="display-sm text-ink-900 dark:text-cream-50 mt-2">
            Portal Pesanan
          </h2>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500 px-4 py-3" role="alert">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-300 mb-2">
            Nomor HP
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0812xxxxxxxx"
            className="w-full px-4 py-2.5 rounded-lg border border-gold-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-cream-50 placeholder:text-ink-600/50 dark:placeholder:text-cream-200/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-300 mb-2">
            Kata Sandi / Kode Akses
          </label>
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={64}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className="w-full px-4 py-2.5 rounded-lg border border-gold-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-cream-50 placeholder:text-ink-600/50 dark:placeholder:text-cream-200/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
          />
        </div>

        <Button type="submit" variant="primary" size="md" fullWidth disabled={loading}>
          {loading ? 'Memproses…' : 'Masuk'}
        </Button>

        <p className="text-xs text-ink-600/70 dark:text-cream-200/50 text-center">
          Belum punya kode akses? Hubungi kami lewat WhatsApp untuk mendapatkannya.
        </p>
      </form>

      {demoAccount && (
        <div className="mt-4 rounded-xl border border-dashed border-gold-300 dark:border-gold-700/60 bg-gold-100/40 dark:bg-gold-500/5 px-4 py-3 text-xs text-ink-700 dark:text-cream-200/70">
          <p className="font-semibold text-gold-700 dark:text-gold-300 mb-1">Akun demo (data dummy)</p>
          <p>
            HP <code className="font-mono">{demoAccount.phone}</code> · Sandi{' '}
            <code className="font-mono">{demoAccount.password}</code>
          </p>
          <p className="mt-1 opacity-70">
            {dummyStats.customers} konsumen contoh dibangkitkan lokal. Ganti dengan autentikasi
            backend — lihat ORDERS-AUTH.md.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ logged in ------------------------------- */

function LoggedInView({ orders, loading, customer }) {
  if (loading) {
    return <p className="text-center text-sm text-ink-600 dark:text-cream-200/60 py-16">Memuat pesanan…</p>;
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-ink-600 dark:text-cream-200/70">
        <span>
          <span className="text-ink-900 dark:text-cream-50 font-medium">{orders.length}</span> pesanan
        </span>
        <span className="text-ink-500/60">·</span>
        <span>{customer.phone}</span>
      </div>

      {orders.length > 0 ? (
        <div className="auto-grid [--col-min:19rem]">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              statusClass={STATUS_STYLE[order.status] || STATUS_STYLE['Belum Dimulai']}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-ink-600 dark:text-cream-200/60 py-16">
          Belum ada pesanan atas nama Anda. Hubungi kami untuk membuat pesanan perhiasan.
        </p>
      )}

      <div className="mt-10">
        <Card
          icon="ℹ️"
          iconTile
          tileColor="gold"
          title="Tentang Progres Pesanan"
          variant="elevated"
          hoverable={false}
        >
          <ul className="text-sm text-ink-600 dark:text-cream-200/70 space-y-1.5">
            <li>— Progres diperbarui berkala oleh pengrajin kami.</li>
            <li>— Status berubah mengikuti tahap pengerjaan.</li>
            <li>— Data ini hanya menampilkan pesanan atas nama Anda.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
