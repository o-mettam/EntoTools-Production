/**
 * Feedback Widget — self-contained floating button + modal
 * Include via <script src="/feedback.js"></script> at the bottom of any page.
 * Submits to POST /api/feedback which creates a GitHub issue.
 */
(function () {
  'use strict';

  // ── Console Log Capture ──────────────────────────────────────────
  const MAX_LOG_ENTRIES = 50;
  const capturedLogs = [];

  const PII_PATTERNS = [
    // Email addresses
    { regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: '[email redacted]' },
    // IPv4 addresses
    { regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[ip redacted]' },
    // IPv6 addresses (simplified)
    { regex: /\b([0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g, replacement: '[ip redacted]' },
    // Lat/lon coordinate pairs (e.g. 40.7128, -74.0060)
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

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #feedback-fab {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9998;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #8aaa25;
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    #feedback-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(0,0,0,.25);
    }
    #feedback-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0,0,0,.4);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity .2s ease;
    }
    #feedback-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    #feedback-modal {
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
      width: 100%;
      max-width: 28rem;
      padding: 1.5rem;
      transform: translateY(12px);
      transition: transform .2s ease;
    }
    #feedback-overlay.open #feedback-modal {
      transform: translateY(0);
    }
    html.dark #feedback-modal {
      background: #2a3348;
      color: #d8dee9;
    }
    #feedback-modal h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 1rem;
    }
    html.dark #feedback-modal h2 { color: #eef1f6; }
    #feedback-modal label {
      display: block;
      font-size: .75rem;
      font-weight: 500;
      color: #54637f;
      margin-bottom: .25rem;
      text-transform: uppercase;
      letter-spacing: .03em;
    }
    html.dark #feedback-modal label { color: #9ca9c0; }
    #feedback-modal input,
    #feedback-modal select,
    #feedback-modal textarea {
      width: 100%;
      border: 1px solid #bdc6d8;
      border-radius: .5rem;
      padding: .5rem .75rem;
      font-size: .875rem;
      margin-bottom: .75rem;
      outline: none;
      font-family: inherit;
      transition: border-color .15s;
    }
    #feedback-modal input:focus,
    #feedback-modal select:focus,
    #feedback-modal textarea:focus {
      border-color: #8aaa25;
      box-shadow: 0 0 0 2px rgba(138,170,37,.2);
    }
    html.dark #feedback-modal input,
    html.dark #feedback-modal select,
    html.dark #feedback-modal textarea {
      background: #3e4a64;
      border-color: #54637f;
      color: #eef1f6;
    }
    #feedback-modal textarea {
      min-height: 5rem;
      resize: vertical;
    }
    .feedback-actions {
      display: flex;
      gap: .5rem;
      justify-content: flex-end;
      margin-top: .25rem;
    }
    .feedback-btn {
      padding: .5rem 1rem;
      border-radius: .5rem;
      font-size: .875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background .15s, opacity .15s;
    }
    .feedback-btn-cancel {
      background: #eef1f6;
      color: #3e4a64;
    }
    .feedback-btn-cancel:hover { background: #d8dee9; }
    html.dark .feedback-btn-cancel { background: #3e4a64; color: #d8dee9; }
    html.dark .feedback-btn-cancel:hover { background: #54637f; }
    .feedback-btn-submit {
      background: #8aaa25;
      color: #fff;
    }
    .feedback-btn-submit:hover { background: #6d881a; }
    .feedback-btn-submit:disabled { opacity: .5; cursor: not-allowed; }
    #feedback-status {
      font-size: .8rem;
      margin-top: .5rem;
      min-height: 1.2em;
    }
    .feedback-status-error { color: #dc2626; }
    .feedback-status-success { color: #16a34a; }
    html.dark .feedback-status-success { color: #86efac; }
  `;
  document.head.appendChild(style);

  // Inject HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <button id="feedback-fab" title="Send Feedback" aria-label="Send Feedback">
      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    </button>
    <div id="feedback-overlay">
      <div id="feedback-modal">
        <h2>Send Feedback</h2>
        <label for="feedback-type">Type</label>
        <select id="feedback-type">
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="other">Other</option>
        </select>
        <label for="feedback-title">Title</label>
        <input id="feedback-title" type="text" placeholder="Brief summary of your feedback" maxlength="100" />
        <label for="feedback-desc">Description</label>
        <textarea id="feedback-desc" placeholder="Please describe in detail…" maxlength="2000"></textarea>
        <label for="feedback-email">Email (optional)</label>
        <input id="feedback-email" type="email" placeholder="your@email.com — only if you'd like a response" />
        <div class="feedback-actions">
          <button class="feedback-btn feedback-btn-cancel" id="feedback-cancel">Cancel</button>
          <button class="feedback-btn feedback-btn-submit" id="feedback-submit">Submit</button>
        </div>
        <div id="feedback-status"></div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  // References
  const fab = document.getElementById('feedback-fab');
  const overlay = document.getElementById('feedback-overlay');
  const cancelBtn = document.getElementById('feedback-cancel');
  const submitBtn = document.getElementById('feedback-submit');
  const statusEl = document.getElementById('feedback-status');

  function openModal() {
    overlay.classList.add('open');
    document.getElementById('feedback-title').focus();
  }

  function closeModal() {
    overlay.classList.remove('open');
    statusEl.textContent = '';
    statusEl.className = '';
  }

  function resetForm() {
    document.getElementById('feedback-type').value = 'bug';
    document.getElementById('feedback-title').value = '';
    document.getElementById('feedback-desc').value = '';
    document.getElementById('feedback-email').value = '';
  }

  fab.addEventListener('click', openModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  submitBtn.addEventListener('click', async () => {
    const type = document.getElementById('feedback-type').value;
    const title = document.getElementById('feedback-title').value.trim();
    const description = document.getElementById('feedback-desc').value.trim();
    const email = document.getElementById('feedback-email').value.trim();

    if (!title) {
      statusEl.textContent = 'Please enter a title.';
      statusEl.className = 'feedback-status-error';
      return;
    }
    if (!description) {
      statusEl.textContent = 'Please enter a description.';
      statusEl.className = 'feedback-status-error';
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = 'Submitting…';
    statusEl.className = '';

    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          description,
          email: email || undefined,
          page: window.location.pathname,
          console_logs: type === 'bug' ? getFormattedLogs() : undefined,
        }),
      });

      const data = await resp.json();

      if (!resp.ok || data.error) {
        statusEl.textContent = data.error || 'Something went wrong. Please try again.';
        statusEl.className = 'feedback-status-error';
        return;
      }

      statusEl.textContent = 'Thank you! Your feedback has been submitted.';
      statusEl.className = 'feedback-status-success';
      resetForm();
      setTimeout(closeModal, 2000);
    } catch (err) {
      statusEl.textContent = 'Network error — please check your connection and try again.';
      statusEl.className = 'feedback-status-error';
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
