#!/usr/bin/env node
/**
 * flag-report.js — feature flag inventory and cleanup list
 * (docs/feature-flags.md).
 *
 * Cross-checks three sources:
 *   code       — every EntoFlags.has('key') / flags.has('key') in
 *                templates/, public/*.js, public/sync/*.js, and every
 *                server-side hasFlag(…, 'key') in src/
 *   migrations — every flag seeded by an INSERT INTO feature_flags in
 *                migrations/*.sql
 *   database   — the live flag rows and their status (only with --remote or
 *                --local; reads D1 through wrangler)
 *
 * and lists what needs doing: GA flags whose check can now be removed from
 * the code, keys used in code but never seeded, and seeded keys no longer
 * used anywhere. Exits 1 if anything needs doing, so it can gate a release.
 *
 *   node scripts/flag-report.js            # code + migrations only
 *   node scripts/flag-report.js --remote   # + production D1
 *   node scripts/flag-report.js --local    # + local D1 (wrangler pages dev)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DB_NAME = 'entotools-accounts';

function filesIn(dir, ext) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith(ext)).map((f) => path.join(dir, f));
}

// key → [ 'file:line', … ]
function codeUsages() {
  const usages = new Map();
  const files = [...filesIn('templates', '.html'), ...filesIn('public', '.js'), ...filesIn('public/sync', '.js'),
    ...filesIn('src', '.js'), ...filesIn('src/routes', '.js'), ...filesIn('src/lib', '.js')]
    .filter((f) => f !== path.join('public', '_worker.js'));
  const re = /(?:[Ff]lags\.has|\bhasFlag)\([^)]*?['"]([a-z0-9][a-z0-9-]*)['"]\s*\)/g;
  for (const file of files) {
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const m of line.matchAll(re)) {
        if (!usages.has(m[1])) usages.set(m[1], []);
        usages.get(m[1]).push(`${file}:${i + 1}`);
      }
    });
  }
  return usages;
}

// key → migration file. A later DELETE FROM feature_flags … removes it again.
function seededKeys() {
  const seeded = new Map();
  for (const file of filesIn('migrations', '.sql').sort()) {
    const sql = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const stmt of sql.matchAll(/INSERT INTO feature_flags\s*\([^)]*\)\s*VALUES([^;]*)/gi)) {
      // First value of each row tuple only — not e.g. datetime('now').
      for (const m of stmt[1].matchAll(/(?:^|\)\s*,)\s*\(\s*'([^']+)'/g)) seeded.set(m[1], file);
    }
    for (const m of sql.matchAll(/DELETE FROM feature_flags\s+WHERE\s+flag_key\s*=\s*'([^']+)'/gi)) seeded.delete(m[1]);
  }
  return seeded;
}

function liveFlags(target) {
  const out = execFileSync(
    path.join(ROOT, 'node_modules', '.bin', 'wrangler'),
    ['d1', 'execute', DB_NAME, `--${target}`, '--json', '--command',
      'SELECT flag_key, status, status_changed_at FROM feature_flags ORDER BY flag_key'],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
  );
  const rows = JSON.parse(out)[0].results;
  return new Map(rows.map((r) => [r.flag_key, r]));
}

const target = process.argv.includes('--remote') ? 'remote' : process.argv.includes('--local') ? 'local' : null;
const usages = codeUsages();
const seeded = seededKeys();
let live = null;
if (target) {
  try { live = liveFlags(target); } catch (e) {
    console.error(`✗ flag-report: could not read ${target} D1 (${e.message.split('\n')[0]})`);
    process.exit(2);
  }
}

const allKeys = [...new Set([...usages.keys(), ...seeded.keys(), ...(live ? live.keys() : [])])].sort();
console.log(`Feature flags — code + migrations${live ? ` + ${target} D1` : ''}\n`);
for (const key of allKeys) {
  const row = live && live.get(key);
  const status = live ? (row ? row.status : 'not in D1') : '';
  console.log(`  ${key.padEnd(28)} ${status.padEnd(10)} ${(usages.get(key) || []).length} use(s)  ${seeded.has(key) ? 'seeded ' + path.basename(seeded.get(key)) : 'not seeded'}`);
}

const todo = [];
if (live) {
  for (const [key, row] of live) {
    if (row.status === 'ga' && usages.has(key)) {
      todo.push(`GA since ${row.status_changed_at || '?'} — remove the flag check and ship the feature unconditionally: ${key}\n      ${usages.get(key).join('\n      ')}`);
    }
    if (row.status === 'ga' && !usages.has(key)) {
      todo.push(`GA and no longer referenced in code — add a migration deleting it: ${key}`);
    }
  }
}
for (const [key, where] of usages) {
  if (!seeded.has(key)) todo.push(`Used in code but not seeded by any migration (admins would have to type the key by hand): ${key}\n      ${where.join('\n      ')}`);
}
for (const [key, file] of seeded) {
  if (!usages.has(key) && !(live && live.get(key) && live.get(key).status === 'ga')) {
    todo.push(`Seeded (${path.basename(file)}) but not used in code — remove it with a migration if it's finished: ${key}`);
  }
}

if (todo.length === 0) {
  console.log('\n✓ Nothing to clean up.');
} else {
  console.log(`\n${todo.length} item(s) to act on:\n`);
  todo.forEach((t) => console.log('  • ' + t));
  if (!live) console.log('\n(Run with --remote to include GA flags that are ready for removal.)');
  process.exitCode = 1;
}
