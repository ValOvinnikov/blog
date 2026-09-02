#!/bin/sh
# Regression tests for vercel-ignore-affected.sh — #1712.
#
# The script decides whether a Vercel build runs at all (exit 0 skips, exit 1
# builds), so a wrong answer is invisible until someone notices a project has
# silently stopped deploying — which is exactly how web-ui-library ended up with
# no production deployment at all. This suite pins the base-resolution rules:
# which commit the diff is taken against in each situation, and the two
# outcomes that follow from it.
#
# Each case runs the real script against a throwaway git repo, with `pnpm`
# stubbed on PATH so the turbo call is observable without needing a turbo
# workspace. The stub records the --base it was handed and emulates
# `turbo query affected --exit-code` (0 = not affected, 1 = affected) by
# diffing that base against HEAD.
#
# Run: sh scripts/vercel-ignore-affected.test.sh
set -u

dir=$(dirname "$0")
script=$(cd "$dir" && pwd)/vercel-ignore-affected.sh
fails=0

# Committing needs an identity, and the ambient one must not leak in.
export GIT_AUTHOR_NAME='Test User' GIT_AUTHOR_EMAIL='test@example.com'
export GIT_COMMITTER_NAME='Test User' GIT_COMMITTER_EMAIL='test@example.com'

workdir=$(mktemp -d)
cleanup() {
	rm -rf "$workdir"
}
trap cleanup EXIT

