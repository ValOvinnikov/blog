// The judgement-free half of code-review-practices §0: every hit fails, so it
// runs in `pnpm verify` and pre-push, before any reviewer is dispatched.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { repoRoot, resolveBase } from './touched-files.mjs';

const MAX_TEST_TITLE_LENGTH = 80;

export const CHECK = {
  CONSOLE: 'bare console.* (log through the app logger)',
  DEBUGGER: 'debugger statement',
  FOCUSED_TEST: 'focused or skipped test',
  CONFLICT_MARKER: 'merge conflict marker',
  ENV_FILE: 'committed .env file',
  UNEXPLAINED_SUPPRESSION: 'suppression without a reason',
  LOG_EVENT_LITERAL:
    'log event name typed at the call (use the <DOMAIN>_LOG const)',
  TEST_COMMENT: 'comment in a test file',
  LONG_TEST_TITLE: `test title over ${MAX_TEST_TITLE_LENGTH} characters`,
};

// This script and its test spell out the patterns they detect.
const SELF = new Set([
  'scripts/check-diff-hygiene.mjs',
  'scripts/check-diff-hygiene.test.mjs',
]);

const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const LINTED_FILE = /\.tsx?$/;
const TEST_FILE = /\.test\.tsx?$/;
const GENERATED = /(^|\/)sanity\/generated\//;

// Mirrors the no-console exemptions in configs/eslint (base, db, insight, web, platform).
const CONSOLE_EXEMPT = [
  /\.test\.tsx?$/,
  /^(apps|packages)\/[^/]+\/src\/testing\//,
  /^apps\/[^/]+\/src\/vitest-setup\.ts$/,
  /^apps\/web\/e2e\//,
  /^packages\/db\/scripts\//,
  /^packages\/db\/drizzle\.config\.ts$/,
  /^packages\/insight\/src\//,
];

