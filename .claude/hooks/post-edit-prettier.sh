#!/bin/sh
# PostToolUse hook: format the file an agent just edited/wrote with Prettier,
# so working-tree diffs stay clean continuously instead of being reformatted
# at commit by lint-staged.
#
# Contract (Claude Code hooks):
#   stdin  — JSON payload; the edited file is .tool_input.file_path
#   exit 0 — always. Never blocks and never sends the agent feedback — this
#            hook formats, it doesn't review. Unsupported/missing files,
#            absent node_modules, and .prettierignore'd files are silent
#            no-ops because Prettier itself already treats them that way.
#
# Wired in settings.json as `post-edit-prettier.sh && post-edit-lint.sh` in
# ONE command string, not as a second entry in the same matcher's `hooks`
# array: Claude Code runs all hooks matching an event in parallel, so two
# array entries would race and ESLint could lint pre-format content. Chaining
# with `&&` inside a single handler is the only way to guarantee order.
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

# File may have been renamed/deleted later in the same turn.
[ -f "$file_path" ] || exit 0

# Worktrees fresh from checkout may not have node_modules yet — skip, the
# commit-time gates (lint-staged, pre-push, CI) still cover them.
[ -x "$CLAUDE_PROJECT_DIR/node_modules/.bin/prettier" ] || exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Prettier resolves the nearest prettier.config.* by walking up from the
# target file, so each workspace's config applies. It already no-ops on
# files it can't parse and on .prettierignore'd paths; --log-level silent
# plus the redirect keep any of that from ever reaching the agent.
"$CLAUDE_PROJECT_DIR/node_modules/.bin/prettier" --write --log-level silent "$file_path" >/dev/null 2>&1

exit 0
