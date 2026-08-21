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

# --- deny: sed/perl in-place edits, tee, and redirection (#1797) ---
check 'sed -i "s/a/b/" file.tsx' deny "sed -i"
check "sed -i.bak 's/a/b/' file.tsx" deny "sed -i.bak (suffix attached)"
check 'sed --in-place "s/a/b/" file.tsx' deny "sed --in-place"
check 'sed --in-place=.bak "s/a/b/" file.tsx' deny "sed --in-place=.bak"
check 'sed -ni "s/a/b/p" file.tsx' deny "sed -ni (in-place not leading the cluster)"
check 'sed -Ei "s/(a)/\1/" file.tsx' deny "sed -Ei (in-place combined with -E)"
check 'perl -i -pe "s/a/b/" file.tsx' deny "perl -i"
check 'perl -pi -e "s/a/b/" file.tsx' deny "perl -pi (in-place not leading the cluster)"
check 'perl -npi -e "s/a/b/" file.tsx' deny "perl -npi"
check 'tee file.tsx' deny "tee"
check 'echo hi | tee file.tsx' deny "pipe to tee"
check 'echo hi | tee -a file.tsx' deny "tee -a"
check 'echo hi > file.tsx' deny "> redirect to a file"
check 'echo hi >> file.tsx' deny ">> redirect (append) to a file"
check 'echo hi 2> err.log' deny "2> redirect (stderr) to a file"
check 'echo hi &> both.log' deny "&> redirect to a file"

# --- deny: -l is a plain boolean on BSD/macOS sed (this guard's actual
# runtime), NOT a value-consuming flag like GNU sed's numeric -l N — a real
# bypass found in #1797 review: treating -l as a stopchar let the scan give
# up before ever reaching a real -i later in the same cluster ---
check "sed -li.bak 's/hello/BYE/' file.tsx" deny "sed -li.bak (real BSD/macOS bypass from #1797 review)"
check "sed -l5i 's/hello/BYE/' file.tsx" deny "sed -l5i"

# --- deny: redirection operator glued to its target and/or its preceding
# word, with no surrounding whitespace on one or both sides — #1797 review
# found the original spaced-tokens-only check missed every one of these,
# which are at least as common a way to type a redirect as the spaced form ---
check 'echo hi>file.txt' deny "> glued on both sides"
check 'echo hi >file.txt' deny "> glued after only (space before)"
check 'echo hi> file.txt' deny "> glued before only (space after)"
check 'echo hi 2>file.log' deny "2> glued after only (fd-qualified)"
check 'echo hi&>file.txt' deny "&> glued (no spaces)"

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

# --- allow: sed/perl flags that merely happen to contain the letter "i"
# in a value-consuming flag's argument, not a real -i (#1797) ---
check 'sed -ne "p" file.tsx' allow "sed -ne (no -i present)"
check 'sed -n "p" file.tsx' allow "sed -n (read only)"
check "sed -e 's/i/x/' file.tsx" allow "sed -e (script text contains 'i', stdout only — exercises the -e stopchar, not just 'no i at all')"
check "sed -f init.sed file.tsx" allow "sed -f (script filename contains 'i', exercises the -f stopchar)"
check "perl -Mstrict -e 'print 1'" allow "perl -Mstrict (module name contains 'i', not a flag)"
check "perl -Ilib -e 'print 1'" allow "perl -Ilib (include path, not a flag)"
check "perl -e 's/i/x/g' file.tsx" allow "perl -e (script text contains 'i', stdout only)"

# --- allow: redirection to a harmless sink, not a real file write (#1797) ---
check 'echo hi > /dev/null' allow "> /dev/null"
check 'echo hi 2>/dev/null' allow "2>/dev/null"
check 'some-cmd 2>&1' allow "2>&1 (fd duplication, not a file write)"
check 'some-cmd 1>&2' allow "1>&2 (fd duplication, not a file write)"

# --- allow: generic read tools ---
check 'rg "pattern" src' allow "rg"
check 'ls -la' allow "ls"

# --- allow: no command to inspect stays out of the way ---
check '' allow "empty command"
raw_check 'not json at all' allow "malformed (non-JSON) payload"

# --- documented residual false positive (docs/context/claude-code.md):
# quote-naive segment splitting can misread a literal "&& mkdir " inside a
# search pattern as a compound command. Pinned here as accepted behavior, not
# a bug — if this ever flips to "allow" the splitting logic changed and that
# doc (docs/context/claude-code.md) needs revisiting, not just the test.
check 'rg "&& mkdir "' deny "known false positive: quoted && mkdir inside a pattern"

echo "---"
echo "${pass} passed, ${fail} failed"
[ "$fail" -eq 0 ]
