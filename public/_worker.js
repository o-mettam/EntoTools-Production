/**
 * EntoTools Dashboard — Cloudflare Pages Worker (_worker.js)
 *
 * KV bindings required:
 *   GEOCODE_CACHE  – runtime cache for Nominatim geocode responses
 *
 * Station data loaded from public/stations.json via env.ASSETS
 * Static assets served by Cloudflare Pages from public/
 */

const NCEI_BASE_URL = 'https://www.ncei.noaa.gov/access/services/data/v1';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const OPEN_METEO_ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const USER_AGENT = 'EntoTools/1.0 (educational-project)';

const NCEI_MAX_RETRIES = 3;
const OPEN_METEO_MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

// ── Request limits (abuse / DoS protection) ──────────────────────
const MAX_DATE_RANGES = 10;          // max number of date ranges per request
const MAX_RANGE_DAYS = 366 * 5;      // max span of a single range (~5 years)
const MAX_TOTAL_DAYS = 366 * 10;     // max combined span across all ranges (~10 years)
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ── CORS / abuse protection ──────────────────────────────────────
// Browser submissions to state-changing endpoints (feedback) must come from
// one of these origins. NOTE: the Origin header is trivially spoofable by
// non-browser clients (curl, scripts), so this check is NOT an authentication
// boundary — it only stops opportunistic cross-site browser abuse. The real
// protection against automated abuse is the per-IP rate limiting below.
const ALLOWED_ORIGINS = new Set([
  'https://entotools.com',
  'https://www.entotools.com',
  // Second custom domain on the same Pages deployment (see issue #33) — also
  // live and publicly reachable, so it needs the same allowance as .com.
  'https://entotools.org',
  'https://www.entotools.org',
  // Cloudflare Pages' default *.pages.dev domain stays live and publicly
  // reachable alongside the custom domain — visitors landing there (bookmarks,
  // shared links, before DNS propagates) were getting 403'd on feedback.
  'https://entotools-production.pages.dev',
]);
// The wrangler dev origin is only honoured when the worker itself is being
// served from localhost, so it can never widen the allowlist in production.
const DEV_ORIGIN = 'http://localhost:8788';

// Resolve the effective set of allowed origins for the given request. Adds the
// dev origin only when the request is actually hitting a local host.
function allowedOriginsFor(requestUrl) {
  const host = requestUrl.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
    return new Set([...ALLOWED_ORIGINS, DEV_ORIGIN]);
  }
  return ALLOWED_ORIGINS;
}
const FEEDBACK_RATE_LIMIT = 5;              // max submissions per window per IP
const FEEDBACK_RATE_WINDOW_SECONDS = 3600; // 1 hour
const SEARCH_RATE_LIMIT = 60;              // max searches per window per IP
const SEARCH_RATE_WINDOW_SECONDS = 3600;   // 1 hour
const STATUS_RATE_LIMIT = 120;             // max status probes per window per IP
const STATUS_RATE_WINDOW_SECONDS = 3600;   // 1 hour

// ── Country → data-provider mapping ──────────────────────────────
// Each key is a 2-letter ISO country code (lowercase).
// Value is the provider key used in DATA_PROVIDERS below.
const COUNTRY_PROVIDER_MAP = {
  'us': 'ncei',
  // Add country-specific providers here, e.g.:
  // 'ca': 'eccc',
  // 'gb': 'met-office',
};
const DEFAULT_PROVIDER = 'open-meteo';

function getProviderForCountry(countryCode) {
  if (!countryCode) return DEFAULT_PROVIDER;
  return COUNTRY_PROVIDER_MAP[countryCode.toLowerCase()] || DEFAULT_PROVIDER;
}

// ── In-memory cache (persists across requests on same isolate) ─────
let _stationsCache = null;

// ── Utility helpers ────────────────────────────────────────────────

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversine(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(a)); // miles
}

/** Case-insensitive field access for NCEI JSON records. */
function _get(record, key) {
  let val = record[key];
  if (val !== undefined && val !== null) return val;
  val = record[key.toLowerCase()];
  if (val !== undefined && val !== null) return val;
  return record[key.toUpperCase()] ?? null;
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// ── Geocoding (Nominatim + KV cache) ──────────────────────────────

async function nominatimGet(params, env) {
  const cacheKey = JSON.stringify(Object.entries(params).sort());
  // Never log the params themselves — they carry the user's searched location.
  console.log('[Worker:nominatimGet] lookup (' + Object.keys(params).length + ' params)');

  // Check KV cache
  const cached = await env.GEOCODE_CACHE.get(cacheKey, { type: 'json' });
  if (cached) {
    console.log('[Worker:nominatimGet] KV cache HIT');
    return cached;
  }
  console.log('[Worker:nominatimGet] KV cache MISS — fetching from Nominatim');

  // Build URL
  const url = new URL(NOMINATIM_URL);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const resp = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!resp.ok) {
    console.error('[Worker:nominatimGet] Nominatim error:', resp.status);
    throw new Error(`Nominatim returned ${resp.status}`);
  }

  const data = await resp.json();
  console.log('[Worker:nominatimGet] Nominatim returned', data.length, 'results');

  // Cache for 24 hours
  await env.GEOCODE_CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: 86400,
  });

  return data;
}

async function geocodeCityState(city, state, country, env) {
  // Don't log city/state — that's the user's searched location.
  console.log('[Worker:geocodeCityState] geocoding city/state input');
  const params = { city, state, format: 'json', limit: '1', addressdetails: '1' };
  if (country) params.country = country;
  const data = await nominatimGet(
    params,
    env,
  );
  if (data && data.length) {
    const cc = (data[0].address && data[0].address.country_code) || null;
    const result = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      label: data[0].display_name || '',
      country_code: cc ? cc.toLowerCase() : null,
    };
    // Log only the resolved country — never the coordinates or display label.
    console.log('[Worker:geocodeCityState] resolved (country:', result.country_code, ')');
    return result;
  }
  console.warn('[Worker:geocodeCityState] no results for the requested city/state');
  return null;
}

