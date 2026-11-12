import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync, statSync } from 'node:fs';
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
  LONG_TEST_TITLE: `test title over ${MAX_TEST_TITLE_LENGTH} characters`,
};

// This script and its test spell out the patterns they detect.
const SELF = new Set([
  'scripts/check-diff-hygiene.mjs',
  'scripts/check-diff-hygiene.test.mjs',
]);

export const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const LINTED_FILE = /\.tsx?$/;
export const TEST_FILE = /\.test\.tsx?$/;
export const GENERATED = /(^|\/)sanity\/generated\//;

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

const isInString = (text, index) => {
  let quote;
  for (let i = 0; i < index; i += 1) {
    const char = text[i];
    if (char === '\\') {
      i += 1;
    } else if (quote ? char === quote : `'"\``.includes(char)) {
      quote = quote ? undefined : char;
    }
  }
  return quote !== undefined;
};

const matchesInCode = (pattern, text) => {
  const match = pattern.exec(text);
  return match !== null && !isInString(text, match.index);
};

const SUPPRESSION_COMMENT =
  /(^\s*|[;,)}\]]\s*)(\/\/|\/\*)\s*(eslint-disable\S*|@ts-(ignore|expect-error|nocheck)).*$/;

const LINE_CHECKS = [
  {
    check: CHECK.CONSOLE,
    applies: (file) =>
      LINTED_FILE.test(file) && !CONSOLE_EXEMPT.some((re) => re.test(file)),
    hit: (text) =>
      matchesInCode(/\bconsole\.(log|info|debug|trace|warn|error)\b/, text),
  },
  {
    check: CHECK.DEBUGGER,
    applies: (file) => SOURCE_FILE.test(file),
    hit: (text) => /^\s*debugger\s*;?\s*$/.test(text),
  },
  {
    check: CHECK.FOCUSED_TEST,
    applies: (file) => SOURCE_FILE.test(file),
    hit: (text) =>
      matchesInCode(/\b(it|test|describe|suite)\.(only|skip)\(\s*['"`]/, text),
  },
  {
    check: CHECK.CONFLICT_MARKER,
    applies: () => true,
    hit: (text) => /^(<{7}|>{7})( |$)/.test(text),
  },
  {
    check: CHECK.UNEXPLAINED_SUPPRESSION,
    applies: (file) => SOURCE_FILE.test(file),
    hit: (text) => {
      const directive = SUPPRESSION_COMMENT.exec(text);
      if (!directive) {
        return false;
      }
      return directive[3].startsWith('eslint-')
        ? !/\s--\s+\S/.test(directive[0])
        : /@ts-[a-z-]+\s*(\*\/)?\s*$/.test(directive[0]);
    },
  },
  {
    check: CHECK.LOG_EVENT_LITERAL,
    applies: (file) => SOURCE_FILE.test(file),
    hit: (text) =>
      matchesInCode(/\blogger\.(error|warn|info|debug)\(\s*['"`]/, text),
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

const isEnvFile = (file) => {
  const name = basename(file);
  return name.startsWith('.env') && name !== '.env.example';
};

export const findViolations = (files) =>
  files
    .filter(({ file }) => !SELF.has(file) && !GENERATED.test(file))
    .flatMap(({ file, added }) => [
      ...(isEnvFile(file) ? [{ file, line: 1, check: CHECK.ENV_FILE }] : []),
      ...added.flatMap(({ line, text }) =>
        LINE_CHECKS.filter(
          ({ applies, hit }) => applies(file) && hit(text),
        ).map(({ check }) => ({ file, line, check, text: text.trim() })),
      ),
    ]);

export const parseAddedLines = (diff) => {
  const byFile = new Map();
  let file;
  let next = 0;
  let afterMinusHeader = false;
  for (const text of diff.split('\n')) {
    const isPlusHeader = afterMinusHeader && text.startsWith('+++ ');
    afterMinusHeader = text.startsWith('--- ') && next === 0;
    if (text.startsWith('diff --git ')) {
      next = 0;
    } else if (isPlusHeader) {
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

export const isFile = (file) =>
  statSync(join(repoRoot, file), { throwIfNoEntry: false })?.isFile() ?? false;

export const readTouchedFiles = (base) => {
  const byFile = parseAddedLines(
    git([
      '-c',
      'core.quotePath=false',
      'diff',
      '-U0',
      '--no-color',
      '--no-ext-diff',
      base,
    ]),
  );
  for (const file of git([
    '-c',
    'core.quotePath=false',
    'ls-files',
    '--others',
    '--exclude-standard',
  ])
    .split('\n')
    .filter((name) => name && isFile(name))) {
    const text = readFileSync(join(repoRoot, file), 'utf8');
    byFile.set(
      file,
      text.split('\n').map((lineText, index) => ({
        line: index + 1,
        text: lineText,
      })),
    );
  }
  return [...byFile].map(([file, added]) => ({ file, added }));
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
