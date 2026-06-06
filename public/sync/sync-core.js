/**
 * EntoTools — Sync Core
 *
 * Provider-agnostic local store + merge engine for the Label Collection Database.
 *
 * Exposes (on window):
 *   EntoStore  — versioned localStorage store with legacy migration + tombstones
 *   EntoCsv    — JSON <-> CSV helpers (single-sourced column layout)
 *   EntoSync   — orchestration (connect/pull/merge/push) wired to a StorageProvider
 *
 * The store envelope shape (localStorage key `entoLabelSheetV2`):
 *   { schemaVersion, deviceId, revision, updatedAt, entries: [ entry, ... ] }
 * Each entry: { id, createdAt, updatedAt, deleted, label1, label2, data }
 */
(function (global) {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────
  const SCHEMA_VERSION = 2;
  const KEY_V2 = 'entoLabelSheetV2';
  const LEGACY_DATA_KEYS = ['entoLabelSheet', 'fireflyLabelSheet']; // migration sources (newest first)
  const DEVICE_KEY = 'entoDeviceId';

  // ── Small utilities ────────────────────────────────────────────
  function uuid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') return global.crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function nowIso() { return new Date().toISOString(); }
  function ts(v) { const t = Date.parse(v); return isNaN(t) ? 0 : t; }

  // ── Pub/sub for store changes (UI status indicators) ───────────
  const listeners = new Set();
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function notify(event) { listeners.forEach((fn) => { try { fn(event); } catch (e) { /* never break */ } }); }

  // ── Device identity ────────────────────────────────────────────
  function getDeviceId() {
    let id = null;
    try { id = localStorage.getItem(DEVICE_KEY); } catch (e) { /* ignore */ }
    if (!id) { id = uuid(); try { localStorage.setItem(DEVICE_KEY, id); } catch (e) { /* ignore */ } }
    return id;
  }

  // ── Envelope helpers ───────────────────────────────────────────
  function emptyEnvelope() {
    return { schemaVersion: SCHEMA_VERSION, deviceId: getDeviceId(), revision: 0, updatedAt: nowIso(), entries: [] };
  }

  function contentHash(entry) {
    const { id, createdAt, updatedAt, deleted, ...rest } = entry;
    try { return JSON.stringify(rest); } catch (e) { return String(Math.random()); }
  }

  function normalizeEntry(e) {
    if (!e.id) e.id = uuid();
    if (!e.createdAt) e.createdAt = nowIso();
    if (!e.updatedAt) e.updatedAt = e.createdAt;
    if (typeof e.deleted !== 'boolean') e.deleted = false;
    return e;
  }

  function readRaw() {
    try { const s = localStorage.getItem(KEY_V2); return s ? JSON.parse(s) : null; }
    catch (e) { console.warn('[EntoStore] read failed:', e); return null; }
  }

  function writeEnvelope(env) {
    try { localStorage.setItem(KEY_V2, JSON.stringify(env)); }
    catch (e) { console.warn('[EntoStore] write failed:', e); }
  }

  // One-time migration from legacy plain-array keys (firefly*/ento*) to V2 envelope.
  function migrateLegacy() {
    for (const k of LEGACY_DATA_KEYS) {
      let raw = null;
      try { raw = localStorage.getItem(k); } catch (e) { continue; }
      if (!raw) continue;
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length >= 0) {
          const env = emptyEnvelope();
          env.entries = arr.map(normalizeEntry);
          env.revision = 1;
          env.updatedAt = nowIso();
          writeEnvelope(env);
          console.log('[EntoStore] migrated', arr.length, 'entries from legacy key "' + k + '"');
        }
      } catch (e) {
        console.warn('[EntoStore] legacy migration failed for "' + k + '":', e);
      }
      try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
      if (readRaw()) break; // stop after the first legacy source that produced an envelope
    }
  }

  function getEnvelope() {
    let env = readRaw();
    if (!env) { migrateLegacy(); env = readRaw(); }
    if (!env) { env = emptyEnvelope(); writeEnvelope(env); return env; }
    if (env.schemaVersion !== SCHEMA_VERSION) env.schemaVersion = SCHEMA_VERSION;
    let changed = false;
    env.entries = (env.entries || []).map((e) => {
      const complete = e.id && e.createdAt && e.updatedAt && typeof e.deleted === 'boolean';
      normalizeEntry(e);
      if (!complete) changed = true;
      return e;
    });
    if (changed) writeEnvelope(env);
    return env;
  }

  // ── Public store API ───────────────────────────────────────────

  // Active (non-tombstone) entries for the UI, in stored order.
  function load() {
    return getEnvelope().entries.filter((e) => !e.deleted);
  }

  // Full envelope including tombstones (used by sync).
  function getEnvelopeSnapshot() {
    return getEnvelope();
  }

  // Reconcile a UI-managed active list back into the envelope:
  // assigns ids, bumps updatedAt on new/changed entries, and tombstones removed ones.
  function saveActiveList(activeEntries) {
    const env = getEnvelope();
    const stored = new Map(env.entries.map((e) => [e.id, e]));
    const t = nowIso();
    const activeIds = new Set();
    const result = [];

    for (const e of activeEntries) {
      normalizeEntry(e);
      activeIds.add(e.id);
      const prev = stored.get(e.id);
      if (!prev) {
        e.createdAt = e.createdAt || t;
        e.updatedAt = t;
        e.deleted = false;
      } else if (prev.deleted || contentHash(prev) !== contentHash(e)) {
        e.createdAt = prev.createdAt || e.createdAt || t;
        e.updatedAt = t;
        e.deleted = false;
      } else {
        e.createdAt = prev.createdAt;
        e.updatedAt = prev.updatedAt;
        e.deleted = false;
      }
      result.push(e);
    }

    // Tombstone entries that disappeared from the active list.
    for (const e of env.entries) {
      if (!activeIds.has(e.id)) {
        if (!e.deleted) { e.deleted = true; e.updatedAt = t; }
        result.push(e);
      }
    }

    env.entries = result;
    env.revision = (env.revision || 0) + 1;
    env.updatedAt = t;
    env.deviceId = getDeviceId();
    writeEnvelope(env);
    notify({ type: 'local-change', revision: env.revision });
    return env;
  }

  // Replace the whole envelope (used after a remote merge).
  function replaceEnvelope(env) {
    if (!env || !Array.isArray(env.entries)) return;
    env.schemaVersion = SCHEMA_VERSION;
    env.entries = env.entries.map(normalizeEntry);
    writeEnvelope(env);
    notify({ type: 'replaced', revision: env.revision });
  }

  // Per-entry last-write-wins merge (tombstones win when newest).
  function mergeEnvelopes(localEnv, remoteEnv) {
    const byId = new Map();
    const consider = (e) => {
      if (!e || !e.id) return;
      const cur = byId.get(e.id);
      if (!cur || ts(e.updatedAt) > ts(cur.updatedAt)) byId.set(e.id, e);
    };
    ((localEnv && localEnv.entries) || []).forEach(consider);
    ((remoteEnv && remoteEnv.entries) || []).forEach(consider);
    return {
      schemaVersion: SCHEMA_VERSION,
      deviceId: getDeviceId(),
      revision: Math.max((localEnv && localEnv.revision) || 0, (remoteEnv && remoteEnv.revision) || 0) + 1,
      updatedAt: nowIso(),
      entries: Array.from(byId.values()),
    };
  }

  const EntoStore = {
    SCHEMA_VERSION,
    KEY_V2,
    load,
    saveActiveList,
    getEnvelopeSnapshot,
    replaceEnvelope,
    mergeEnvelopes,
    getDeviceId,
    subscribe,
    uuid,
    nowIso,
  };

  // ── CSV helpers (single source of the column layout) ───────────
  const CSV_HEADERS = [
    'Specimen ID', 'Specimen Identification', 'Number of Specimens',
    'Site Name', 'Location', 'Country', 'Latitude', 'Longitude', 'Coordinates Estimated', 'Elevation (m)',
    'Date Start', 'Date End', 'Sunset', 'Time of Collection',
    'Collector', 'Determiner',
    'High Temp (F)', 'Low Temp (F)', 'Avg Temp (F)', 'Temp at Collection (F)', 'mGDD',
    'Humidity (%)', 'Rainfall Last 7 Days (in)', 'Rainfall Last 30 Days (in)',
    'Weather Station', 'Station ID', 'Station Distance (mi)', 'Data Provider',
    'mGDD Base Temp (F)', 'mGDD Max Temp (F)', 'mGDD Accum Start Date',
    'Collection Method', 'Notes',
  ];

  function csvTime12(t) {
    if (!t) return '';
    const parts = String(t).split(':').map(Number);
    const h = parts[0], m = parts[1];
    if (isNaN(h) || isNaN(m)) return '';
    const suffix = h >= 12 ? 'PM' : 'AM';
    return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + ' ' + suffix;
  }
  function csvTimeRange(d) {
    if (d.timeStart && d.timeEnd) return csvTime12(d.timeStart) + ' – ' + csvTime12(d.timeEnd);
    if (d.timeStart) return csvTime12(d.timeStart);
    if (d.timeOfCollection && d.timeOfCollection.includes(' - ')) {
      const p = d.timeOfCollection.split(' - ');
      return csvTime12(p[0].trim()) + ' – ' + csvTime12(p[1].trim());
    }
    return d.timeOfCollection ? csvTime12(d.timeOfCollection) : '';
  }

  function rowFromData(d) {
    return [
      d.specimenId, d.identification, d.numSpecimens,
      d.siteName, d.location, d.country || d.countryCode || '', d.lat, d.lon, d.inputMode !== 'latlon' ? 'Yes' : 'No', d.elevation,
      d.dateStart, d.dateEnd, d.sunset || '', csvTimeRange(d),
      d.collector, d.identifier,
      d.highTemp, d.lowTemp, d.avgTemp, d.tempAtTime != null ? d.tempAtTime : '', d.isRange ? d.gddStart + ' - ' + d.gddEnd : d.gddStart,
      (d.humidity && (d.humidity.atTime || d.humidity.avg)) || '', d.rainfallWeek, d.rainfallMonth,
      d.stationName, d.stationId, d.stationDist, d.provider || '',
      d.baseTemp, d.maxTemp, d.accumStartMD,
      d.collectionMethod || '', d.userNotes || '',
    ];
  }

  function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
  function csvLine(vals) { return vals.map(csvCell).join(','); }

  // Build a CSV string from active entries (or full entry list, tombstones skipped).
  function buildCsv(entries) {
    let csv = csvLine(CSV_HEADERS) + '\n';
    for (const item of entries) {
      if (item.deleted) continue;
      const d = item.data;
      if (d) csv += csvLine(rowFromData(d)) + '\n';
    }
    return '\uFEFF' + csv;
  }

  const EntoCsv = { headers: CSV_HEADERS, rowFromData, buildCsv };

  // ── Sync orchestration (provider-agnostic) ─────────────────────
  // A provider implements: isConfigured(), isConnected(), connect(),
  // silentConnect(), disconnect(), pull(), push(snapshot), lastSynced().
  let _provider = null;
  let _syncing = false;
  let _pushTimer = null;

  function setProvider(p) { _provider = p; }
  function hasProvider() { return !!_provider; }
  function isConnected() { return !!_provider && _provider.isConnected(); }
  function isConfigured() { return !!_provider && _provider.isConfigured(); }
  function lastSynced() { return _provider && _provider.lastSynced ? _provider.lastSynced() : null; }

  // interactive=true means the call came from a user gesture (Connect / Sync now)
  // and is allowed to trigger the provider's auth UI. Background syncs (load,
  // auto-push) pass false and silently defer if no valid token is held.
  async function fullSync(interactive) {
    if (!_provider) throw new Error('No sync provider configured.');
    if (_syncing) return;
    if (!interactive && _provider.hasToken && !_provider.hasToken()) {
      notify({ type: 'sync-deferred' });
      return;
    }
    if (_provider.setInteractive) _provider.setInteractive(!!interactive);
    _syncing = true;
    notify({ type: 'sync-start' });
    try {
      const remote = await _provider.pull();          // { json, meta }
      const localEnv = getEnvelope();
      let merged;
      if (remote && remote.json && Array.isArray(remote.json.entries)) {
        merged = mergeEnvelopes(localEnv, remote.json);
        replaceEnvelope(merged);
      } else {
        merged = localEnv;
      }
      await _provider.push(merged);
      notify({ type: 'sync-success', at: lastSynced() });
      return merged;
    } catch (e) {
      if (e && e.code === 'TOKEN_UNAVAILABLE') { notify({ type: 'sync-deferred' }); return; }
      console.error('[EntoSync] sync failed:', e);
      notify({ type: 'sync-error', error: e.message });
      throw e;
    } finally {
      _syncing = false;
      if (_provider.setInteractive) _provider.setInteractive(false);
    }
  }

  async function connect() {
    if (!_provider) throw new Error('No sync provider configured.');
    await _provider.connect();
    notify({ type: 'connected' });
    return fullSync(true);
  }

  async function tryResume() {
    if (!_provider) return false;
    let ok = false;
    try { ok = await _provider.silentConnect(); } catch (e) { ok = false; }
    if (ok) { notify({ type: 'connected' }); fullSync().catch(() => {}); }
    return ok;
  }

  function disconnect() {
    if (_provider) _provider.disconnect();
    notify({ type: 'disconnected' });
  }

  // Debounced auto-push after local edits (only while connected).
  function scheduleAutoSync(delayMs) {
    if (!isConnected()) return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(() => { fullSync().catch(() => {}); }, delayMs || 4000);
  }

  const EntoSync = {
    setProvider, hasProvider, isConnected, isConfigured, lastSynced,
    connect, disconnect, tryResume, fullSync, scheduleAutoSync, subscribe,
  };

  // ── Expose ─────────────────────────────────────────────────────
  global.EntoStore = EntoStore;
  global.EntoCsv = EntoCsv;
  global.EntoSync = EntoSync;
})(window);
