#!/usr/bin/env bash
# PreToolUse guard for the read-only subagents (reviewer, explore,
# seo-auditor) — issue #425 — reused for Bash-mutation denial by test-writer
# (#396), which isn't fully read-only.
#
# Wired in each agent's frontmatter, so it fires ONLY for that agent's Bash
# calls. It works together with `permissionMode: dontAsk` in the same
# frontmatter — but #1797 found that combination was documented wrong:
#
#   - dontAsk does NOT fail closed on every command that would otherwise
#     prompt. It runs a command unprompted if it matches `permissions.allow`,
#     is approved by a PreToolUse hook, OR the harness's own built-in
#     classification judges the command safely read-only — that third path
#     isn't this project's to configure, and it is NOT sound: `sed -i`
#     against a real product file ran unprompted and unblocked under
#     dontAsk in #1797, because the harness's own heuristic treated `sed` as
#     an ordinary read/text-processing command without accounting for the
#     `-i` flag turning it into a write. `perl -i`, `tee`, and shell
#     redirection are the same class of misjudgment.
#   - This script is therefore not just "subtracting the allow-list's
#     write-shaped entries" — it is the actual enforcement for every
#     write-shaped command below, full stop, regardless of what dontAsk's
#     own classifier would have done on its own.
#
# Deliberately NOT a general write-detector: #397 established that text
# analysis of shell commands cannot be made sound and its false positives on
# honest commands cost more than they protect. DENY_PREFIXES mirrors the
# write-shaped permissions.allow entries — update it when that list changes.
# The in-place-editor/redirection checks below (#1797) are the one
# deliberate exception to "mirror the allow-list": those shapes have no
# single allow-list prefix to mirror (`sed -i` vs. `sed -n`, `cmd > file` vs.
# `cmd > /dev/null`), so they get their own narrow, targeted detection
# instead of a blanket "any redirection" ban that would also deny harmless
# forms like `>/dev/null`.
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
  "tee"
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

# True if TOKEN (a single dash followed by a cluster of combined short
# flags, e.g. "-npi") activates in-place editing: scans left to right and
# denies the moment it sees the letter `i` (in-place), UNLESS it first hits
# one of STOPCHARS — a flag that consumes the *rest* of the token as its own
# value (a script, a module name, an include path, a backup suffix already
# spoken for) rather than more flag letters, at which point anything after
# it — including a stray `i` — belongs to that value, not to a new switch.
# Shared by sed_inplace_denied and perl_inplace_denied below; each passes its
# own binary's value-consuming letters as STOPCHARS.
inplace_cluster_denied() {
  local body="${1:1}" stopchars="$2" j c
  for ((j = 0; j < ${#body}; j++)); do
    c="${body:j:1}"
    [ "$c" = "i" ] && return 0
    case "$stopchars" in
    *"$c"*) return 1 ;;
    esac
  done
  return 1
}

# True if $1 is a `sed` invocation carrying an in-place-edit flag: `-i`,
# `-i<suffix>` (the mandatory-argument form, e.g. `-i.bak`, `-i''`),
# `--in-place`/`--in-place=<suffix>`, or `-i` combined into a cluster with
# other boolean flags (`-ni`, `-Ei`, …) — GNU sed accepts `-i` anywhere in
# such a cluster, not just leading it. `-e`/`-f`/`-l` each consume the rest
# of their token as a script/file/number, so `inplace_cluster_denied` stops
# scanning at those rather than misreading their value as more flags.
sed_inplace_denied() {
  tokenize "$1"
  [ "${TOKENS[0]:-}" = "sed" ] || return 1
  local t
  for t in "${TOKENS[@]:1}"; do
    case "$t" in
    --in-place | --in-place=*) return 0 ;;
    --*) continue ;;
    -*) inplace_cluster_denied "$t" "efl" && return 0 ;;
    esac
  done
  return 1
}

# True if $1 is a `perl` invocation carrying an in-place-edit flag. Unlike
# `sed`, perl's boolean short options combine into one dash-prefixed cluster
# (`-pi`, `-npi -e`, …), so `-i` can appear anywhere inside a single-dash
# token, not just at the start. A naive "does this token contain the letter
# i" check is unsound here: `-M`/`-I`/`-e`/`-E`/`-m` each consume the *rest*
# of their token as a value (a module name, an include path, inline code),
# so `-Mstrict`/`-Ilib` are common, entirely unrelated flags whose value
# happens to contain the letter i — `inplace_cluster_denied` stops scanning
# at those instead of misreading the value as more flags.
perl_inplace_denied() {
  tokenize "$1"
  [ "${TOKENS[0]:-}" = "perl" ] || return 1
  local t
  for t in "${TOKENS[@]:1}"; do
    case "$t" in
    --* | [!-]*) continue ;;
    esac
    inplace_cluster_denied "$t" "MIeEm" && return 0
  done
  return 1
}

# True if $1 contains shell output redirection to something other than a
# harmless sink (/dev/null, /dev/stderr, /dev/stdout, or duplicating one
# stream onto another via `>&1`/`>&2`) — `>`, `>>`, and their fd-qualified
# forms (`2>`, `1>>`, `&>`, `&>>`) all create or overwrite a file. Only
# detects the operator as its own whitespace-separated token (or immediately
# followed by a fd-dup target in the same token, e.g. `2>&1`) — an operator
# glued to its target with no surrounding space (`echo hi>file`) is a known,
# accepted gap, same posture as the rest of this guard (#397).
redirection_denied() {
  tokenize "$1"
  local i=0
  while [ "$i" -lt "${#TOKENS[@]}" ]; do
    local tok="${TOKENS[$i]}"
    if [[ "$tok" =~ ^[0-9]*(\>\>?|\&\>\>?)$ ]]; then
      local target="${TOKENS[$((i + 1))]:-}"
      case "$target" in
      /dev/null | /dev/stderr | /dev/stdout | '&1' | '&2') ;;
      *) return 0 ;;
      esac
    elif [[ "$tok" =~ ^[0-9]*\>\>?\&[0-9]+$ ]]; then
      : # fd duplication as one token (e.g. "2>&1", "1>>&2") — not a file write
    fi
    i=$((i + 1))
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
# residual risk, documented in docs/context/claude-code.md.
while IFS= read -r segment; do
  segment="${segment#"${segment%%[![:space:]]*}"}"
  [ -z "$segment" ] && continue

  if git_subcommand_denied "$segment"; then
    deny "$GUARD_LABEL: this git command mutates the working tree, repo, or board state. Report the change you wanted to make instead of applying it; for searching, prefer the Grep/Read tools."
  fi
  if pnpm_exec_denied "$segment"; then
    deny "$GUARD_LABEL: 'pnpm exec'/'--filter ... exec' runs an arbitrary command and can mutate the tree. Report the change you wanted to make instead of applying it."
  fi
  if sed_inplace_denied "$segment"; then
    deny "$GUARD_LABEL: 'sed -i'/'--in-place' overwrites the target file. Report the change you wanted to make instead of applying it; for searching, prefer the Grep/Read tools."
  fi
  if perl_inplace_denied "$segment"; then
    deny "$GUARD_LABEL: 'perl -i' overwrites the target file. Report the change you wanted to make instead of applying it; for searching, prefer the Grep/Read tools."
  fi
  if redirection_denied "$segment"; then
    deny "$GUARD_LABEL: this command redirects output to a file, which creates or overwrites it. Report the change you wanted to make instead of applying it; for searching, prefer the Grep/Read tools."
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
