#!/usr/bin/env bash
# Deny/allow matrix for layer-scope-guard.sh — #3360.
#
# Same contract as test-writer-scope-guard.sh: the guard always exits 0 and
# signals a deny with a `hookSpecificOutput.permissionDecision` on stdout; no
# stdout means allow. Each case sets `LAYER_PATHS` (and optionally
# `LAYER_FILES`) the way an agent's frontmatter would, and passes `cwd` in the
# payload the way the harness does.
#
# Hermetic: throwaway directories under a temp root shaped like the real
# layout — a primary checkout with `.claude/worktrees/agent-*` and `agents-*`
# worktrees inside it, plus an unrelated sibling checkout — so no live
# worktree, session state or network is involved. Only the nested-cwd case
# needs a real `git init`, since that is the one path that asks git for the
# checkout root.
#
# Run: bash .claude/hooks/layer-scope-guard.test.sh
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
guard="$script_dir/layer-scope-guard.sh"

pass=0
fail=0

root=$(mktemp -d)
trap 'rm -rf "$root"' EXIT

primary="$root/blog"
agent_wt="$primary/.claude/worktrees/agent-0123456789abcdef0"
session_wt="$primary/.claude/worktrees/agents-review-5"
other="$root/other-checkout"
mkdir -p "$primary/packages/ui" "$primary/apps/web" \
  "$agent_wt/packages/ui" "$agent_wt/apps/web" "$agent_wt/packages/config" \
  "$agent_wt/packages/utils" "$agent_wt/configs/eslint" "$agent_wt/packages/ui-foo" \
  "$session_wt/packages/ui" "$other/packages/ui"

# $1 LAYER_PATHS, $2 LAYER_FILES ("" for unset), $3 raw payload, $4 dir to
# run from, $5 expected allow|deny, $6 label.
run_and_assert() {
  local paths=$1 files=$2 payload=$3 from_dir=$4 expected=$5 label=$6
  local output decision
  if [ -n "$files" ]; then
    output=$(cd "$from_dir" && printf '%s' "$payload" | LAYER_PATHS="$paths" LAYER_FILES="$files" bash "$guard")
  elif [ -n "$paths" ]; then
    output=$(cd "$from_dir" && printf '%s' "$payload" | LAYER_PATHS="$paths" bash "$guard")
  else
    output=$(cd "$from_dir" && printf '%s' "$payload" | env -u LAYER_PATHS -u LAYER_FILES bash "$guard")
  fi
  if [ -z "$output" ]; then
    decision="allow"
  else
    decision=$(printf '%s' "$output" | jq -r '.hookSpecificOutput.permissionDecision // "allow"' 2>/dev/null) || decision="allow"
  fi
  if [ "$decision" = "$expected" ]; then
    pass=$((pass + 1))
    printf '  ok   %s\n' "$label"
  else
    fail=$((fail + 1))
    printf '  FAIL %s (expected %s, got %s)\n    output: %s\n' "$label" "$expected" "$decision" "$output"
  fi
}

# $1 LAYER_PATHS, $2 cwd for the payload, $3 file_path, $4 expected, $5 label.
check() {
  local paths=$1 cwd=$2 path=$3 expected=$4 label=$5
  local payload
  payload=$(jq -n --arg cwd "$cwd" --arg path "$path" \
    '{hook_event_name: "PreToolUse", tool_name: "Edit", cwd: $cwd, tool_input: {file_path: $path}}')
  run_and_assert "$paths" "" "$payload" "$root" "$expected" "$label"
}

# Same, with LAYER_FILES=$2 set as well.
check_files() {
  local paths=$1 files=$2 cwd=$3 path=$4 expected=$5 label=$6
  local payload
  payload=$(jq -n --arg cwd "$cwd" --arg path "$path" \
    '{hook_event_name: "PreToolUse", tool_name: "Write", cwd: $cwd, tool_input: {file_path: $path}}')
  run_and_assert "$paths" "$files" "$payload" "$root" "$expected" "$label"
}

