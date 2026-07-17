#!/usr/bin/env bash
# Deny/allow matrix for read-only-agent-guard.sh (#425).
#
# Pins the cases hand-tested across #425's three review rounds — including
# the bypasses found and fixed along the way (`git -C "quoted dir" commit`,
# `pnpm --filter x exec -- git commit`) — so a future edit to the guard can't
# silently reopen one. Run directly or via CI (`.github/workflows/hooks.yml`):
#   bash .claude/hooks/read-only-agent-guard.test.sh
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
guard="$script_dir/read-only-agent-guard.sh"

pass=0
fail=0

# Builds the {tool_input: {command: $1}} payload the guard expects on stdin,
# runs it, and asserts the resulting permissionDecision matches $2
# ("allow"/"deny"). No stdout from the guard means allow (it only prints on
# deny — see the script's own `deny()` helper).
check() {
  local cmd=$1 expected=$2 label=$3
  local payload
  payload=$(jq -n --arg cmd "$cmd" '{tool_input: {command: $cmd}}')
  run_and_assert "$payload" "$expected" "$label" "$cmd"
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
    printf 'FAIL: %s\n  command:  %s\n  expected: %s\n  got:      %s\n' "$label" "$shown" "$expected" "$decision" >&2
  fi
}

# --- deny: write-shaped git subcommands, including flag-skipping edge cases ---
check 'git commit -m "x"' deny "git commit"
check 'git -C "quoted dir" commit -m "x"' deny 'git -C "quoted dir" commit'
check 'git -c user.name=x commit -m "x"' deny "git -c k=v commit"
check 'git --git-dir=/tmp/x commit -m "x"' deny "git --git-dir=... commit"
check 'git add .' deny "git add"
check 'git switch main' deny "git switch"
check 'git fetch origin' deny "git fetch"
check 'git pull' deny "git pull"

# --- deny: other write-shaped prefixes from the allow-list mirror ---
check 'mkdir foo' deny "mkdir"
check 'touch foo.txt' deny "touch"
check 'cp a b' deny "cp"
check 'mv a b' deny "mv"
check 'pnpm add lodash' deny "pnpm add"
check 'pnpm install' deny "pnpm install"
check 'pnpm create vite' deny "pnpm create"
check 'pnpm typegen' deny "pnpm typegen"
check 'pnpm format' deny "pnpm format"
check 'npx sanity deploy' deny "npx sanity"
check 'gh project item-add 1 --url x' deny "gh project item-add"
check 'gh project item-edit 1 --field-id x' deny "gh project item-edit"

# --- deny: pnpm exec bypasses an arbitrary command ---
check 'pnpm exec eslint --fix' deny "pnpm exec"
check 'pnpm --filter web exec -- git commit' deny "pnpm --filter x exec -- git commit"

# --- deny: a denied command hiding in a compound segment ---
check 'git status && mkdir foo' deny "compound && with denied second segment"
check 'git diff; mkdir foo' deny "compound ; with denied second segment"

# --- deny: tokenize()'s xargs-fallback path, keyed on exit status ---
# xargs -n1 can print partial tokens before failing on an unbalanced quote
# (`git`/`-C` here, before it hits the dangling quote) — a token-count check
# alone would miss that partial success and use the truncated result, which
# drops the subcommand and silently allows. Guards against a real bypass
# found while writing this harness; see the tokenize() comment in the guard.
check 'git -C "unterminated commit' deny 'git -C <unterminated quote> commit (tokenize fallback)'
# Same tokenize() bypass class, via the other call site (pnpm_exec_denied).
check 'pnpm --filter "unterminated exec -- rm -rf /' deny 'pnpm --filter <unterminated quote> exec (tokenize fallback)'

# --- allow: read-only git, including the same flag-skipping shapes as above ---
check 'git status' allow "git status"
check 'git diff' allow "git diff"
check 'git log' allow "git log"
check 'git -C "quoted dir" log' allow 'git -C "quoted dir" log'
check 'git show HEAD' allow "git show"
check 'git cherry origin/main branch' allow "git cherry"

# --- allow: pnpm/turbo commands not on the write-shaped list ---
check 'pnpm --filter web test' allow "pnpm --filter web test"
check 'pnpm test' allow "pnpm test"
check 'pnpm --filter web build' allow "pnpm --filter web build"
check 'turbo run lint' allow "turbo run lint"

# --- allow: generic read tools ---
check 'rg "pattern" src' allow "rg"
check 'ls -la' allow "ls"

# --- allow: no command to inspect stays out of the way ---
check '' allow "empty command"
raw_check 'not json at all' allow "malformed (non-JSON) payload"

# --- documented residual false positive (README "Working with Claude Code"):
# quote-naive segment splitting can misread a literal "&& mkdir " inside a
# search pattern as a compound command. Pinned here as accepted behavior, not
# a bug — if this ever flips to "allow" the splitting logic changed and this
# note (and the README) need revisiting, not just the test.
check 'rg "&& mkdir "' deny "known false positive: quoted && mkdir inside a pattern"

echo "---"
echo "${pass} passed, ${fail} failed"
[ "$fail" -eq 0 ]
