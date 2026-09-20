#!/usr/bin/env bash
# Run: bash .claude/hooks/post-edit.test.sh
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
hook="$script_dir/post-edit.sh"

pass=0
fail=0

project=$(cd "$(mktemp -d)" && pwd -P)
trap 'rm -rf "$project"' EXIT
calls="$project/calls.log"
export CALLS="$calls"

git -C "$project" init -q
mkdir -p "$project/node_modules/.bin" "$project/apps/web/src" "$project/packages/utils/src"
: > "$project/apps/web/eslint.config.js"

cat > "$project/node_modules/.bin/prettier" <<'EOF'
#!/bin/sh
for arg; do file=$arg; done
printf 'prettier cwd=%s file=%s\n' "$PWD" "$file" >> "$CALLS"
EOF
cat > "$project/node_modules/.bin/eslint" <<'EOF'
#!/bin/sh
for arg; do file=$arg; done
printf 'eslint cwd=%s file=%s\n' "$PWD" "$file" >> "$CALLS"
if grep -q 'console.log' "$file"; then
  printf '%s\n  1:1  error  Unexpected console statement  no-console\n' "$file"
  exit 1
fi
EOF
chmod +x "$project/node_modules/.bin/prettier" "$project/node_modules/.bin/eslint"

dirty="$project/apps/web/src/dirty.ts"
clean="$project/apps/web/src/clean.ts"
outside="$project/packages/utils/src/no-config.ts"
markdown="$project/apps/web/README.md"
printf "console.log('x');\n" > "$dirty"
printf "export const x = 1;\n" > "$clean"
printf "console.log('x');\n" > "$outside"
printf "# hi\n" > "$markdown"

payload_for() {
  printf '{"tool_input":{"file_path":"%s"}}' "$1"
}

run_hook() {
  : > "$calls"
  stderr_out=$(printf '%s' "$1" | "$hook" 2>&1 >/dev/null)
  status=$?
}

expect() {
  local label=$1 want_status=$2 want_calls=$3 want_stderr=$4
  local got_calls stderr_ok
  got_calls=$(cat "$calls")
  if [ -z "$want_stderr" ]; then
    [ -z "$stderr_out" ] && stderr_ok=1 || stderr_ok=0
  else
    [[ "$stderr_out" == *"$want_stderr"* ]] && stderr_ok=1 || stderr_ok=0
  fi
  if [ "$status" -eq "$want_status" ] && [ "$got_calls" = "$want_calls" ] && [ "$stderr_ok" -eq 1 ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    printf 'FAIL: %s\n  status: %s (want %s)\n  stderr: %s\n  calls:\n%s\n  want calls:\n%s\n' \
      "$label" "$status" "$want_status" "$stderr_out" "$got_calls" "$want_calls" >&2
  fi
}

export CLAUDE_PROJECT_DIR="$project"
cd "$project" || exit 1

run_hook "$(payload_for "$dirty")"
expect "lint problems reach the agent: prettier first, eslint from the workspace" 2 \
  "prettier cwd=$project file=$dirty
eslint cwd=$project/apps/web file=$dirty" "no-console"

run_hook "$(payload_for "$clean")"
expect "clean file is formatted and linted silently" 0 \
  "prettier cwd=$project file=$clean
eslint cwd=$project/apps/web file=$clean" ""

run_hook "$(payload_for "$outside")"
expect "file with no workspace config lints from the project root" 2 \
  "prettier cwd=$project file=$outside
eslint cwd=$project file=$outside" "no-console"

run_hook "$(payload_for "$markdown")"
expect "non-TS file is formatted but not linted" 0 \
  "prettier cwd=$project file=$markdown" ""

run_hook "$(payload_for "$project/apps/web/src/gone.ts")"
expect "missing file is a silent no-op" 0 "" ""

run_hook 'not json at all'
expect "malformed payload is a silent no-op" 0 "" ""

run_hook "$(payload_for "apps/web/src/dirty.ts")"
expect "relative path resolves against the cwd" 2 \
  "prettier cwd=$project file=$dirty
eslint cwd=$project/apps/web file=$dirty" "no-console"

cd "$project/apps" || exit 1
run_hook "$(payload_for "web/src/dirty.ts")"
expect "relative path from a cwd below the project dir is absolutised for both tools" 2 \
  "prettier cwd=$project file=$dirty
eslint cwd=$project/apps/web file=$dirty" "no-console"
cd "$project" || exit 1

unset CLAUDE_PROJECT_DIR
run_hook "$(payload_for "$dirty")"
expect "CLAUDE_PROJECT_DIR unset falls back to the git toplevel" 2 \
  "prettier cwd=$project file=$dirty
eslint cwd=$project/apps/web file=$dirty" "no-console"

cd / || exit 1
run_hook "$(payload_for "$dirty")"
expect "fallback is anchored on the file, not the cwd" 2 \
  "prettier cwd=$project file=$dirty
eslint cwd=$project/apps/web file=$dirty" "no-console"
cd "$project" || exit 1

export CLAUDE_PROJECT_DIR="$project"
mv "$project/node_modules" "$project/node_modules.off"
run_hook "$(payload_for "$dirty")"
expect "missing node_modules is a silent no-op" 0 "" ""
mv "$project/node_modules.off" "$project/node_modules"

echo "---"
echo "${pass} passed, ${fail} failed"
[ "$fail" -eq 0 ]