echo "Own layer, own checkout (agent worktree):"
check packages/ui "$agent_wt" "$agent_wt/packages/ui/src/atoms/button.tsx" allow "ui edits packages/ui by absolute path"
check packages/ui "$agent_wt" "$agent_wt/packages/ui/src/atoms/new-file.tsx" allow "ui writes a file that does not exist yet"
check apps/web "$agent_wt" "$agent_wt/apps/web/src/app/page.tsx" allow "web edits apps/web"
check packages/ui "$agent_wt" "$agent_wt/packages/ui" allow "the prefix directory itself"
check packages/ui/ "$agent_wt" "$agent_wt/packages/ui/src/x.ts" allow "trailing slash on the prefix is tolerated"

echo "Other layer's files:"
check apps/web "$agent_wt" "$agent_wt/packages/ui/src/atoms/button.tsx" deny "web cannot write under packages/ui"
check packages/ui "$agent_wt" "$agent_wt/apps/web/src/app/page.tsx" deny "ui cannot write under apps/web"
check packages/ui "$agent_wt" "$agent_wt/package.json" deny "repo-root file is not in any layer"

echo "Outside the agent's own checkout:"
check packages/ui "$agent_wt" "$primary/packages/ui/src/atoms/button.tsx" deny "primary checkout by absolute path"
check packages/ui "$agent_wt" "$other/packages/ui/src/atoms/button.tsx" deny "unrelated sibling checkout"
check packages/ui "$agent_wt" "$session_wt/packages/ui/src/x.ts" deny "the session's own agents-* worktree"
check packages/ui "$session_wt" "$session_wt/packages/ui/src/x.ts" allow "a session worktree as the agent's cwd is fine"
check packages/ui "$primary" "$primary/packages/ui/src/x.ts" allow "an un-isolated agent in the primary checkout is fine"

echo "Relative paths resolve against cwd:"
check packages/ui "$agent_wt" "packages/ui/src/atoms/button.tsx" allow "relative in-layer path"
check packages/ui "$agent_wt" "./packages/ui/src/atoms/button.tsx" allow "dot-relative in-layer path"
check packages/ui "$agent_wt" "apps/web/src/app/page.tsx" deny "relative other-layer path"
check packages/ui "$agent_wt" "../../../packages/ui/src/x.ts" deny "dot-dot climbs out of the worktree into the primary checkout"
check packages/ui "$agent_wt" "packages/ui/../../apps/web/src/x.ts" deny "dot-dot inside the path is normalised before matching"
check packages/ui "$agent_wt" "packages//ui/src/x.ts" allow "doubled slash is normalised"

echo "Prefix boundary:"
check packages/ui "$agent_wt" "$agent_wt/packages/ui-foo/src/x.ts" deny "packages/ui-foo does not match prefix packages/ui"
check packages/ui "$agent_wt" "$agent_wt/packages/uix.ts" deny "packages/uix.ts does not match prefix packages/ui"
check packages/u "$agent_wt" "$agent_wt/packages/ui/src/x.ts" deny "prefix packages/u does not match packages/ui"

echo "Multi-prefix LAYER_PATHS (config):"
config_paths="packages/config:packages/utils:configs"
check "$config_paths" "$agent_wt" "$agent_wt/packages/config/src/constants/cta.ts" allow "first prefix"
check "$config_paths" "$agent_wt" "$agent_wt/packages/utils/src/slug.ts" allow "middle prefix"
check "$config_paths" "$agent_wt" "$agent_wt/configs/eslint/base.js" allow "last prefix"
check "$config_paths" "$agent_wt" "$agent_wt/packages/ui/src/x.ts" deny "not in any of the three"
check "packages/config::configs" "$agent_wt" "$agent_wt/configs/eslint/base.js" allow "empty segment in the list is ignored"