async function reverseGeocode(lat, lon, env) {
  // Don't log the coordinates — they are the user's searched location.
  console.log('[Worker:reverseGeocode] reverse-geocoding coordinates');
  const cacheKey = JSON.stringify(['reverse', lat, lon]);
  const cached = await env.GEOCODE_CACHE.get(cacheKey, { type: 'json' });
  if (cached) {
    console.log('[Worker:reverseGeocode] KV cache HIT — country:', cached.country_code);
    return cached;
  }

  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  const resp = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!resp.ok) {
    console.error('[Worker:reverseGeocode] Nominatim reverse error:', resp.status);
    return { country_code: null };
  }

  const data = await resp.json();
  const cc = (data.address && data.address.country_code) || null;
  const result = { country_code: cc ? cc.toLowerCase() : null };
  console.log('[Worker:reverseGeocode] resolved country:', result.country_code);

  await env.GEOCODE_CACHE.put(cacheKey, JSON.stringify(result), {
    expirationTtl: 86400,
  });
  return result;
}

// ── NCEI fetch with retry ─────────────────────────────────────────

async function nceiFetch(url) {
  console.log('[Worker:nceiFetch] requesting:', url.toString().slice(0, 200));
  let lastErr = null;
  for (let attempt = 0; attempt < NCEI_MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) console.log('[Worker:nceiFetch] retry attempt', attempt + 1, '/', NCEI_MAX_RETRIES);
      const resp = await fetch(url.toString(), { headers: { 'User-Agent': USER_AGENT } });
      if (RETRYABLE_STATUS_CODES.has(resp.status)) {
        if (attempt < NCEI_MAX_RETRIES - 1) {
          console.warn('[Worker:nceiFetch] NCEI returned', resp.status, '— backing off', 2 ** attempt, 's');
          await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
          continue;
        }
        console.warn('[Worker:nceiFetch] NCEI returned', resp.status, 'on final attempt — giving up');
      }
      console.log('[Worker:nceiFetch] response status:', resp.status);
      return resp;
    } catch (err) {
      lastErr = err;
      console.error('[Worker:nceiFetch] fetch error on attempt', attempt + 1, ':', err.message);
      if (attempt < NCEI_MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      }
    }
  }
  console.error('[Worker:nceiFetch] all retries exhausted');
  throw lastErr || new Error('NCEI request failed after retries');
}

// ── Station lookup ────────────────────────────────────────────────

async function getStations(env) {
  if (_stationsCache) {
    console.log('[Worker:getStations] using in-memory cache (' + _stationsCache.length + ' stations)');
    return _stationsCache;
  }
  console.log('[Worker:getStations] loading stations.json from static assets');
  const resp = await env.ASSETS.fetch(new Request('https://dummy/stations.json'));
  if (!resp.ok) throw new Error('Failed to load stations.json from static assets');
  const data = await resp.json();
  _stationsCache = data;
  console.log('[Worker:getStations] loaded', data.length, 'stations');
  return data;
}

async function findNearestStation(lat, lon, env, maxCandidates = 50) {
  console.log('[Worker:findNearestStation] searching (maxCandidates:', maxCandidates, ')');
  const stations = await getStations(env);

  // Pre-filter by bounding box, expanding progressively (2°→4°→8°→16°) so we
  // avoid an O(n) scan of the full station set unless absolutely necessary.
  const cosLat = Math.max(Math.cos(toRad(lat)), 0.1);
  let nearby = [];
  for (let margin = 2.0; margin <= 16.0; margin *= 2) {
    const latMargin = margin;
    const lonMargin = margin / cosLat;
    nearby = stations.filter(
      (s) => Math.abs(s.lat - lat) <= latMargin && Math.abs(s.lon - lon) <= lonMargin,
    );
    if (nearby.length >= maxCandidates) break;
  }
  if (nearby.length === 0) nearby = stations; // last resort: very remote location

  // Rank by distance
  const ranked = nearby
    .map((s) => ({ dist: haversine(lat, lon, s.lat, s.lon), station: s }))
    .sort((a, b) => a.dist - b.dist);

  // Prefer stations with temperature data (USW, USC, USR)
  const tempLikely = ranked.filter((r) =>
    /^(USW|USC|USR)/.test(r.station.id),
  );
  const tempUnlikely = ranked.filter(
    (r) => !/^(USW|USC|USR)/.test(r.station.id),
  );
  const candidates = [...tempLikely, ...tempUnlikely].slice(0, maxCandidates);
  const stationIds = candidates.map((c) => c.station.id).join(',');

  const now = new Date();
  const endDate = formatDate(now);
  const startDate = formatDate(addDays(now, -30));

  const url = new URL(NCEI_BASE_URL);
  url.searchParams.set('dataset', 'daily-summaries');
  url.searchParams.set('dataTypes', 'TMIN,TMAX,PRCP');
  url.searchParams.set('stations', stationIds);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('format', 'json');
  url.searchParams.set('units', 'standard');

  const resp = await nceiFetch(url);
  if (!resp.ok) return null;

  const data = await resp.json();
  if (!data || !data.length) return null;

  // Which stations have data?
  const idsWithData = new Set();
  for (const rec of data) {
    const sid = _get(rec, 'station');
    if (
      sid && (
        (_get(rec, 'TMIN') != null && _get(rec, 'TMIN') !== '') ||
        (_get(rec, 'TMAX') != null && _get(rec, 'TMAX') !== '') ||
        (_get(rec, 'PRCP') != null && _get(rec, 'PRCP') !== '')
      )
    ) {
      idsWithData.add(sid);
    }
  }

  console.log('[Worker:findNearestStation]', idsWithData.size, 'stations have data out of', candidates.length, 'candidates');
  for (const c of candidates) {
    if (idsWithData.has(c.station.id)) {
      const result = {
        station_id: c.station.id,
        station_name: c.station.name,
        station_lat: c.station.lat,
        station_lon: c.station.lon,
        distance_miles: Math.round(c.dist * 10) / 10,
      };
      console.log('[Worker:findNearestStation] best station:', result.station_id, result.station_name, '(' + result.distance_miles + ' mi)');
      return result;
    }
  }

  console.warn('[Worker:findNearestStation] no station with data found near the requested location');
  return null;
}

