#!/bin/sh
# Vercel ignoreCommand for a turbo-scoped package: skip the build (exit 0)
# unless $1 is affected since $VERCEL_GIT_PREVIOUS_SHA — or one of the extra
# watch paths ($2..$N) changed since the same base, in which case the build
# is forced. The watch paths carry the deploy config that governs this build
# (the project's own vercel.json, plus this shared script): a change there is
# exactly what turbo can't see as "affecting" the package, yet it's the change
# that most needs a live build to validate. Falls back to a real git-computed
# base when Vercel doesn't supply one (e.g. a branch's first push). Vercel's
# build clone has no 'origin' remote configured, so this fetches by explicit
# URL and diffs against FETCH_HEAD instead of origin/main.
PACKAGE="$1"
shift
ROOT="$(git rev-parse --show-toplevel)"
REPO_URL="https://github.com/${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}.git"

BASE="$VERCEL_GIT_PREVIOUS_SHA"
if [ -z "$BASE" ]; then
  git -C "$ROOT" fetch --quiet --depth=100 "$REPO_URL" main 2>/dev/null || true
  BASE=$(git -C "$ROOT" merge-base HEAD FETCH_HEAD 2>/dev/null || true)
fi

# On a main build FETCH_HEAD *is* main, so the merge-base above resolves to
# HEAD itself — and a commit diffed against itself shows nothing affected, so
# the build skips, no deployment happens, VERCEL_GIT_PREVIOUS_SHA stays empty,
# and the next merge repeats it. Comparing against the previous commit breaks
# that. Also covers a redeploy whose supplied SHA is already HEAD, where the
# clone may still be shallow — hence the deepen.
if [ -n "$BASE" ] && [ "$BASE" = "$(git -C "$ROOT" rev-parse HEAD)" ]; then
  git -C "$ROOT" rev-parse --verify --quiet HEAD^1 >/dev/null 2>&1 ||
    git -C "$ROOT" fetch --quiet --deepen=1 "$REPO_URL" 2>/dev/null || true
  BASE=$(git -C "$ROOT" rev-parse --verify --quiet HEAD^1 2>/dev/null || true)
fi

if [ -z "$BASE" ]; then
  exit 1
fi

# A change to any watched deploy-config path forces the build (exit 1) so the
# config change is validated by a real deployment.
if [ "$#" -gt 0 ] && ! git -C "$ROOT" diff --quiet "$BASE" HEAD -- "$@" 2>/dev/null; then
  exit 1
fi

# Turbo marks every dependent affected by any packages/config change, but these
# two paths hold only types, and both storybook:build scripts are a bare
# `storybook build` — Vite transpiles without type-checking, so nothing here can
# reach the output or break the build.
CHANGED=$(git -C "$ROOT" diff --name-only "$BASE" HEAD 2>/dev/null)
if [ -n "$CHANGED" ] && ! printf '%s\n' "$CHANGED" |
  grep -qvE '^packages/config/src/(types|sanity/generated)/'; then
  exit 0
fi

cd "$ROOT" && pnpm exec turbo query affected --base="$BASE" --packages "$PACKAGE" --exit-code
