#!/usr/bin/env bash
# Block/pass matrix for subagent-stop-commit-guard.sh — #3354.
#
# Contract differs from the PreToolUse siblings: a SubagentStop hook signals a
# block with a top-level `{"decision":"block","reason":…}` on stdout, not a
# `hookSpecificOutput.permissionDecision`. No stdout means pass. The guard
# always exits 0 either way.
#
# Hermetic: each case builds its own throwaway git repo under a path shaped
# like an agent worktree (`…/.claude/worktrees/agent-<x>`) or not, so no real
# worktree, network, or live session state is involved.
#
# Run: bash .claude/hooks/subagent-stop-commit-guard.test.sh
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
guard="$script_dir/subagent-stop-commit-guard.sh"

pass=0
fail=0

root=$(mktemp -d)
trap 'rm -rf "$root"' EXIT

# Creates a git repo at $1 with one committed file, so `git status` is clean
# until a case dirties it.
make_repo() {
  local dir=$1
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" -c user.name=t -c user.email=t@t config commit.gpgsign false
  printf 'base\n' >"$dir/base.txt"
  git -C "$dir" add base.txt
  git -C "$dir" -c user.name=t -c user.email=t@t commit -q -m 'base'
}

# $1 payload (raw stdin), $2 directory to run the guard from, $3 expected
# block|pass, $4 label.
run_and_assert() {
  local payload=$1 from_dir=$2 expected=$3 label=$4
  local output decision
  output=$(cd "$from_dir" && printf '%s' "$payload" | bash "$guard")
  if [ -z "$output" ]; then
    decision="pass"
  else
    decision=$(printf '%s' "$output" | jq -r 'if .decision == "block" then "block" else "pass" end' 2>/dev/null) || decision="pass"
  fi
  if [ "$decision" = "$expected" ]; then
    pass=$((pass + 1))
    printf '  ok   %s\n' "$label"
  else
    fail=$((fail + 1))
    printf '  FAIL %s (expected %s, got %s)\n    output: %s\n' "$label" "$expected" "$decision" "$output"
  fi
}

# Runs the guard with `cwd` set in the JSON payload; the process cwd is
# somewhere unrelated so a fallback to $PWD would be visible as a wrong answer.
check_json_cwd() {
  local dir=$1 expected=$2 label=$3
  local payload
  payload=$(jq -n --arg cwd "$dir" '{hook_event_name: "SubagentStop", cwd: $cwd}')
  run_and_assert "$payload" "$root" "$expected" "$label"
}

# Runs the guard with no `cwd` field, from inside $1, so only the $PWD
# fallback can locate the worktree.
check_pwd_fallback() {
  local dir=$1 expected=$2 label=$3
  run_and_assert '{"hook_event_name": "SubagentStop"}' "$dir" "$expected" "$label"
}

agent_clean="$root/.claude/worktrees/agent-clean0001"
agent_dirty="$root/.claude/worktrees/agent-dirty0002"
agent_untracked="$root/.claude/worktrees/agent-untracked3"
agent_nested="$root/.claude/worktrees/agent-nested0004"
session_wt="$root/.claude/worktrees/agents-session-review-5"
plain_repo="$root/checkout"

make_repo "$agent_clean"
make_repo "$agent_dirty"
printf 'edited\n' >>"$agent_dirty/base.txt"
make_repo "$agent_untracked"
printf 'new\n' >"$agent_untracked/new.txt"
make_repo "$agent_nested"
mkdir -p "$agent_nested/packages/ui"
printf 'edited\n' >>"$agent_nested/base.txt"
make_repo "$session_wt"
printf 'edited\n' >>"$session_wt/base.txt"
make_repo "$plain_repo"
printf 'edited\n' >>"$plain_repo/base.txt"

echo "Agent worktree, cwd from the hook payload:"
check_json_cwd "$agent_clean" pass "clean worktree passes"
check_json_cwd "$agent_dirty" block "modified tracked file blocks"
check_json_cwd "$agent_untracked" block "untracked-only file blocks"
check_json_cwd "$agent_nested/packages/ui" block "cwd nested inside the worktree still blocks"

echo "Not an agent worktree:"
check_json_cwd "$plain_repo" pass "dirty main checkout passes"
check_json_cwd "$session_wt" pass "dirty session worktree (agents-*) is not agent-*"
check_json_cwd "$root/does-not-exist/.claude/worktrees/agent-gone" pass "worktree path that no longer exists passes"

echo "Missing cwd field falls back to PWD:"
check_pwd_fallback "$agent_dirty" block "dirty worktree via PWD blocks"
check_pwd_fallback "$agent_clean" pass "clean worktree via PWD passes"
check_pwd_fallback "$plain_repo" pass "non-worktree PWD passes"

echo "Unparsable payload still resolves cwd from PWD:"
run_and_assert 'not json at all' "$agent_dirty" block "malformed payload, dirty PWD blocks"
run_and_assert 'not json at all' "$plain_repo" pass "malformed payload, non-worktree PWD passes"

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
