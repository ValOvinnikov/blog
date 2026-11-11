#!/bin/sh
# Regression tests for pre-bash-branch-name-guard.sh.
#
# Run: sh .claude/hooks/pre-bash-branch-name-guard.test.sh
set -u

dir=$(cd "$(dirname "$0")" && pwd)
guard="$dir/pre-bash-branch-name-guard.sh"
fails=0

repo=$(mktemp -d) || exit 1
[ -n "$repo" ] && [ -d "$repo" ] || exit 1
trap 'rm -rf "$repo"' EXIT
git -C "$repo" init -q -b main
git -C "$repo" -c user.name=t -c user.email=t@example.com commit -q --allow-empty -m init
git init -q --bare "$repo/.origin.git"
git -C "$repo" remote add origin "$repo/.origin.git"
git -C "$repo" push -q origin main:claude/issue-7015-o0wc5t

on_branch() {
	git -C "$repo" switch -q -C "$1"
}

expect() {
	want=$1
	cmd=$2
	payload=$(jq -n --arg cmd "$cmd" '{tool_input: {command: $cmd}}')
	(cd "$repo" && printf '%s' "$payload" | sh "$guard" >/dev/null 2>&1)
	got=$?
	if [ "$got" != "$want" ]; then
		printf 'FAIL want=%s got=%s  [%s] %s\n' "$want" "$got" "$(git -C "$repo" branch --show-current)" "$cmd"
		fails=$((fails + 1))
	fi
}

block() { expect 2 "$1"; }
allow() { expect 0 "$1"; }

on_branch claude/optimistic-noether-isuljn
block 'git push'
block 'git push -u origin HEAD'
block 'git push -u origin claude/optimistic-noether-isuljn'
block 'git push -u origin HEAD 2>&1 | tail -15'
block 'git fetch origin && git push origin HEAD'
block "git -C $repo push"
block 'GIT_SSH_COMMAND=x git push'
block 'env GIT_SSH_COMMAND=x git push'
block 'git push -o skip-ci origin'
block 'git push --push-option skip-ci origin'
block 'git push --force-with-lease origin'
allow 'git push origin HEAD:feat/3952-team-single-member'
allow 'git push origin main'
allow 'git push origin v1.2.3:refs/tags/v1.2.3'
block 'git push origin HEAD:tooling/branch-name-push-guard'
allow 'git push origin --delete claude/optimistic-noether-isuljn'
allow 'git push origin :claude/optimistic-noether-isuljn'
allow 'git push --tags'
allow 'git commit -m "then git push it"'
allow 'git status'
allow 'echo push'

on_branch claude/issue-7015-o0wc5t
allow 'git push'
allow 'git push origin HEAD'
block 'git push origin HEAD:claude/issue-7016-n2ecx3'
allow 'git push nowhere HEAD:feat/7016-x'
block 'git push nowhere HEAD:claude/issue-7015-o0wc5t'

on_branch claude/vercel-react-best-practices-7c35f1
block 'git push -u origin HEAD'

on_branch claude/issue-3949-20260930-1428
allow 'git push -u origin HEAD'

on_branch claude/issue-3949-a1b2c3
block 'git push -u origin HEAD'
allow 'git push origin HEAD:feat/3949-team-single-member'

on_branch feat/3952-team-single-member
allow 'git push'
allow 'git push -o skip-ci origin'
allow 'GIT_SSH_COMMAND=x git push'
allow 'git push -u origin HEAD'
block 'git push origin HEAD:claude/eager-wozniak-gsbpiz'
allow 'git push -u origin HEAD 2>&1 | tail -15'
allow 'git push origin HEAD > push.log 2>&1'
allow 'git push origin HEAD 2> /dev/null'

on_branch tooling/branch-name-push-guard
block 'git push -u origin HEAD'

on_branch dependabot/npm_and_yarn/next-16.1.0
allow 'git push'

git -C "$repo" switch -q --detach
allow 'git push origin HEAD:refs/heads/fix/1-x'

printf '%s' 'not json' | sh "$guard" >/dev/null 2>&1 || {
	echo 'FAIL malformed payload was blocked'
	fails=$((fails + 1))
}

if [ "$fails" -ne 0 ]; then
	echo "$fails case(s) failed"
	exit 1
fi
echo "all cases passed"
