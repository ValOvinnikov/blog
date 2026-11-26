#!/usr/bin/env bash
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
guard="$script_dir/neon-dev-branch-guard.sh"

DEV="br-curly-wildflower-za0la71g"
PROD="br-old-salad-zapbn0xi"
NEON="mcp__80850c2b-fa62-4fbe-9c57-9a387fb89e7e"

pass=0
fail=0

check() {
  local tool=$1 tool_input=$2 expected=$3 label=$4
  local output decision
  output=$(jq -n --arg tool "$tool" --argjson input "$tool_input" '{tool_name: $tool, tool_input: $input}' | "$guard")
  if [ -z "$output" ]; then
    decision="allow"
  else
    decision=$(printf '%s' "$output" | jq -r '.hookSpecificOutput.permissionDecision // "allow"' 2>/dev/null) || decision="allow"
  fi
  if [ "$decision" = "$expected" ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    printf 'FAIL: %s\n  tool:     %s\n  input:    %s\n  expected: %s\n  got:      %s\n' "$label" "$tool" "$tool_input" "$expected" "$decision" >&2
  fi
}

check "${NEON}__run_sql" '{"sql":"select 1"}' deny "run_sql without a branch"
check "${NEON}__run_sql" "{\"sql\":\"select 1\",\"branch_id\":\"$PROD\"}" deny "run_sql on production"
check "${NEON}__run_sql" '{"sql":"select 1","branch_id":"*"}' deny "run_sql with a glob branch"
check "${NEON}__run_sql" '{"sql":"select 1","branch_id":""}' deny "run_sql with an empty branch"
check "${NEON}__run_sql_transaction" '{"sql_statements":["select 1"]}' deny "transaction without a branch"
check "${NEON}__explain_sql_statement" '{"sql":"delete from x","analyze":true}' deny "explain analyze without a branch"
check "${NEON}__reset_from_parent" "{\"branch_id\":\"$PROD\"}" deny "reset production"
check "${NEON}__delete_branch" "{\"branch_id\":\"$PROD\"}" deny "delete production"
check "${NEON}__update_branch" "{\"branch_id\":\"$PROD\",\"protected\":false}" deny "unprotect production"
check "${NEON}__restore_snapshot" '{"snapshot_id":"snap-1","finalize":true}' deny "restore onto the snapshot source"
check "${NEON}__prepare_database_migration" '{"migration_sql":"alter table x add y int"}' deny "prepare migration from the default branch"
check "${NEON}__complete_database_migration" "{\"migration_id\":\"m\",\"migration_sql\":\"s\",\"database_name\":\"neondb\",\"temporary_branch_id\":\"br-tmp\",\"parent_branch_id\":\"$PROD\"}" deny "complete migration onto production"
check "${NEON}__complete_query_tuning" '{"suggested_sql_statements":[],"tuning_id":"t","database_name":"neondb","temporary_branch_id":"br-tmp","apply_changes":true}' deny "apply tuning to the default branch"
check "${NEON}__reset_postgres_role_password" "{\"branch_id\":\"$PROD\",\"role_name\":\"neondb_owner\"}" deny "reset production password"
check "mcp__another-uuid__run_sql" '{"sql":"select 1"}' deny "suffix match under any server id"
check "${NEON}__run_sql" "{\"sql\":\"select 1\",\"branch_id\":\"$DEV\\n$DEV\"}" deny "two dev ids joined by a newline"
check "${NEON}__run_sql" "{\"sql\":\"select 1\",\"branch_id\":[\"$DEV\"]}" deny "branch id as an array"
check "${NEON}__run_sql" "\"$DEV\"" deny "tool input that is not an object"
check "${NEON}__delete_project" '{"project_id":"muddy-morning-49047000"}' deny "delete the project"
check "${NEON}__set_default_branch" "{\"branch_id\":\"$DEV\"}" deny "set default to development"
check "${NEON}__provision_neon_auth" '{}' deny "provision auth on the default branch"
check "${NEON}__provision_neon_data_api" "{\"branch_id\":\"$PROD\"}" deny "provision data api on production"

malformed_exit=0
printf '{"tool_name":"%s__run_sql", broken' "$NEON" | "$guard" 2>/dev/null || malformed_exit=$?
if [ "$malformed_exit" -eq 2 ]; then
  pass=$((pass + 1))
else
  fail=$((fail + 1))
  printf 'FAIL: malformed guarded call\n  expected exit: 2\n  got:           %s\n' "$malformed_exit" >&2
fi

unrelated_exit=0
printf '{"tool_name":"mcp__x__list_things", broken' | "$guard" 2>/dev/null || unrelated_exit=$?
if [ "$unrelated_exit" -eq 0 ]; then
  pass=$((pass + 1))
else
  fail=$((fail + 1))
  printf 'FAIL: malformed unguarded call\n  expected exit: 0\n  got:           %s\n' "$unrelated_exit" >&2
fi

check "${NEON}__run_sql" "{\"sql\":\"select 1\",\"branch_id\":\"$DEV\"}" allow "run_sql on development"
check "${NEON}__run_sql_transaction" "{\"sql_statements\":[\"select 1\"],\"branch_id\":\"$DEV\"}" allow "transaction on development"
check "${NEON}__reset_from_parent" "{\"branch_id\":\"$DEV\"}" allow "reset development"
check "${NEON}__provision_neon_auth" "{\"branch_id\":\"$DEV\"}" allow "provision auth on development"
check "${NEON}__get_connection_string" '{}' allow "get tool is not a write"
check "${NEON}__restore_snapshot" "{\"snapshot_id\":\"snap-1\",\"target_branch_id\":\"$DEV\"}" allow "restore onto development"
check "${NEON}__complete_database_migration" "{\"migration_id\":\"m\",\"migration_sql\":\"s\",\"database_name\":\"neondb\",\"temporary_branch_id\":\"br-tmp\",\"parent_branch_id\":\"$DEV\"}" allow "complete migration onto development"
check "${NEON}__list_branches" '{}' allow "list tool"
check "${NEON}__describe_branch" "{\"branch_id\":\"$PROD\"}" allow "describe production"
check "${NEON}__get_database_tables" '{}' allow "get tool"
check "Bash" '{"command":"ls"}' allow "non-MCP tool"

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
