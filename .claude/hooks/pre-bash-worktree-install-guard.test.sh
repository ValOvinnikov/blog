#!/bin/sh
# Regression tests for pre-bash-worktree-install-guard.sh.
#
# The guard is a hand-written regex tokenizer for "is `pnpm <mutating verb>`
# at command position" — the same class of parsing logic that took three
# review rounds to get right in gate-bypass-guard.js (#397) and turned up
# real bypasses in read-only-agent-guard.sh (#425). This suite pins the
# intended behavior so a future edit can't silently reopen a gap: bare
# mutating subcommands, flag-tolerant forms (`--filter`/`-F`/`--dir`/`-C` in
# both `--flag value` and `--flag=value` shapes), compound commands where the
# mutating call is a later segment, and the negative cases (non-mutating
# pnpm commands, and commands that merely *mention* pnpm install).
#
# Run: sh .claude/hooks/pre-bash-worktree-install-guard.test.sh
set -u

dir=$(dirname "$0")
guard="$dir/pre-bash-worktree-install-guard.sh"
fails=0

# The guard only activates when node_modules is a symlink (the shared-deps
# worktree shape .husky/post-checkout creates) — so point CLAUDE_PROJECT_DIR
# at a scratch dir with a symlinked node_modules for every case below. A
# companion case near the end proves the guard stays inert when
# node_modules is a real directory (the primary checkout's shape).
# An empty path from a failed mktemp would point every fixture, and the
# cleanup's rm -rf, at the current directory.
require_dir() {
	if [ -z "$1" ] || [ ! -d "$1" ]; then
		echo 'pre-bash-worktree-install-guard: mktemp failed; no fixture directory, nothing was run'
		exit 1
	fi
}

scratch=$(mktemp -d) || scratch=
require_dir "$scratch"
target=$(mktemp -d) || target=
require_dir "$target"
ln -s "$target" "$scratch/node_modules"
export CLAUDE_PROJECT_DIR="$scratch"

cleanup() {
	rm -rf "$scratch" "$target"
}
trap cleanup EXIT

expect() {
	want=$1
	cmd=$2
	payload=$(jq -n --arg cmd "$cmd" '{tool_input: {command: $cmd}}')
	printf '%s' "$payload" | sh "$guard" >/dev/null 2>&1
	got=$?
	if [ "$got" != "$want" ]; then
		printf 'FAIL want=%s got=%s  %s\n' "$want" "$got" "$cmd"
		fails=$((fails + 1))
	fi
}

block() { expect 2 "$1"; }
allow() { expect 0 "$1"; }

# Same assertion, but feeds $1 to the guard as a raw (non-JSON-wrapped) stdin
# payload — exercises the guard's "malformed payload -> empty command ->
# allow" fallback (see the node -e block's catch).
raw_expect() {
	want=$1
	raw=$2
	printf '%s' "$raw" | sh "$guard" >/dev/null 2>&1
	got=$?
	if [ "$got" != "$want" ]; then
		printf 'FAIL want=%s got=%s  (raw payload) %s\n' "$want" "$got" "$raw"
		fails=$((fails + 1))
	fi
}

# --- must BLOCK: bare mutating subcommands, at command position ------------
block 'pnpm install'
block 'pnpm i'
block 'pnpm add lodash'
block 'pnpm remove lodash'
block 'pnpm rm lodash'
block 'pnpm uninstall lodash'
block 'pnpm un lodash'
block 'pnpm update'
block 'pnpm up'
block 'pnpm upgrade'
block 'pnpm dedupe'
block 'pnpm rebuild'
block 'pnpm prune'
block 'pnpm import'
block 'pnpm link ../foo'
block 'pnpm unlink foo'
block 'pnpm patch-commit /tmp/x'
block 'pnpm store prune'
block '  pnpm install'

# --- must BLOCK: flags before the subcommand, both value forms -------------
block 'pnpm --filter web install'
block 'pnpm --filter=web install'
block 'pnpm --filter web add lodash'
block 'pnpm -F web install'
block 'pnpm --dir ./apps/web install'
block 'pnpm --dir=./apps/web install'
block 'pnpm -C ./apps/web install'
block 'pnpm --filter web --filter foo install'

