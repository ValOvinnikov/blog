#!/bin/sh
# PostToolUse hook: lint the TypeScript file an agent just edited/wrote so
# lint failures — including the layer-boundary no-restricted-imports rules —
# surface in the same turn instead of at commit time (lint-staged/pre-push).
# Runs via post-edit.sh, after post-edit-prettier.sh has formatted the file.
#
# Contract (Claude Code hooks):
#   stdin  — JSON payload; the edited file is .tool_input.file_path
#   exit 0 — silent success (also: non-TS file, missing file, no eslint,
#            ESLint fatal error where no eslint.config.* resolves)
#   exit 2 — stderr is fed back to the agent as feedback (lint problems, or
#            ESLint failing to load a config that exists); report-only, no --fix
set -u

payload=$(cat)

file_path=$(printf '%s' "$payload" | node -e '
  let s = "";
  process.stdin.on("data", (c) => (s += c));
  process.stdin.on("end", () => {
    try {
      const j = JSON.parse(s);
      process.stdout.write(j.tool_input?.file_path ?? "");
    } catch {
      /* malformed payload -> empty path -> no-op */
    }
  });
')

case "$file_path" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac

# File may have been renamed/deleted later in the same turn.
[ -f "$file_path" ] || exit 0

case "$file_path" in
  /*) ;;
  *) file_path="$PWD/$file_path" ;;
esac

project_dir=${CLAUDE_PROJECT_DIR:-$(git -C "$(dirname "$file_path")" rev-parse --show-toplevel 2>/dev/null)}
[ -n "$project_dir" ] || exit 0

# Worktrees fresh from checkout may not have node_modules yet — skip, the
# commit-time gates (lint-staged, pre-push, CI) still cover them.
eslint="$project_dir/node_modules/.bin/eslint"
[ -x "$eslint" ] || exit 0

# Run from the workspace that owns the file, the way `pnpm lint` does:
# @next/eslint-plugin-next prints a "Pages directory cannot be found" line
# from any other cwd, and it would reach the agent as if it were a finding.
workspace_dir=$(dirname "$file_path")
until [ "$workspace_dir" = "$project_dir" ] || [ "$workspace_dir" = "/" ] || ls "$workspace_dir"/eslint.config.* >/dev/null 2>&1; do
  workspace_dir=$(dirname "$workspace_dir")
done

cd "$workspace_dir" || exit 0

# BLOG_LINT_TOUCHED switches on the rules that apply only to files being
# changed (prefer-shared-constant, no-duplicate-string).
output=$(BLOG_LINT_TOUCHED=1 "$eslint" --no-warn-ignored "$file_path" 2>&1)
status=$?

# ESLint exits 0 clean, 1 on lint problems, >=2 fatal. A fatal exit beside an
# eslint.config.* means the config failed to load (often a stale install), so
# every edit would go unlinted unless the agent is told.
if [ "$status" -eq 1 ]; then
  printf '%s\n' "$output" >&2
  exit 2
fi

if [ "$status" -ge 2 ] && ls ./eslint.config.* >/dev/null 2>&1; then
  first_error=$(printf '%s\n' "$output" | grep -m1 -i 'error' || printf '%s\n' "$output" | head -n 1)
  printf 'ESLint could not load its config, so %s was not linted:\n  %s\nRun pnpm install in %s, then re-save the file.\n' \
    "$file_path" "$first_error" "$project_dir" >&2
  exit 2
fi

exit 0
