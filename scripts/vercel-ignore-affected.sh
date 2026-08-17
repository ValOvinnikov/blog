#!/bin/sh
# Vercel ignoreCommand for a turbo-scoped package: skip the build (exit 0)
# unless $1 is affected since $VERCEL_GIT_PREVIOUS_SHA. Falls back to a
# real git-computed base when Vercel doesn't supply one (e.g. a branch's
# first push), instead of building unconditionally.
PACKAGE="$1"
ROOT="$(git rev-parse --show-toplevel)"
REPO_URL="https://github.com/${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}.git"

echo "[debug] ROOT=$ROOT"
echo "[debug] VERCEL_GIT_PREVIOUS_SHA=$VERCEL_GIT_PREVIOUS_SHA"
echo "[debug] REPO_URL=$REPO_URL"
echo "[debug] fetching main by explicit URL (no 'origin' remote exists in this clone)..."
git -C "$ROOT" fetch --depth=100 "$REPO_URL" main
echo "[debug] fetch exit=$?"

BASE="$VERCEL_GIT_PREVIOUS_SHA"
if [ -z "$BASE" ]; then
  echo "[debug] VERCEL_GIT_PREVIOUS_SHA empty, computing merge-base against FETCH_HEAD..."
  BASE=$(git -C "$ROOT" merge-base HEAD FETCH_HEAD)
  MERGE_BASE_EXIT=$?
  echo "[debug] merge-base exit=$MERGE_BASE_EXIT BASE=$BASE"
fi

echo "[debug] final BASE=$BASE"

if [ -z "$BASE" ]; then
  echo "[debug] BASE still empty, falling back to build"
  exit 1
fi

cd "$ROOT" && pnpm exec turbo query affected --base="$BASE" --packages "$PACKAGE" --exit-code
