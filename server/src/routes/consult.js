import { Router } from 'express';
import { consultSchema } from '../lib/validate.js';
import { runConsult } from '../lib/claude.js';
import { db } from '../db.js';
import { metrics } from '../lib/metrics.js';
import { optionalAuth } from '../lib/auth.js';
import { consultDailyLimiter } from '../middleware/security.js';
import { screenInbound, sanitizeOutbound, redactPii } from '../lib/guardrails.js';

export const consultRouter = Router();

const LOG_CAP = 200; // simpan transkrip ringkas terakhir saja

function logConsult(messages, result, req) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const logs = db.all('consult_logs');
  logs.push({
    id: Date.now() + Math.random().toString(16).slice(2, 8),
    at: new Date().toISOString(),
    question: redactPii(lastUser).slice(0, 300),
    replyPreview: redactPii(String(result?.reply || '')).slice(0, 300),
    escalated: Boolean(result?.escalate),
    mode: result?.mode || 'fallback',
    member: Boolean(req.session),
    sources: (result?.sources || []).map((s) => s.title),
    turns: messages.length,
    ip: req.ip,
  });
  if (logs.length > LOG_CAP) logs.splice(0, logs.length - LOG_CAP);
  db.set('consult_logs', logs);
}

// optionalAuth: set req.session bila token valid (anon tetap boleh -> fallback).
// consultDailyLimiter: plafon per pengirim; harus setelah optionalAuth agar bisa
// mengunci ke token sesi, bukan cuma IP.
consultRouter.post('/', optionalAuth, consultDailyLimiter, async (req, res, next) => {
  const parsed = consultSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Format pesan tidak valid.' });
  const messages = parsed.data.messages;
  try {
    // Guard rail masuk: blokir prompt-injection sebelum menyentuh model.
    const screen = screenInbound(messages);
    let result;
    if (screen.blocked) {
      result = { reply: screen.reply, sources: [], functions: [], escalate: null, mode: 'blocked' };
      metrics.inc('guardBlocks');
    } else {
      // Guard rail keluar: potong & redaksi balasan model.
      result = sanitizeOutbound(await runConsult(messages, { isMember: Boolean(req.session) }));
      metrics.inc('ragQueries');
      metrics.inc('ragSourcesTotal', (result?.sources || []).length);
    }

    metrics.inc('consultCalls');
    metrics.inc('consultToday');
    if (result?.escalate) metrics.inc('escalations');
    try {
      logConsult(messages, result, req);
    } catch (e) {
      console.error('[consult] gagal mencatat log:', e.message);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});
