#!/usr/bin/env bash
# A query file can be a stale leftover from an earlier dispatch, so board-keeper never runs GraphQL from one.
set -u

input=$(cat)

cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null) || cmd=""
[ -z "$cmd" ] && exit 0
cmd=${cmd//$'\\\n'/ }

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

graphql_reads_file() {
  local -a words
  # shellcheck disable=SC2206
  words=($1)
  local i is_graphql=1
  for ((i = 0; i + 2 < ${#words[@]}; i++)); do
    if [ "${words[$i]}" = "gh" ] && [ "${words[$((i + 1))]}" = "api" ] && [ "${words[$((i + 2))]}" = "graphql" ]; then
      is_graphql=0
      break
    fi
  done
  [ "$is_graphql" -eq 0 ] || return 1
  local w
  for w in "${words[@]}"; do
    case "$w" in
    *=@* | --input | --input=*) return 0 ;;
    esac
  done
  return 1
}

set -f
while IFS= read -r segment; do
  [ -z "$segment" ] && continue
  if graphql_reads_file "$segment"; then
    deny "board-keeper: GraphQL never runs from a file (-F query=@…, --input). Run the query or mutation inline and single-quoted, as one plain command — gh api graphql -f query='mutation { … }' — with nothing else in the same Bash call. If that exact command is refused, report it instead of routing around the refusal."
  fi
done <<EOF
$(printf '%s\n' "$cmd" | awk '{gsub(/&&|\|\||;|\|/, "\n"); print}')
EOF

exit 0
