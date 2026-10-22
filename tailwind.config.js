/**
 * Static Tailwind build (security assessment 2026-09, R4).
 *
 * The site used the Tailwind Play CDN (a ~300 KB runtime script that
 * compiles classes in the browser and injects a <style> tag). Replacing it
 * with a build-time stylesheet removes a third-party script from the CSP
 * script-src entirely, and is also faster for every visitor.
 *
 * The palette is NOT duplicated here: it's read out of public/theme.js,
 * which stays the single source of truth (that file still applies the same
 * palette at runtime for dark-mode handling, and the CDN fallback path). Any
 * change to PALETTE there is picked up on the next build.
 *
 * Built by scripts/build-public.sh:
 *   tailwindcss -c tailwind.config.js -i src/tailwind.css -o public/tailwind.css --minify
 */
const fs = require('fs');
const path = require('path');

const themeSrc = fs.readFileSync(path.join(__dirname, 'public', 'theme.js'), 'utf8');
const m = themeSrc.match(/var PALETTE = (\{[\s\S]*?\n {4}\});/);
if (!m) throw new Error('tailwind.config.js: could not find "var PALETTE = {...};" in public/theme.js');
// The literal is plain data (colour hex strings) — evaluating it is the
// simplest way to keep one source of truth without a separate JSON file.
const PALETTE = new Function('return ' + m[1])(); // eslint-disable-line no-new-func

module.exports = {
  content: [
    './templates/**/*.html',   // every page, plus the admin GUI bundled into the Worker
    './public/*.js',           // account.js / feedback.js / theme.js build markup at runtime
    './public/sync/*.js',
  ],
  darkMode: 'class',
  theme: { extend: { colors: PALETTE } },
};
