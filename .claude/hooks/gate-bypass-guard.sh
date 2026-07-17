#!/bin/sh
# PreToolUse wrapper for gate-bypass-guard.js — see that file for the rules
# and the design history (#397).
#
# Exists only to keep the common case cheap: this hook is wired globally
# (every agent's Bash calls, not just one agent's — see settings.json) and
# node costs ~250ms to start. Payloads with no "git" anywhere (pnpm, ls,
# grep, ...) are the overwhelming majority and exit here without spawning
# anything.
#
# The prefilter is intentionally case-sensitive: case-insensitive filesystem
# tricks (`GIT push --force`) are a documented, accepted gap in
# gate-bypass-guard.js, so widening this to `grep -qi` would only slow down
# the common case for no correctness gain.
#
# Fails OPEN (exit 0) if node is unavailable: a guard that cannot parse must
# not wedge every Bash call in the session. The commit-time husky gates and
# CI remain the real enforcement either way.
#
# Contract (Claude Code hooks):
#   stdin  — JSON payload; the command is .tool_input.command
#   exit 0 — allow
#   exit 2 — block; stderr is fed back to the agent
set -u

payload=$(cat)

printf '%s' "$payload" | grep -q git || exit 0

if ! command -v node >/dev/null 2>&1; then
	echo "gate-bypass-guard: node not found; gate-bypass guard is INERT this session." >&2
	exit 0
fi

printf '%s' "$payload" | node "$(dirname "$0")/gate-bypass-guard.js"
