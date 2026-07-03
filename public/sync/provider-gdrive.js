/**
 * EntoTools — Google Drive storage provider
 *
 * Implements the StorageProvider interface consumed by EntoSync:
 *   connect(), silentConnect(), disconnect(), isConnected(), pull(), push(snapshot)
 *
 * Auth: Google Identity Services (GIS) token client, implicit flow, scope drive.file.
 * Files: a visible "EntoTools Backups" folder containing ento-collection.json
 *        (canonical) and ento-collection.csv (human-readable mirror).
 *
 * Requires (loaded in the page before this script):
 *   - https://accounts.google.com/gsi/client   (window.google.accounts)
 *   - sync-core.js (EntoCsv)
 *   - config.js (window.ENTO_GOOGLE_CLIENT_ID)
 */
(function (global) {
  'use strict';

  const SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const FOLDER_NAME = 'EntoTools Backups';
  const JSON_NAME = 'ento-collection.json';
  const CSV_NAME = 'ento-collection.csv';
  const CONN_KEY = 'entoDriveConn'; // persisted connection intent + cached file ids

  const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
  const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

  let accessToken = null;
  let tokenExpiry = 0;
  let tokenClient = null;
  let allowInteractive = false; // only true during explicit user actions (Connect / Sync now)
  const SESSION_TOKEN_KEY = 'entoDriveToken'; // sessionStorage cache (cleared on tab/browser close)

  // Restore a still-valid token from this browser session so refreshes don't re-prompt.
  function restoreToken() {
    if (accessToken && Date.now() < tokenExpiry) return;
    try {
      const s = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (s) {
        const t = JSON.parse(s);
        if (t && t.accessToken && t.tokenExpiry > Date.now()) {
          accessToken = t.accessToken; tokenExpiry = t.tokenExpiry;
        }
      }
    } catch (e) { /* ignore */ }
  }
  function persistToken() {
    try { sessionStorage.setItem(SESSION_TOKEN_KEY, JSON.stringify({ accessToken: accessToken, tokenExpiry: tokenExpiry })); } catch (e) { /* ignore */ }
  }
  function clearToken() {
    accessToken = null; tokenExpiry = 0;
    try { sessionStorage.removeItem(SESSION_TOKEN_KEY); } catch (e) { /* ignore */ }
  }

  // ── Persisted connection state (file ids, intent) ──────────────
  function loadConn() {
    try { return JSON.parse(localStorage.getItem(CONN_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveConn(conn) {
    try { localStorage.setItem(CONN_KEY, JSON.stringify(conn)); } catch (e) { /* ignore */ }
  }
  function clearConn() {
    try { localStorage.removeItem(CONN_KEY); } catch (e) { /* ignore */ }
  }

  function clientId() { return global.ENTO_GOOGLE_CLIENT_ID; }
  function gisReady() { return !!(global.google && global.google.accounts && global.google.accounts.oauth2); }

  // The GIS client script loads async/defer; wait briefly for it to be ready.
  function waitForGis(timeoutMs) {
    return new Promise((resolve) => {
      if (gisReady()) return resolve(true);
      const deadline = Date.now() + (timeoutMs || 5000);
      const timer = setInterval(() => {
        if (gisReady()) { clearInterval(timer); resolve(true); }
        else if (Date.now() > deadline) { clearInterval(timer); resolve(false); }
      }, 100);
    });
  }

  function isConfigured() {
    const id = clientId();
    return !!id && id.indexOf('REPLACE_WITH_') !== 0;
  }

  // ── Token handling ─────────────────────────────────────────────
  function ensureTokenClient() {
    if (tokenClient) return;
    if (!gisReady()) throw new Error('Google Identity Services not loaded.');
    if (!isConfigured()) throw new Error('Google OAuth client ID is not configured (see public/sync/config.js).');
    tokenClient = global.google.accounts.oauth2.initTokenClient({
      client_id: clientId(),
      scope: SCOPE,
      callback: () => {}, // replaced per-request
    });
  }

  // prompt: 'consent' (interactive) | '' (silent if previously granted)
  function requestToken(prompt) {
    return new Promise((resolve, reject) => {
      try { ensureTokenClient(); } catch (e) { return reject(e); }
      tokenClient.callback = (resp) => {
        if (resp && resp.error) { reject(new Error(resp.error)); return; }
        accessToken = resp.access_token;
        tokenExpiry = Date.now() + ((resp.expires_in || 3600) - 60) * 1000; // refresh 1 min early
        persistToken();
        resolve(accessToken);
      };
      try { tokenClient.requestAccessToken({ prompt: prompt }); }
      catch (e) { reject(e); }
    });
  }

  function hasValidToken() { restoreToken(); return !!accessToken && Date.now() < tokenExpiry; }

  async function ensureToken() {
    if (hasValidToken()) return accessToken;
    // Never trigger Google's auth UI unless the call originated from a user gesture.
    if (!allowInteractive) { const e = new Error('token-unavailable'); e.code = 'TOKEN_UNAVAILABLE'; throw e; }
    return requestToken('');
  }

  // ── Drive REST helpers ─────────────────────────────────────────
  async function driveFetch(url, options) {
    const token = await ensureToken();
    const opts = options || {};
    opts.headers = Object.assign({}, opts.headers, { Authorization: 'Bearer ' + token });
    const resp = await fetch(url, opts);
    if (resp.status === 401) {
      // token rejected — force one interactive-free refresh and retry once
      clearToken();
      const t2 = await requestToken('');
      opts.headers.Authorization = 'Bearer ' + t2;
      return fetch(url, opts);
    }
    return resp;
  }

  // Escape a value for safe interpolation into a Drive `q` query string.
  // Drive uses single-quoted string literals; backslashes and single quotes
  // must be escaped. Prevents query breakage/injection if a value ever contains
  // special characters.
  function driveQ(v) { return String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

  async function findFile(q) {
    const url = DRIVE_FILES + '?q=' + encodeURIComponent(q) +
      '&fields=' + encodeURIComponent('files(id,name,modifiedTime,headRevisionId)') +
      '&spaces=drive&pageSize=10';
    const resp = await driveFetch(url, { method: 'GET' });
    if (!resp.ok) throw new Error('Drive list failed (' + resp.status + ')');
    const data = await resp.json();
    return (data.files && data.files[0]) || null;
  }

  async function ensureFolder(conn) {
    if (conn.folderId) {
      const resp = await driveFetch(DRIVE_FILES + '/' + conn.folderId + '?fields=id,trashed', { method: 'GET' });
      if (resp.ok) { const f = await resp.json(); if (!f.trashed) return conn.folderId; }
    }
    const existing = await findFile(
      "mimeType='application/vnd.google-apps.folder' and name='" + driveQ(FOLDER_NAME) + "' and trashed=false");
    if (existing) { conn.folderId = existing.id; saveConn(conn); return conn.folderId; }

    const resp = await driveFetch(DRIVE_FILES + '?fields=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
    });
    if (!resp.ok) throw new Error('Drive folder create failed (' + resp.status + ')');
    const folder = await resp.json();
    conn.folderId = folder.id;
    saveConn(conn);
    return conn.folderId;
  }

  async function ensureFile(conn, role, name, mimeType, idKey) {
    const folderId = await ensureFolder(conn);
    if (conn[idKey]) {
      const resp = await driveFetch(DRIVE_FILES + '/' + conn[idKey] + '?fields=id,trashed', { method: 'GET' });
      if (resp.ok) { const f = await resp.json(); if (!f.trashed) return conn[idKey]; }
    }
    const existing = await findFile(
      "name='" + driveQ(name) + "' and '" + driveQ(folderId) + "' in parents and trashed=false");
    if (existing) { conn[idKey] = existing.id; saveConn(conn); return conn[idKey]; }

    // Create empty file with an appProperties role tag for reliable re-discovery.
    const resp = await driveFetch(DRIVE_FILES + '?fields=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, mimeType: mimeType, parents: [folderId], appProperties: { entotoolsRole: role } }),
    });
    if (!resp.ok) throw new Error('Drive file create failed (' + resp.status + ')');
    const file = await resp.json();
    conn[idKey] = file.id;
    saveConn(conn);
    return conn[idKey];
  }

  async function uploadMedia(fileId, content, mimeType) {
    const resp = await driveFetch(
      DRIVE_UPLOAD + '/' + fileId + '?uploadType=media&fields=id,modifiedTime,headRevisionId',
      { method: 'PATCH', headers: { 'Content-Type': mimeType }, body: content });
    if (!resp.ok) throw new Error('Drive upload failed (' + resp.status + ')');
    return resp.json();
  }

  async function downloadText(fileId) {
    const resp = await driveFetch(DRIVE_FILES + '/' + fileId + '?alt=media', { method: 'GET' });
    if (resp.status === 404) return null;
    if (!resp.ok) throw new Error('Drive download failed (' + resp.status + ')');
    return resp.text();
  }

  // ── StorageProvider interface ──────────────────────────────────
  const provider = {
    id: 'gdrive',
    label: 'Google Drive',

    isConfigured: isConfigured,
    isConnected: function () { return !!loadConn().connected; },
    hasToken: function () { return hasValidToken(); },
    setInteractive: function (v) { allowInteractive = !!v; },

    async connect() {
      allowInteractive = true;
      try {
        await waitForGis(8000);
        await requestToken('consent');
        const conn = loadConn();
        conn.connected = true;
        saveConn(conn);
        await ensureFolder(conn);
        return true;
      } finally {
        allowInteractive = false;
      }
    },

    // Resume only from a cached session token. Never triggers Google's auth UI on
    // page load — that requires an explicit user gesture (Connect / Sync now).
    async silentConnect() {
      const conn = loadConn();
      if (!conn.connected) return false;
      if (!isConfigured()) return false;
      return hasValidToken();
    },

    disconnect() {
      try {
        if (accessToken && gisReady()) global.google.accounts.oauth2.revoke(accessToken, function () {});
      } catch (e) { /* ignore */ }
      clearToken();
      clearConn();
    },

    // Returns { json: envelope|null, meta } — null json means no remote data yet.
    async pull() {
      const conn = loadConn();
      const jsonId = await ensureFile(conn, 'db-json', JSON_NAME, 'application/json', 'jsonFileId');
      const text = await downloadText(jsonId);
      if (!text || !text.trim()) return { json: null, meta: { fileId: jsonId } };
      let parsed = null;
      try { parsed = JSON.parse(text); }
      catch (e) { console.warn('[GDrive] remote JSON parse failed — treating as empty:', e.message); }
      return { json: parsed, meta: { fileId: jsonId } };
    },

    // Uploads JSON (canonical) + CSV (mirror). snapshot is a store envelope.
    async push(snapshot) {
      const conn = loadConn();
      const jsonId = await ensureFile(conn, 'db-json', JSON_NAME, 'application/json', 'jsonFileId');
      const csvId = await ensureFile(conn, 'db-csv', CSV_NAME, 'text/csv', 'csvFileId');
      const jsonStr = JSON.stringify(snapshot);
      const csvStr = (global.EntoCsv ? global.EntoCsv.buildCsv(snapshot.entries || []) : '');
      const jsonMeta = await uploadMedia(jsonId, jsonStr, 'application/json');
      await uploadMedia(csvId, csvStr, 'text/csv');
      conn.lastSynced = new Date().toISOString();
      saveConn(conn);
      return { modifiedTime: jsonMeta.modifiedTime, revision: jsonMeta.headRevisionId };
    },

    lastSynced() { return loadConn().lastSynced || null; },
  };

  global.EntoDriveProvider = provider;
})(window);
