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

if [ -z "$BASE" ]; then
  exit 1
fi

# A change to any watched deploy-config path forces the build (exit 1) so the
# config change is validated by a real deployment.
if [ "$#" -gt 0 ] && ! git -C "$ROOT" diff --quiet "$BASE" HEAD -- "$@" 2>/dev/null; then
  exit 1
fi

cd "$ROOT" && pnpm exec turbo query affected --base="$BASE" --packages "$PACKAGE" --exit-code
