#!/bin/sh
# Vercel ignoreCommand for a turbo-scoped package: skip the build (exit 0)
# unless $1 is affected since $VERCEL_GIT_PREVIOUS_SHA. Falls back to a
# real git-computed base when Vercel doesn't supply one (e.g. a branch's
# first push), instead of building unconditionally.
set -e

PACKAGE="$1"
ROOT="$(git rev-parse --show-toplevel)"

git -C "$ROOT" fetch --quiet --depth=100 origin main 2>/dev/null || true

BASE="$VERCEL_GIT_PREVIOUS_SHA"
if [ -z "$BASE" ]; then
  BASE=$(git -C "$ROOT" merge-base HEAD origin/main 2>/dev/null || true)
fi

if [ -z "$BASE" ]; then
  exit 1
fi

cd "$ROOT" && pnpm exec turbo query affected --base="$BASE" --packages "$PACKAGE" --exit-code