// ── NCEI weather data ─────────────────────────────────────────────

async function getWeatherData(stationId, startDate, endDate) {
  console.log('[Worker:getWeatherData] station:', stationId, 'range:', startDate, 'to', endDate);
  const url = new URL(NCEI_BASE_URL);
  url.searchParams.set('dataset', 'daily-summaries');
  url.searchParams.set('dataTypes', 'TMIN,TMAX,PRCP');
  url.searchParams.set('stations', stationId);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('format', 'json');
  url.searchParams.set('includeStationName', 'true');
  url.searchParams.set('includeStationLocation', 'true');
  url.searchParams.set('units', 'standard');

  const resp = await nceiFetch(url);
  if (!resp.ok) throw new Error(`NCEI returned ${resp.status}`);
  const raw = await resp.json();

  const byDate = {};
  for (const rec of raw) {
    const d = (_get(rec, 'date') || '').slice(0, 10);
    if (!d) continue;
    if (!byDate[d]) byDate[d] = { date: d, TMIN: null, TMAX: null, PRCP: null };
    const tmin = _get(rec, 'TMIN');
    const tmax = _get(rec, 'TMAX');
    const prcp = _get(rec, 'PRCP');
    if (tmin != null && tmin !== '') byDate[d].TMIN = Math.round(parseFloat(tmin) * 10) / 10;
    if (tmax != null && tmax !== '') byDate[d].TMAX = Math.round(parseFloat(tmax) * 10) / 10;
    if (prcp != null && prcp !== '') byDate[d].PRCP = Math.round(parseFloat(prcp) * 100) / 100;
  }

  // Fill in any missing dates in the requested range so no gaps appear
  const all = [];
  const cur = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  if (isNaN(cur.getTime()) || isNaN(end.getTime())) {
    throw new Error(`Unparseable date range: ${startDate} to ${endDate}`);
  }
  while (cur <= end) {
    const d = cur.toISOString().slice(0, 10);
    all.push(byDate[d] || { date: d, TMIN: null, TMAX: null, PRCP: null });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  console.log('[Worker:getWeatherData] returned', all.length, 'daily records');
  return all;
}

function calculatePrecipAccumulation(weatherData) {
  let accum = 0;
  return weatherData.map((rec) => {
    const prcp = rec.PRCP || 0;
    accum += prcp;
    return { ...rec, PRCP_ACCUM: Math.round(accum * 100) / 100 };
  });
}

// ── Retry helper for transient HTTP errors ────────────────────────

async function fetchWithRetry(url, options = {}, { maxRetries = 3, label = 'fetchWithRetry' } = {}) {
  let lastErr = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) console.log(`[Worker:${label}] retry attempt ${attempt + 1}/${maxRetries}`);
      const resp = await fetch(url.toString(), options);
      if (RETRYABLE_STATUS_CODES.has(resp.status)) {
        const delay = 2 ** attempt * 1000;
        console.warn(`[Worker:${label}] received ${resp.status} — backing off ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        // Last attempt still returned a retryable error — throw with status info
        throw new Error(`${label} returned ${resp.status} after ${maxRetries} attempts`);
      }
      return resp;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries - 1) {
        const delay = 2 ** attempt * 1000;
        console.error(`[Worker:${label}] fetch error on attempt ${attempt + 1}:`, err.message, `— retrying in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error(`[Worker:${label}] all ${maxRetries} retries exhausted`);
  throw lastErr || new Error(`${label} failed after ${maxRetries} retries`);
}

// ── Open-Meteo data provider (global fallback) ───────────────────

function celsiusToFahrenheit(c) {
  return Math.round((c * 9 / 5 + 32) * 10) / 10;
}

function mmToInches(mm) {
  return Math.round(mm / 25.4 * 100) / 100;
}

async function getWeatherDataOpenMeteo(lat, lon, startDate, endDate) {
  console.log('[Worker:getWeatherDataOpenMeteo] fetching archive for range:', startDate, 'to', endDate);
  const url = new URL(OPEN_METEO_ARCHIVE_URL);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max,precipitation_sum');
  url.searchParams.set('timezone', 'UTC');

  const resp = await fetchWithRetry(
    url.toString(),
    { headers: { 'User-Agent': USER_AGENT } },
    { maxRetries: OPEN_METEO_MAX_RETRIES, label: 'Open-Meteo Archive' },
  );
  if (!resp.ok) {
    console.error('[Worker:getWeatherDataOpenMeteo] Open-Meteo error:', resp.status);
    throw new Error(`Open-Meteo returned ${resp.status}`);
  }

  const raw = await resp.json();
  const daily = raw.daily || {};
  const dates = daily.time || [];
  const tmins = daily.temperature_2m_min || [];
  const tmaxs = daily.temperature_2m_max || [];
  const prcps = daily.precipitation_sum || [];

  const all = [];
  for (let i = 0; i < dates.length; i++) {
    all.push({
      date: dates[i],
      TMIN: tmins[i] != null ? celsiusToFahrenheit(tmins[i]) : null,
      TMAX: tmaxs[i] != null ? celsiusToFahrenheit(tmaxs[i]) : null,
      PRCP: prcps[i] != null ? mmToInches(prcps[i]) : null,
    });
  }

  // Fill in any missing dates so no gaps appear
  const byDate = {};
  for (const rec of all) byDate[rec.date] = rec;
  const filled = [];
  const cur = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  if (isNaN(cur.getTime()) || isNaN(end.getTime())) {
    throw new Error(`Unparseable date range: ${startDate} to ${endDate}`);
  }
  while (cur <= end) {
    const d = cur.toISOString().slice(0, 10);
    filled.push(byDate[d] || { date: d, TMIN: null, TMAX: null, PRCP: null });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  console.log('[Worker:getWeatherDataOpenMeteo] returned', filled.length, 'daily records');
  return filled;
}

// ── Open-Meteo Forecast API ───────────────────────────────────────

async function getForecastOpenMeteo(lat, lon) {
  console.log('[Worker:getForecastOpenMeteo] fetching forecast');
  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max,precipitation_sum');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('forecast_days', '16');
  url.searchParams.set('past_days', '5');
  url.searchParams.set('timezone', 'UTC');

  const resp = await fetchWithRetry(
    url.toString(),
    { headers: { 'User-Agent': USER_AGENT } },
    { maxRetries: OPEN_METEO_MAX_RETRIES, label: 'Open-Meteo Forecast' },
  );
  if (!resp.ok) throw new Error(`Open-Meteo Forecast returned ${resp.status}`);

  const raw = await resp.json();
  const daily = raw.daily || {};
  const dates = daily.time || [];
  const tmins = daily.temperature_2m_min || [];
  const tmaxs = daily.temperature_2m_max || [];
  const precips = daily.precipitation_sum || [];

  // Include all days (past_days + today + future); the merge logic will only
  // use entries that fall after the last actual archive data point.
  const forecast = [];
  for (let i = 0; i < dates.length; i++) {
    if (tmins[i] != null && tmaxs[i] != null) {
      forecast.push({
        date: dates[i],
        TMIN: Math.round(tmins[i] * 10) / 10,
        TMAX: Math.round(tmaxs[i] * 10) / 10,
        PRCP: precips[i] != null ? Math.round(precips[i] * 100) / 100 : 0,
        is_forecast: true,
      });
    }
  }

  console.log('[Worker:getForecastOpenMeteo] returned', forecast.length, 'forecast days');
  return forecast;
}

// ── API handler ───────────────────────────────────────────────────

async function handleSearch(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body — expected JSON.' }, 400);
  }
  const mode = body.mode;
  // Log only the request shape, not its contents — the body carries the
  // user's searched location (city/state or coordinates).
  console.log('[Worker:handleSearch] mode:', mode, '| dateRanges:', Array.isArray(body.dateRanges) ? body.dateRanges.length : (body.startDate ? 1 : 0));

  // Step 0 — Validate the requested date ranges BEFORE touching any upstream
  // service, so malformed or oversized requests never cost a geocode, a station
  // lookup or a forecast fetch.
  let dateRanges = body.dateRanges;
  if (!dateRanges || !dateRanges.length) {
    dateRanges = [{ startDate: body.startDate, endDate: body.endDate, label: 'Range 1' }];
  }
  if (!Array.isArray(dateRanges)) {
    return jsonResponse({ error: 'Invalid date ranges.' }, 400);
  }
  if (dateRanges.length > MAX_DATE_RANGES) {
    return jsonResponse({ error: `Too many date ranges (max ${MAX_DATE_RANGES}).` }, 400);
  }

  let totalDays = 0;
  for (const dr of dateRanges) {
    const label = dr.label || '';
    const sd = dr.startDate;
    const ed = dr.endDate;
    if (!sd || !ed) {
      return jsonResponse({ error: `Missing start or end date for '${label || 'a range'}'.` }, 400);
    }
    const sdDate = new Date(sd);
    const edDate = new Date(ed);
    if (isNaN(sdDate.getTime()) || isNaN(edDate.getTime())) {
      return jsonResponse({ error: `Invalid date format for '${label || 'a range'}'.` }, 400);
    }
    if (edDate < sdDate) {
      return jsonResponse({ error: `End date is before start date for '${label || 'a range'}'.` }, 400);
    }
    const spanDays = Math.floor((edDate.getTime() - sdDate.getTime()) / MS_PER_DAY) + 1;
    if (spanDays > MAX_RANGE_DAYS) {
      return jsonResponse({ error: `Date range '${label || 'a range'}' is too large (max ${MAX_RANGE_DAYS} days).` }, 400);
    }
    totalDays += spanDays;
  }
  if (totalDays > MAX_TOTAL_DAYS) {
    return jsonResponse({ error: `Combined date ranges are too large (max ${MAX_TOTAL_DAYS} days total).` }, 400);
  }

  // Step 1 — Resolve location + country_code
  let lat = null;
  let lon = null;
  let locationLabel = '';
  let countryCode = null;

  try {
    if (mode === 'city') {
      const city = (body.city || '').trim();
      const state = (body.state || '').trim();
      const country = (body.country || '').trim();
      if (!city || !state)
        return jsonResponse({ error: 'Please enter both city and state/province.' }, 400);
      const geo = await geocodeCityState(city, state, country, env);
      if (!geo) return jsonResponse({ error: 'Could not resolve that location.' }, 404);
      ({ lat, lon, label: locationLabel, country_code: countryCode } = geo);
    } else if (mode === 'latlon') {
      lat = parseFloat(body.lat);
      lon = parseFloat(body.lon);
      if (isNaN(lat) || isNaN(lon))
        return jsonResponse({ error: 'Invalid latitude / longitude values.' }, 400);
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
        return jsonResponse({ error: 'Latitude must be between -90 and 90, and longitude between -180 and 180.' }, 400);
      locationLabel = `${lat}, ${lon}`;
      // Reverse-geocode to determine country
      try {
        const rev = await reverseGeocode(lat, lon, env);
        countryCode = rev.country_code;
      } catch (e) {
        console.warn('[Worker:handleSearch] reverse geocode failed — defaulting provider:', e.message);
      }
    } else {
      return jsonResponse({ error: 'Invalid search mode.' }, 400);
    }
  } catch (err) {
    console.error('[Worker:handleSearch] geocoding failed:', err.message);
    return jsonResponse({ error: 'Could not resolve that location. Please try again.' }, 500);
  }

  let provider = getProviderForCountry(countryCode);
  const isFallback = !!countryCode && !COUNTRY_PROVIDER_MAP[countryCode.toLowerCase()];
  let providerFallback = false;   // true if the primary provider failed and we fell back to Open-Meteo
  let fallbackReason = '';        // human-readable reason for the fallback
  // Log only non-identifying routing info — never the coordinates or label.
  console.log('[Worker:handleSearch] geocoded — country:', countryCode, 'provider:', provider, 'fallback:', isFallback);

  // Step 2 — Resolve data source (station for NCEI, grid point for Open-Meteo)
  let station;
  const makeOpenMeteoStation = () => ({
    station_id: `OM:${lat.toFixed(4)},${lon.toFixed(4)}`,
    station_name: 'Open-Meteo Grid Point',
    station_lat: lat,
    station_lon: lon,
    distance_miles: 0,
  });

  if (provider === 'ncei') {
    try {
      station = await findNearestStation(lat, lon, env);
    } catch (err) {
      console.error('[Worker:handleSearch] NCEI station lookup FAILED:', err.message);
      console.warn('[Worker:handleSearch] falling back to Open-Meteo due to station lookup failure');
      provider = 'open-meteo';
      providerFallback = true;
      fallbackReason = `NCEI station lookup failed (${err.message}). Using Open-Meteo as a fallback data source.`;
      station = makeOpenMeteoStation();
    }
    if (!station) {
      console.warn('[Worker:handleSearch] no NCEI station found with recent data — falling back to Open-Meteo');
      provider = 'open-meteo';
      providerFallback = true;
      fallbackReason = 'No NCEI weather stations with recent data were found near this location. Using Open-Meteo as a fallback data source.';
      station = makeOpenMeteoStation();
    }
  } else {
    // Open-Meteo (and future grid-based providers) use lat/lon directly
    station = makeOpenMeteoStation();
  }

  // For grid providers the station_id embeds the user's coordinates, so only
  // log a concrete station id for NCEI (public weather-station identifiers).
  const loggedStationId = provider === 'ncei' ? station.station_id : '(grid point)';
  console.log('[Worker:handleSearch] resolved station:', loggedStationId, station.station_name, '| provider:', provider, '| providerFallback:', providerFallback);

  // Step 3 — Fetch data per date range (already validated in step 0)
  console.log('[Worker:handleSearch] using', provider, '| station:', loggedStationId, '— fetching', dateRanges.length, 'date range(s)');

  // Fetch Open-Meteo forecast once (used for all ranges, regardless of provider)
  let forecastDays = [];
  let forecastUnavailable = false;
  try {
    forecastDays = await getForecastOpenMeteo(lat, lon);
    console.log('[Worker:handleSearch] Open-Meteo forecast fetched:', forecastDays.length, 'days');
  } catch (e) {
    console.warn('[Worker:handleSearch] forecast fetch failed — forecast will be skipped:', e.message);
    forecastUnavailable = true;
  }
  const today = formatDate(new Date());
  // The forecast horizon (today .. today+15) is anchored to the current date, not
  // to any range's requested end date — so a range whose end reaches today (e.g.
  // the common "End = today" case) still gets the full 16-day forecast appended
  // past it, per the documented behavior.
  const forecastHorizonEnd = forecastDays.length
    ? forecastDays.reduce((max, f) => (f.date > max ? f.date : max), forecastDays[0].date)
    : today;

  // Fetch all date ranges in parallel
  let resultsByRange;
  let serviceErrors = [];  // Track which services had issues
  try {
    resultsByRange = await Promise.all(
      dateRanges.map(async (dr) => {
        const label = dr.label || '';
        const sd = dr.startDate;
        const ed = dr.endDate;

        let temps;
        if (provider === 'ncei') {
          try {
            temps = await getWeatherData(station.station_id, sd, ed);
            console.log('[Worker:handleSearch] NCEI data fetched for range "' + label + '":', temps.length, 'records');
          } catch (nceiErr) {
            console.error('[Worker:handleSearch] NCEI data fetch FAILED for range "' + label + '":', nceiErr.message);
            console.warn('[Worker:handleSearch] falling back to Open-Meteo for range "' + label + '"');
            try {
              temps = await getWeatherDataOpenMeteo(lat, lon, sd, ed);
              console.log('[Worker:handleSearch] Open-Meteo fallback data fetched for range "' + label + '":', temps.length, 'records');
            } catch (omErr) {
              console.error('[Worker:handleSearch] Open-Meteo fallback ALSO failed for range "' + label + '":', omErr.message);
              serviceErrors.push({ service: 'Open-Meteo', error: omErr.message });
              throw new Error(`Both NCEI and Open-Meteo are unavailable: ${nceiErr.message} / ${omErr.message}`);
            }
            if (!providerFallback) {
              providerFallback = true;
              fallbackReason = `NCEI data request failed (${nceiErr.message}). Some or all date ranges used Open-Meteo as a fallback data source.`;
            }
          }
        } else {
          try {
            temps = await getWeatherDataOpenMeteo(lat, lon, sd, ed);
            console.log('[Worker:handleSearch] Open-Meteo data fetched for range "' + label + '":', temps.length, 'records');
          } catch (omErr) {
            console.error('[Worker:handleSearch] Open-Meteo FAILED for range "' + label + '":', omErr.message);
            serviceErrors.push({ service: 'Open-Meteo', error: omErr.message });
            throw omErr;
          }
        }

        // Append forecast days that fall after the last actual data point.
        // Find the last date that has real temperature data (not null-filled
        // placeholders). If the range contains no observations at all (e.g. a
        // wholly future range), every day in it is eligible for forecast data.
        let lastActualDate = null;
        for (let i = temps.length - 1; i >= 0; i--) {
          if (temps[i].TMIN != null && temps[i].TMAX != null) {
            lastActualDate = temps[i].date;
            break;
          }
        }
        // Only extend past the range's requested end date when that end date
        // reaches today — a wholly historical range (ed < today) has no
        // business pulling in the current 16-day forecast window.
        const forecastCutoff = ed >= today ? forecastHorizonEnd : ed;
        const forecast = forecastDays.filter(f =>
          f.date <= forecastCutoff && (lastActualDate === null ? f.date >= sd : f.date > lastActualDate));
        console.log('[Worker:handleSearch] appending', forecast.length, 'forecast days after', lastActualDate || '(no observations)', 'to range "' + label + '"');

        // Replace null-filled placeholders within the requested range with
        // forecast data, then append any remaining forecast days that fall
        // after `ed` (the 16-day horizon extending past the range's end).
        const forecastByDate = {};
        for (const f of forecast) forecastByDate[f.date] = f;
        const tempDates = new Set(temps.map(t => t.date));
        const merged = temps.map(t => forecastByDate[t.date] || t);
        const extraForecastDays = forecast
          .filter(f => !tempDates.has(f.date))
          .sort((a, b) => a.date.localeCompare(b.date));
        const combined = merged.concat(extraForecastDays);
        const tempsWithAccum = calculatePrecipAccumulation(combined);
        const effectiveEnd = combined.length ? combined[combined.length - 1].date : ed;

        return { label, startDate: sd, endDate: effectiveEnd, temperatures: tempsWithAccum };
      }),
    );
  } catch (err) {
    console.error('[Worker:handleSearch] data fetch failed entirely:', err.message, err.stack);
    // Provide service-specific error messaging
    const isTransient = /502|503|504|after \d+ attempts/.test(err.message);
    const serviceName = serviceErrors.length ? serviceErrors[0].service : 'the weather data provider';
    const userMessage = isTransient
      ? `${serviceName} is currently experiencing an outage and is not responding. Please try again in a few minutes.`
      : 'Failed to retrieve weather data. Please try again later.';
    return jsonResponse({
      error: userMessage,
      service_error: {
        transient: isTransient,
        service: serviceName,
      },
    }, 503);
  }

  if (providerFallback) {
    console.warn('[Worker:handleSearch] PROVIDER FALLBACK active — reason:', fallbackReason);
  }

  console.log('[Worker:handleSearch] returning', resultsByRange.length, 'range(s) of data | provider:', provider, '| fallback:', isFallback, '| providerFallback:', providerFallback);
  return jsonResponse({
    location: locationLabel,
    search_lat: lat,
    search_lon: lon,
    country_code: countryCode,
    provider,
    is_fallback: isFallback,
    provider_fallback: providerFallback,
    fallback_reason: fallbackReason,
    forecast_unavailable: forecastUnavailable,
    station,
    ranges: resultsByRange,
  });
}

// ── Feedback → GitHub Issue ────────────────────────────────────────

const GITHUB_REPO_OWNER = 'o-mettam';
const GITHUB_REPO_NAME = 'EntoTools-Production';

const FEEDBACK_TYPE_LABELS = {
  bug: 'bug',
  feature: 'enhancement',
  other: 'feedback',
};

// Mask an IP before logging (privacy): keep enough to spot patterns in the
// logs, drop enough that a single user can't be identified from them.
// IPv4 → first three octets (1.2.3.x); IPv6 → first two hextets (a:b::…).
function maskIp(ip) {
  if (!ip) return '(unknown)';
  if (ip.includes(':')) return ip.split(':').slice(0, 2).join(':') + '::…';
  return ip.split('.').slice(0, 3).join('.') + '.x';
}

// Hash an IP so it never appears in cleartext in a KV key. SHA-256 → first 16
// hex chars is ample to avoid collisions within a single time bucket while
// keeping no reversible record of the caller's address.
async function hashIp(ip) {
  try {
    const data = new TextEncoder().encode(ip);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest).slice(0, 8))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    // Fallback (crypto unavailable): still avoid storing the raw IP verbatim.
    return 'nohash';
  }
}

