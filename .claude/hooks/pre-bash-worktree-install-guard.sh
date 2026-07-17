#!/bin/sh
# PreToolUse(Bash) hook: block dependency-mutating pnpm commands inside a
# shared-deps agent worktree — one whose root node_modules is a symlink to the
# primary checkout (created by .husky/post-checkout). pnpm follows that
# symlink, so `pnpm install`/`add`/... here would prune and rewrite the
# PRIMARY checkout's dependencies. The pnpm `preinstall` guard
# (scripts/guard-worktree-install.mjs) is the authoritative backstop; this
# hook stops agents one step earlier, before pnpm touches anything at all.
#
# Contract (Claude Code hooks):
#   stdin  — JSON payload; the command is .tool_input.command
#   exit 0 — allow
#   exit 2 — block; stderr is fed back to the agent
set -u

root="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -L "$root/node_modules" ] || exit 0 # private/real tree: installs are fine

payload=$(cat)

command=$(printf '%s' "$payload" | node -e '
  let s = "";
  process.stdin.on("data", (c) => (s += c));
  process.stdin.on("end", () => {
    try {
      const j = JSON.parse(s);
      process.stdout.write(j.tool_input?.command ?? "");
    } catch {
      /* malformed payload -> empty command -> allow */
    }
  });
')

case "$command" in
*pnpm*) ;;
*) exit 0 ;;
esac

# `pnpm` must sit at a command position (start of command, or after ; & | ( or
# a backtick) so that commands merely *mentioning* an install — grep patterns,
# commit messages, echo — pass. Flags before the subcommand are tolerated,
# including value-taking ones (`--filter <pkg>` / `--filter=<pkg>` / its short
# alias `-F <pkg>`, `-C <dir>`, `--dir <dir>`, ...) — a filtered add/remove
# still rewrites the lockfile and installs through the shared symlink.
# Spellings that slip past this first line (env-var prefixes, `sh -c "…"`)
# are still caught by the pnpm `preinstall` guard before anything is linked.
if printf '%s' "$command" |
	grep -Eq '(^|[;&|(`])[[:space:]]*pnpm([[:space:]]+((--filter|--dir)(=[^[:space:]]+)?([[:space:]]+[^-][^[:space:]]+)?|-[FC]([[:space:]]+[^-][^[:space:]]+)?|-[^[:space:]]+))*[[:space:]]+(i|install|add|remove|rm|uninstall|un|update|up|upgrade|dedupe|rebuild|prune|import|link|unlink|patch-commit|store[[:space:]]+prune)([[:space:]);&|]|$)'; then
	cat >&2 <<'EOF'
Blocked: this worktree shares the primary checkout's node_modules via a
symlink, and this pnpm command would mutate the primary checkout's
dependencies through it.

If this branch must change dependencies, give the worktree a private tree
first:
  rm node_modules   # removes only the symlink, not its target
  pnpm install

See README.md § "Working with Claude Code".
EOF
	exit 2
fi

exit 0