# --- must BLOCK: the mutating call as a later segment of a compound --------
block 'echo hi; pnpm install'
block 'echo hi && pnpm install'
block 'echo hi | pnpm install'
block 'echo start; echo mid; pnpm install'
# shellcheck disable=SC2016 # the $(...) must reach the guard unexpanded
block 'x=$(pnpm install)'
block 'foo() ( pnpm install )'

# --- must ALLOW: non-mutating pnpm commands ---------------------------------
allow 'pnpm test'
allow 'pnpm build'
allow 'pnpm lint'
# typegen is not on the guard's mutating-subcommand list (only
# i/install/add/remove/rm/uninstall/un/update/up/upgrade/dedupe/rebuild/
# prune/import/link/unlink/patch-commit/store prune) — pinned here so a
# future edit that narrows or widens that list shows up as an intentional
# diff in this test, not a silent behavior change.
allow 'pnpm typegen'
allow 'pnpm run build'
allow 'pnpm exec eslint'
allow 'pnpm dlx foo'
allow 'pnpm --filter web test'
allow 'pnpm publish'
allow 'pnpm audit'
allow 'pnpm outdated'
allow 'pnpm ls'

# --- must ALLOW: pnpm with no subcommand, or not actually pnpm -------------
allow 'pnpm'
allow 'pnpm --version'
allow 'pnpmx install'
allow 'echo pnpm'

# --- must ALLOW: pnpm install merely *mentioned*, not invoked ---------------
allow 'echo "run pnpm install to set things up"'
allow '# pnpm install'
allow 'grep "pnpm install" README.md'

# --- must ALLOW: empty command, or a malformed (non-JSON) payload -----------
allow ''
raw_expect 0 'not json at all'

# --- known, documented gap: a closing backtick is not a recognized trailing
# boundary. `` `pnpm install` `` is a real command substitution that still
# runs pnpm install, but the guard's trailing-boundary class after the
# subcommand ([[:space:]);&|] or end-of-string) doesn't include a backtick,
# so the match never completes when the backtick closes immediately after
# the subcommand with no intervening space. Found while writing this suite;
# reported back as a finding per #459's no-scope-creep instruction rather
# than fixed here. Pinned as ALLOW so it's visible, not silently missing —
# note the very next case shows a trailing space inside the backticks closes
# the gap (space *is* in the trailing-boundary class).
# shellcheck disable=SC2016 # backticks must reach the guard unexpanded
allow '`pnpm install`'
# shellcheck disable=SC2016 # backticks must reach the guard unexpanded
allow 'x=`pnpm install`'
# shellcheck disable=SC2016 # backticks must reach the guard unexpanded
block '`pnpm install `'

# --- must ALLOW: inert when node_modules is a real directory ---------------
real_scratch=$(mktemp -d)
mkdir "$real_scratch/node_modules"
payload=$(jq -n --arg cmd 'pnpm install' '{tool_input: {command: $cmd}}')
printf '%s' "$payload" | CLAUDE_PROJECT_DIR="$real_scratch" sh "$guard" >/dev/null 2>&1
got=$?
rm -rf "$real_scratch"
if [ "$got" != 0 ]; then
	printf 'FAIL want=0 got=%s  pnpm install (real node_modules dir, guard should be inert)\n' "$got"
	fails=$((fails + 1))
fi

# --- the payload's cwd decides, not CLAUDE_PROJECT_DIR ----------------------
cwd_expect() {
	want=$1
	project_dir=$2
	cwd=$3
	label=$4
	payload=$(jq -n --arg cwd "$cwd" '{cwd: $cwd, tool_input: {command: "pnpm install"}}')
	printf '%s' "$payload" | CLAUDE_PROJECT_DIR="$project_dir" sh "$guard" >/dev/null 2>&1
	got=$?
	if [ "$got" != "$want" ]; then
		printf 'FAIL want=%s got=%s  %s\n' "$want" "$got" "$label"
		fails=$((fails + 1))
	fi
}

