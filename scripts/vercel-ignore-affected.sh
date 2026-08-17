#!/bin/sh
# Vercel ignoreCommand for a turbo-scoped package: skip the build (exit 0)
# unless $1 is affected since $VERCEL_GIT_PREVIOUS_SHA. Falls back to a
# real git-computed base when Vercel doesn't supply one (e.g. a branch's
# first push). Vercel's build clone has no 'origin' remote configured, so
# this fetches by explicit URL and diffs against FETCH_HEAD instead of
# origin/main.
PACKAGE="$1"
ROOT="$(git rev-parse --show-toplevel)"
REPO_URL="https://github.com/${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}.git"

BASE="$VERCEL_GIT_PREVIOUS_SHA"
if [ -z "$BASE" ]; then
  git -C "$ROOT" fetch --quiet --depth=100 "$REPO_URL" main 2>/dev/null || true
  BASE=$(git -C "$ROOT" merge-base HEAD FETCH_HEAD 2>/dev/null || true)
fi

if [ -z "$BASE" ]; then
  exit 1
fi

cd "$ROOT" && pnpm exec turbo query affected --base="$BASE" --packages "$PACKAGE" --exit-code
