#!/usr/bin/env bash
# shellcheck disable=SC2016
# Moves one issue's Blog Build board item to a target Status, forward-only.
# Usage: sync-board-status.sh <issue-number> <"In Progress"|"Code Review">
#
# Requires GH_TOKEN in the environment, a classic PAT scoped public_repo +
# project (the default GITHUB_TOKEN cannot write Projects v2).
#
# SC2016 is disabled file-wide: the single-quoted GraphQL query strings below
# use GraphQL's own $variable syntax deliberately — double-quoting would let
# bash expand $owner/$repo/$number/etc. as unset shell variables before gh
# ever sees the query.
set -euo pipefail

ISSUE_NUMBER="$1"
TARGET_STATUS_NAME="$2"

# IDs below are copied from .claude/agents/board-keeper.md's "Board IDs"
# table, the documented source of truth (itself already duplicated once, into
# open-pull-request/SKILL.md) — check that table first if any ID here ever
# needs to change.
OWNER="ValOvinnikov"
REPO="blog"
PROJECT_ID="PVT_kwHOAIMQW84BcK3T"
STATUS_FIELD_ID="PVTSSF_lAHOAIMQW84BcK3TzhW1nPs"

status_option_id() {
  case "$1" in
    "Todo") echo "f75ad846" ;;
    "In Progress") echo "47fc9ee4" ;;
    "Code Review") echo "679cfd06" ;;
    "Done") echo "98236657" ;;
    "Rejected") echo "6ec9286b" ;;
    *) echo "" ;;
  esac
}

TARGET_OPTION_ID="$(status_option_id "$TARGET_STATUS_NAME")"
if [[ -z "$TARGET_OPTION_ID" ]]; then
  echo "::error::Unknown target status '$TARGET_STATUS_NAME' — no option id configured."
  exit 1
fi

case "$TARGET_STATUS_NAME" in
  "In Progress" | "Code Review") ;;
  *)
    echo "::error::This script only supports advancing to 'In Progress' or 'Code Review'."
    exit 1
    ;;
esac

# Same safe forward-only transitions board-keeper.md's Step 4 applies by hand.
allowed_current() {
  case "$1" in
    "In Progress") printf '%s\n' "" "Todo" ;;
    "Code Review") printf '%s\n' "" "Todo" "In Progress" ;;
  esac
}

# Advances one issue, forward-only, and records its parent in PARENT_NUMBER.
advance() {
  local number="$1" target="$2"
  local option_id
  option_id="$(status_option_id "$target")"

  echo "Resolving issue #$number..."
  ISSUE_JSON=$(gh api graphql -f query='
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          id
          parent { number }
          projectItems(first: 10) {
            nodes {
              id
              project { id }
              fieldValueByName(name: "Status") {
                ... on ProjectV2ItemFieldSingleSelectValue { name }
              }
            }
          }
        }
      }
    }' -f owner="$OWNER" -f repo="$REPO" -F number="$number")

  PARENT_NUMBER=$(echo "$ISSUE_JSON" | jq -r '.data.repository.issue.parent.number // empty')

  ISSUE_NODE_ID=$(echo "$ISSUE_JSON" | jq -r '.data.repository.issue.id // empty')
  if [[ -z "$ISSUE_NODE_ID" ]]; then
    echo "::error::Issue #$number not found."
    return 1
  fi

  ITEM_ID=$(echo "$ISSUE_JSON" | jq -r --arg pid "$PROJECT_ID" '[.data.repository.issue.projectItems.nodes[] | select(.project.id == $pid)][0].id // empty')
  CURRENT_STATUS=$(echo "$ISSUE_JSON" | jq -r --arg pid "$PROJECT_ID" '[.data.repository.issue.projectItems.nodes[] | select(.project.id == $pid)][0].fieldValueByName.name // ""')

  if [[ -z "$ITEM_ID" ]]; then
    echo "Issue #$number is not yet on the board — adding it."
    ITEM_ID=$(gh api graphql -f query='
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
          item { id }
        }
      }' -f projectId="$PROJECT_ID" -f contentId="$ISSUE_NODE_ID" --jq '.data.addProjectV2ItemById.item.id')
    CURRENT_STATUS=""
  fi

  echo "Current status: '${CURRENT_STATUS:-<blank>}'"

  if ! allowed_current "$target" | grep -qxF -- "$CURRENT_STATUS"; then
    echo "Current status '$CURRENT_STATUS' is not eligible to advance to '$target' (forward-only) — skipping, not an error."
    return 0
  fi

  echo "Setting status to '$target'..."
  gh api graphql -f query='
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId,
        itemId: $itemId,
        fieldId: $fieldId,
        value: { singleSelectOptionId: $optionId }
      }) {
        projectV2Item { id }
      }
    }' -f projectId="$PROJECT_ID" -f itemId="$ITEM_ID" -f fieldId="$STATUS_FIELD_ID" -f optionId="$option_id" > /dev/null

  echo "Verifying the write stuck..."
  VERIFIED_STATUS=$(gh api graphql -f query='
    query($itemId: ID!) {
      node(id: $itemId) {
        ... on ProjectV2Item {
          fieldValueByName(name: "Status") {
            ... on ProjectV2ItemFieldSingleSelectValue { name }
          }
        }
      }
    }' -f itemId="$ITEM_ID" --jq '.data.node.fieldValueByName.name // ""')

  if [[ "$VERIFIED_STATUS" != "$target" ]]; then
    echo "::error::Write did not stick — expected '$target', board shows '$VERIFIED_STATUS'. This is the known Projects v2 silent-write-failure mode (board-keeper.md Step 4)."
    return 1
  fi

  echo "Confirmed: issue #$number is now '$VERIFIED_STATUS'."
}

PARENT_NUMBER=""
advance "$ISSUE_NUMBER" "$TARGET_STATUS_NAME"

parent="$PARENT_NUMBER"
if [[ -n "$parent" ]]; then
  echo "Issue #$ISSUE_NUMBER has parent #$parent — a parent starts when any sub-issue does."
  advance "$parent" "In Progress"
fi
