#!/usr/bin/env bash
# PreToolUse guard for the ten layer agents — an Edit/Write must land inside
# the agent's own checkout AND inside its layer's workspace(s) (#3360).
#
# Every layer agent runs with `isolation: worktree`, but that isolation is
# cwd-only: Edit/Write resolve an absolute path literally, so an agent that
# types `/Users/…/Projects/blog/packages/db/…` from habit edits the primary
# checkout instead of its worktree (memory records the `db` agent doing it on
# #1732 and three repeats during #2144). Nothing stops it editing another
# layer's files either — the boundary lives only in each agent's prose. This
# hook is the enforcement for the Edit/Write surface: two checks, both must
# pass.
#
#   1. Checkout: the target, absolutised against the payload's `cwd` (falling
#      back to `$PWD`) and lexically normalised, must sit under the agent's
#      own checkout — the git toplevel of `cwd`, or `cwd` itself when git
#      can't answer. `$CLAUDE_PROJECT_DIR` is deliberately NOT used: it names
#      the *session's* project dir, which for a worktree-isolated agent is
#      exactly the primary checkout this check exists to keep it out of.
#   2. Layer: the checkout-relative path must sit under one of the
#      colon-separated repo-relative prefixes in `LAYER_PATHS`
#      (`packages/ui`, `packages/config:packages/utils:configs`, …). A prefix
#      matches a directory and its descendants only — `packages/ui` never
#      matches `packages/ui-foo`. `LAYER_FILES`, optional, is a
#      colon-separated list of path suffixes (`tsconfig.json:vitest.config.ts`)
#      allowed anywhere in the checkout, for the two layers whose docs send
#      them into every consumer's alias wiring.
#
# Wired in each layer agent's frontmatter with its own `LAYER_PATHS`, so the
# same script carries every layer's scope without a lookup table here.
#
# Edit/Write is the only surface this covers: a layer agent's Bash can still
# `mv`/`cp` across the boundary, and unlike test-writer nothing closes that
# half — accepted residual gap, documented rather than guarded.
#
# Fails open when `jq` is missing or `LAYER_PATHS` is unset/empty — an
# unconfigured guard stays out of the way rather than denying everything, the
# same stance as test-writer-scope-guard.sh and the read-only guard. A missing
# `file_path` (nothing to check) passes too.
set -u

command -v jq >/dev/null 2>&1 || exit 0
[ -z "${LAYER_PATHS:-}" ] && exit 0

input=$(cat)

file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || file_path=""
[ -z "$file_path" ] && exit 0

cwd=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null) || cwd=""
[ -z "$cwd" ] && cwd=$PWD

agent_type=$(printf '%s' "$input" | jq -r '.agent_type // empty' 2>/dev/null) || agent_type=""
layer=${agent_type:+"the ${agent_type} agent"}
layer=${layer:-"a layer agent scoped to ${LAYER_PATHS}"}

normalise() {
  local out="" seg
  local IFS='/'
  for seg in $1; do
    case "$seg" in
    '' | .) ;;
    ..) out=${out%/*} ;;
    *) out="$out/$seg" ;;
    esac
  done
  printf '%s' "${out:-/}"
}

# Symlink-resolves the longest existing ancestor (macOS /tmp is /private/tmp) so a new file compares like its neighbours.
physical() {
  local path=$1 rest="" dir
  while [ ! -d "$path" ] && [ "$path" != "/" ]; do
    rest="/${path##*/}$rest"
    path=${path%/*}
    [ -z "$path" ] && path=/
  done
  dir=$(cd "$path" 2>/dev/null && pwd -P) || dir=$path
  [ "$dir" = / ] && dir=""
  printf '%s%s' "$dir" "$rest"
}

root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null) || root=$cwd
root=$(physical "$(normalise "$root")")

case "$file_path" in
/*) target=$file_path ;;
*) target="$cwd/$file_path" ;;
esac
target=$(physical "$(normalise "$target")")

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

case "$target" in
"$root" | "$root"/*) ;;
*) deny "You are ${layer} (#3360): Edit/Write is confined to your own checkout at \"${root}\". \"${target}\" is outside it — the primary checkout or another worktree is never yours to edit; use the same path relative to your checkout, or report the change as a finding for the owning layer agent." ;;
esac

rel=${target#"$root"}
rel=${rel#/}

IFS=':' read -r -a prefixes <<<"$LAYER_PATHS"
for prefix in "${prefixes[@]}"; do
  prefix=${prefix%/}
  [ -z "$prefix" ] && continue
  case "$rel" in
  "$prefix" | "$prefix"/*) exit 0 ;;
  esac
done

if [ -n "${LAYER_FILES:-}" ]; then
  IFS=':' read -r -a suffixes <<<"$LAYER_FILES"
  for suffix in "${suffixes[@]}"; do
    [ -z "$suffix" ] && continue
    case "$rel" in
    "$suffix" | */"$suffix") exit 0 ;;
    esac
  done
fi

allowed="${LAYER_PATHS//:/, }"
[ -n "${LAYER_FILES:-}" ] && allowed="${allowed} (plus ${LAYER_FILES//:/, } anywhere)"
deny "You are ${layer} (#3360): Edit/Write is scoped to ${allowed}. \"${rel}\" belongs to another layer — report the change as a finding for the owning layer agent instead of editing it."
