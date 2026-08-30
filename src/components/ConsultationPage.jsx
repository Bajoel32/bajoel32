import { useEffect, useRef, useState } from 'react';
import BackButton from './BackButton';
import { WhatsAppIcon } from './BrandIcons';
import { consultationConfig, sendConsultation } from '../config/consultation';
import { checkUserInput } from '../config/guardrails';

const rupiah = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;
let idSeq = 0;
const nextId = () => `m${Date.now()}_${idSeq++}`;

export default function ConsultationPage({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scrollAnchor = useRef(null);
  const abortRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const grow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const send = async (raw) => {
    if (loading) return;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const check = checkUserInput(trimmed.slice(0, consultationConfig.maxChars), { history: messages });
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    const text = check.text;

    setError('');
    setInput('');
    requestAnimationFrame(grow);

    const userMsg = { id: nextId(), role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    abortRef.current = new AbortController();
    try {
      const res = await sendConsultation({ messages: history, signal: abortRef.current.signal });
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          content: res?.reply || 'Maaf, saya tidak punya jawaban untuk itu.',
          sources: res?.sources || [],
          functions: res?.functions || [],
          escalate: res?.escalate || null,
        },
      ]);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError('Gagal menghubungi asisten. Coba lagi, atau hubungi kami lewat WhatsApp.');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="w-full min-h-screen flex flex-col bg-cream-50 dark:bg-ink-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-cream-50/90 dark:bg-ink-900/90 backdrop-blur-md border-b border-gold-200/70 dark:border-ink-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <BackButton onClick={onBack} />
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 shrink-0 rounded-full bg-linear-to-b from-gold-300 to-gold-500 flex items-center justify-center text-ink-900 text-lg">
              ◈
            </span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-ink-900 dark:text-cream-50 leading-tight truncate">
                {consultationConfig.assistantName}
              </p>
              <p className="text-[0.65rem] uppercase tracking-[0.18em] font-semibold text-gold-600 dark:text-gold-300">
                Konsultasi
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main
        className="flex-1 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="Percakapan konsultasi"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          {empty && (
            <div className="text-center py-8">
              <span className="eyebrow">Selamat datang</span>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 dark:text-cream-50 mt-3 mb-3">
                Ada yang bisa dibantu?
              </h1>
              <p className="text-sm sm:text-base text-ink-600 dark:text-cream-200/70 max-w-lg mx-auto">
                {consultationConfig.intro}
              </p>
              <div className="mt-7 grid gap-2 sm:grid-cols-2 text-left">
                {consultationConfig.starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-gold-200/70 dark:border-ink-700 bg-white dark:bg-ink-800 px-4 py-3 text-sm text-ink-700 dark:text-cream-200/80 hover:border-gold-400 hover:shadow-elegant transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink-900 dark:bg-gold-500 text-cream-50 dark:text-ink-900 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-start">
                <div className="max-w-[90%] space-y-3">
                  <div className="rounded-2xl rounded-bl-md bg-white dark:bg-ink-800 border border-gold-200/70 dark:border-ink-700 px-4 py-3 text-sm text-ink-800 dark:text-cream-100 leading-relaxed">
                    <FormattedText text={m.content} />
                  </div>
                  {m.functions?.map((fn, i) => (
                    <FunctionResult key={i} fn={fn} />
                  ))}
                  {m.escalate && <EscalateCard esc={m.escalate} />}
                  {m.sources?.length > 0 && <Sources items={m.sources} />}
                </div>
              </div>
            ),
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-white dark:bg-ink-800 border border-gold-200/70 dark:border-ink-700 px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500 px-4 py-3" role="alert">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div ref={scrollAnchor} />
        </div>
      </main>

      {/* Composer */}
      <footer className="sticky bottom-0 bg-cream-50/95 dark:bg-ink-900/95 backdrop-blur-md border-t border-gold-200/70 dark:border-ink-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value.slice(0, consultationConfig.maxChars));
                grow();
              }}
              onKeyDown={onKeyDown}
              placeholder="Tulis pertanyaan Anda…"
              className="flex-1 resize-none rounded-2xl border border-gold-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-4 py-3 text-sm text-ink-900 dark:text-cream-50 placeholder:text-ink-600/50 dark:placeholder:text-cream-200/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Kirim"
              className="shrink-0 w-11 h-11 rounded-full bg-linear-to-b from-gold-400 to-gold-600 text-ink-900 shadow-gold flex items-center justify-center hover:from-gold-300 hover:to-gold-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.5 4.5a.6.6 0 0 1 .82-.73l15.9 7.68a.6.6 0 0 1 0 1.08l-15.9 7.68a.6.6 0 0 1-.82-.73L6 12Zm0 0h7" />
              </svg>
            </button>
          </form>
          <p className="mt-2 text-[0.7rem] leading-snug text-ink-600/70 dark:text-cream-200/50 text-center">
            {consultationConfig.disclaimer}
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- sub-komponen ---------- */

function FormattedText({ text }) {
  const lines = String(text).split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const bullet = line.trimStart().startsWith('•');
        return (
          <p key={i} className={bullet ? 'pl-3 -indent-3' : i > 0 ? 'mt-2' : ''}>
            {line || ' '}
          </p>
        );
      })}
    </>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1.5" aria-label="Asisten sedang mengetik">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

