#!/bin/sh
# Vercel ignoreCommand for a turbo-scoped package: skip the build (exit 0)
# unless $1 is affected since $VERCEL_GIT_PREVIOUS_SHA. Falls back to a
# real git-computed base when Vercel doesn't supply one (e.g. a branch's
# first push), instead of building unconditionally.
PACKAGE="$1"
ROOT="$(git rev-parse --show-toplevel)"

echo "[debug] ROOT=$ROOT"
echo "[debug] VERCEL_GIT_PREVIOUS_SHA=$VERCEL_GIT_PREVIOUS_SHA"
echo "[debug] remotes:"
git -C "$ROOT" remote -v
echo "[debug] fetching origin main..."
git -C "$ROOT" fetch --depth=100 origin main
echo "[debug] fetch exit=$?"
echo "[debug] refs after fetch:"
git -C "$ROOT" show-ref | grep main || echo "[debug] no main ref found"

BASE="$VERCEL_GIT_PREVIOUS_SHA"
if [ -z "$BASE" ]; then
  echo "[debug] VERCEL_GIT_PREVIOUS_SHA empty, computing merge-base..."
  BASE=$(git -C "$ROOT" merge-base HEAD origin/main)
  MERGE_BASE_EXIT=$?
  echo "[debug] merge-base exit=$MERGE_BASE_EXIT BASE=$BASE"
fi

echo "[debug] final BASE=$BASE"

if [ -z "$BASE" ]; then
  echo "[debug] BASE still empty, falling back to build"
  exit 1
fi

cd "$ROOT" && pnpm exec turbo query affected --base="$BASE" --packages "$PACKAGE" --exit-code
