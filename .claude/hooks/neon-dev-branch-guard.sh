#!/usr/bin/env bash
# The Neon MCP server targets the project's default branch — production — whenever a call omits its branch.
set -u

DEV_BRANCH_ID="br-curly-wildflower-za0la71g"
BRANCH_WRITERS="run_sql run_sql_transaction explain_sql_statement reset_from_parent restore_snapshot finalize_branch_restore delete_branch update_branch prepare_database_migration complete_database_migration prepare_query_tuning complete_query_tuning create_postgres_database update_postgres_database delete_postgres_database create_postgres_role delete_postgres_role reset_postgres_role_password provision_neon_auth provision_neon_data_api"
PROJECT_WRITERS="delete_project set_default_branch"

input=$(cat)

guarded_suffix() {
  local name
  for name in $BRANCH_WRITERS $PROJECT_WRITERS; do
    case "$1" in
    *__"$name") printf '%s' "$name" && return 0 ;;
    esac
  done
  return 1
}

if ! tool=$(printf '%s' "$input" | jq -er '.tool_name' 2>/dev/null); then
  for name in $BRANCH_WRITERS $PROJECT_WRITERS; do
    case "$input" in
    *__"$name"\"*)
      echo "Neon MCP guard could not parse this call, so it refuses it. Check that jq is installed." >&2
      exit 2
      ;;
    esac
  done
  exit 0
fi

action=$(guarded_suffix "$tool") || exit 0

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

case " $PROJECT_WRITERS " in
*" $action "*)
  deny "Neon MCP: $action changes the whole project, production included. Agents in this repo never run it; it is the user's to do in the Neon console."
  ;;
esac

if printf '%s' "$input" | jq -e --arg dev "$DEV_BRANCH_ID" '
  .tool_input
  | [.branch_id, .parent_branch_id, .target_branch_id]
  | map(select(. != null))
  | length > 0 and all(. == $dev)
' >/dev/null 2>&1; then
  exit 0
fi

deny "Neon MCP: $action writes to a branch, and agents in this repo write only to the development branch. Pass branch_id \"$DEV_BRANCH_ID\" explicitly — a call without one runs on the default branch, which is production. Schema changes go through Drizzle migrations; anything on production is the user's to run in the Neon console."
