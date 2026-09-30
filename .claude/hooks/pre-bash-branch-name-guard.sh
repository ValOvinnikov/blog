#!/bin/sh
# PreToolUse(Bash) hook: refuse `git push` of a session's generated branch
# name (`claude/<words>-<id>`). board-auto-sync reads the issue number from
# the branch name, so a generated name leaves the ticket unmoved on the board.
# `claude/issue-<n>-…` is the GitHub `@claude` runner's own shape and passes.
#
# Contract (Claude Code hooks):
#   stdin  — JSON payload; the command is .tool_input.command
#   exit 0 — allow
#   exit 2 — block; stderr is fed back to the agent
set -u

payload=$(cat)

case "$payload" in
*push*) ;;
*) exit 0 ;;
esac

printf '%s' "$payload" | node -e '
const { execFileSync } = require("node:child_process");

let s = "";
process.stdin.on("data", (c) => (s += c));
process.stdin.on("end", () => {
  let command = "";
  try {
    command = JSON.parse(s).tool_input?.command ?? "";
  } catch {
    process.exit(0);
  }

  const currentBranch = (dir) => {
    try {
      return execFileSync("git", ["-C", dir, "symbolic-ref", "--quiet", "--short", "HEAD"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return "";
    }
  };

  const destinations = [];
  for (const segment of command.split(/&&|\|\||[;&|\n]/)) {
    const words = segment.trim().split(/\s+/).filter(Boolean);
    let i = 0;
    if (words[i] === "env") i += 1;
    while (i < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i])) i += 1;
    if (words[i] !== "git") continue;
    i += 1;
    let dir = process.cwd();
    while (i < words.length && words[i].startsWith("-")) {
      if (words[i] === "-C") dir = words[i + 1] ?? dir;
      i += words[i] === "-C" || words[i] === "-c" ? 2 : 1;
    }
    if (words[i] !== "push") continue;
    const rest = words.slice(i + 1);
    if (rest.some((w) => ["--delete", "-d", "--tags"].includes(w))) continue;
    const valueFlags = ["-o", "--push-option", "--receive-pack", "--exec"];
    const positional = rest.filter(
      (w, j) => !w.startsWith("-") && !valueFlags.includes(rest[j - 1]),
    );
    const refspecs = positional.slice(1);
    if (refspecs.length === 0) {
      destinations.push(currentBranch(dir));
      continue;
    }
    for (const spec of refspecs) {
      const [src, dst] = spec.replace(/^\+/, "").split(":");
      if (dst !== undefined && (src === "" || dst === "")) continue;
      const target = dst ?? src;
      destinations.push(target === "HEAD" ? currentBranch(dir) : target.replace(/^refs\/heads\//, ""));
    }
  }

  const generated = destinations.filter(
    (b) => b.startsWith("claude/") && !/^claude\/issue-\d+-/.test(b),
  );
  if (generated.length === 0) process.exit(0);

  process.stderr.write(
    "Blocked: \"" + generated[0] + "\" is a generated branch name. It carries no issue\n" +
      "number, so board-auto-sync cannot move the ticket, and the name says\n" +
      "nothing about the work. Rename it from the ticket title, then push:\n" +
      "  git branch -m <type>/<n>-<words-from-title>   e.g. feat/3952-team-single-member\n" +
      "  git branch -m <type>/<short-slug>             when there is no ticket\n",
  );
  process.exit(2);
});
'
