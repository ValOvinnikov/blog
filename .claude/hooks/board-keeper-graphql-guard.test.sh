#!/usr/bin/env bash
# Deny/allow matrix for board-keeper-graphql-guard.sh. Run directly or via CI
# (`.github/workflows/workflow-security.yml`):
#   bash .claude/hooks/board-keeper-graphql-guard.test.sh
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
guard="$script_dir/board-keeper-graphql-guard.sh"

pass=0
fail=0

check() {
  local cmd=$1 expected=$2 label=$3
  local output decision
  output=$(jq -n --arg cmd "$cmd" '{tool_input: {command: $cmd}}' | "$guard")
  if [ -z "$output" ]; then
    decision="allow"
  else
    decision=$(printf '%s' "$output" | jq -r '.hookSpecificOutput.permissionDecision // "allow"' 2>/dev/null) || decision="allow"
  fi
  if [ "$decision" = "$expected" ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    printf 'FAIL: %s\n  command:  %s\n  expected: %s\n  got:      %s\n' "$label" "$cmd" "$expected" "$decision" >&2
  fi
}

check 'gh api graphql -F query=@/tmp/x/rm.graphql' deny "query from a file"
check 'gh api graphql -f query=@/tmp/x/rm.graphql' deny "query from a file via -f"
check 'gh api graphql --field query=@rm.graphql' deny "long --field form"
check 'gh api graphql --field=query=@rm.graphql' deny "--field= form"
check 'gh api graphql -F query=@-' deny "query from stdin"
check 'cat /tmp/x/rm.graphql | gh api graphql -F query=@-' deny "file piped to stdin"
check 'gh api graphql --input /tmp/x/body.json' deny "--input file"
check 'gh api graphql --input=/tmp/x/body.json' deny "--input= file"
check 'sleep 2; gh api graphql -F query=@rm.graphql' deny "file route after a separator"
check 'gh api graphql -F query=@q.graphql -F owner=ValOvinnikov' deny "file query with a variable"
check $'gh api graphql \\\n  -F query=@q.graphql' deny "file query on a continuation line"
check $'gh api graphql \\\n  --input body.json' deny "--input on a continuation line"
check 'gh issue view 1 && gh api graphql -Fquery=@x' deny "fused -F after &&"

check "gh api graphql -f query='mutation { removeSubIssue(input:{issueId:\"I_a\", subIssueId:\"I_b\"}) { issue { number } } }'" allow "inline mutation"
check "gh api graphql -f query='query{viewer{login}}'" allow "inline query"
check $'gh api graphql -f query=\'query {\n  viewer { login }\n}\'' allow "multi-line inline query"
check "gh api graphql -f query='query(\$n:Int!){ repository(owner:\"ValOvinnikov\", name:\"blog\"){ issue(number:\$n){ title } } }' -F n=5910" allow "inline query with a variable"
check 'gh api repos/ValOvinnikov/blog/issues -F body=@notes.md' allow "REST call is out of scope"
check 'gh project item-edit --id PVTI_x --project-id PVT_x --field-id F --single-select-option-id 6ec9286b' allow "item-edit"
check 'gh issue view 5910 --json title' allow "unrelated gh"
check '' allow "empty command"

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
