#!/usr/bin/env bash
# `stage` deploys a prebuilt app without assigning its domains and requests the
# new deployment so its server starts with the real (Sensitive included) env;
# it writes the deployment URL to $GITHUB_OUTPUT only when that request shows
# the server started. `gate` fails unless every app the run deploys staged, and
# `promote` assigns the domains to a staged URL, so one failed check leaves
# every site on its previous deployment. <path> must reach
# server code that imports the app's env module, or nothing is validated.
set -euo pipefail

usage='usage: vercel-deploy-checked.sh stage <app> <path> | gate | promote <app> <url>'
mode=${1:?$usage}

summary() {
	if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
		printf '%s\n' "$1" >>"$GITHUB_STEP_SUMMARY"
	fi
}

# NEEDS is the promote job's `toJSON(needs)`. REQUIRED_JOBS names the stage
# jobs that must have run, for a deploy that has no change detection.
gate() {
	: "${NEEDS:?empty — pass toJSON(needs) from the promote job}"
	local blocked list
	blocked=$(jq -r --arg required "${REQUIRED_JOBS:-}" '
		($required | split(" ") | map(select(. != ""))) as $req
		| to_entries[]
		| select(
			(.value.result == "failure" or .value.result == "cancelled")
			or (.value.result == "success" and (.key | startswith("deploy-")) and (.value.outputs.url // "") == "")
			or ((.key | IN($req[])) and .value.result != "success"))
		| "\(.key) (\(.value.result))"' <<<"$NEEDS")
	if [ -n "$blocked" ]; then
		list=$(paste -sd, - <<<"$blocked" | sed 's/,/, /g')
		echo "::error title=No app was promoted::Every deploying app must pass its check before any goes live. Did not succeed: ${list}." >&2
		summary "**No app was promoted** — every site keeps serving its previous deployment. Did not succeed: ${list}."
		exit 1
	fi
	echo "Every deploying app passed its check."
}

if [ "$mode" = gate ]; then
	gate
	exit 0
fi

app=${2:?$usage}
target=${3:?$usage}
: "${VERCEL_TOKEN:?empty — set the VERCEL_TOKEN secret}"
: "${VERCEL_CLI_VERSION:?empty — set VERCEL_CLI_VERSION}"

vercel() {
	npx --yes "vercel@${VERCEL_CLI_VERSION}" "$@" --token="$VERCEL_TOKEN"
}

fail() {
	echo "::error title=${app} deployment did not start::$1 No app is promoted; every site keeps serving its previous deployment." >&2
	summary "**${app} failed its check:** $1"
	exit 1
}

require_url() {
	case "$1" in
	https://*) ;;
	*) fail "$2 (got '$1')." ;;
	esac
}

promote() {
	require_url "$target" "No staged deployment URL for ${app}"
	vercel promote "$target" --yes
	echo "${app}: promoted ${target}."
	summary "**${app}** promoted: ${target}"
}

stage() {
	local path=$target url
	url=$(vercel deploy --prebuilt --prod --skip-domain | tail -n 1)
	require_url "$url" "vercel deploy printed no deployment URL for ${app}"

	headers=$(mktemp)
	trap 'rm -f "$headers"' EXIT

	# Vercel generates the bypass secret per project, so each app reads its own.
	local bypass_name bypass_secret protection_hint
	bypass_name="VERCEL_AUTOMATION_BYPASS_SECRET_$(printf '%s' "$app" | tr '[:lower:]' '[:upper:]')"
	bypass_secret=${!bypass_name:-}
	local bypass=()
	if [ -n "$bypass_secret" ]; then
		bypass=(--header "x-vercel-protection-bypass: ${bypass_secret}")
	fi
	protection_hint="set ${bypass_name} on this GitHub Environment to the project's Protection Bypass for Automation secret."

	# Retries cover a cold start's transient 5xx; a real startup crash fails all three.
	local status
	status=$(curl --silent --show-error --max-time 60 --retry 2 \
		--output /dev/null --dump-header "$headers" --write-out '%{http_code}' \
		${bypass[@]+"${bypass[@]}"} "${url}${path}") ||
		fail "The new ${app} deployment (${url}) did not answer ${path}."

	local final vercel_error content_type location
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

	echo "${app}: ${url}${path} answered HTTP ${status}; staged for promotion."
	echo "url=${url}" >>"${GITHUB_OUTPUT:-/dev/null}"
}

case "$mode" in
stage) stage ;;
promote) promote ;;
*)
	echo "$usage" >&2
	exit 2
	;;
esac
