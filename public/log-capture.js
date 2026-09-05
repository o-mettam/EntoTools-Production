/**
 * EntoTools shared logging — wraps console.log/warn/error so recent output
 * can be attached to bug reports, and adds a small amount of diagnostic
 * logging of its own (page version, browser info, user actions, errors).
 *
 * Must load BEFORE any other page script (right after the Tailwind CDN
 * script, before /theme.js) so nothing logged during page startup is missed.
 * feedback.js depends on window.EntoLog — keep this loaded first.
 */
(function () {
  'use strict';

  const MAX_LOG_ENTRIES = 50;
  const capturedLogs = [];

  // KEEP IN SYNC with PII_PATTERNS in src/index.js (same rules, array form).
  // Everything logged through EntoLog or the wrapped console methods is run
  // through this before being retained, so browser/device info logged below
  // can never leak an email, IP, coordinate, or token into a bug report.
  const PII_PATTERNS = [
    // Email addresses
    { regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: '[email redacted]' },
    // IPv4 addresses
    { regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[ip redacted]' },
    // IPv6 — full form
    { regex: /\b([0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g, replacement: '[ip redacted]' },
    // IPv6 — "::"-compressed form (e.g. 2001:db8::1, fe80::)
    { regex: /\b([0-9a-fA-F]{1,4}:){1,7}:([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){0,6}\b)?/g, replacement: '[ip redacted]' },
    // Labelled coordinates at ANY precision (lat: 40.71, "lon":-74, lng=12.5)
    { regex: /\b(lat|latitude|lon|lng|longitude)(["']?\s*[:=]\s*["']?)-?\d{1,3}(\.\d+)?/gi, replacement: '$1$2[coord redacted]' },
    // Comma-separated coordinate pairs with 2+ decimals (40.71, -74.05)
    { regex: /-?\d{1,3}\.\d{2,}\s*,\s*-?\d{1,3}\.\d{2,}/g, replacement: '[coord redacted]' },
    // Standalone high-precision decimals (4+ places — likely coordinates)
    { regex: /-?\d{1,3}\.\d{4,}/g, replacement: '[coord redacted]' },
    // Bearer/auth tokens
    { regex: /(Bearer\s+|token[=:]\s*)[\w\-._~+/]+=*/gi, replacement: '$1[token redacted]' },
    // Generic long hex/base64 strings (API keys, tokens)
    { regex: /\b[A-Za-z0-9_\-]{32,}\b/g, replacement: '[key redacted]' },
  ];

  function sanitizeLogString(str) {
    let sanitized = str;
    for (const { regex, replacement } of PII_PATTERNS) {
      sanitized = sanitized.replace(regex, replacement);
    }
    return sanitized;
  }

  function captureLog(level, args) {
    try {
      const message = args.map(a => {
        if (typeof a === 'string') return a;
        try { return JSON.stringify(a); } catch { return String(a); }
      }).join(' ');
      const sanitized = sanitizeLogString(message);
      capturedLogs.push({
        ts: new Date().toISOString(),
        level,
        msg: sanitized.slice(0, 500),
      });
      if (capturedLogs.length > MAX_LOG_ENTRIES) capturedLogs.shift();
    } catch { /* never break the app */ }
  }

  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  console.log = function (...args) { captureLog('log', args); originalConsole.log(...args); };
  console.warn = function (...args) { captureLog('warn', args); originalConsole.warn(...args); };
  console.error = function (...args) { captureLog('error', args); originalConsole.error(...args); };

  // Also capture unhandled errors
  window.addEventListener('error', (e) => {
    captureLog('error', [`Unhandled: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`]);
  });
  window.addEventListener('unhandledrejection', (e) => {
    captureLog('error', [`Unhandled rejection: ${e.reason}`]);
  });

  function getFormattedLogs() {
    if (capturedLogs.length === 0) return '';
    return capturedLogs.map(e => `[${e.ts}] ${e.level.toUpperCase()}: ${e.msg}`).join('\n');
  }

  // ── Action / error logging helpers ───────────────────────────────
  function action(label, detail) {
    console.log('[Action]', label, detail !== undefined ? detail : '');
  }

  function error(context, err) {
    const msg = err && err.message ? err.message : err;
    console.error('[Error]', context, msg !== undefined ? msg : '');
  }

  window.EntoLog = {
    getFormattedLogs,
    action,
    error,
  };

  // ── Generic button-click logging ─────────────────────────────────
  // Delegated listener so every button on every page is logged as a user
  // action with zero per-page wiring — new buttons are covered automatically.
  document.addEventListener('click', (e) => {
    const el = e.target && e.target.closest
      ? e.target.closest('button, [role="button"], input[type="submit"], input[type="button"]')
      : null;
    if (!el) return;
    const label = el.id || el.getAttribute('aria-label') || el.title
      || (el.textContent && el.textContent.trim().slice(0, 60)) || el.value || '(unnamed button)';
    action('button click: ' + label, location.pathname);
  }, true);

  // ── Startup diagnostics ───────────────────────────────────────────
  // Deferred to DOMContentLoaded so /theme.js (loaded right after this
  // script) has already set window.APP_VERSION and applied the theme class.
  // Deliberately minimal (security assessment 2026-09, R7): these lines end
  // up in public bug reports, so only what's needed to reproduce a problem —
  // version, page, theme, browser. Timezone/language/platform/viewport were
  // dropped: together they're a fingerprint and rarely explain a bug.
  function logStartup() {
    console.log('[EntoLog] page loaded', {
      version: window.APP_VERSION || 'unknown',
      page: location.pathname,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      userAgent: navigator.userAgent,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logStartup);
  } else {
    logStartup();
  }
})();
