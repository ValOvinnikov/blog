#!/usr/bin/env bash
# SubagentStop guard — a layer agent may not end its turn with uncommitted
# work in its worktree (#3354).
#
# Every layer agent carries `isolation: worktree`, and the orchestrator lands
# its work by merging the agent's *commit* onto the feature branch. An agent
# that reports done with the files only on disk looks finished (its report
# lists the files, its verify passed) while `git log` on its branch still sits
# at the base — memory records three consecutive dispatches (#2437–#2439)
# ending that way. The Definition-of-done prose in each agent file asks for
# the commit; this hook is the enforcement.
#
# Deliberately narrow: it only fires when the stopping agent's cwd is inside
# an agent worktree (`.claude/worktrees/agent-*`). Read-only agents
# (reviewer, explore, verify-runner, …) don't self-isolate and run in the
# main checkout, so they pass trivially — as does anything else whose cwd
# isn't a worktree. A missing `git`/`jq`, or a cwd that is no longer a repo,
# also passes: same fail-open posture as the sibling guards.
set -u

input=$(cat)

cwd=""
if command -v jq >/dev/null 2>&1; then
  cwd=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null) || cwd=""
fi
[ -z "$cwd" ] && cwd=$PWD

case "$cwd" in
*/.claude/worktrees/agent-*) ;;
*) exit 0 ;;
esac

command -v git >/dev/null 2>&1 || exit 0

status=$(git -C "$cwd" status --porcelain 2>/dev/null) || exit 0
[ -z "$status" ] && exit 0

printf '{"decision":"block","reason":"commit your work before finishing — stage the files you changed and commit with a conventional message"}\n'
exit 0
