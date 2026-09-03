#!/usr/bin/env bash
# PreToolUse guard on the Agent tool — enforces Gate 0 (issue must be
# In Progress on the board before a layer agent starts implementing it).
#
# Why this exists as a hook rather than more prose in CLAUDE.md: the rule is
# written as step 1 of a lifecycle ("when shipping an issue"), but the failure
# happens on a single *action* — dispatching a layer agent. In practice Gate 0
# gets run when the orchestrator consciously enters "shipping an issue" mode
# and gets skipped when a dispatch emerges from conversational momentum
# (decision → spec → tickets → dispatch). CLAUDE.md already carries two
# emphatic prose warnings about structurally identical traps; a third had no
# reason to work better.
#
# Deliberately narrow, for the same reason `read-only-agent-guard.sh` is:
# a guard that fires on honest work gets disabled, and then protects nothing.
#
#   - Only layer agents are checked. Reviewers, explore, board-keeper,
#     ci-watcher, verify-runner and everything else pass straight through —
#     they don't implement issues.
#   - Only dispatches that name an *implementation target* are checked, via
#     the "Implement issue #N" shape. Dispatch prompts routinely cite other
#     issues as context (parents, siblings, superseded work); matching every
#     `#N` would block on whichever number appeared first.
#   - No issue named → pass. Plenty of legitimate layer work isn't ticketed
#     (remediation, exploratory spikes).
#
# FAILS OPEN by design. If `gh`/`jq` is missing, the network is down, or the
# issue isn't on the board, this warns and allows. A guard that bricks every
# dispatch on a transient network blip is worse than no guard, because it gets
# removed. It catches the honest mistake it was written for, not an adversary.
set -u

input=$(cat)

# jq missing or unparsable input → stay out of the way.
command -v jq >/dev/null 2>&1 || exit 0

subagent=$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // empty' 2>/dev/null) || exit 0
[ -z "$subagent" ] && exit 0

# The agents that own repo source files (CLAUDE.md's layer map). Only these
# implement issues; everything else is review, discovery, or orchestration.
case "$subagent" in
config | studio | service | ui | web | db | platform-app | auth | insight | email) ;;
*) exit 0 ;;
esac

prompt=$(printf '%s' "$input" | jq -r '.tool_input.prompt // empty' 2>/dev/null) || exit 0
[ -z "$prompt" ] && exit 0

# Match the implementation-target shape only: "Implement issue #1436",
# "Implementing issue **#1436**". Bare "#1436" elsewhere in the prompt is
# context, not a target, and must not trigger this.
issue=$(printf '%s' "$prompt" |
  grep -oiE 'implement(ing)?[[:space:]]+issue[[:space:]]+\*{0,2}#[0-9]+' |
  head -1 |
  grep -oE '[0-9]+' || true)
[ -z "$issue" ] && exit 0

warn_and_allow() {
  # stderr on a 0 exit is surfaced to the agent without blocking the call.
  printf 'Gate 0 guard: could not verify issue #%s board status (%s). Allowing the dispatch — verify manually that it is In Progress.\n' "$issue" "$1" >&2
  exit 0
}

command -v gh >/dev/null 2>&1 || warn_and_allow "gh not found"

remote=$(git config --get remote.origin.url 2>/dev/null) || warn_and_allow "no git remote"
# git@github.com:Owner/repo.git and https://github.com/Owner/repo.git both →
# Owner/repo. Resolved locally to avoid a second network round-trip.
#
# Parameter expansion + tr rather than a sed regex: BSD sed (stock macOS)
# rejects the `+?` lazy quantifier that the obvious one-liner wants, and the
# portable ERE version is less readable than just peeling the string.
slug=${remote%.git}
slug=${slug#*://} # https://host/Owner/repo → host/Owner/repo
slug=${slug#*@}   # git@host:Owner/repo     → host:Owner/repo
slug=$(printf '%s' "$slug" | tr ':' '/')
repo=${slug##*/}
slug=${slug%/*}
owner=${slug##*/}
{ [ -n "$owner" ] && [ -n "$repo" ]; } || warn_and_allow "could not parse remote"

# `timeout` is GNU coreutils; absent on a stock macOS. Use it when present so
# a hung API call can't wedge the dispatch, and accept the risk when not.
runner=""
if command -v timeout >/dev/null 2>&1; then
  runner="timeout 15"
elif command -v gtimeout >/dev/null 2>&1; then
  runner="gtimeout 15"
fi

# Targeted lookup: the issue's own project items, rather than listing the
# whole board (which is slow enough to be felt on every dispatch).
status=$(
  # SC2086: $runner is an intentionally-unquoted optional command prefix.
  # SC2016: $owner/$repo/$number in the query body are GraphQL variables bound
  # by the -f/-F flags — they must NOT be shell-expanded.
  # shellcheck disable=SC2086,SC2016
  $runner gh api graphql \
    -f owner="$owner" -f repo="$repo" -F number="$issue" \
    -f query='
      query($owner:String!,$repo:String!,$number:Int!){
        repository(owner:$owner,name:$repo){
          issue(number:$number){
            projectItems(first:10){
              nodes{
                fieldValueByName(name:"Status"){
                  ... on ProjectV2ItemFieldSingleSelectValue { name }
                }
              }
            }
          }
        }
      }' \
    --jq '[.data.repository.issue.projectItems.nodes[].fieldValueByName.name // empty] | first // empty' 2>/dev/null
) || warn_and_allow "board query failed"

# Not on the board at all → not this guard's business to adjudicate.
[ -z "$status" ] && warn_and_allow "issue not found on the board"

[ "$status" = "In Progress" ] && exit 0

jq -n --arg issue "$issue" --arg status "$status" --arg agent "$subagent" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: (
      "Gate 0 not run: issue #" + $issue + " is \"" + $status +
      "\" on the board, not \"In Progress\", but this dispatch implements it with the `" + $agent + "` agent.\n\n" +
      "Dispatch board-keeper first (synchronously — this is one of the three documented exceptions to background dispatch):\n" +
      "    \"starting work on #" + $issue + "\"\n\n" +
      "It sets the issue to In Progress and promotes a Todo parent epic in the same dispatch. Batch sibling issues into one dispatch (\"starting work on #1, #2\") rather than one per issue. Then re-run this dispatch.\n\n" +
      "If this dispatch is not implementing #" + $issue + " (e.g. it is remediation on already-in-flight work), reword the prompt so it does not say \"Implement issue #" + $issue + "\"."
    )
  }
}'
exit 0