echo "LAYER_FILES suffixes anywhere in the checkout:"
alias_files="tsconfig.json:vitest.config.ts"
check_files packages/email "$alias_files" "$agent_wt" "$agent_wt/apps/web/tsconfig.json" allow "email may wire a consumer's tsconfig.json"
check_files packages/email "$alias_files" "$agent_wt" "$agent_wt/apps/web/vitest.config.ts" allow "email may wire a consumer's vitest.config.ts"
check_files packages/email "$alias_files" "$agent_wt" "$agent_wt/tsconfig.json" allow "a root-level tsconfig.json matches too"
check_files packages/email "$alias_files" "$agent_wt" "$agent_wt/apps/web/src/x.ts" deny "other consumer files stay denied"
check_files packages/email "$alias_files" "$agent_wt" "$agent_wt/apps/web/tsconfig.json.bak" deny "suffix must end the path"
check_files packages/email "$alias_files" "$agent_wt" "$agent_wt/apps/web/mytsconfig.json" deny "suffix must start a path segment"
check_files packages/email "$alias_files" "$agent_wt" "$primary/apps/web/tsconfig.json" deny "checkout check still applies to LAYER_FILES"

echo "MultiEdit carries the same file_path:"
multi=$(jq -n --arg cwd "$agent_wt" --arg path "$agent_wt/apps/web/src/x.ts" \
  '{hook_event_name: "PreToolUse", tool_name: "MultiEdit", cwd: $cwd, tool_input: {file_path: $path, edits: [{old_string: "a", new_string: "b"}]}}')
run_and_assert packages/ui "" "$multi" "$root" deny "ui MultiEdit under apps/web"
multi=$(jq -n --arg cwd "$agent_wt" --arg path "$agent_wt/packages/ui/src/x.ts" \
  '{hook_event_name: "PreToolUse", tool_name: "MultiEdit", cwd: $cwd, tool_input: {file_path: $path, edits: [{old_string: "a", new_string: "b"}]}}')
run_and_assert packages/ui "" "$multi" "$root" allow "ui MultiEdit under packages/ui"

echo "Nested cwd resolves the checkout root through git:"
repo="$root/repo/.claude/worktrees/agent-nested0004"
mkdir -p "$repo/packages/ui" "$repo/packages/config"
git -C "$repo" init -q
check "$config_paths" "$repo/packages/ui" "$repo/packages/config/src/x.ts" allow "cwd inside the worktree still allows a sibling prefix"
check "$config_paths" "$repo/packages/ui" "$root/repo/packages/config/src/x.ts" deny "…but not the primary checkout above it"

echo "Missing cwd falls back to PWD:"
no_cwd=$(jq -n --arg path "packages/ui/src/x.ts" '{tool_input: {file_path: $path}}')
run_and_assert packages/ui "" "$no_cwd" "$agent_wt" allow "relative in-layer path from PWD"
no_cwd=$(jq -n --arg path "apps/web/src/x.ts" '{tool_input: {file_path: $path}}')
run_and_assert packages/ui "" "$no_cwd" "$agent_wt" deny "relative other-layer path from PWD"

echo "Fails open:"
unset_payload=$(jq -n --arg cwd "$agent_wt" --arg path "$agent_wt/apps/web/src/x.ts" \
  '{cwd: $cwd, tool_input: {file_path: $path}}')
run_and_assert "" "" "$unset_payload" "$root" allow "LAYER_PATHS unset passes an other-layer path"
output=$(cd "$root" && printf '%s' "$unset_payload" | LAYER_PATHS="" bash "$guard")
if [ -z "$output" ]; then
  pass=$((pass + 1))
  printf '  ok   %s\n' "LAYER_PATHS set but empty passes too"
else
  fail=$((fail + 1))
  printf '  FAIL LAYER_PATHS set but empty passes too\n    output: %s\n' "$output"
fi
check packages/ui "$agent_wt" "" allow "empty file_path"
run_and_assert packages/ui "" '{"cwd": "'"$agent_wt"'", "tool_input": {}}' "$root" allow "missing file_path key"
run_and_assert packages/ui "" 'not json at all' "$root" allow "malformed (non-JSON) payload"

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
