#!/usr/bin/env bash
# Run: bash scripts/vercel-deploy-checked.test.sh
# check() evals each condition after run() sets $code and $out.
# shellcheck disable=SC2016,SC2034
set -u

script="$(cd "$(dirname "$0")" && pwd)/vercel-deploy-checked.sh"
deployment_url='https://web-abc123.vercel.app'
fails=0

workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT
stubdir="$workdir/bin"
mkdir -p "$stubdir"

cat >"$stubdir/npx" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$STUB_LOG"
case " $* " in
*" deploy "*) echo "Inspect: https://vercel.com/x/y" >&2; echo "$STUB_DEPLOY_URL" ;;
esac
STUB

cat >"$stubdir/curl" <<'STUB'
#!/usr/bin/env bash
printf 'curl %s\n' "$*" >>"$STUB_LOG"
[ "$STUB_CURL_EXIT" -eq 0 ] || exit "$STUB_CURL_EXIT"
while [ $# -gt 0 ]; do
	[ "$1" = --dump-header ] && printf '%b' "$STUB_HEADERS" >"$2"
	shift
done
printf '%s' "$STUB_STATUS"
STUB
chmod +x "$stubdir/npx" "$stubdir/curl"

run() {
	STUB_LOG="$workdir/log"
	: >"$STUB_LOG"
	export STUB_LOG STUB_DEPLOY_URL="${DEPLOY_URL-$deployment_url}"
	export STUB_STATUS="$1" STUB_HEADERS="$2" STUB_CURL_EXIT="${CURL_EXIT:-0}"
	out=$(PATH="$stubdir:$PATH" VERCEL_TOKEN=t VERCEL_CLI_VERSION=1.0.0 \
		bash "$script" web /api/check 2>&1)
	code=$?
}

check() {
	if eval "$2"; then
		echo "ok   - $1"
	else
		echo "FAIL - $1"
		printf '%s\n' "$out" | sed 's/^/       /'
		fails=$((fails + 1))
	fi
}

promoted() { grep -q " promote $deployment_url --yes" "$STUB_LOG"; }

run 200 'HTTP/2 200\r\ncontent-type: text/html\r\n\r\n'
check 'a deployment that answers 200 is promoted' '[ $code -eq 0 ] && promoted'
check 'the deployment is staged without its domains' \
	'grep -q -- "deploy --prebuilt --prod --skip-domain" "$STUB_LOG"'
check 'the check requests the given path on the new deployment' \
	'grep -q "$deployment_url/api/check" "$STUB_LOG"'

run 404 'HTTP/2 404\r\n\r\n'
check 'a 4xx from the app is promoted' '[ $code -eq 0 ] && promoted'

run 500 'HTTP/2 500\r\nx-vercel-error: MIDDLEWARE_INVOCATION_FAILED\r\n\r\n'
check 'a 5xx fails without promoting' '[ $code -ne 0 ] && ! promoted'
check 'the failure names the app and says it did not start' \
	'[[ "$out" == *"::error title=web deployment did not start::"* ]]'
check 'the failure carries the Vercel error code' \
	'[[ "$out" == *MIDDLEWARE_INVOCATION_FAILED* ]]'

run 404 'HTTP/2 404\r\nx-vercel-error: NOT_FOUND\r\n\r\n'
check 'an x-vercel-error header fails without promoting' '[ $code -ne 0 ] && ! promoted'

run 200 'HTTP/2 500\r\nx-vercel-error: FUNCTION_INVOCATION_FAILED\r\n\r\nHTTP/2 200\r\n\r\n'
check 'only the final response of a retried request counts' '[ $code -eq 0 ] && promoted'

run 401 'HTTP/2 401\r\ncontent-type: application/json\r\n\r\n'
check "the app's own JSON 401 is promoted" '[ $code -eq 0 ] && promoted'

run 401 'HTTP/2 401\r\ncontent-type: text/html; charset=utf-8\r\n\r\n'
check "a Deployment Protection page fails and names the app's bypass secret" \
	'[ $code -ne 0 ] && ! promoted && [[ "$out" == *VERCEL_AUTOMATION_BYPASS_SECRET_WEB* ]]'

run 302 'HTTP/2 302\r\nlocation: https://vercel.com/sso-api?url=https%3A%2F%2Fweb-abc123.vercel.app%2F\r\ncontent-type: text/plain\r\n\r\n'
check "a redirect to Vercel's sign-in fails and names the app's bypass secret" \
	'[ $code -ne 0 ] && ! promoted && [[ "$out" == *VERCEL_AUTOMATION_BYPASS_SECRET_WEB* ]]'

run 307 'HTTP/2 307\r\nlocation: /sign-in?callbackUrl=%2F\r\n\r\n'
check "the app's own redirect to its sign-in is promoted" '[ $code -eq 0 ] && promoted'

CURL_EXIT=28 run 000 ''
check 'a request that never answers fails without promoting' '[ $code -ne 0 ] && ! promoted'

DEPLOY_URL='' run 200 'HTTP/2 200\r\n\r\n'
check 'a deploy that prints no URL fails before any request' \
	'[ $code -ne 0 ] && ! grep -q "^curl" "$STUB_LOG"'

out=$(PATH="$stubdir:$PATH" VERCEL_TOKEN=t VERCEL_CLI_VERSION=1.0.0 \
	VERCEL_AUTOMATION_BYPASS_SECRET_WEB=web-s3cret VERCEL_AUTOMATION_BYPASS_SECRET_PLATFORM=platform-s3cret \
	STUB_LOG="$workdir/log" STUB_DEPLOY_URL="$deployment_url" STUB_STATUS=200 STUB_HEADERS='' STUB_CURL_EXIT=0 \
	bash "$script" web / 2>&1)
check "the app's own bypass secret is sent as the protection-bypass header" \
	'grep -q "x-vercel-protection-bypass: web-s3cret" "$workdir/log" && ! grep -q platform-s3cret "$workdir/log"'

[ "$fails" -eq 0 ] || {
	echo "$fails failing"
	exit 1
}
