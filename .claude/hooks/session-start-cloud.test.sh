#!/bin/sh
# Regression tests for session-start-cloud.sh.
#
# Run: sh .claude/hooks/session-start-cloud.test.sh
set -u

dir=$(cd "$(dirname "$0")" && pwd)
hook="$dir/session-start-cloud.sh"
fails=0

repo=$(mktemp -d) || exit 1
[ -n "$repo" ] && [ -d "$repo" ] || exit 1
trap 'rm -rf "$repo"' EXIT
git -C "$repo" init -q -b main
git -C "$repo" -c user.name=t -c user.email=t@example.com commit -q --allow-empty -m init
mkdir "$repo/node_modules"

run() {
	CLAUDE_CODE_REMOTE=$1 CLAUDE_PROJECT_DIR=$repo sh "$hook"
}

expect() {
	label=$1
	want=$2
	got=$3
	case "$got" in
	*"$want"*) ;;
	*)
		printf 'FAIL %s: want output containing [%s], got [%s]\n' "$label" "$want" "$got"
		fails=$((fails + 1))
		;;
	esac
}

expect_silent() {
	label=$1
	got=$2
	if [ -n "$got" ]; then
		printf 'FAIL %s: want no output, got [%s]\n' "$label" "$got"
		fails=$((fails + 1))
	fi
}

git -C "$repo" switch -q -C claude/issue-123-abc123
# shellcheck disable=SC2016
expect 'cloud, generated branch' 'git branch -m "$(pnpm -s branch:name 123 "<title>")"' "$(run true)"
expect_silent 'local session' "$(run '')"

git -C "$repo" switch -q -C feat/123-a-team-may-have
expect_silent 'cloud, ticket branch' "$(run true)"

git -C "$repo" switch -q --detach
expect_silent 'cloud, detached HEAD' "$(run true)"

if [ "$fails" -ne 0 ]; then
	echo "$fails case(s) failed"
	exit 1
fi
echo "all cases passed"