// Per-IP rate limit backed by KV (GEOCODE_CACHE). Returns true if the caller
// has exceeded the allowed number of requests in the current window.
// The read-modify-write is not atomic, so concurrent requests from one IP can
// undercount; the window is bucketed by wall-clock so a caller can never be
// locked out for longer than one window. The IP is hashed into the key so no
// cleartext address is ever persisted.
async function rateLimited(env, ip, prefix, limit, windowSeconds) {
  if (!ip || !env.GEOCODE_CACHE) return false; // can't identify caller — don't hard-block
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `${prefix}:${bucket}:${await hashIp(ip)}`;
  let count = 0;
  try { count = parseInt(await env.GEOCODE_CACHE.get(key), 10) || 0; }
  catch (e) { return false; }
  if (count >= limit) return true;
  try { await env.GEOCODE_CACHE.put(key, String(count + 1), { expirationTtl: windowSeconds }); }
  catch (e) { /* fail open on KV write error */ }
  return false;
}

function feedbackRateLimited(env, ip) {
  return rateLimited(env, ip, 'fb-rl', FEEDBACK_RATE_LIMIT, FEEDBACK_RATE_WINDOW_SECONDS);
}

function searchRateLimited(env, ip) {
  return rateLimited(env, ip, 'search-rl', SEARCH_RATE_LIMIT, SEARCH_RATE_WINDOW_SECONDS);
}

