#!/usr/bin/env bash
# Deploys a prebuilt app without assigning its domains, requests the new
# deployment so its server starts with the real (Sensitive included) env, and
# promotes it only when that request shows the server started. On a failure
# the previous deployment keeps serving. <path> must reach server code that
# imports the app's env module, or nothing is validated.
set -euo pipefail

usage='usage: vercel-deploy-checked.sh <app> <path>'
app=${1:?$usage}
path=${2:?$usage}
: "${VERCEL_TOKEN:?empty — set the VERCEL_TOKEN secret}"
: "${VERCEL_CLI_VERSION:?empty — set VERCEL_CLI_VERSION}"

vercel() {
	npx --yes "vercel@${VERCEL_CLI_VERSION}" "$@" --token="$VERCEL_TOKEN"
}

fail() {
	echo "::error title=${app} deployment did not start::$1 It was not promoted; the previous deployment keeps serving." >&2
	exit 1
}

url=$(vercel deploy --prebuilt --prod --skip-domain | tail -n 1)
case "$url" in
https://*) ;;
*) fail "vercel deploy printed no deployment URL for ${app} (got '${url}')." ;;
esac

headers=$(mktemp)
trap 'rm -f "$headers"' EXIT

bypass=()
if [ -n "${VERCEL_AUTOMATION_BYPASS_SECRET:-}" ]; then
	bypass=(--header "x-vercel-protection-bypass: ${VERCEL_AUTOMATION_BYPASS_SECRET}")
fi

# Retries cover a cold start's transient 5xx; a real startup crash fails all three.
status=$(curl --silent --show-error --max-time 60 --retry 2 \
	--output /dev/null --dump-header "$headers" --write-out '%{http_code}' \
	"${bypass[@]}" "${url}${path}") ||
	fail "The new ${app} deployment (${url}) did not answer ${path}."

final=$(awk 'tolower($0) ~ /^http\// { buf = "" } { buf = buf $0 "\n" } END { printf "%s", buf }' "$headers")
header() {
	printf '%s' "$final" | grep -i "^$1:" | tail -n 1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//' || true
}
vercel_error=$(header x-vercel-error)
content_type=$(header content-type)

if [ "$status" -ge 500 ] || [ -n "$vercel_error" ]; then
	fail "The new ${app} deployment (${url}) answered ${path} with HTTP ${status}${vercel_error:+ (${vercel_error})} — check its runtime logs for the startup error."
fi
# The apps answer 401 with JSON; Vercel's protection page is HTML.
if [ "$status" -eq 401 ] && [[ "$content_type" != application/json* ]]; then
	fail "Deployment Protection refused the check on ${url}${path} — set the VERCEL_AUTOMATION_BYPASS_SECRET secret on this GitHub Environment."
fi

echo "${app}: ${url}${path} answered HTTP ${status}; promoting."
vercel promote "$url" --yes
