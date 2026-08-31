export default function OrderCard({ order, statusClass }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-ink-800 border border-gold-200/70 dark:border-ink-700 shadow-elegant p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 shrink-0 rounded-xl bg-ink-900 flex items-center justify-center text-lg text-gold-400">
          💍
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-ink-900 dark:text-cream-50 truncate">
              {order.serviceName}
            </h3>
            <span className={`shrink-0 rounded-md px-2.5 py-1 text-[0.65rem] font-bold tracking-wide ${statusClass}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-ink-600 dark:text-cream-200/60 mt-0.5">
            Kadar Emas {order.goldPurity}K
          </p>
          <p className="text-xs text-gold-600 dark:text-gold-300 font-medium mt-0.5">
            #{order.orderNumber}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[0.7rem] mb-1.5">
          <span className="text-ink-600 dark:text-cream-200/60">Progres</span>
          <span className="tabular-nums text-ink-700 dark:text-cream-200/70 font-medium">{order.progress}%</span>
        </div>
        <div className="w-full bg-cream-200 dark:bg-ink-700 rounded-full h-1.5">
          <div
            className="bg-linear-to-r from-gold-400 to-gold-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${order.progress}%` }}
          />
        </div>
      </div>

      <details className="mt-3 group">
        <summary className="cursor-pointer list-none text-xs font-semibold text-ink-600 dark:text-cream-200/60 hover:text-gold-600 dark:hover:text-gold-300 flex items-center gap-1.5">
          <span className="group-open:rotate-90 transition-transform">▸</span>
          Detail pesanan
        </summary>
        <p className="mt-2 text-xs text-ink-600 dark:text-cream-200/60">
          Tanggal dibuat: {new Date(order.createdDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </details>
    </div>
  );
}
