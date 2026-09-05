/**
 * EntoTools — Account system client (issue #35, phases 2-4).
 * Passkey sign-up/login/logout, self-service passkey management, and
 * feature-flag population (window.EntoFlags) used to gate other features —
 * see public/sync/provider-gdrive.js, which only loads/activates Google
 * Drive Sync for users with the "gdrive-sync" flag (#37).
 *
 * Loads @simplewebauthn/browser from jsDelivr (pinned + SRI, same pattern
 * already used for Chart.js in degree_day_calculator.html) — public/*.js
 * files aren't bundled the way src/index.js is via esbuild, so this can't be
 * an npm import here; the actual WebAuthn ceremony (navigator.credentials.
 * create/get plus base64url encoding of the binary fields) is handled by
 * that library rather than hand-rolled in this file.
 *
 * IMPORTANT: every template loads this as <script src="/account.js?v=N">
 * (same convention as /sync/*.js). Bump N here and in every template on any
 * change to this file — the Worker's Cache-Control header for .js assets is
 * "no-cache", not "no-store", and browsers (Safari especially) have been
 * observed serving a stale cached copy under revalidation rather than
 * always refetching. A version-bumped URL is a fresh cache key and sidesteps
 * that entirely; relying on headers alone was the root cause of #38/#39.
 */
