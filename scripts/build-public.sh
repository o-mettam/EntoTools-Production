#!/usr/bin/env bash
# build-public.sh
# Copies HTML templates into public/ for Cloudflare Workers static assets.
# Run: npm run build-public (or bash scripts/build-public.sh)
#
# Every page served from public/ has a source in templates/. Assets that are NOT
# generated here and are edited directly in public/ are:
#   public/theme.js        — shared brand palette + dark-mode handling (all pages)
#   public/theme.css       — shared base styles + dark-mode overrides (all pages)
#   public/ento-gdd.js     — shared mGDD calculation + HTML-escape helpers
#   public/log-capture.js — shared console log capture + startup/action logging
#   public/feedback.js     — feedback widget
#   public/sync/*.js       — local store, merge engine, Drive provider, OAuth config
#   public/stations.json   — generated station index

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."

mkdir -p "$ROOT/public/degree-day-calculator"
mkdir -p "$ROOT/public/gdd-lookup"
mkdir -p "$ROOT/public/sample-collection"
mkdir -p "$ROOT/public/collection-database"
mkdir -p "$ROOT/public/documentation"
mkdir -p "$ROOT/public/privacy"
mkdir -p "$ROOT/public/terms"
mkdir -p "$ROOT/public/status"

# Homepage → public/index.html (served at /)
cp "$ROOT/templates/entotools.html" "$ROOT/public/index.html"

# Calculator → public/degree-day-calculator/index.html (served at /degree-day-calculator)
cp "$ROOT/templates/degree_day_calculator.html" "$ROOT/public/degree-day-calculator/index.html"

# GDD Lookup → public/gdd-lookup/index.html (served at /gdd-lookup)
cp "$ROOT/templates/gdd_lookup.html" "$ROOT/public/gdd-lookup/index.html"

# Sample Collection → public/sample-collection/index.html (served at /sample-collection)
cp "$ROOT/templates/label_data.html" "$ROOT/public/sample-collection/index.html"

# Collection Database → public/collection-database/index.html (served at /collection-database)
cp "$ROOT/templates/collection_database.html" "$ROOT/public/collection-database/index.html"

# Documentation → public/documentation/index.html (served at /documentation)
cp "$ROOT/templates/documentation.html" "$ROOT/public/documentation/index.html"

# Privacy Policy → public/privacy/index.html (served at /privacy)
cp "$ROOT/templates/privacy_policy.html" "$ROOT/public/privacy/index.html"

# Terms of Use → public/terms/index.html (served at /terms)
cp "$ROOT/templates/terms_of_use.html" "$ROOT/public/terms/index.html"

# Service Status → public/status/index.html (served at /status)
cp "$ROOT/templates/status.html" "$ROOT/public/status/index.html"

# Error pages
cp "$ROOT/templates/404.html" "$ROOT/public/404.html"
cp "$ROOT/templates/500.html" "$ROOT/public/500.html"
cp "$ROOT/templates/503.html" "$ROOT/public/503.html"

# Worker entry point for Cloudflare Pages advanced mode
cp "$ROOT/src/index.js" "$ROOT/public/_worker.js"

echo "✓ public/ directory built successfully."
ls -lh "$ROOT/public/"
ls -lh "$ROOT/public/degree-day-calculator/"