# `pnpm` stub. Records the full argv (so the resolved --base is assertable)
# and stands in for `turbo query affected --exit-code`.
stubdir="$workdir/bin"
mkdir -p "$stubdir"
cat >"$stubdir/pnpm" <<'STUB'
#!/bin/sh
printf '%s\n' "$*" >"$PNPM_STUB_LOG"
base=""
for arg in "$@"; do
	case "$arg" in
	--base=*) base=${arg#--base=} ;;
	esac
done
[ -n "$base" ] || exit 1
# Stands in for `turbo query affected --packages @blog/ui --exit-code`:
# exit 1 (affected) when the diff touches @blog/ui or a package it depends
# on, exit 0 (not affected) otherwise. Modelling the config -> ui graph edge
# matters — turbo genuinely reports ui as affected by any packages/config
# change, which is precisely why the type-only skip has to be its own rule
# rather than something turbo could decide.
if git diff --name-only "$base" HEAD 2>/dev/null |
	grep -qE '^packages/(ui|config)/'; then
	exit 1
else
	exit 0
fi
STUB
chmod +x "$stubdir/pnpm"
PATH="$stubdir:$PATH"
export PATH

# Builds a fresh bare origin + build-clone pair and echoes the clone's path.
# The clone rewrites the GitHub URL the script constructs to the local origin,
# so the script's own `git fetch` resolves offline instead of over the network.
new_repo() {
	name=$1
	origin="$workdir/$name-origin"
	clone="$workdir/$name"

	git init --quiet --bare --initial-branch=main "$origin"
	git clone --quiet "file://$origin" "$clone" 2>/dev/null
	git -C "$clone" config "url.file://$origin.insteadOf" \
		'https://github.com/test-owner/test-repo.git'
	git -C "$clone" symbolic-ref HEAD refs/heads/main

	mkdir -p "$clone/packages/config/src/types" \
		"$clone/packages/config/src/sanity/generated" \
		"$clone/packages/ui/src" \
		"$clone/scripts"
	echo '{}' >"$clone/vercel.json"
	echo 'placeholder' >"$clone/scripts/vercel-ignore-affected.sh"
	echo 'export type A = string;' >"$clone/packages/config/src/types/index.ts"
	echo 'export type B = string;' >"$clone/packages/config/src/sanity/generated/types.ts"
	echo 'export const c = 1;' >"$clone/packages/ui/src/index.ts"
	echo 'readme' >"$clone/README.md"
	git -C "$clone" add -A
	git -C "$clone" commit --quiet -m 'base commit'
	git -C "$clone" push --quiet origin main

	printf '%s' "$clone"
}

# Commits $2 (a file path) with fresh content in repo $1.
commit_file() {
	repo=$1
	path=$2
	mkdir -p "$repo/$(dirname "$path")"
	echo "changed $(date +%s%N)" >>"$repo/$path"
	git -C "$repo" add -A
	git -C "$repo" commit --quiet -m "change $path"
}

# Publishes repo $1's current main to its origin. Every case that models a
# *main* build must call this: on a real production build the commit being
# built is already on origin/main, which is exactly what collapses the
# merge-base fallback onto HEAD. Without the push the origin lags behind and
# the deadlock never reproduces.
publish_main() {
	git -C "$1" push --quiet origin main
}

# expect <want-exit> <label> <repo> [extra watch paths...]
# VERCEL_GIT_PREVIOUS_SHA is inherited from the caller's environment.
expect() {
	want=$1
	label=$2
	repo=$3
	shift 3
	PNPM_STUB_LOG="$workdir/pnpm-args"
	export PNPM_STUB_LOG
	: >"$PNPM_STUB_LOG"
	(
		cd "$repo" && \
			VERCEL_GIT_REPO_OWNER=test-owner \
			VERCEL_GIT_REPO_SLUG=test-repo \
			sh "$script" "@blog/ui" "$@" >/dev/null 2>&1
	)
	got=$?
	if [ "$got" != "$want" ]; then
		printf 'FAIL want=%s got=%s  %s\n' "$want" "$got" "$label"
		fails=$((fails + 1))
	fi
}

# Asserts the base handed to turbo on the most recent expect() run.
expect_base() {
	want=$1
	label=$2
	got=$(sed -n 's/.*--base=\([^ ]*\).*/\1/p' "$workdir/pnpm-args")
	if [ "$got" != "$want" ]; then
		printf 'FAIL base want=%s got=%s  %s\n' "$want" "$got" "$label"
		fails=$((fails + 1))
	fi
}

build() { expect 1 "$@"; }
skip() { expect 0 "$@"; }

# expect_paths <want-exit> <label> <repo> <trigger-path>...
# Allowlist mode takes no package argument and must never reach turbo — falling
# through to affectedness would silently restore the behaviour it replaces, so
# every case asserts the stub stayed untouched.
expect_paths() {
	want=$1
	label=$2
	repo=$3
	shift 3
	PNPM_STUB_LOG="$workdir/pnpm-args"
	export PNPM_STUB_LOG
	: >"$PNPM_STUB_LOG"
	(
		cd "$repo" && \
			VERCEL_GIT_REPO_OWNER=test-owner \
			VERCEL_GIT_REPO_SLUG=test-repo \
			sh "$script" --paths "$@" >/dev/null 2>&1
	)
	got=$?
	if [ "$got" != "$want" ]; then
		printf 'FAIL want=%s got=%s  %s\n' "$want" "$got" "$label"
		fails=$((fails + 1))
	fi
	if [ -s "$PNPM_STUB_LOG" ]; then
		printf 'FAIL turbo was invoked in --paths mode  %s\n' "$label"
		fails=$((fails + 1))
	fi
}

build_paths() { expect_paths 1 "$@"; }
skip_paths() { expect_paths 0 "$@"; }

# --- the #1712 deadlock: a main build with no prior successful deployment ---
# VERCEL_GIT_PREVIOUS_SHA is empty until a project has deployed successfully
# once, so a brand-new project's every main build lands here. The fallback
# must not resolve to HEAD itself — diffing a commit against itself reports
# nothing affected and skips the build forever.
repo=$(new_repo deadlock)
commit_file "$repo" packages/ui/src/index.ts
publish_main "$repo"
VERCEL_GIT_PREVIOUS_SHA='' \
	build 'main build, empty PREVIOUS_SHA, ui changed' "$repo"
expect_base "$(git -C "$repo" rev-parse HEAD^1)" \
	'main build falls back to HEAD^1, not HEAD'

# --- the same deadlock, seen through the watch-path force rule --------------
# A change to the deploy config itself must force a build so it gets validated
# live. With the base resolving to HEAD that diff is always empty, so the rule
# silently never fired on main.
repo=$(new_repo watchpath)
commit_file "$repo" vercel.json
publish_main "$repo"
VERCEL_GIT_PREVIOUS_SHA='' \
	build 'main build, vercel.json changed, forces build' "$repo" \
	vercel.json scripts/vercel-ignore-affected.sh

repo=$(new_repo watchpath-script)
commit_file "$repo" scripts/vercel-ignore-affected.sh
publish_main "$repo"
VERCEL_GIT_PREVIOUS_SHA='' \
	build 'main build, ignore script changed, forces build' "$repo" \
	vercel.json scripts/vercel-ignore-affected.sh

# --- type-only changes cannot alter a Storybook build ----------------------
# Both storybook:build scripts are a bare `storybook build` with no tsc step
# and no typecheck plugin, so Vite erases these files without ever reading
# them for correctness. Nothing they contain can reach the output.
#
# These cases pin an explicit PREVIOUS_SHA rather than exercising the
# fallback, so that what they prove is the type-only rule alone. Left on the
# fallback they would pass against the unfixed script for the wrong reason —
# the deadlock skips everything, type-only or not.
repo=$(new_repo typeonly)
prev=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" packages/config/src/types/index.ts
VERCEL_GIT_PREVIOUS_SHA="$prev" \
	skip 'type-only config change skips' "$repo"

repo=$(new_repo generated)
prev=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" packages/config/src/sanity/generated/types.ts
VERCEL_GIT_PREVIOUS_SHA="$prev" \
	skip 'generated-types-only change skips' "$repo"

repo=$(new_repo typeonly-both)
prev=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" packages/config/src/types/index.ts
commit_file "$repo" packages/config/src/sanity/generated/types.ts
VERCEL_GIT_PREVIOUS_SHA="$prev" \
	skip 'both type-only paths together skip' "$repo"

# A type-only file travelling alongside a real source change must still build
# — the skip is "nothing but type-only changed", not "any type-only present".
repo=$(new_repo mixed)
prev=$(git -C "$repo" rev-parse HEAD)
mkdir -p "$repo/packages/config/src/types"
echo 'export type C = string;' >>"$repo/packages/config/src/types/index.ts"
echo 'export const d = 2;' >>"$repo/packages/ui/src/index.ts"
git -C "$repo" add -A
git -C "$repo" commit --quiet -m 'mixed change'
VERCEL_GIT_PREVIOUS_SHA="$prev" \
	build 'type-only mixed with a real source change still builds' "$repo"

# --- feature-branch behaviour must be untouched by the fix -----------------
# Regression guards: these pass before and after #1712's change. They exist so
# a future edit to the fallback can't quietly repoint the branch case, which
# is the one the merge-base logic is actually correct for.
repo=$(new_repo branch-affected)
git -C "$repo" checkout --quiet -b feature
fork=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" packages/ui/src/index.ts
VERCEL_GIT_PREVIOUS_SHA='' \
	build 'feature branch, ui changed, builds' "$repo"
expect_base "$fork" 'feature branch still bases on the merge-base with main'

repo=$(new_repo branch-unaffected)
git -C "$repo" checkout --quiet -b feature
commit_file "$repo" README.md
VERCEL_GIT_PREVIOUS_SHA='' \
	skip 'feature branch, unrelated change, skips' "$repo"

# --- an explicit PREVIOUS_SHA always wins over any fallback ----------------
repo=$(new_repo explicit)
prev=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" packages/ui/src/index.ts
VERCEL_GIT_PREVIOUS_SHA="$prev" \
	build 'explicit PREVIOUS_SHA drives the diff' "$repo"
expect_base "$prev" 'explicit PREVIOUS_SHA is used verbatim'

# --- fail safe: unresolvable base builds rather than silently skipping -----
# A root commit has no parent and no merge-base, so there is nothing to diff
# against. Building needlessly is recoverable; skipping silently is the bug
# this whole suite exists to prevent.
repo="$workdir/rootonly"
mkdir -p "$repo"
git -C "$repo" init --quiet --initial-branch=main
echo 'x' >"$repo/file.txt"
git -C "$repo" add -A
git -C "$repo" commit --quiet -m 'root commit'
VERCEL_GIT_PREVIOUS_SHA='' \
	build 'unresolvable base builds rather than skips' "$repo"

# --- shallow build clone: deepening to reach HEAD^1 ------------------------
# Vercel's build clone is shallow, so HEAD^1 can be missing exactly when the
# fallback needs it. Reaching that state takes a supplied PREVIOUS_SHA that
# already equals HEAD (Vercel redeploying an already-deployed commit): the
# depth=100 fetch is inside the empty-PREVIOUS_SHA branch, so in this path
# nothing has deepened the clone by the time HEAD^1 is wanted.
origin="$workdir/shallow-origin"
seed="$workdir/shallow-seed"
repo="$workdir/shallow"
git init --quiet --bare --initial-branch=main "$origin"
git clone --quiet "file://$origin" "$seed" 2>/dev/null
git -C "$seed" symbolic-ref HEAD refs/heads/main
mkdir -p "$seed/packages/ui/src"
echo 'export const c = 1;' >"$seed/packages/ui/src/index.ts"
git -C "$seed" add -A
git -C "$seed" commit --quiet -m 'first'
echo 'export const c = 2;' >"$seed/packages/ui/src/index.ts"
git -C "$seed" add -A
git -C "$seed" commit --quiet -m 'second'
git -C "$seed" push --quiet origin main

git clone --quiet --depth=1 "file://$origin" "$repo"
git -C "$repo" config "url.file://$origin.insteadOf" \
	'https://github.com/test-owner/test-repo.git'

# Guard the fixture itself: if the clone ever stops being shallow, the case
# below would pass without the deepen path ever running, and would silently
# stop covering the thing it exists to cover.
if git -C "$repo" rev-parse --verify --quiet HEAD^1 >/dev/null 2>&1; then
	printf 'FAIL fixture is not shallow — HEAD^1 already present, deepen path untested\n'
	fails=$((fails + 1))
fi

# The seed is a full clone of the same origin, so its HEAD^1 is the parent
# the shallow clone must arrive at once deepened.
parent=$(git -C "$seed" rev-parse HEAD^1)
VERCEL_GIT_PREVIOUS_SHA="$(git -C "$repo" rev-parse HEAD)" \
	build 'shallow clone deepens to reach HEAD^1' "$repo"
expect_base "$parent" 'shallow clone resolves HEAD^1 after deepening'

# --- allowlist mode: an explicit trigger list instead of turbo affectedness -
# web's Storybook is scoped to the `web` turbo package, which nearly every
# commit touches, so affected mode rebuilt it on pushes that could not move a
# single story. These cases pin the narrower contract: the trigger list is the
# complete input set, and anything outside it skips.
stories=':(glob)apps/web/**/*.stories.tsx'

repo=$(new_repo paths-story)
prev=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" apps/web/src/components/thing/thing.stories.tsx
VERCEL_GIT_PREVIOUS_SHA="$prev" \
	build_paths 'a story file matches the glob and builds' "$repo" \
	vercel.json "$stories"

# The case affected mode got wrong, and the whole reason the mode exists.
repo=$(new_repo paths-component)
prev=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" apps/web/src/components/thing/thing.tsx
VERCEL_GIT_PREVIOUS_SHA="$prev" \
	skip_paths 'a web component with no story change skips' "$repo" \
	vercel.json "$stories"

# A bare `*` in a git pathspec spans slashes, so without :(glob) magic this
# case would match apps/platform and build.
repo=$(new_repo paths-glob-scope)
prev=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" apps/platform/src/thing.stories.tsx
VERCEL_GIT_PREVIOUS_SHA="$prev" \
	skip_paths 'a story outside apps/web does not match the glob' "$repo" \
	vercel.json "$stories"

# Directory triggers work alongside the glob.
repo=$(new_repo paths-dir)
prev=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" packages/ui/src/index.ts
VERCEL_GIT_PREVIOUS_SHA="$prev" \
	build_paths 'a directory trigger builds' "$repo" \
	vercel.json "$stories" packages/ui

# Deploy-config changes keep forcing a build, same as in affected mode.
repo=$(new_repo paths-config)
prev=$(git -C "$repo" rev-parse HEAD)
commit_file "$repo" vercel.json
VERCEL_GIT_PREVIOUS_SHA="$prev" \
	build_paths 'a deploy-config change still forces a build' "$repo" \
	vercel.json "$stories"

# Fail safe, same stance as affected mode: an unresolvable base builds.
repo="$workdir/paths-rootonly"
mkdir -p "$repo"
git -C "$repo" init --quiet --initial-branch=main
echo 'x' >"$repo/file.txt"
git -C "$repo" add -A
git -C "$repo" commit --quiet -m 'root commit'
VERCEL_GIT_PREVIOUS_SHA='' \
	build_paths 'unresolvable base builds rather than skips' "$repo" \
	vercel.json "$stories"

if [ "$fails" -eq 0 ]; then
	echo "vercel-ignore-affected: all cases pass"
else
	printf 'vercel-ignore-affected: %s case(s) failed\n' "$fails"
	exit 1
fi
