#!/usr/bin/env bash
# Allow/deny matrix for pre-agent-gate0-guard.sh.
#
# Contract, same as read-only-agent-guard.sh and test-writer-scope-guard.sh:
# the guard always exits 0 and signals a block via a JSON permissionDecision
# on stdout. No stdout means allow.
#
# The board lookup is stubbed by putting a fake `gh` earlier on PATH, so the
# suite is hermetic — no network, no dependency on live board state. The
# stub's canned status is set via GATE0_TEST_STATUS.
#
# Run: bash .claude/hooks/pre-agent-gate0-guard.test.sh
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
guard="$script_dir/pre-agent-gate0-guard.sh"

pass=0
fail=0

stub_dir=$(mktemp -d)
trap 'rm -rf "$stub_dir"' EXIT

# Fake `gh`. Two modes:
#
#   default            — echo the canned GATE0_TEST_STATUS. Empty models
#                        "issue not on the board"; GATE0_TEST_FAIL=1 models an
#                        API/network failure.
#   GATE0_TEST_BODY    — a raw GraphQL response body. The stub pulls the real
#                        `--jq` expression out of its own argv and runs it over
#                        that body with the real jq, so the guard's extraction
#                        filter is genuinely exercised rather than bypassed.
#                        Without this, a future edit to that filter would pass
#                        CI while being broken.
cat >"$stub_dir/gh" <<'STUB'
#!/usr/bin/env bash
[ "${GATE0_TEST_FAIL:-0}" = "1" ] && exit 1
if [ -n "${GATE0_TEST_BODY:-}" ]; then
  filter=""
  while [ "$#" -gt 0 ]; do
    if [ "$1" = "--jq" ]; then
      filter=$2
      break
    fi
    shift
  done
  [ -z "$filter" ] && exit 1
  printf '%s' "$GATE0_TEST_BODY" | jq -r "$filter"
  exit 0
fi
printf '%s' "${GATE0_TEST_STATUS:-}"
exit 0
STUB
chmod +x "$stub_dir/gh"

# Builds the Agent-tool payload the guard expects on stdin and asserts the
# decision. $1 subagent_type, $2 prompt, $3 expected allow|deny, $4 label.
check() {
  local subagent=$1 prompt=$2 expected=$3 label=$4
  local payload out decision
  payload=$(jq -n --arg s "$subagent" --arg p "$prompt" \
    '{tool_input: {subagent_type: $s, prompt: $p}}')
  out=$(printf '%s' "$payload" | PATH="$stub_dir:$PATH" bash "$guard" 2>/dev/null)
  if [ -z "$out" ]; then
    decision="allow"
  else
    decision=$(printf '%s' "$out" | jq -r '.hookSpecificOutput.permissionDecision // "allow"')
  fi
  if [ "$decision" = "$expected" ]; then
    pass=$((pass + 1))
    printf '  ok   %s\n' "$label"
  else
    fail=$((fail + 1))
    printf '  FAIL %s (expected %s, got %s)\n' "$label" "$expected" "$decision"
  fi
}

echo "Layer agent + implementation target, issue not In Progress:"
export GATE0_TEST_STATUS="Todo"
check ui "Implement issue #1436 — Switch and Slider shells." deny "Todo blocks"
check db "Implement issue **#1432** — registry tables." deny "bold markdown around the number"
check config "Implementing issue #1431 — constants." deny "\"Implementing\" variant"
GATE0_TEST_STATUS="Code Review" check web "Implement issue #99 — thing." deny "Code Review blocks"
GATE0_TEST_STATUS="Done" check service "Implement issue #99 — thing." deny "Done blocks"
GATE0_TEST_STATUS="Todo" check platform-app "Implement issue #1452 — admin scaffold." deny "platform-app is a layer agent"
GATE0_TEST_STATUS="Todo" check auth "Implement issue #1457 — shared auth config." deny "auth is a layer agent"
GATE0_TEST_STATUS="Todo" check insight "Implement issue #1639 — logger core." deny "insight is a layer agent"
GATE0_TEST_STATUS="Todo" check email "Implement issue #2606 — email shell and transport." deny "email is a layer agent"

echo "Layer agent + implementation target, correctly In Progress:"
export GATE0_TEST_STATUS="In Progress"
check ui "Implement issue #1436 — Switch and Slider shells." allow "In Progress passes"
check db "Implement issue **#1432** — registry tables." allow "In Progress passes (bold)"
check platform-app "Implement issue #1452 — admin scaffold." allow "platform-app In Progress passes"
check auth "Implement issue #1457 — shared auth config." allow "auth In Progress passes"
check insight "Implement issue #1639 — logger core." allow "insight In Progress passes"
check email "Implement issue #2606 — email shell and transport." allow "email In Progress passes"

echo "Non-layer agents are never checked:"
export GATE0_TEST_STATUS="Todo"
check reviewer "Implement issue #1436 — review it." allow "reviewer bypasses"
check explore "Implement issue #1436 — find things." allow "explore bypasses"
check board-keeper "Implement issue #1436 — board it." allow "board-keeper bypasses"
check test-writer "Implement issue #1436 — test it." allow "test-writer bypasses"
check verify-runner "Implement issue #1436 — verify." allow "verify-runner bypasses"

echo "No implementation target named:"
export GATE0_TEST_STATUS="Todo"
check ui "Trim the docstring on clearNewsletterSubscribedCookie." allow "no issue reference"
check ui "Context: this relates to #1436 and #1435, both in flight." allow "bare #N is context, not a target"
check db "See issue #1432 for background. Build the thing described below." allow "\"See issue #N\" is not a target"
check web "Fixes #1234 will follow later." allow "closing keyword is not a target"

echo "Fails open when the board cannot be consulted:"
GATE0_TEST_STATUS="" check ui "Implement issue #1436 — shells." allow "issue not on board"
GATE0_TEST_FAIL=1 GATE0_TEST_STATUS="Todo" check ui "Implement issue #1436 — shells." allow "gh failure"

echo "Real --jq extraction over raw GraphQL bodies:"
unset GATE0_TEST_STATUS
body() { GATE0_TEST_BODY=$1; export GATE0_TEST_BODY; }

body '{"data":{"repository":{"issue":{"projectItems":{"nodes":[{"fieldValueByName":{"name":"Todo"}}]}}}}}'
check ui "Implement issue #1436 — shells." deny "single project item, Todo"

body '{"data":{"repository":{"issue":{"projectItems":{"nodes":[{"fieldValueByName":{"name":"In Progress"}}]}}}}}'
check ui "Implement issue #1436 — shells." allow "single project item, In Progress"

# Issue on no project at all — the filter must yield empty, not crash.
body '{"data":{"repository":{"issue":{"projectItems":{"nodes":[]}}}}}'
check ui "Implement issue #1436 — shells." allow "zero project items falls open"

# An item with no Status field set yields a null fieldValueByName.
body '{"data":{"repository":{"issue":{"projectItems":{"nodes":[{"fieldValueByName":null}]}}}}}'
check ui "Implement issue #1436 — shells." allow "null Status falls open"

# Multiple projects: the first non-null Status wins, and a leading null entry
# must not shadow it.
body '{"data":{"repository":{"issue":{"projectItems":{"nodes":[{"fieldValueByName":null},{"fieldValueByName":{"name":"Todo"}}]}}}}}'
check ui "Implement issue #1436 — shells." deny "null then Todo still blocks"

unset GATE0_TEST_BODY

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
