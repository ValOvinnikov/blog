#!/bin/sh
# Regression tests for gate-bypass-guard — #397.
#
# The ALLOW bank below is the point of this suite. Most of it is reused
# verbatim from the discarded first attempt's 80-case suite (commit ecc1092,
# `git show ecc1092:.claude/hooks/pre-bash-git-guard.test.sh`) — specifically
# the legitimate commands and lookalikes that previously false-positived or
# had to be hand-fixed across five review rounds. This narrower guard's job
# is to get exactly these right; that is the design constraint that mattered
# last time, more than bypass coverage.
#
# This suite deliberately does NOT reuse ecc1092's adversarial bypass cases
# (newline tricks used to hide a command from a naive scanner, env var
# indirection, shell recursion, case-insensitive filesystems, path-qualified
# binaries, wrapper commands, quote-splitting, backslash-newline
# continuations, clustered short flags) — those are out of scope on purpose;
# see gate-bypass-guard.js's header for why. A handful are asserted as ALLOW
# below anyway, so the scope decision is pinned and visible rather than
# silently missing.
#
# Run: sh .claude/hooks/gate-bypass-guard.test.sh
set -u

dir=$(dirname "$0")
guard="$dir/gate-bypass-guard.sh"
fails=0

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

# --- must BLOCK: the minimum bar, plain and unobfuscated ---------------------
block 'git commit --no-verify -m "x"'
block 'git commit -n -m "x"'
block 'git push --no-verify'
block 'git merge --no-verify main'
block 'git push --force origin main'
block 'git push -f'
block 'git push --force-with-lease origin main'
block 'git push --force-with-lease=main:abc123 origin main'
block 'git push origin +main'
block 'git config core.hooksPath /dev/null'
block 'git config --global core.hooksPath /dev/null'
# git config keys are case-insensitive, so this is still a plain, literal form.
block 'git config CORE.HOOKSPATH /dev/null'
# A chained command is still a plain, single-line form.
block 'git add -A && git commit --no-verify -m "x"'
# A value-taking global option given in its two-token form (not `--flag=value`,
# already covered by the generic dash-prefix skip) must not shift the real
# subcommand into `args` and hide it from every check below — reviewer-found
# gap, not an obfuscation case: this is a completely plain, unobfuscated
# single-line invocation.
block 'git --git-dir /foo/bar commit --no-verify'
block 'git --work-tree /foo push --force origin main'
block 'git --namespace foo commit --no-verify -m x'
block 'git --exec-path /foo commit --no-verify'
# Two ordinary lines is the normal shape of an agent Bash call, not an
# evasion technique — segmenting on newline the same as `;`/`&&` is what lets
# a benign multi-line command (see the ALLOW bank below) parse correctly at
# all, and this case falls out of that for free.
block 'git status
git push --force origin main'

# --- must ALLOW: the repo's own workflow (from ecc1092's ALLOW bank) --------
allow 'git commit -q -m "chore: x"'
allow 'git -C /tmp status'
allow 'git -c user.email=a commit -m "x"'
# Value-taking global options in both their forms, on a subcommand with no
# dangerous flags — must not be misread as blocking just because the global
# option itself is now recognized.
allow 'git --exec-path /foo status'
allow 'git --git-dir=/tmp/.git status'
allow 'git add -A
git commit -m "x"'
allow 'git status
pnpm build'
# "git" as a substring of an ordinary word must not trip the prefilter.
allow 'echo digital'
allow 'git commit -m "x"'
allow 'git push -u origin feat/x'
allow 'git push origin main'
allow 'git status'
allow 'git config user.name "Val"'
allow 'pnpm build'
allow 'echo hello'

# --- must ALLOW: lookalikes that are NOT bypasses (from ecc1092) -----------
# -n is --dry-run for push, --no-stat for merge, --dry-run for clean; only
# `commit -n` is --no-verify.
allow 'git push -n'
allow 'git clean -n'
allow 'git merge -n main'
# -uno is --untracked-files=no; the n is part of a value, not a flag, and this
# guard never inspects inside a token — it just isn't "-n".
allow 'git commit -uno -m "x"'
# Flag-like text inside a quoted message must never be read as a flag: the
# whole quoted string is one token, so it can never equal "-n"/"--no-verify".
allow 'git commit -am "fix -n handling"'
allow 'git commit -m "do not use --no-verify here"'
allow 'git commit -m "revert --force push"'
# A message that names a whole git command is still just a message.
allow 'git commit -m "fix the git push --force bug"'
allow 'bash -c "pnpm build"'

# --- must ALLOW: this repo's own multi-line commit convention --------------
# The realistic case that broke the discarded attempt twice: a commit body
# built with `$(cat <<'EOF' ... EOF)` (this repo's own convention, per
# CLAUDE.md) that itself discusses these flags. If this ever regresses, the
# guard is blocking honest documentation about itself — exactly the failure
# this rewrite exists to avoid.
# shellcheck disable=SC2016 # the $(...) must reach the guard unexpanded
allow 'git commit -m "$(cat <<'"'"'EOF'"'"'
docs: mention --no-verify, -f, and core.hooksPath in a commit body

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"'

# --- known, documented gaps: narrower scope than ecc1092 on purpose --------
# Not chased — see gate-bypass-guard.js's header for why each is out of
# scope. Asserted here so the scope decision is visible, not silently
# missing.
allow 'git commit -an -m "x"'                        # clustered short flag
allow 'git push -uf origin main'                      # clustered short flag
allow 'git -c core.hooksPath=/dev/null commit -m "x"' # transient config override
allow 'GIT push --force origin main'                  # case-insensitive filesystem
allow '/usr/bin/git push --force origin main'         # path-qualified binary
allow 'sudo git push --force origin main'             # wrapper command
allow 'bash -c "git push --force"'                    # shell recursion

if [ "$fails" -eq 0 ]; then
	echo "gate-bypass-guard: all cases pass"
else
	printf 'gate-bypass-guard: %s case(s) failed\n' "$fails"
	exit 1
fi
