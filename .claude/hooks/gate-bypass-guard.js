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
// to `git`, or `core.hooksPath` passed to `git config` as a write, not a
// `--get`-style read (#454). It deliberately does NOT chase, and a future
// edit should not try to add:
//   - `git -c core.hooksPath=...` (a transient per-invocation override)
//   - GIT_CONFIG_KEY_n / env var indirection
//   - recursion into `bash -c "..."` / `eval "..."` string arguments
//   - case-insensitive filesystem tricks (`GIT push --force`)
//   - path-qualified binaries (`/usr/bin/git`)
//   - wrapper commands (`sudo`/`env`/`xargs`/`command` before `git`)
//   - clustered short flags (`-nm`, `-uf`, `-an`)
//   - quote-split flags — a backslash-escaped quote INSIDE a `$(...)`
//     substitution (`$(echo \"abc\)\") --no-verify` — #454 round 2) opens a
//     real, standalone `--no-verify` token there; the same trick at the
//     PLAIN top level with no `$(...)` involved (`--no-ver\"ify\"`) is inert
//     in real bash (it produces the literal arg `--no-ver"ify"`, not a flag)
//     and is unaffected either way — same missing feature, different
//     exploitability, still not chased
//   - `$'...'` ANSI-C quoting (`$'x\'y'` — the tokenizer treats it as plain
//     `'...'` and doesn't recognize `\'` as an escaped close, so
//     `git commit -m $'x\'y' --no-verify` opens a real --no-verify token;
//     same gap reachable inside `$(...)` too — #454 round 3)
//   - backslash-newline continuations
// #454's own history is why this file stops here rather than attempting
// another round: fixing the original unquoted-$(...) gap (round 1)
// uncovered a bug IN that fix (a quoted `)` corrupting the paren-depth
// count, closed in round 2) — and reviewing round 2's fix then found two
// more gaps nested inside the corrected scanner: a backtick span not
// tracked as its own unit inside $(...) (closed in round 3) and the
// quote-split-flags gap above (left documented, not closed). Reviewing
// round 3's fix then found a further, separate gap: the `$'...'` bullet
// above. Each of three consecutive review passes surfaced a new problem in
// the same quote-tokenization area, found only by direct adversarial
// testing and never by reading the code — the identical failure pattern
// that got the discarded first #397 attempt killed. This file stops
// chasing it here, the same way that attempt should have stopped sooner.
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
 * A quoted region is captured verbatim, in full, up to its matching close
 * quote, including any newlines, `$(...)`, or quotes of the OTHER kind
 * inside it. That is enough to keep a whole multi-line commit message —
 * even one built with `$(cat <<'EOF' ... EOF)`, this repo's own convention —
 * as a single value token that can never look like a flag.
 *
 * `$(...)` and backtick command substitution are recognized OUTSIDE quotes
 * too (#454): they are a VALUE, not a statement separator, so
 * `git commit -m $(echo hi) --no-verify` (unquoted, no protective quotes
 * around the substitution) must still be inspected as one `git` invocation
 * with `--no-verify` visible in its args — not fractured into a trailing
 * segment that no longer starts with `git` and skips the check entirely.
 * A bare unquoted `(`/`)` (a subshell group, not preceded by `$`) still ends
 * the current statement, same as before.
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
    } else if (c === '$' && src[i + 1] === '(') {
      // $(...) command substitution — a value, consumed whole (balanced
      // parens) as part of the current token. See function doc.
      //
      // Paren-counting must ignore parens inside quotes INSIDE the
      // substitution (`$(echo "abc)")`) — reviewer-found gap: a naive count
      // closes the substitution one char early on the quoted `)`, and the
      // stray `"` that follows is then misread as opening a NEW unterminated
      // double-quote region that swallows the rest of the command (including
      // a real trailing --no-verify) into a value token, hiding it from
      // check(). So this loop tracks quote state the same way the top-level
      // scan does. It also must not let parens inside a NESTED backtick
      // substitution affect the count (`` $(echo `echo \)`) `` ) — second
      // reviewer-found gap: backticks are consumed as their own atomic span,
      // same as the top-level backtick branch below, so their contents never
      // reach the depth counter.
      //
      // What this does NOT chase: a backslash-escaped quote used to hide a
      // flag (`$(echo \"abc\)\") --no-verify`) is the same quote-splitting
      // trick already listed as out of scope in the file header — the
      // existing top-level tokenizer has the identical gap for the identical
      // reason (a `\"` it doesn't recognize as escaped still opens a real
      // quote region). Chasing it here would mean chasing it everywhere;
      // see gate-bypass-guard.test.sh's "known, documented gaps" section for
      // a pinned example.
      started = true;
      cur += c;
      let depth = 0;
      let inSingle = false;
      let inDouble = false;
      let j = i + 1;
      for (; j < src.length; j++) {
        const cj = src[j];
        if (inSingle) {
          cur += cj;
          if (cj === "'") {
            inSingle = false;
          }
          continue;
        }
        if (inDouble) {
          cur += cj;
          if (cj === '\\' && j + 1 < src.length) {
            j++;
            cur += src[j];
            continue;
          }
          if (cj === '"') {
            inDouble = false;
          }
          continue;
        }
        if (cj === '`') {
          // Nested backtick span — consume atomically, same rule as the
          // top-level backtick branch, so its contents never touch depth.
          cur += cj;
          let k = j + 1;
          for (; k < src.length && src[k] !== '`'; k++) {
            if (src[k] === '\\' && k + 1 < src.length) {
              cur += src[k];
              k++;
            }
            cur += src[k];
          }
          if (k < src.length) {
            cur += src[k]; // closing backtick
          }
          j = k;
          continue;
        }
        cur += cj;
        if (cj === "'") {
          inSingle = true;
        } else if (cj === '"') {
          inDouble = true;
        } else if (cj === '(') {
          depth++;
        } else if (cj === ')') {
          depth--;
          if (depth === 0) {
            break;
          }
        }
      }
      i = j;
    } else if (c === '`') {
      // Backtick command substitution — same reasoning as $(...) above.
      started = true;
      cur += c;
      let j = i + 1;
      for (; j < src.length && src[j] !== '`'; j++) {
        cur += src[j];
      }
      if (j < src.length) {
        cur += src[j]; // closing backtick
      }
      i = j;
    } else if (';|&()\n'.includes(c)) {
      // Ends the current statement, same as `;`. This is what lets
      // `git add -A && git commit --no-verify` be inspected as two
      // invocations rather than one blob — not an attempt to catch
      // newline-based evasion (out of scope, see header). Bare `(`/`)`
      // reach here only when NOT part of a `$(...)` substitution (that
      // case is handled above and never falls through to this branch).
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
  // --get*-style flags make this a read, not a write (#454) — `git config
  // --get core.hooksPath` only prints the current value. The bare form
  // `git config core.hooksPath` (no value, no flag) is ALSO technically a
  // read in real git, but this deliberately doesn't special-case it — only
  // the explicitly-flagged reads the issue asked for are exempted; the bare
  // form stays blocked (over-cautious, not a false positive anyone hit).
  const CONFIG_READ_FLAGS = new Set([
    '--get',
    '--get-all',
    '--get-regexp',
    '--get-urlmatch',
  ]);
  if (
    sub === 'config' &&
    args.some((a) => a.toLowerCase() === 'core.hookspath') &&
    !args.some((a) => CONFIG_READ_FLAGS.has(a))
  ) {
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
