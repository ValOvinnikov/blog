#!/usr/bin/env bash
# Deny/allow matrix for test-writer-scope-guard.sh — #459.
#
# The guard's own logic is a simple fail-closed suffix check (*.test.ts /
# *.test.tsx allow, anything else deny) — much less bypass surface than
# pre-bash-worktree-install-guard.sh's regex tokenizer, but it had zero
# regression coverage relative to its siblings (gate-bypass-guard.sh,
# read-only-agent-guard.sh). Note the contract: despite #459's assumption
# that this guard uses the same exit-code contract as
# pre-bash-worktree-install-guard.sh/gate-bypass-guard.sh, it actually always
# exits 0 and communicates allow/deny via a JSON permissionDecision on
# stdout, same as read-only-agent-guard.sh — so this suite reuses that
# sibling's check/raw_check/run_and_assert helper shape instead of
# gate-bypass-guard.test.sh's exit-code block/allow helpers.
#
# Run: bash .claude/hooks/test-writer-scope-guard.test.sh
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
guard="$script_dir/test-writer-scope-guard.sh"

pass=0
fail=0

# Builds the {tool_input: {file_path: $1}} payload the guard expects on
# stdin, runs it, and asserts the resulting permissionDecision matches $2
# ("allow"/"deny"). No stdout from the guard means allow (it only prints on
# deny — see the script's own final `jq -n` call).
check() {
  local path=$1 expected=$2 label=$3
  local payload
  payload=$(jq -n --arg path "$path" '{tool_input: {file_path: $path}}')
  run_and_assert "$payload" "$expected" "$label" "$path"
}

# Same assertion, but for a raw (possibly non-JSON) stdin payload — exercises
# the guard's "unparsable input -> stay out of the way" fallback.
raw_check() {
  local raw=$1 expected=$2 label=$3
  run_and_assert "$raw" "$expected" "$label" "$raw"
}

run_and_assert() {
  local payload=$1 expected=$2 label=$3 shown=$4
  local output decision
  output=$(printf '%s' "$payload" | "$guard")
  if [ -z "$output" ]; then
    decision="allow"
  else
    decision=$(printf '%s' "$output" | jq -r '.hookSpecificOutput.permissionDecision // "allow"' 2>/dev/null) || decision="allow"
  fi
  if [ "$decision" = "$expected" ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    printf 'FAIL: %s\n  input:    %s\n  expected: %s\n  got:      %s\n' "$label" "$shown" "$expected" "$decision" >&2
  fi
}

# --- allow: co-located *.test.ts(x) targets, one per layer ------------------
check 'packages/ui/src/atoms/Button.test.tsx' allow "ui component .test.tsx"
check 'packages/service/src/queries/post.test.ts' allow "service .test.ts"
check 'apps/web/src/app/page.test.tsx' allow "web route .test.tsx"

# --- deny: product code, one per layer --------------------------------------
check 'packages/ui/src/atoms/Button.tsx' deny "ui product .tsx"
check 'packages/service/src/queries/post.ts' deny "service product .ts"
check 'apps/web/src/app/page.tsx' deny "web route product file"

# --- deny: suffix lookalikes that are NOT *.test.ts(x) ----------------------
check 'packages/ui/src/atoms/Button.test.tsx.bak' deny "trailing .bak after .test.tsx"
check 'packages/ui/src/atoms/test.tsx' deny "literal filename test.tsx, no .test. suffix"
check 'packages/ui/src/atoms/Button.TEST.TSX' deny "case mismatch — suffix check is case-sensitive"
check 'packages/ui/src/atoms/Button.testx.tsx' deny "near-miss suffix, not .test.tsx"

# --- allow: no file_path to inspect stays out of the way --------------------
check '' allow "empty file_path"
raw_check '{"tool_input": {}}' allow "missing file_path key"
raw_check 'not json at all' allow "malformed (non-JSON) payload"

echo "---"
echo "${pass} passed, ${fail} failed"
[ "$fail" -eq 0 ]
