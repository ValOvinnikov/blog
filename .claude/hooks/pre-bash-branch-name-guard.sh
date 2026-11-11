#!/bin/sh
# PreToolUse(Bash) hook: refuse `git push` to a branch outside the one
# branch-name pattern, which scripts/branch-name.mjs defines.
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

BRANCH_NAME_SCRIPT="$(cd "$(dirname "$0")/../../scripts" && pwd)/branch-name.mjs"
export BRANCH_NAME_SCRIPT

printf '%s' "$payload" | node -e '
const { execFileSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");

let s = "";
process.stdin.on("data", (c) => (s += c));
process.stdin.on("end", async () => {
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
  const unredirected = command
    .replace(/\d*[<>]+&\d+/g, " ")
    .replace(/\d*[<>]+\s*[^\s;&|]+/g, " ");
  for (const segment of unredirected.split(/&&|\|\||[;&|\n]/)) {
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
      if (target.startsWith("refs/tags/")) continue;
      destinations.push(target === "HEAD" ? currentBranch(dir) : target.replace(/^refs\/heads\//, ""));
    }
  }

  const { isAllowedBranch, renameHint } = await import(
    pathToFileURL(process.env.BRANCH_NAME_SCRIPT).href
  );
  const refused = destinations.filter((b) => b !== "" && !isAllowedBranch(b));
  if (refused.length === 0) process.exit(0);

  process.stderr.write("Blocked: " + renameHint(refused[0]));
  process.exit(2);
});
'
