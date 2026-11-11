#!/usr/bin/env bash
# PreToolUse guard wired in test-writer's frontmatter: denies any Edit/Write
# outside a *.test.ts(x) file, a src/testing/ builder or a __mocks__/ fake, so
# product code reaches the orchestrator as a finding. Write-shaped Bash is
# read-only-agent-guard.sh's job. A missing jq fails open, like that guard.
set -u

input=$(cat)

file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || file_path=""
[ -z "$file_path" ] && exit 0

case "$file_path" in
*/../* | ../*) ;;
*.test.ts | *.test.tsx) exit 0 ;;
*/src/testing/*.ts | */src/testing/*.tsx) exit 0 ;;
*/__mocks__/*.ts | */__mocks__/*.tsx) exit 0 ;;
esac

jq -n --arg path "$file_path" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ("You are the test-writer agent (#396): scoped to *.test.ts(x) files, src/testing/ builders and __mocks__/ fakes. \"" + $path + "\" is product code — report the needed change back to the orchestrator as a finding instead of editing it; the owning layer agent applies it.")
  }
}'
exit 0