primary=$(mktemp -d)
mkdir "$primary/node_modules"
shared_wt=$(mktemp -d)
git -C "$shared_wt" init -q
ln -s "$primary/node_modules" "$shared_wt/node_modules"
mkdir -p "$shared_wt/apps/web"
private_wt=$(mktemp -d)
git -C "$private_wt" init -q
mkdir "$private_wt/node_modules"

cwd_expect 2 "$primary" "$shared_wt" "shared-deps worktree blocks although CLAUDE_PROJECT_DIR is the primary checkout"
cwd_expect 2 "$primary" "$shared_wt/apps/web" "cwd nested inside a shared-deps worktree blocks"
cwd_expect 0 "$scratch" "$private_wt" "private worktree allows although CLAUDE_PROJECT_DIR has a symlinked tree"
rm -rf "$primary" "$shared_wt" "$private_wt"

# --- an install aimed at another worktree is judged by that worktree --------
# The session sits in a shared-deps worktree; only `cd <linked worktree whose
# node_modules is not a symlink> && pnpm install [--frozen-lockfile]` passes.
target_expect() {
	want=$1
	cmd=$2
	label=$3
	payload=$(jq -n --arg cwd "$session_wt" --arg cmd "$cmd" '{cwd: $cwd, tool_input: {command: $cmd}}')
	printf '%s' "$payload" | CLAUDE_PROJECT_DIR="$repo" sh "$guard" >/dev/null 2>&1
	got=$?
	if [ "$got" != "$want" ]; then
		printf 'FAIL want=%s got=%s  %s\n' "$want" "$got" "$label"
		fails=$((fails + 1))
	fi
}

worktrees=$(mktemp -d) || worktrees=
require_dir "$worktrees"
worktrees=$(cd "$worktrees" && pwd -P)
repo="$worktrees/repo"
git init -q "$repo"
git -C "$repo" -c user.name=t -c user.email=t@example.com commit -q --allow-empty -m init
mkdir "$repo/node_modules"
session_wt="$worktrees/session"
review_wt="$worktrees/review"
seeded_wt="$worktrees/seeded"
git -C "$repo" worktree add -q --detach "$session_wt"
git -C "$repo" worktree add -q --detach "$review_wt"
git -C "$repo" worktree add -q --detach "$seeded_wt"
ln -s "$repo/node_modules" "$session_wt/node_modules"
ln -s "$repo/node_modules" "$seeded_wt/node_modules"
mkdir -p "$review_wt/apps/web"

target_expect 0 "cd $review_wt && pnpm install --frozen-lockfile" "install in a worktree with no symlink passes"
target_expect 0 "cd $review_wt && pnpm install" "plain install in a worktree with no symlink passes"
target_expect 0 "cd $review_wt/apps/web && pnpm i" "a directory nested in that worktree passes"
target_expect 2 "cd $seeded_wt && pnpm install" "a worktree still holding the symlink blocks"
target_expect 2 "cd $seeded_wt && rm node_modules && pnpm install" "removing the symlink in the same command blocks"
target_expect 2 "cd $repo && pnpm install" "the primary checkout blocks"
target_expect 2 "cd $session_wt && pnpm install" "the session's own shared worktree blocks"
target_expect 2 "cd $review_wt && cd $seeded_wt && pnpm install" "a second cd blocks"
target_expect 2 "cd $review_wt && pnpm -C $seeded_wt install" "a redirected install blocks"
target_expect 2 "cd $review_wt && pnpm install --modules-dir $repo/node_modules" "any other install flag blocks"
target_expect 2 "cd $review_wt && pnpm add lodash" "a dependency change blocks"
target_expect 2 "cd ../review && pnpm install" "a relative target blocks"
target_expect 2 "cd $worktrees && pnpm install" "a target outside any repository blocks"
target_expect 2 "cd $review_wt && pnpm install
cd $seeded_wt && pnpm install" "a second line blocks"
rm -rf "$worktrees"

if [ "$fails" -eq 0 ]; then
	echo "pre-bash-worktree-install-guard: all cases pass"
else
	printf 'pre-bash-worktree-install-guard: %s case(s) failed\n' "$fails"
	exit 1
fi
