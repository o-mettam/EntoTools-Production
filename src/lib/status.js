/**
 * Upstream service health checks — shared by the public /api/status/check
 * endpoint (one service per call, rate-limited) and the admin portal's
 * Status tab (all services at once, Access-gated).
 */
const USER_AGENT = 'EntoTools/1.0 (educational-project)';

export const STATUS_SERVICES = {
  ncei: {
    name: 'NOAA NCEI',
    role: 'Historical daily weather (US stations) for the calculator',
    url: 'https://www.ncei.noaa.gov/access/services/data/v1?dataset=daily-summaries&stations=USW00094728&startDate=2024-01-01&endDate=2024-01-01&dataTypes=TMAX&format=json',
    timeout: 10000,
  },
  'open-meteo': {
    name: 'Open-Meteo',
    role: 'Forecast + archive weather (global fallback)',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=40&longitude=-74&current_weather=true',
    timeout: 8000,
  },
  nominatim: {
    name: 'Nominatim (OpenStreetMap)',
    role: 'Geocoding for city/state lookups',
    url: 'https://nominatim.openstreetmap.org/search?q=New+York&format=json&limit=1',
    timeout: 8000,
  },
  github: {
    name: 'GitHub API',
    role: 'Feedback widget → public issues',
    url: 'https://api.github.com/rate_limit',
    timeout: 8000,
  },
};

// One service: { ok, latency, error? }. Never throws.
export async function checkService(id) {
  const config = STATUS_SERVICES[id];
  if (!config) return { ok: false, error: 'Unknown service', latency: 0 };
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeout);
  try {
    const resp = await fetch(config.url, { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal });
    const latency = Date.now() - start;
    if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}`, latency };
    return { ok: true, latency };
  } catch (err) {
    const latency = Date.now() - start;
    return { ok: false, error: err.name === 'AbortError' ? 'Timeout' : err.message, latency };
  } finally {
    clearTimeout(timer);
  }
}

// Every service in parallel (admin use only — this fans out four outbound
// requests, so it stays behind Access rather than on the public endpoint).
export async function checkAllServices() {
  const ids = Object.keys(STATUS_SERVICES);
  const results = await Promise.all(ids.map((id) => checkService(id)));
  const checkedAt = new Date().toISOString();
  return ids.map((id, i) => ({
    id,
    name: STATUS_SERVICES[id].name,
    role: STATUS_SERVICES[id].role,
    host: new URL(STATUS_SERVICES[id].url).host,
    timeoutMs: STATUS_SERVICES[id].timeout,
    checkedAt,
    ...results[i],
  }));
}
