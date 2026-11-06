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

# Vercel generates the bypass secret per project, so each app reads its own.
bypass_name="VERCEL_AUTOMATION_BYPASS_SECRET_$(printf '%s' "$app" | tr '[:lower:]' '[:upper:]')"
bypass_secret=${!bypass_name:-}
bypass=()
if [ -n "$bypass_secret" ]; then
	bypass=(--header "x-vercel-protection-bypass: ${bypass_secret}")
fi
protection_hint="set ${bypass_name} on this GitHub Environment to the project's Protection Bypass for Automation secret."

# Retries cover a cold start's transient 5xx; a real startup crash fails all three.
status=$(curl --silent --show-error --max-time 60 --retry 2 \
	--output /dev/null --dump-header "$headers" --write-out '%{http_code}' \
	${bypass[@]+"${bypass[@]}"} "${url}${path}") ||
	fail "The new ${app} deployment (${url}) did not answer ${path}."

final=$(awk 'tolower($0) ~ /^http\// { buf = "" } { buf = buf $0 "\n" } END { printf "%s", buf }' "$headers")
header() {
	printf '%s' "$final" | grep -i "^$1:" | tail -n 1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//' || true
}
vercel_error=$(header x-vercel-error)
content_type=$(header content-type)
location=$(header location)

if [ "$status" -ge 500 ] || [ -n "$vercel_error" ]; then
	fail "The new ${app} deployment (${url}) answered ${path} with HTTP ${status}${vercel_error:+ (${vercel_error})} — check its runtime logs for the startup error."
fi
case "$location" in
*vercel.com/sso-api*)
	fail "Deployment Protection redirected the check on ${url}${path} to Vercel's sign-in — ${protection_hint}"
	;;
esac
# The apps answer 401 with JSON; Vercel's protection page is HTML.
if [ "$status" -eq 401 ] && [[ "$content_type" != application/json* ]]; then
	fail "Deployment Protection refused the check on ${url}${path} — ${protection_hint}"
fi

echo "${app}: ${url}${path} answered HTTP ${status}; promoting."
vercel promote "$url" --yes
