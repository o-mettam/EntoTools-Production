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

  // Stable, key-order-independent serialization of an entry's content. Entries
  // rebuilt from CSV or a remote snapshot can carry the same fields in a
  // different order; a plain JSON.stringify would then report a false change.
  function stableStringify(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
    if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(v).sort()
      .map((k) => JSON.stringify(k) + ':' + stableStringify(v[k]))
      .join(',') + '}';
  }

  function contentHash(entry) {
    const { id, createdAt, updatedAt, deleted, ...rest } = entry;
    try { return stableStringify(rest); } catch (e) { return String(Math.random()); }
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
  // A legacy key is only removed once its records are safely written into the V2
  // envelope. An unparseable or empty legacy value is left untouched so the next
  // (older) key still gets a chance to supply the data.
  function migrateLegacy() {
    for (const k of LEGACY_DATA_KEYS) {
      let raw = null;
      try { raw = localStorage.getItem(k); } catch (e) { continue; }
      if (!raw) continue;
      let arr = null;
      try { arr = JSON.parse(raw); }
      catch (e) {
        console.warn('[EntoStore] legacy migration skipped for "' + k + '" (unparseable, left in place):', e);
        continue;
      }
      if (!Array.isArray(arr) || arr.length === 0) {
        console.log('[EntoStore] legacy key "' + k + '" holds no records — skipping');
        continue;
      }
      const env = emptyEnvelope();
      env.entries = arr.map(normalizeEntry);
      env.revision = 1;
      env.updatedAt = nowIso();
      writeEnvelope(env);
      if (!readRaw()) {
        console.warn('[EntoStore] legacy migration could not be persisted for "' + k + '" — leaving it in place');
        continue;
      }
      console.log('[EntoStore] migrated', arr.length, 'entries from legacy key "' + k + '"');
      try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
      break; // stop after the first legacy source that produced an envelope
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

  // Per-entry last-write-wins merge (newest updatedAt wins).
  //
  // NOTE: this remains a last-write-wins strategy — two devices that edit the
  // same entry at genuinely different times will keep only the later edit. The
  // tie-break below only guarantees that, given identical timestamps, every
  // device converges on the SAME winner (no split-brain). Conflict-free merging
  // of concurrent edits would require a CRDT/vector-clock redesign.
  function mergeEnvelopes(localEnv, remoteEnv) {
    const byId = new Map();
    const consider = (e) => {
      if (!e || !e.id) return;
      const cur = byId.get(e.id);
      if (!cur) { byId.set(e.id, e); return; }
      const te = ts(e.updatedAt), tc = ts(cur.updatedAt);
      if (te > tc) { byId.set(e.id, e); return; }
      if (te === tc) {
        // Deterministic tie-break so all devices converge identically:
        // 1) a surviving edit beats a concurrent deletion;
        // 2) otherwise pick a stable winner by content comparison.
        if (cur.deleted && !e.deleted) { byId.set(e.id, e); return; }
        if (cur.deleted === e.deleted && contentHash(e) > contentHash(cur)) byId.set(e.id, e);
      }
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

  // Guard against CSV formula injection: prefix cells starting with =, +, -, @,
  // or a control char with a single quote so spreadsheet apps (Excel/Sheets)
  // treat them as text rather than executable formulas.
  function csvSafe(v) { const s = String(v == null ? '' : v); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; }
  function csvCell(v) { return '"' + csvSafe(v).replace(/"/g, '""') + '"'; }
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

  // ── Sync orchestration (multi-provider) ────────────────────────
  // A provider implements: id, isConfigured(), isConnected(), connect(),
  // silentConnect(), disconnect(), pull(), push(snapshot), lastSynced().
  //
  // Several providers can be registered at once (the EntoTools account
  // provider and Google Drive both, for a flagged user). A full sync pulls
  // from every connected provider, folds each remote copy into the local
  // store with the same last-write-wins merge, then pushes the single merged
  // result back to every provider — so all backends converge on one dataset.
  // Every event carries `provider: <id>` so per-backend UI can filter.
  //
  // Every public function takes an optional provider id; omitting it means
  // "all registered providers" (or, for connect(), the only one registered).
  const _providers = new Map(); // id -> provider, in registration order
  let _syncing = false;
  let _pushTimer = null;

  function addProvider(p) {
    if (!p || !p.id) throw new Error('A sync provider needs an id.');
    _providers.set(p.id, p); // idempotent — re-registering replaces by id
  }
  // Back-compat alias: earlier callers "set" a single provider; that now just
  // registers it alongside any others rather than replacing them (#35/#37 —
  // the Drive UI used to silently unregister account sync this way).
  function setProvider(p) { addProvider(p); }
  function removeProvider(id) { _providers.delete(id); }
  function getProvider(id) { return _providers.get(id) || null; }
  function providersFor(id) {
    if (id == null) return Array.from(_providers.values());
    const p = _providers.get(id);
    return p ? [p] : [];
  }

  function hasProvider(id) { return providersFor(id).length > 0; }
  function isConnected(id) { return providersFor(id).some((p) => p.isConnected()); }
  function isConfigured(id) { return providersFor(id).some((p) => p.isConfigured()); }
  // Most recent sync time across the selected providers.
  function lastSynced(id) {
    let best = null;
    for (const p of providersFor(id)) {
      const t = p.lastSynced ? p.lastSynced() : null;
      if (t && (!best || ts(t) > ts(best))) best = t;
    }
    return best;
  }

  // interactive=true means the call came from a user gesture (Connect / Sync now)
  // and is allowed to trigger a provider's auth UI. Background syncs (load,
  // auto-push) pass false and silently defer any provider without a valid token.
  async function fullSync(interactive, id) {
    if (_providers.size === 0) throw new Error('No sync provider configured.');
    if (_syncing) return;
    const targets = providersFor(id).filter((p) => {
      if (!p.isConnected()) return false;
      if (!interactive && p.hasToken && !p.hasToken()) { notify({ type: 'sync-deferred', provider: p.id }); return false; }
      return true;
    });
    if (targets.length === 0) return;

    _syncing = true;
    const pulled = [];   // providers whose pull succeeded — only these get the push
    const failures = []; // { provider, error }
    try {
      for (const p of targets) if (p.setInteractive) p.setInteractive(!!interactive);

      // Phase 1: pull from every target and fold it into one merged envelope.
      let merged = getEnvelope();
      let hadRemote = false;
      for (const p of targets) {
        notify({ type: 'sync-start', provider: p.id });
        try {
          const remote = await p.pull(); // { json, meta }
          if (remote && remote.json && Array.isArray(remote.json.entries)) {
            merged = mergeEnvelopes(merged, remote.json);
            hadRemote = true;
          }
          pulled.push(p);
        } catch (e) {
          failures.push({ provider: p, error: e });
        }
      }
      if (hadRemote) replaceEnvelope(merged);

      // Phase 2: push the single merged result to every provider that pulled.
      for (const p of pulled) {
        try {
          await p.push(merged);
          notify({ type: 'sync-success', provider: p.id, at: p.lastSynced ? p.lastSynced() : null });
        } catch (e) {
          failures.push({ provider: p, error: e });
        }
      }

      for (const f of failures) {
        if (f.error && f.error.code === 'TOKEN_UNAVAILABLE') { notify({ type: 'sync-deferred', provider: f.provider.id }); continue; }
        console.error('[EntoSync] sync failed (' + f.provider.id + '):', f.error);
        notify({ type: 'sync-error', provider: f.provider.id, error: f.error && f.error.message });
      }
      const hard = failures.find((f) => !(f.error && f.error.code === 'TOKEN_UNAVAILABLE'));
      if (hard) throw hard.error;
      return merged;
    } finally {
      _syncing = false;
      for (const p of targets) if (p.setInteractive) p.setInteractive(false);
    }
  }

  // Interactive connect for one provider (the id is required once more than
  // one is registered — connecting is inherently a per-backend user action).
  async function connect(id) {
    const list = providersFor(id);
    if (list.length === 0) throw new Error('No sync provider configured.');
    if (list.length > 1) throw new Error('connect() needs a provider id when several are registered.');
    const p = list[0];
    await p.connect();
    notify({ type: 'connected', provider: p.id });
    return fullSync(true, p.id);
  }

  // Silent resume for the selected providers (no auth UI), then one combined
  // background sync across everything that is connected. Resolves true if at
  // least one of the selected providers resumed.
  async function tryResume(id) {
    let any = false;
    for (const p of providersFor(id)) {
      let ok = false;
      try { ok = await p.silentConnect(); } catch (e) { ok = false; }
      if (ok) { any = true; notify({ type: 'connected', provider: p.id }); }
    }
    if (any) fullSync(false).catch(() => {});
    return any;
  }

  function disconnect(id) {
    for (const p of providersFor(id)) {
      try { p.disconnect(); } catch (e) { console.warn('[EntoSync] disconnect failed (' + p.id + '):', e); }
      notify({ type: 'disconnected', provider: p.id });
    }
  }

  // Debounced auto-push after local edits (only while something is connected).
  function scheduleAutoSync(delayMs) {
    if (!isConnected()) return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(() => { fullSync().catch(() => {}); }, delayMs || 4000);
  }

  const EntoSync = {
    addProvider, setProvider, removeProvider, getProvider, hasProvider,
    isConnected, isConfigured, lastSynced,
    connect, disconnect, tryResume, fullSync, scheduleAutoSync, subscribe,
  };

  // ── Expose ─────────────────────────────────────────────────────
  global.EntoStore = EntoStore;
  global.EntoCsv = EntoCsv;
  global.EntoSync = EntoSync;
})(window);