const LINE_CHECKS = [
  {
    check: CHECK.CONSOLE,
    applies: (file) =>
      LINTED_FILE.test(file) && !CONSOLE_EXEMPT.some((re) => re.test(file)),
    hit: (text) => /\bconsole\.(log|info|debug|trace|warn|error)\b/.test(text),
  },
  {
    check: CHECK.DEBUGGER,
    applies: (file) => SOURCE_FILE.test(file),
    hit: (text) => /^\s*debugger\s*;?\s*$/.test(text),
  },
  {
    check: CHECK.FOCUSED_TEST,
    applies: (file) => SOURCE_FILE.test(file),
    hit: (text) => /\b(it|test|describe|suite)\.(only|skip)\(/.test(text),
  },
  {
    check: CHECK.CONFLICT_MARKER,
    applies: () => true,
    hit: (text) => /^(<{7}|>{7})( |$)/.test(text),
  },
  {
    check: CHECK.UNEXPLAINED_SUPPRESSION,
    applies: (file) => SOURCE_FILE.test(file),
    hit: (text) =>
      (/\beslint-disable(-next-line|-line)?\b/.test(text) &&
        !/\beslint-disable(-next-line|-line)?\b.*\s--\s+\S/.test(text)) ||
      /@ts-(ignore|expect-error|nocheck)\s*(\*\/)?\s*$/.test(text),
  },
  {
    check: CHECK.LOG_EVENT_LITERAL,
    applies: (file) => SOURCE_FILE.test(file),
    hit: (text) => /\blogger\.(error|warn|info|debug)\(\s*['"`]/.test(text),
  },
  {
    check: CHECK.LONG_TEST_TITLE,
    applies: (file) => TEST_FILE.test(file),
    hit: (text) => {
      const match = /^\s*(it|test)(\.each\(.*\))?\(\s*(['"`])/.exec(text);
      if (!match) {
        return false;
      }
      const rest = text.slice(match.index + match[0].length);
      const end = rest.indexOf(match[3]);
      return (end === -1 ? rest.length : end) > MAX_TEST_TITLE_LENGTH;
    },
  },
];

const DIRECTIVE_COMMENT =
  /^\s*(\/\/|\/\*)\s*(eslint-|@ts-|@vitest-|\/ <reference)/;

const isDirectiveBlock = (block) => {
  const bodies = block
    .map(({ text }) =>
      text
        .replace(/^\s*(\/\*+|\*\/|\*)?/, '')
        .replace(/\*\/\s*$/, '')
        .trim(),
    )
    .filter(Boolean);
  return (
    bodies.length > 0 &&
    bodies.every((body) => /^(@vitest-|@jest-|eslint-|@ts-)/.test(body))
  );
};

const findTestComments = (content) => {
  const lines = [];
  let block;
  content.split('\n').forEach((text, index) => {
    const trimmed = text.trim();
    const line = { line: index + 1, text };
    if (block) {
      block.push(line);
    } else if (DIRECTIVE_COMMENT.test(text)) {
      return;
    } else if (trimmed.startsWith('//')) {
      lines.push(line.line);
      return;
    } else if (trimmed.startsWith('/*')) {
      block = [line];
    } else {
      return;
    }
    if (
      block.length > 1
        ? trimmed.includes('*/')
        : trimmed.slice(2).includes('*/')
    ) {
      if (!isDirectiveBlock(block)) {
        lines.push(...block.map(({ line: number }) => number));
      }
      block = undefined;
    }
  });
  return lines;
};

const isEnvFile = (file) => {
  const name = basename(file);
  return name.startsWith('.env') && name !== '.env.example';
};

export const findViolations = (files) =>
  files
    .filter(({ file }) => !SELF.has(file) && !GENERATED.test(file))
    .flatMap(({ file, added, content }) => [
      ...(isEnvFile(file) ? [{ file, line: 1, check: CHECK.ENV_FILE }] : []),
      ...added.flatMap(({ line, text }) =>
        LINE_CHECKS.filter(
          ({ applies, hit }) => applies(file) && hit(text),
        ).map(({ check }) => ({ file, line, check, text: text.trim() })),
      ),
      ...(TEST_FILE.test(file) && content !== undefined
        ? findTestComments(content).map((line) => ({
            file,
            line,
            check: CHECK.TEST_COMMENT,
          }))
        : []),
    ]);

export const parseAddedLines = (diff) => {
  const byFile = new Map();
  let file;
  let next = 0;
  for (const text of diff.split('\n')) {
    if (text.startsWith('+++ ')) {
      file = text === '+++ /dev/null' ? undefined : text.slice(6);
      if (file) {
        byFile.set(file, byFile.get(file) ?? []);
      }
    } else if (text.startsWith('@@')) {
      next = Number(/\+(\d+)/.exec(text)[1]);
    } else if (file && text.startsWith('+')) {
      byFile.get(file).push({ line: next, text: text.slice(1) });
      next += 1;
    }
  }
  return byFile;
};

const git = (args) =>
  execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });

const readTouchedFiles = (base) => {
  const byFile = parseAddedLines(
    git(['diff', '-U0', '--no-color', '--no-ext-diff', base]),
  );
  for (const file of git(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .filter(Boolean)) {
    const text = readFileSync(join(repoRoot, file), 'utf8');
    byFile.set(
      file,
      text.split('\n').map((lineText, index) => ({
        line: index + 1,
        text: lineText,
      })),
    );
  }
  return [...byFile].map(([file, added]) => {
    const path = join(repoRoot, file);
    return {
      file,
      added,
      content:
        TEST_FILE.test(file) && existsSync(path)
          ? readFileSync(path, 'utf8')
          : undefined,
    };
  });
};

const main = () => {
  const base = resolveBase();
  if (!base) {
    console.log(
      'No origin/main to diff against; skipping the diff hygiene check.',
    );
    return;
  }
  const violations = findViolations(readTouchedFiles(base));
  for (const { file, line, check, text } of violations) {
    console.error(`${file}:${line} — ${check}${text ? `: ${text}` : ''}`);
  }
  if (violations.length > 0) {
    console.error(
      `\n${violations.length} diff hygiene finding(s). Fix each before review (code-review-practices §0).`,
    );
    process.exit(1);
  }
};

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