// Muncul HANYA saat bot menandai perlu admin/manusia (field `escalate` di respons).
function EscalateCard({ esc }) {
  const href = esc?.contact || consultationConfig.whatsapp;
  if (!href) return null;
  return (
    <div className="rounded-xl border border-gold-300 dark:border-gold-700/60 bg-gold-100/40 dark:bg-gold-500/5 px-4 py-3">
      <p className="text-xs font-semibold text-ink-900 dark:text-cream-50">
        Perlu bantuan admin{esc?.reason ? ` — ${esc.reason}` : ''}
      </p>
      <p className="text-[0.7rem] text-ink-600/80 dark:text-cream-200/60 mt-0.5 mb-2.5">
        Lanjutkan percakapan dengan admin kami lewat WhatsApp.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-gold-300 dark:border-gold-700/60 bg-white dark:bg-ink-800 px-4 py-2 text-xs font-semibold text-ink-800 dark:text-cream-100 hover:border-gold-400 transition-colors"
      >
        <WhatsAppIcon className="w-4 h-4" />
        Chat Admin via WhatsApp
      </a>
    </div>
  );
}

function Sources({ items }) {
  return (
    <details className="group">
      <summary className="cursor-pointer text-[0.7rem] uppercase tracking-[0.16em] font-semibold text-gold-600 dark:text-gold-300 list-none flex items-center gap-1.5">
        <span className="group-open:rotate-90 transition-transform">▸</span>
        {items.length} Sumber
      </summary>
      <ul className="mt-2 space-y-1.5">
        {items.map((s, i) => (
          <li
            key={i}
            className="text-xs text-ink-600 dark:text-cream-200/60 border-l-2 border-gold-300/60 pl-3"
          >
            <span className="font-medium text-ink-800 dark:text-cream-100">{s.title}</span>
            {s.snippet ? ` — ${s.snippet}` : ''}
            {s.url ? (
              <>
                {' '}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gold-600"
                >
                  buka
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

function FunctionResult({ fn }) {
  const shell =
    'rounded-xl border border-gold-200/70 dark:border-ink-700 bg-cream-50 dark:bg-ink-900/60 overflow-hidden';
  const head = (
    <div className="px-4 py-2 border-b border-gold-200/60 dark:border-ink-700 flex items-center gap-2">
      <span className="text-[0.65rem] uppercase tracking-[0.16em] font-semibold text-gold-700 dark:text-gold-300">
        {fn.label || fn.name}
      </span>
      <span className="text-[0.6rem] font-mono text-ink-600/60 dark:text-cream-200/40">{fn.name}</span>
    </div>
  );

  if (fn.name === 'infoLayanan' && Array.isArray(fn.data)) {
    return (
      <div className={shell}>
        {head}
        <ul className="px-4 py-2 text-xs space-y-1.5">
          {fn.data.map((s) => (
            <li key={s.id} className="text-ink-800 dark:text-cream-100">
              {s.icon} {s.name}
            </li>
          ))}
        </ul>
        <p className="px-4 py-2 text-[0.7rem] text-ink-600/70 dark:text-cream-200/50 border-t border-gold-200/50 dark:border-ink-700">
          Biaya dan estimasi waktu bersifat penawaran, dikonfirmasi staf.
        </p>
      </div>
    );
  }

  if (fn.name === 'cekStatusPesanan') {
    const o = fn.data || {};
    // needVerification / mismatch / notFound → tidak ada detail; teks balasan bot yang menjelaskan.
    if (!o.status) return null;
    return (
      <div className={shell}>
        {head}
        <div className="px-4 py-3 space-y-2 text-xs">
          <div className="flex justify-between gap-3">
            <span className="text-ink-600 dark:text-cream-200/60">No. Pesanan</span>
            <span className="font-medium text-ink-900 dark:text-cream-50">{o.orderNumber}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-ink-600 dark:text-cream-200/60">Pelanggan</span>
            <span className="font-medium text-ink-900 dark:text-cream-50">{o.customerName}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-ink-600 dark:text-cream-200/60">Status</span>
            <span className="font-medium text-gold-700 dark:text-gold-300">{o.status}</span>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[0.7rem] mb-1">
              <span className="text-ink-600 dark:text-cream-200/60">Progres</span>
              <span className="tabular-nums text-ink-700 dark:text-cream-200/70">{o.progress}%</span>
            </div>
            <div className="w-full bg-cream-200 dark:bg-ink-700 rounded-full h-1.5">
              <div
                className="bg-linear-to-r from-gold-400 to-gold-600 h-1.5 rounded-full"
                style={{ width: `${o.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fn.name === 'rekomendasiGaleri' && Array.isArray(fn.data) && fn.data.length > 0) {
    return (
      <div className={shell}>
        {head}
        <div className="p-3 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
          {fn.data.map((g) => (
            <div key={g.id} className="rounded-lg overflow-hidden border border-gold-200/60 dark:border-ink-700 bg-white dark:bg-ink-800">
              <div className="aspect-square bg-cream-100 dark:bg-ink-900">
                <img src={g.image} alt={g.title} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-ink-900 dark:text-cream-50 line-clamp-1">{g.title}</p>
                <p className="text-[0.7rem] text-gold-700 dark:text-gold-300 font-semibold">{rupiah(g.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // fallback: tampilkan data mentah (berguna saat mengembangkan backend)
  return (
    <div className={shell}>
      {head}
      <pre className="px-4 py-3 text-[0.7rem] text-ink-700 dark:text-cream-200/70 overflow-x-auto">
        {JSON.stringify(fn.data, null, 2)}
      </pre>
    </div>
  );
}
