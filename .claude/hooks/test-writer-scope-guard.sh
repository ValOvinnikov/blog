#!/usr/bin/env bash
# PreToolUse guard for the test-writer subagent (#396).
#
# test-writer exists so test quality stops depending on each layer agent's
# leftover attention at the end of its run — but that only holds if it can
# never quietly patch product code to make a test pass. This hook is the
# enforcement: it denies any Edit/Write whose target isn't a co-located
# *.test.ts(x) file. A product-code change must come back as a finding for
# the orchestrator to hand to the owning layer agent, never be applied here.
#
# Wired in test-writer's frontmatter only, so it fires exclusively for that
# agent's Edit/Write calls; layer agents (cms/service/ui/web) never see it.
#
# This is one half of the boundary, not the whole thing: Edit/Write are both
# in the session-wide allow-list regardless of `permissionMode`, so this hook
# is the *sole* enforcement for THIS tool surface — nothing else stops an
# Edit/Write outside `*.test.ts(x)`. The other surface, Bash (`mv`/`cp` could
# move or overwrite a file without ever calling Edit/Write), is covered
# separately by `permissionMode: dontAsk` + `read-only-agent-guard.sh` wired
# on the same agent (#396 review). A missing/broken `jq` degrades to "stay
# out of the way" rather than "deny everything," the same fail-open stance
# the read-only guard takes for the same tool availability reason —
# accepted, documented residual risk (#397's precedent: unsound detection
# costs more than the gap it closes).
set -u

input=$(cat)

file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || file_path=""
[ -z "$file_path" ] && exit 0

case "$file_path" in
*.test.ts | *.test.tsx) exit 0 ;;
esac

jq -n --arg path "$file_path" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ("You are the test-writer agent (#396): scoped to writing/editing *.test.ts(x) files only. \"" + $path + "\" is product code — report the needed change back to the orchestrator as a finding instead of editing it; the owning layer agent applies it.")
  }
}'
exit 0
