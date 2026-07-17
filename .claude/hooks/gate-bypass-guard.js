#!/usr/bin/env node
// PreToolUse hook: block the PLAIN, unobfuscated forms of git commands that
// skip this repo's husky gates or rewrite pushed history — #397.
//
// This is issue #397's second attempt. The first (commit ecc1092, discarded
// at the maintainer's direction) chased ~15 real bypasses across five review
// rounds — env var indirection, shell recursion, case-insensitive
// filesystems, path-qualified binaries, wrapper commands, short-flag
// clusters, quote-splitting, backslash-newline continuations — and its
// actual failure mode was never bypass coverage. It was false positives on
// HONEST commands: it blocked its own commit twice, once for a message that
// merely *mentioned* `git commit -n`, once for its own test probe. A guard
// that blocks someone from writing about `--no-verify` has a worse cost
// profile than the shortcut it prevents.
//
// This version is deliberately narrower — a guardrail against reaching for a
// bypass flag by habit, not an adversarial-proof sandbox (same posture as
// .claude/hooks/read-only-agent-guard.sh). It catches only LITERAL,
// unobfuscated forms: a real `--no-verify`/`-n`/`--force`/`-f` token passed
// to `git`, or `core.hooksPath` passed to `git config`. It deliberately does
// NOT chase, and a future edit should not try to add:
//   - `git -c core.hooksPath=...` (a transient per-invocation override)
//   - GIT_CONFIG_KEY_n / env var indirection
//   - recursion into `bash -c "..."` / `eval "..."` string arguments
//   - case-insensitive filesystem tricks (`GIT push --force`)
//   - path-qualified binaries (`/usr/bin/git`)
//   - wrapper commands (`sudo`/`env`/`xargs`/`command` before `git`)
//   - clustered short flags (`-nm`, `-uf`, `-an`)
//   - quote-split flags (`--no-ver"ify"`)
//   - backslash-newline continuations
// If a future edit finds it needs cleverer tokenization to catch one of
// these, that is the signal to stop, not to extend this file — see #397 for
// the full history of what chasing them cost last time.
//
// The one piece of care this DOES take, because it is exactly what broke the
// discarded attempt: tokenization resolves quotes the way the shell does, so
// a commit message is one value token and can never be misread as a flag —
// `git commit -m "mentions --no-verify"` must pass, including this repo's own
// multi-line `-m "$(cat <<'EOF' ... EOF)"` commit convention. See tokenize().
//
// Contract (Claude Code hooks):
//   stdin  — JSON payload; the command is .tool_input.command
//   exit 0 — allow (also: unparsable payload, no git command)
//   exit 2 — block; stderr is shown to the agent as the reason

/**
 * Split a command into shell-ish tokens, resolving quotes the way bash does.
 * Deliberately does NOT understand `$(...)`/backtick command substitution or
 * heredocs as syntax — it does not need to. A quoted region is captured
 * verbatim, in full, up to its matching close quote, including any
 * newlines, `$(...)`, or quotes of the OTHER kind inside it. That is enough
 * to keep a whole multi-line commit message — even one built with
 * `$(cat <<'EOF' ... EOF)`, this repo's own convention — as a single value
 * token that can never look like a flag.
 */
function tokenize(src) {
  const tokens = [];
  let cur = '';
  let started = false;
  const push = () => {
    if (started) {
      tokens.push(cur);
      cur = '';
      started = false;
    }
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "'") {
      started = true;
      const end = src.indexOf("'", i + 1);
      if (end === -1) {
        cur += src.slice(i + 1);
        break;
      }
      cur += src.slice(i + 1, end);
      i = end;
    } else if (c === '"') {
      started = true;
      let j = i + 1;
      for (; j < src.length && src[j] !== '"'; j++) {
        if (src[j] === '\\' && j + 1 < src.length) {
          j++;
        }
        cur += src[j];
      }
      i = j;
    } else if (';|&()`\n'.includes(c)) {
      // Ends the current statement, same as `;`. This is what lets
      // `git add -A && git commit --no-verify` be inspected as two
      // invocations rather than one blob — not an attempt to catch
      // newline-based evasion (out of scope, see header).
      push();
      tokens.push(';');
    } else if (/\s/.test(c)) {
      push();
    } else {
      cur += c;
      started = true;
    }
  }
  push();
  return tokens;
}