function statusRateLimited(env, ip) {
  return rateLimited(env, ip, 'status-rl', STATUS_RATE_LIMIT, STATUS_RATE_WINDOW_SECONDS);
}

// Server-side PII redaction. The client sanitizes before sending, but this
// endpoint writes to a PUBLIC GitHub issue, so we never trust the client and
// re-run redaction here on anything derived from user input.
// KEEP IN SYNC with PII_PATTERNS in public/feedback.js (same rules, object form).
const PII_PATTERNS = [
  // Email addresses
  [/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[email redacted]'],
  // IPv4 addresses
  [/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip redacted]'],
  // IPv6 — full form
  [/\b([0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g, '[ip redacted]'],
  // IPv6 — "::"-compressed form (e.g. 2001:db8::1, fe80::)
  [/\b([0-9a-fA-F]{1,4}:){1,7}:([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){0,6}\b)?/g, '[ip redacted]'],
  // Labelled coordinates at ANY precision (lat: 40.71, "lon":-74, lng=12.5)
  [/\b(lat|latitude|lon|lng|longitude)(["']?\s*[:=]\s*["']?)-?\d{1,3}(\.\d+)?/gi, '$1$2[coord redacted]'],
  // Comma-separated coordinate pairs with 2+ decimals (40.71, -74.05)
  [/-?\d{1,3}\.\d{2,}\s*,\s*-?\d{1,3}\.\d{2,}/g, '[coord redacted]'],
  // Standalone high-precision decimals (4+ places — likely coordinates)
  [/-?\d{1,3}\.\d{4,}/g, '[coord redacted]'],
  // Bearer/auth tokens
  [/(Bearer\s+|token[=:]\s*)[\w\-._~+/]+=*/gi, '$1[token redacted]'],
  // Generic long hex/base64 strings (API keys, tokens)
  [/\b[A-Za-z0-9_\-]{32,}\b/g, '[key redacted]'],
];

function redactPii(str) {
  let out = String(str);
  for (const [regex, replacement] of PII_PATTERNS) out = out.replace(regex, replacement);
  return out;
}

// Neutralize Markdown/HTML so user-supplied text can't inject links, images,
// or raw HTML into the public issue. Renders as plain text in GitHub.
function sanitizeIssueText(str, maxLen = 4000) {
  return String(str)
    .slice(0, maxLen)
    .replace(/[<>]/g, (c) => (c === '<' ? '\u2039' : '\u203A')) // ‹ › — strip raw HTML tags
    .replace(/[`*_~#\[\]()|!]/g, '\\$&');                        // escape Markdown control chars
}

async function handleFeedback(request, env) {
  // Scope CORS to known origins for this state-changing endpoint.
  const allowedOrigins = allowedOriginsFor(new URL(request.url));
  const origin = request.headers.get('Origin');
  const cors = allowedOrigins.has(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' }
    : { 'Access-Control-Allow-Origin': 'null' };
  const reply = (data, status = 200) => jsonResponse(data, status, cors);

  // Require an allowlisted Origin. This blocks opportunistic cross-site browser
  // submissions; it is defence-in-depth only (see ALLOWED_ORIGINS note). The
  // per-IP rate limit is what actually caps automated abuse.
  if (!allowedOrigins.has(origin)) {
    console.warn('[Worker:handleFeedback] rejected disallowed/missing origin:', origin);
    return reply({ error: 'Forbidden.' }, 403);
  }

  // Per-IP rate limiting to prevent GitHub issue spam.
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (await feedbackRateLimited(env, ip)) {
    console.warn('[Worker:handleFeedback] rate limit exceeded for IP:', maskIp(ip));
    return reply({ error: 'Too many feedback submissions. Please try again later.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return reply({ error: 'Invalid request body — expected JSON.' }, 400);
  }
  const { type, title, description, email, page, app_version, console_logs } = body;

  if (!title || !title.trim()) {
    return reply({ error: 'A title is required.' }, 400);
  }
  if (!description || !description.trim()) {
    return reply({ error: 'A description is required.' }, 400);
  }
  const trimmedEmail = email && email.trim();
  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return reply({ error: 'Please enter a valid email address, or leave it blank.' }, 400);
  }

  const token = env.GITHUB_TOKEN;
  if (!token) {
    console.error('[Worker:handleFeedback] GITHUB_TOKEN secret is not configured');
    return reply({ error: 'Feedback submission is not configured on this server.' }, 500);
  }

  const feedbackType = type || 'other';
  const label = FEEDBACK_TYPE_LABELS[feedbackType] || 'feedback';

  // Build issue body. All user-supplied fields are PII-redacted AND
  // Markdown/HTML-sanitized server-side — this issue is PUBLIC, so emails,
  // IPs, coordinates, and token-like strings pasted into any field must
  // never reach it.
  let issueBody = sanitizeIssueText(redactPii(description.trim()));
  issueBody += '\n\n---\n';
  issueBody += `**Type:** ${sanitizeIssueText(feedbackType, 40)}\n`;
  if (page) issueBody += `**Page:** ${sanitizeIssueText(redactPii(page), 200)}\n`;
  if (app_version) issueBody += `**App version:** ${sanitizeIssueText(String(app_version), 40)}\n`;
  // Contact email is deliberately NOT PII-redacted — the reporter opted in to
  // sharing it so they can be followed up with. It is still Markdown/HTML-sanitized.
  if (trimmedEmail) issueBody += `**Contact email:** ${sanitizeIssueText(trimmedEmail, 200)}\n`;
  issueBody += `**Submitted:** ${new Date().toISOString()}\n`;

  if (console_logs && console_logs.trim()) {
    // Re-run PII redaction server-side, then neutralize backtick fences so logs
    // can't break out of the code block.
    const safeLogs = redactPii(console_logs.trim().slice(0, 5000)).replace(/`/g, '\u2018');
    issueBody += '\n<details>\n<summary>Browser Console Logs (PII sanitized)</summary>\n\n```\n';
    issueBody += safeLogs;
    issueBody += '\n```\n</details>\n';
  }

  const issuePayload = {
    title: `[Feedback] ${sanitizeIssueText(redactPii(title.trim()), 200)}`,
    body: issueBody,
    labels: [label, 'Needs Triage'],
  };

  console.log('[Worker:handleFeedback] creating GitHub issue:', issuePayload.title);

  const ghResp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(issuePayload),
    },
  );

  if (!ghResp.ok) {
    const errText = await ghResp.text();
    console.error('[Worker:handleFeedback] GitHub API error:', ghResp.status, errText);
    return reply({ error: 'Failed to submit feedback. Please try again later.' }, 502);
  }

  const issue = await ghResp.json();
  console.log('[Worker:handleFeedback] issue created:', issue.html_url);

  return reply({ success: true, issue_url: issue.html_url });
}

// ── Status / Health Checks ────────────────────────────────────────

const STATUS_SERVICES = {
  ncei: {
    url: 'https://www.ncei.noaa.gov/access/services/data/v1?dataset=daily-summaries&stations=USW00094728&startDate=2024-01-01&endDate=2024-01-01&dataTypes=TMAX&format=json',
    timeout: 10000,
  },
  'open-meteo': {
    url: 'https://api.open-meteo.com/v1/forecast?latitude=40&longitude=-74&current_weather=true',
    timeout: 8000,
  },
  nominatim: {
    url: 'https://nominatim.openstreetmap.org/search?q=New+York&format=json&limit=1',
    timeout: 8000,
  },
  github: {
    url: 'https://api.github.com/rate_limit',
    timeout: 8000,
  },
};

async function handleStatusCheck(url) {
  const service = url.searchParams.get('service');
  const config = STATUS_SERVICES[service];
  if (!config) {
    return jsonResponse({ error: 'Unknown service' }, 400);
  }

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeout);
  try {
    const resp = await fetch(config.url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    const latency = Date.now() - start;

    if (!resp.ok) {
      return jsonResponse({ ok: false, error: `HTTP ${resp.status}`, latency });
    }
    return jsonResponse({ ok: true, latency });
  } catch (err) {
    const latency = Date.now() - start;
    const msg = err.name === 'AbortError' ? 'Timeout' : err.message;
    return jsonResponse({ ok: false, error: msg, latency });
  } finally {
    clearTimeout(timer);
  }
}

// ── Worker entry point ────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    console.log('[Worker] incoming', request.method, url.pathname);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // API routes
    if (url.pathname === '/api/search' && request.method === 'POST') {
      // Per-IP rate limiting to protect upstream providers (Nominatim/NCEI/
      // Open-Meteo) from abuse through this open, unauthenticated endpoint.
      const ip = request.headers.get('CF-Connecting-IP') || '';
      if (await searchRateLimited(env, ip)) {
        console.warn('[Worker:handleSearch] rate limit exceeded for IP:', maskIp(ip));
        return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429);
      }
      try {
        return await handleSearch(request, env);
      } catch (err) {
        console.error('[Worker:handleSearch] unexpected error:', err.message, err.stack);
        return jsonResponse({ error: 'An unexpected server error occurred. Please try again.' }, 500);
      }
    }

    if (url.pathname === '/api/feedback' && request.method === 'POST') {
      try {
        return await handleFeedback(request, env);
      } catch (err) {
        console.error('[Worker:handleFeedback] unexpected error:', err.message, err.stack);
        return jsonResponse({ error: 'An unexpected server error occurred. Please try again.' }, 500);
      }
    }

    if (url.pathname === '/api/status/ping' && request.method === 'GET') {
      return jsonResponse({ ok: true, ts: Date.now() });
    }

    if (url.pathname === '/api/status/check' && request.method === 'GET') {
      // This endpoint fans out to third-party services, so it needs its own
      // per-IP budget even though the target URLs are allowlisted.
      const ip = request.headers.get('CF-Connecting-IP') || '';
      if (await statusRateLimited(env, ip)) {
        console.warn('[Worker:handleStatusCheck] rate limit exceeded for IP:', maskIp(ip));
        return jsonResponse({ ok: false, error: 'Too many requests. Please try again later.' }, 429);
      }
      try {
        return await handleStatusCheck(url);
      } catch (err) {
        console.error('[Worker:handleStatusCheck] unexpected error:', err.message);
        return jsonResponse({ ok: false, error: 'Status check failed.' });
      }
    }

    if (url.pathname.startsWith('/api/')) {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    // Everything else → static assets from public/
    return env.ASSETS.fetch(request);
  },
};
