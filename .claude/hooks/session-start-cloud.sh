#!/bin/sh
# SessionStart hook, cloud sessions only: install dependencies on a fresh
# checkout, and print the rename command when the session's branch fails
# the branch-name pattern. Stdout reaches the session as context.
set -u

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

scripts="$(cd "$(dirname "$0")/../../scripts" && pwd)"
project="${CLAUDE_PROJECT_DIR:-$(dirname "$scripts")}"
cd "$project" || exit 0

if [ ! -d node_modules ]; then
  if log=$(pnpm install --frozen-lockfile 2>&1); then
    echo "Installed dependencies (pnpm install --frozen-lockfile)."
  else
    echo "pnpm install --frozen-lockfile failed:"
    printf '%s\n' "$log" | tail -n 20
  fi
fi

branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null) || exit 0
node "$scripts/branch-name.mjs" --check "$branch" 2>&1 || true
exit 0