(function () {
  'use strict';

  // Fails safe: empty until we know better, and reset to empty on any error
  // below — a bug here can only ever hide a gated feature, never show one.
  window.EntoFlags = new Set();

  var state = { user: null, credentials: [] };

  // Same simple check used elsewhere in this codebase (public/feedback.js,
  // src/index.js) — accounts require an email, not an arbitrary display name.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Set from a ?reregister=<token> URL param (see below) — an admin-issued
  // link from the admin portal after resetting a user's passkeys (#36).
  var pendingReregisterToken = null;

  function clearReregisterFromUrl() {
    var url = new URL(location.href);
    url.searchParams.delete('reregister');
    history.replaceState(null, '', url.toString());
  }

  function loadScript(src, integrity) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      if (integrity) { s.integrity = integrity; s.crossOrigin = 'anonymous'; }
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  var webauthnBrowserReady = loadScript(
    'https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@14.0.0/dist/bundle/index.umd.min.js',
    'sha384-06g944bCm8L/wG3i0Q8PdB8jccE4GdpHdNCa1tJY8eMqoP3GIHGJdL6B5lD5OMGD'
  ).catch(function (e) { console.error('[EntoAccount] failed to load WebAuthn browser library:', e); });

  // cache: 'no-store' matters here specifically for Safari, which — unlike
  // Chrome/Firefox — will reuse a cached GET response for an identical URL
  // even across a login that changed the session cookie. Without this, a
  // checkSession() call right after logIn()/signUp() can silently be served
  // the stale pre-login "{user: null}" response instead of hitting the
  // network, so the UI never updates even though the server-side session is
  // fine (issues #38/#39).
  async function api(path, options) {
    const resp = await fetch(path, Object.assign({ cache: 'no-store' }, options));
    let data = {};
    try { data = await resp.json(); } catch (e) { /* non-JSON or empty body */ }
    if (!resp.ok || data.error) throw new Error(data.error || ('HTTP ' + resp.status));
    return data;
  }

  // Escapes quotes too, so it's safe inside attribute values as well as text.
  function esc(str) {
    var el = document.createElement('span');
    el.textContent = str == null ? '' : str;
    return el.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Session + flags ──────────────────────────────────────────────
  async function refreshFlags() {
    try {
      const { flags } = await api('/api/account/flags');
      window.EntoFlags = new Set(flags);
    } catch (e) {
      window.EntoFlags = new Set();
    }
    document.dispatchEvent(new CustomEvent('entoflags:updated'));
  }

  async function refreshCredentials() {
    if (!state.user) { state.credentials = []; return; }
    try {
      const { credentials } = await api('/api/account/credentials');
      state.credentials = credentials;
    } catch (e) {
      state.credentials = [];
    }
  }

  async function checkSession() {
    try {
      const { user } = await api('/api/account/session');
      state.user = user;
    } catch (e) {
      // Logged, not silent: a 401 here right after a successful login is
      // exactly the signature of the browser sending a cookie the server
      // can't match (#38/#39), and it was invisible in bug reports before.
      console.warn('[EntoAccount] checkSession: no active session (' + e.message + ')');
      state.user = null;
    }
    if (state.user) {
      await Promise.all([refreshFlags(), refreshCredentials()]);
    } else {
      window.EntoFlags = new Set();
      state.credentials = [];
      document.dispatchEvent(new CustomEvent('entoflags:updated'));
    }
    // A throw in here (e.g. settings-panel markup not matching what this
    // expects on some page) would otherwise silently swallow the rest of
    // checkSession(), including the entoaccount:ready dispatch that other
    // scripts (Drive sync gating, account-based sync) depend on.
    try { renderSettingsSection(); } catch (e) { console.error('[EntoAccount] renderSettingsSection failed:', e.message); }
    document.dispatchEvent(new CustomEvent('entoaccount:ready', { detail: { user: state.user } }));
  }

  // ── WebAuthn ceremonies ──────────────────────────────────────────
  // Every step logs — issue #38 was a bug report submitted right after a
  // failed login attempt that captured zero information about what
  // actually happened (no console output either way), making it
  // undiagnosable from the report alone. That gap is the actual bug this
  // logging exists to close.
  async function signUp(label) {
    console.log('[EntoAccount] signUp: requesting registration options');
    await webauthnBrowserReady;
    const options = await api('/api/account/register/options', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label }),
    });
    console.log('[EntoAccount] signUp: got options, starting browser ceremony');
    const attResp = await SimpleWebAuthnBrowser.startRegistration({ optionsJSON: options });
    console.log('[EntoAccount] signUp: ceremony complete, verifying with server');
    await api('/api/account/register/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attResp),
    });
    console.log('[EntoAccount] signUp: verified, session established');
    await checkSession();
  }

  async function addPasskey() {
    console.log('[EntoAccount] addPasskey: requesting registration options');
    await webauthnBrowserReady;
    const options = await api('/api/account/register/options', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
    });
    const attResp = await SimpleWebAuthnBrowser.startRegistration({ optionsJSON: options });
    await api('/api/account/register/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attResp),
    });
    console.log('[EntoAccount] addPasskey: verified and added');
    await refreshCredentials();
    renderSettingsSection();
  }

  async function logIn() {
    console.log('[EntoAccount] logIn: requesting authentication options');
    await webauthnBrowserReady;
    const options = await api('/api/account/login/options', { method: 'POST' });
    console.log('[EntoAccount] logIn: got options, starting browser ceremony');
    const authResp = await SimpleWebAuthnBrowser.startAuthentication({ optionsJSON: options });
    console.log('[EntoAccount] logIn: ceremony complete, verifying with server');
    await api('/api/account/login/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authResp),
    });
    console.log('[EntoAccount] logIn: verified, session established');
    await checkSession();
  }

  async function logOut() {
    try { await api('/api/account/logout', { method: 'POST' }); } catch (e) { console.error('[EntoAccount] logOut: server call failed, clearing local state anyway:', e.message); }
    console.log('[EntoAccount] logOut: complete');
    await checkSession();
  }

  // An admin-issued single-use link (?reregister=<token>) after resetting a
  // user's passkeys (#36) — the server links the new passkey to that same
  // existing account instead of creating a new one, but only via this exact
  // token; a normal signUp() with a matching label never does this (#35).
  async function reregisterWithToken(token) {
    await webauthnBrowserReady;
    const options = await api('/api/account/register/options', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reregisterToken: token }),
    });
    const attResp = await SimpleWebAuthnBrowser.startRegistration({ optionsJSON: options });
    await api('/api/account/register/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attResp),
    });
    await checkSession();
  }

  async function removeCredential(credentialId) {
    await api('/api/account/credentials/' + encodeURIComponent(credentialId), { method: 'DELETE' });
    await refreshCredentials();
    renderSettingsSection();
  }

  async function renameCredential(credentialId, name) {
    await api('/api/account/credentials/' + encodeURIComponent(credentialId), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_label: name }),
    });
    await refreshCredentials();
  }

  // ── Modal (sign up / log in / manage passkeys) ────────────────────
  var modalInjected = false;
  function injectModal() {
    if (modalInjected) return;
    modalInjected = true;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div id="ento-account-overlay" class="fixed inset-0 z-[9999] bg-black/40 hidden items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 id="ento-account-title" class="text-lg font-semibold text-slate-800">Account</h2>
            <button id="ento-account-close" class="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
          </div>
          <div id="ento-account-body"></div>
          <p id="ento-account-status" class="text-sm mt-3"></p>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);
    document.getElementById('ento-account-close').addEventListener('click', closeModal);
    document.getElementById('ento-account-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'ento-account-overlay') closeModal();
    });
  }

  function openModal() {
    injectModal();
    document.getElementById('ento-account-overlay').classList.remove('hidden');
    document.getElementById('ento-account-overlay').classList.add('flex');
    renderModalBody();
  }
  function closeModal() {
    var overlay = document.getElementById('ento-account-overlay');
    if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
  }
  // A brief pause (not an instant vanish) so the "Account created."/"Signed
  // in." confirmation is actually visible before the window disappears.
  function closeModalSoon() {
    setTimeout(closeModal, 700);
  }
  function setStatus(msg, isError) {
    var el = document.getElementById('ento-account-status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'text-sm mt-3 ' + (isError ? 'text-red-600' : 'text-lime-700');
  }

  function renderModalBody() {
    var body = document.getElementById('ento-account-body');
    var title = document.getElementById('ento-account-title');
    if (pendingReregisterToken) {
      title.textContent = 'Register a new passkey';
      body.innerHTML = `
        <p class="text-sm text-slate-600 mb-3">An admin reset your passkeys — register a new one below to regain access to your existing account. This link is single-use.</p>
        <button id="ento-account-reregister" class="w-full px-3 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 text-white text-sm font-medium transition">Register new passkey</button>
      `;
      document.getElementById('ento-account-reregister').addEventListener('click', async function () {
        setStatus('Follow your browser/device prompt…');
        try {
          await reregisterWithToken(pendingReregisterToken);
          pendingReregisterToken = null;
          clearReregisterFromUrl();
          setStatus('Passkey registered.');
          closeModalSoon();
        } catch (err) { console.error("[EntoAccount] action failed:", err.message); setStatus(err.message, true); }
      });
      return;
    }
    if (state.user) {
      title.textContent = 'Manage account';
      body.innerHTML = `
        <p class="text-sm text-slate-600 mb-3">Signed in as <span class="font-medium">${esc(state.user.label)}</span></p>
        <h3 class="text-sm font-semibold text-slate-700 mb-2">Passkeys</h3>
        <div id="ento-account-credentials" class="space-y-1.5 mb-3"></div>
        <button id="ento-account-add-passkey" class="w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition mb-2">Add a passkey on this device</button>
        <button id="ento-account-logout" class="w-full px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition">Log out</button>
      `;
      renderCredentialList();
      document.getElementById('ento-account-add-passkey').addEventListener('click', async function () {
        setStatus('Follow your browser/device prompt…');
        try { await addPasskey(); setStatus('Passkey added.'); renderCredentialList(); }
        catch (err) { console.error("[EntoAccount] action failed:", err.message); setStatus(err.message, true); }
      });
      document.getElementById('ento-account-logout').addEventListener('click', async function () {
        await logOut();
        closeModal();
      });
    } else {
      title.textContent = 'Sign in';
      body.innerHTML = `
        <label class="block text-xs font-medium text-slate-500 mb-1">Email address</label>
        <input id="ento-account-label" type="email" placeholder="you@example.com"
               class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-lime-500 outline-none mb-3">
        <button id="ento-account-signup" class="w-full px-3 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 text-white text-sm font-medium transition mb-2">Create account with a passkey</button>
        <div class="text-center text-xs text-slate-400 my-2">— or —</div>
        <button id="ento-account-login" class="w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition">Log in with an existing passkey</button>
      `;
      document.getElementById('ento-account-signup').addEventListener('click', async function () {
        var label = document.getElementById('ento-account-label').value.trim();
        if (!EMAIL_RE.test(label)) { setStatus('Enter a valid email address.', true); return; }
        setStatus('Follow your browser/device prompt…');
        try { await signUp(label); setStatus('Account created.'); closeModalSoon(); }
        catch (err) { console.error("[EntoAccount] action failed:", err.message); setStatus(err.message, true); }
      });
      document.getElementById('ento-account-login').addEventListener('click', async function () {
        setStatus('Follow your browser/device prompt…');
        try { await logIn(); setStatus('Signed in.'); closeModalSoon(); }
        catch (err) { console.error("[EntoAccount] action failed:", err.message); setStatus(err.message, true); }
      });
    }
  }

  function renderCredentialList() {
    var el = document.getElementById('ento-account-credentials');
    if (!el) return;
    el.innerHTML = state.credentials.length
      ? state.credentials.map(function (c) {
          return `
            <div class="ento-cred-row flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm" data-id="${esc(c.credential_id)}">
              <span class="ento-cred-label text-slate-700 truncate" title="${esc(c.device_label || 'Unnamed device')}">${esc(c.device_label || 'Unnamed device')}</span>
              <span class="flex items-center gap-3 shrink-0">
                <button class="ento-rename-cred text-xs text-slate-500 hover:text-slate-700 font-medium">Rename</button>
                <button class="ento-remove-cred text-xs text-red-600 hover:text-red-700 font-medium">Remove</button>
              </span>
            </div>
          `;
        }).join('')
      : '<p class="text-slate-400 text-sm">No passkeys found.</p>';
    el.querySelectorAll('.ento-cred-row').forEach(function (row) {
      var id = row.dataset.id;
      row.querySelector('.ento-remove-cred').addEventListener('click', async function () {
        if (!confirm('Remove this passkey? You will no longer be able to log in with that device.')) return;
        try { await removeCredential(id); renderCredentialList(); }
        catch (err) { console.error("[EntoAccount] action failed:", err.message); setStatus(err.message, true); }
      });
      row.querySelector('.ento-rename-cred').addEventListener('click', function () { startRename(row, id); });
    });
  }

  // Inline rename: the row turns into an input + Save/Cancel; Enter saves,
  // Escape cancels. The current name is assigned via .value (not interpolated
  // into the markup) so it can never break out of the attribute.
  function startRename(row, credentialId) {
    var current = row.querySelector('.ento-cred-label').textContent;
    row.innerHTML = `
      <input class="ento-rename-input flex-1 min-w-0 rounded-md border border-slate-300 px-2 py-1 text-sm focus:ring-2 focus:ring-lime-500 outline-none" maxlength="60" aria-label="Passkey name">
      <span class="flex items-center gap-3 shrink-0">
        <button class="ento-rename-save text-xs text-lime-700 hover:text-lime-800 font-medium">Save</button>
        <button class="ento-rename-cancel text-xs text-slate-500 hover:text-slate-700">Cancel</button>
      </span>
    `;
    var input = row.querySelector('.ento-rename-input');
    input.value = current;
    input.focus();
    input.select();
    var busy = false;
    async function save() {
      if (busy) return;
      var name = input.value.trim();
      if (!name) { setStatus('Enter a name for this passkey.', true); input.focus(); return; }
      busy = true;
      try { await renameCredential(credentialId, name); setStatus('Passkey renamed.'); }
      catch (err) { console.error("[EntoAccount] action failed:", err.message); setStatus(err.message, true); }
      renderCredentialList();
    }
    row.querySelector('.ento-rename-save').addEventListener('click', save);
    row.querySelector('.ento-rename-cancel').addEventListener('click', renderCredentialList);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      else if (e.key === 'Escape') { e.preventDefault(); renderCredentialList(); }
    });
  }

  // ── Settings panel entry point ────────────────────────────────────
  // Same auto-inject convention theme.js already uses for the version line
  // (id="settings-panel" is shared markup across every page) — appended
  // before that version line so the final order reads: account section,
  // then "Version X.Y.Z" as the last line.
  function renderSettingsSection() {
    var panel = document.getElementById('settings-panel');
    if (!panel) return;
    var section = document.getElementById('ento-account-section');
    if (!section) {
      section = document.createElement('div');
      section.id = 'ento-account-section';
      var versionLine = document.getElementById('app-version-info');
      panel.insertBefore(section, versionLine || null);
    }
    if (state.user) {
      section.innerHTML = `
        <hr class="my-2 border-slate-100">
        <p class="text-xs text-slate-500 pt-1">Signed in as</p>
        <p class="text-sm font-medium text-slate-800 truncate">${esc(state.user.label)}</p>
        <div class="flex items-center justify-between mt-2 pb-1">
          <button id="ento-account-manage" class="text-xs text-slate-500 hover:text-slate-700 underline">Manage passkeys</button>
          <button id="ento-account-signout" class="text-xs text-red-600 hover:text-red-700 font-medium">Sign out</button>
        </div>
      `;
      document.getElementById('ento-account-manage').addEventListener('click', openModal);
      document.getElementById('ento-account-signout').addEventListener('click', async function () {
        await logOut();
      });
    } else {
      section.innerHTML = `
        <hr class="my-2 border-slate-100">
        <button id="ento-account-open" class="w-full text-left py-2 text-sm text-lime-700 hover:text-lime-800 font-medium transition">Sign in / Create account</button>
      `;
      document.getElementById('ento-account-open').addEventListener('click', openModal);
    }
  }

  window.EntoAccount = {
    isLoggedIn: function () { return !!state.user; },
    getUser: function () { return state.user; },
    login: logIn,
    logout: logOut,
    open: openModal,
    refresh: checkSession,
  };

  pendingReregisterToken = new URL(location.href).searchParams.get('reregister');
  checkSession().then(function () {
    if (pendingReregisterToken) openModal();
  });
})();
