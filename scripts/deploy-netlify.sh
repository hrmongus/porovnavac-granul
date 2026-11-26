#!/usr/bin/env bash
# Nasadenie analyzéra na Netlify (produkcia). Potrebuje NETLIFY_AUTH_TOKEN a prepojený projekt (.netlify/state.json).
# Zostavuje sa BEZ lokálneho .env, aby sa tajné hodnoty nedostali do balíka; premenné prostredia sú nastavené na Netlify.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=""
if [ -f .env ]; then tmp=$(mktemp); mv .env "$tmp"; fi
trap '[ -n "$tmp" ] && mv "$tmp" .env' EXIT
rm -rf .next .netlify/functions-internal .netlify/edge-functions .netlify/static
npx netlify-cli@latest build --offline --context production
if find .netlify .next -name '.env*' | grep -q .; then echo "CHYBA: .env v balíku, nenasadzujem" >&2; exit 1; fi
# statické súbory pripraví Netlify Next.js adaptér do .netlify/static
npx netlify-cli@latest deploy --no-build --prod --dir .netlify/static