/** Split tokens into command segments at the `;` markers tokenize() emits. */
function segments(tokens) {
  const out = [[]];
  for (const t of tokens) {
    if (t === ';') {
      out.push([]);
    } else {
      out[out.length - 1].push(t);
    }
  }
  return out.filter((s) => s.length > 0);
}

/**
 * Git's own global options that take a value as a SEPARATE token (`git
 * --git-dir /foo commit`, not `--git-dir=/foo`). The `--flag=value` single-
 * token form needs no special-casing — it's caught by the generic
 * `startsWith('-')` skip below — but the two-token form must be recognized
 * here, or the value token (`/foo`) gets misread as the subcommand and the
 * real one (`commit`, with its `--no-verify`) shifts into `args`, where
 * nothing ever looks at it again. This is not an obfuscation case: a plain
 * `git --git-dir /foo/bar commit --no-verify` is as literal as it gets.
 */
const GLOBAL_VALUE_FLAGS = new Set([
  '-c',
  '-C',
  '--exec-path',
  '--git-dir',
  '--work-tree',
  '--namespace',
  '--super-prefix',
  '--config-env',
]);

/**
 * The git subcommand in a segment, tolerating git's own global flags before
 * it (`-C dir`, `-c k=v`, `--git-dir=...` or `--git-dir foo`). Requires the
 * LITERAL token `git` at the start of the segment — no case-insensitivity,
 * no path qualification (`/usr/bin/git`), no wrapper prefix
 * (`sudo git ...`). That narrowing is deliberate: see the file header.
 */
function gitSubcommand(seg) {
  if (seg[0] !== 'git') {
    return null;
  }
  for (let j = 1; j < seg.length; j++) {
    if (GLOBAL_VALUE_FLAGS.has(seg[j])) {
      j++; // skip the flag's value token
      continue;
    }
    if (seg[j].startsWith('-')) {
      continue;
    }
    return { sub: seg[j], args: seg.slice(j + 1) };
  }
  return { sub: null, args: [] };
}

function check(seg) {
  const g = gitSubcommand(seg);
  if (!g) {
    return null;
  }
  const { sub, args } = g;
  const has = (f) => args.includes(f);

  if (['commit', 'push', 'merge'].includes(sub) && has('--no-verify')) {
    return '--no-verify skips the husky pre-commit/pre-push gates (lint-staged, type-check, lint).';
  }
  // -n is --no-verify only for `commit`: it means --dry-run for `push` and
  // --no-stat for `merge` (and --dry-run for `clean`, an unrelated
  // subcommand). Checking it for anything but commit false-blocks those.
  if (sub === 'commit' && has('-n')) {
    return 'git commit -n is the short form of --no-verify and skips the husky pre-commit gate.';
  }
  if (sub === 'push') {
    if (
      has('--force') ||
      has('-f') ||
      has('--force-with-lease') ||
      args.some((a) => a.startsWith('--force-with-lease='))
    ) {
      return "Force-pushing can destroy pushed history and other people's work.";
    }
    if (args.some((a) => /^\+.+/.test(a))) {
      return 'A leading + in a push refspec is a force push.';
    }
  }
  if (sub === 'config' && args.some((a) => a.toLowerCase() === 'core.hookspath')) {
    return 'Changing core.hooksPath disables the husky gates.';
  }
  return null;
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let cmd;
  try {
    cmd = JSON.parse(raw).tool_input?.command ?? '';
  } catch {
    process.exit(0); // malformed payload -> allow
  }
  if (!cmd.includes('git')) {
    process.exit(0);
  }
  for (const seg of segments(tokenize(cmd))) {
    const reason = check(seg);
    if (reason) {
      process.stderr.write(`${reason}\n`);
      process.stderr.write(
        'Blocked: this bypasses a repo gate (#397). If it is genuinely needed, ask the human to run it.\n',
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
