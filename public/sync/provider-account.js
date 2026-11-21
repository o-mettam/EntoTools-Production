/**
 * EntoTools — account-backed sync provider (#35 phase 3)
 *
 * Implements the StorageProvider interface EntoSync expects
 * (connect(), silentConnect(), disconnect(), isConnected(), pull(),
 * push(snapshot); see public/sync/sync-core.js).
 *
 * "Connected" just means "logged in" (public/account.js owns the actual
 * passkey ceremony) — there's no separate consent step, no token to
 * refresh, just the session cookie that already exists once signed in.
 *
 * Requires public/account.js to be loaded first (for window.EntoAccount).
 */
(function (global) {
  'use strict';

  const LAST_SYNCED_KEY = 'entoAccountLastSynced';

  function getLastSynced() {
    try { return localStorage.getItem(LAST_SYNCED_KEY); } catch (e) { return null; }
  }
  function setLastSynced(iso) {
    try { localStorage.setItem(LAST_SYNCED_KEY, iso); } catch (e) { /* ignore */ }
  }

  async function api(path, options) {
    const resp = await fetch(path, options);
    let data = {};
    try { data = await resp.json(); } catch (e) { /* ignore */ }
    if (!resp.ok || data.error) throw new Error(data.error || ('HTTP ' + resp.status));
    return data;
  }

  const provider = {
    id: 'account',
    label: 'EntoTools Account',

    isConfigured: function () { return true; }, // no external client ID to set up
    isConnected: function () { return !!(global.EntoAccount && global.EntoAccount.isLoggedIn()); },
    hasToken: function () { return provider.isConnected(); },
    setInteractive: function () {}, // no-op — public/account.js already gates its own popups on a user gesture

    // If already logged in, this is a no-op success. Otherwise opens the
    // sign-in/sign-up modal and waits for the user to complete it.
    async connect() {
      if (provider.isConnected()) return true;
      if (!global.EntoAccount) throw new Error('Account system not loaded.');
      return new Promise((resolve, reject) => {
        const onReady = () => {
          document.removeEventListener('entoaccount:ready', onReady);
          if (global.EntoAccount.isLoggedIn()) resolve(true);
          else reject(new Error('Sign-in was not completed.'));
        };
        document.addEventListener('entoaccount:ready', onReady);
        global.EntoAccount.open();
      });
    },

    // Never triggers any UI — a session cookie either already exists or it
    // doesn't; public/account.js's own startup check already established
    // window.EntoAccount's login state by the time anything calls this.
    async silentConnect() {
      return provider.isConnected();
    },

    disconnect() {
      if (global.EntoAccount) global.EntoAccount.logout();
    },

    // Returns { json: envelope|null, meta } — null json means no remote data yet.
    async pull() {
      const data = await api('/api/account/collection');
      return { json: data.json, meta: data.meta || {} };
    },

    // snapshot is a store envelope (see EntoStore in sync-core.js).
    async push(snapshot) {
      const result = await api('/api/account/collection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      setLastSynced(result.modifiedTime);
      return result;
    },

    lastSynced() { return getLastSynced(); },
  };

  global.EntoAccountProvider = provider;
})(window);
