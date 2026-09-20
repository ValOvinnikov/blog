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
# Deliberately narrow, on two axes:
#
#   - Only the ten layer agents. The settings.json `matcher` already limits
#     which stops reach this script, and the payload's `agent_type` is checked
#     again here so a widened matcher can't silently widen the guard.
#     `test-writer` is the case that makes this load-bearing: it also runs
#     with `isolation: worktree` but `read-only-agent-guard.sh` denies it
#     `git add`/`git commit`, so a block it can never satisfy would loop
#     forever. Read-only agents (reviewer, explore, verify-runner, …) never
#     match either.
#   - Only when the stopping agent's cwd is inside an agent worktree
#     (`.claude/worktrees/agent-*`); the main checkout and a session's own
#     `agents-*` worktree pass.
#
# A missing `jq` falls back to `$PWD` with no `agent_type` check; a missing
# `git`, or a cwd that is no longer a repo, passes — same fail-open posture as
# the sibling guards.
set -u

LAYER_AGENTS="config studio service ui web db auth platform-app email insight"

input=$(cat)

cwd=""
agent_type=""
if command -v jq >/dev/null 2>&1; then
  cwd=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null) || cwd=""
  agent_type=$(printf '%s' "$input" | jq -r '.agent_type // empty' 2>/dev/null) || agent_type=""
fi
[ -z "$cwd" ] && cwd=$PWD

if [ -n "$agent_type" ]; then
  case " $LAYER_AGENTS " in
  *" $agent_type "*) ;;
  *) exit 0 ;;
  esac
fi

case "$cwd" in
*/.claude/worktrees/agent-*) ;;
*) exit 0 ;;
esac

command -v git >/dev/null 2>&1 || exit 0

status=$(git -C "$cwd" status --porcelain 2>/dev/null) || exit 0
[ -z "$status" ] && exit 0

printf '{"decision":"block","reason":"commit your work before finishing — stage the files you changed and commit with a conventional message"}\n'
exit 0
