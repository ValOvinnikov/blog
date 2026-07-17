#!/usr/bin/env bash
# PreToolUse guard for the read-only subagents (reviewer, explore,
# seo-auditor) — issue #425 — reused for Bash-mutation denial by test-writer
# (#396), which isn't fully read-only.
#
# Wired in each agent's frontmatter, so it fires ONLY for that agent's Bash
# calls. It works together with `permissionMode: dontAsk` in the same
# frontmatter:
#
#   - dontAsk makes the harness's own permission engine fail CLOSED: any Bash
#     call it would prompt for (redirects, sed -i, tee, unrecognized binaries,
#     obfuscated forms) is auto-denied. That engine — not this script — is the
#     enforcement layer.
#   - This script only subtracts the write-shaped commands that the project
#     allow-list (.claude/settings.json permissions.allow) would otherwise
#     wave through without a prompt. That is a finite, plainly-written set,
#     because anything not matching an allow rule's literal prefix is already
#     denied by dontAsk.
#
# Deliberately NOT a general write-detector: #397 established that text
# analysis of shell commands cannot be made sound and its false positives on
# honest commands cost more than they protect. Keep this list a mirror of the
# write-shaped permissions.allow entries — update it when that list changes.
#
# `test-writer` has no legitimate need for any command on the deny list
# either, even though it isn't read-only overall (it writes `*.test.ts(x)`
# via Edit/Write, gated separately by `test-writer-scope-guard.sh`). Each
# caller sets `GUARD_LABEL` in its hook command to keep the deny message
# accurate; it defaults to the original #425 framing, so reviewer/explore/
# seo-auditor (which don't set it) need no changes.
set -u

GUARD_LABEL="${GUARD_LABEL:-You are a read-only agent (#425)}"

input=$(cat)

# jq missing or unparsable input → stay out of the way (dontAsk still holds).
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null) || cmd=""
[ -z "$cmd" ] && exit 0

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

# Write-shaped prefixes the session allow-list admits without a prompt.
# `git <subcommand>` entries list the subcommand only — matched via
# git_subcommand_denied() below, which tolerates leading global flags
# (`git -C dir commit`, `git -c x=y commit`) that a literal-prefix match
# would miss.
GIT_DENY_SUBCOMMANDS=(add commit switch fetch pull)
DENY_PREFIXES=(
  "mkdir"
  "touch"
  "cp"
  "mv"
  "pnpm add"
  "pnpm install"
  "pnpm create"
  "pnpm typegen"
  "pnpm format"
  "npx sanity"
  "gh project item-add"
  "gh project item-edit"
)

# Splits $1 into TOKENS, one element per shell word, honoring quotes — unlike
# naive `($1)` splitting, `git -C "a dir" commit` doesn't fall apart into
# "a and dir" as two tokens (that specific gap let `git -C "<space-path>"
# commit` slip past an earlier version of this script; see #425 review
# history). `xargs -n1` is a quoting-aware tokenizer already available on the
# host with no new dependency; an unbalanced quote makes it fail, in which
# case fall back to naive splitting rather than silently allowing.
#
# The fallback triggers on xargs's own exit status, not on whether TOKENS
# ended up empty: `xargs -n1` can print some tokens before it hits the
# unbalanced quote and errors, e.g. `git -C "unterminated commit` emits
# "git"/"-C" and only then fails — an empty-TOKENS check would miss that and
# use the truncated, subcommand-dropping result instead of falling back.
#
# Portable to bash 3.2 (macOS system bash) — no mapfile/readarray.
tokenize() {
  TOKENS=()
  local tok output status
  output=$(printf '%s' "$1" | xargs -n1 2>/dev/null)
  status=$?
  # The `-n "$output"` guard matters: a here-string on an empty variable
  # (`<<<""`) still feeds `read` one empty line, which would otherwise seed
  # TOKENS with a single "" element instead of leaving it truly empty.
  if [ "$status" -eq 0 ] && [ -n "$output" ]; then
    while IFS= read -r tok; do
      TOKENS+=("$tok")
    done <<<"$output"
  fi
  if [ "${#TOKENS[@]}" -eq 0 ] && [ -n "$1" ]; then
    # shellcheck disable=SC2206
    TOKENS=($1)
  fi
}

# True if $1 is a `git` invocation whose subcommand (after skipping leading
# global flags) is one of GIT_DENY_SUBCOMMANDS. Only -C/-c's flag-then-value
# form is unwrapped; other global flags (--git-dir=x, -c x=y) are single
# tokens and skip on their own via the -*) case.
git_subcommand_denied() {
  tokenize "$1"
  [ "${TOKENS[0]:-}" = "git" ] || return 1
  local i=1
  while [ "$i" -lt "${#TOKENS[@]}" ]; do
    case "${TOKENS[$i]}" in
    -C | -c)
      i=$((i + 2))
      ;;
    -*)
      i=$((i + 1))
      ;;
    *)
      local sub="${TOKENS[$i]}"
      for denied in "${GIT_DENY_SUBCOMMANDS[@]}"; do
        [ "$sub" = "$denied" ] && return 0
      done
      return 1
      ;;
    esac
  done
  return 1
}

# True if $1 is a `pnpm` invocation containing an `exec` token anywhere
# (`pnpm exec <bin>`, `pnpm --filter <pkg> exec -- <cmd>`) — `pnpm exec` and
# `--filter ... exec` both run an arbitrary command, bypassing every prefix
# check below, so they're denied outright rather than pattern-matched.
pnpm_exec_denied() {
  tokenize "$1"
  [ "${TOKENS[0]:-}" = "pnpm" ] || return 1
  local t
  for t in "${TOKENS[@]}"; do
    [ "$t" = "exec" ] && return 0
  done
  return 1
}

# Check each command segment (split on &&, ||, ;, |, newline) against the
# rules above, mirroring the allow-list's literal-prefix matching. Splitting
# is quote-naive on purpose: a quoted "&& mkdir " inside e.g. an rg pattern
# can false-positive — the deny reason tells the agent to use Grep/Read
# instead, which is the correct tool there anyway. This is a guardrail
# against honest mistakes, not adversarial-proof (#397): further obfuscation
# (case tricks, path-qualified binaries, wrapper commands) is accepted
# residual risk, documented in README.md.
while IFS= read -r segment; do
  segment="${segment#"${segment%%[![:space:]]*}"}"
  [ -z "$segment" ] && continue

  if git_subcommand_denied "$segment"; then
    deny "$GUARD_LABEL: this git command mutates the working tree, repo, or board state. Report the change you wanted to make instead of applying it; for searching, prefer the Grep/Read tools."
  fi
  if pnpm_exec_denied "$segment"; then
    deny "$GUARD_LABEL: 'pnpm exec'/'--filter ... exec' runs an arbitrary command and can mutate the tree. Report the change you wanted to make instead of applying it."
  fi
  for prefix in "${DENY_PREFIXES[@]}"; do
    case "$segment" in
    "$prefix" | "$prefix"[[:space:]]*)
      deny "$GUARD_LABEL: '$prefix' mutates the working tree, repo, or board state. Report the change you wanted to make instead of applying it; for searching, prefer the Grep/Read tools."
      ;;
    esac
  done
done <<EOF
$(printf '%s\n' "$cmd" | awk '{gsub(/&&|\|\||;|\|/, "\n"); print}')
EOF

exit 0
