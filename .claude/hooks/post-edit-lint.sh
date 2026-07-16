#!/bin/sh
# PostToolUse hook: lint the TypeScript file an agent just edited/wrote so
# lint failures — including the layer-boundary no-restricted-imports rules —
# surface in the same turn instead of at commit time (lint-staged/pre-push).
#
# Contract (Claude Code hooks):
#   stdin  — JSON payload; the edited file is .tool_input.file_path
#   exit 0 — silent success (also: non-TS file, missing file, no eslint,
#            ESLint fatal error such as no eslint.config.* resolving)
#   exit 2 — stderr is fed back to the agent as feedback; report-only, no --fix
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

# Worktrees fresh from checkout may not have node_modules yet — skip, the
# commit-time gates (lint-staged, pre-push, CI) still cover them.
[ -x "$CLAUDE_PROJECT_DIR/node_modules/.bin/eslint" ] || exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Flat config resolves upward from the linted file, so the matching
# workspace's eslint.config.js applies. --no-warn-ignored keeps ignored
# files (e.g. generated types) silent instead of warning.
output=$("$CLAUDE_PROJECT_DIR/node_modules/.bin/eslint" --no-warn-ignored "$file_path" 2>&1)
status=$?

# ESLint exit codes: 0 = clean, 1 = lint problems, >=2 = fatal (e.g. no
# eslint.config.* resolves for a file outside every workspace). Only real
# lint problems are agent feedback; a tool failure must not be presented
# as one — stay silent and let the commit-time gates cover the file.
if [ "$status" -eq 1 ]; then
  printf '%s\n' "$output" >&2
  exit 2
fi

exit 0
