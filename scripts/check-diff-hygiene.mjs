import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

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
    hit: (text) =>
      /\b(it|test|describe|suite)\.(only|skip)\(\s*['"`]/.test(text),
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

const DIRECTIVE = /^(eslint-|@ts-|@vitest-|@jest-|\/ <reference)/;

const isDirective = (comment) => {
  const bodies = comment
    .replace(/^\/\/|^\/\*+|\*\/$/g, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s*/, '').trim())
    .filter(Boolean);
  return bodies.length > 0 && bodies.every((body) => DIRECTIVE.test(body));
};

const REGEX_CAN_FOLLOW = new Set([
  ts.SyntaxKind.Identifier,
  ts.SyntaxKind.NumericLiteral,
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.CloseParenToken,
  ts.SyntaxKind.CloseBracketToken,
  ts.SyntaxKind.CloseBraceToken,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.ThisKeyword,
]);

const findTestComments = (content) => {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.JSX,
    content,
  );
  const lineOf = (pos) => content.slice(0, pos).split('\n').length;
  const templateDepths = [];
  let braceDepth = 0;
  let previous;
  const lines = [];
  for (
    let kind = scanner.scan();
    kind !== ts.SyntaxKind.EndOfFileToken;
    kind = scanner.scan()
  ) {
    if (
      kind === ts.SyntaxKind.SingleLineCommentTrivia ||
      kind === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      if (!isDirective(scanner.getTokenText())) {
        lines.push(lineOf(scanner.getTokenStart()));
      }
      continue;
    }
    if (
      kind === ts.SyntaxKind.WhitespaceTrivia ||
      kind === ts.SyntaxKind.NewLineTrivia
    ) {
      continue;
    }
    if (
      (kind === ts.SyntaxKind.SlashToken ||
        kind === ts.SyntaxKind.SlashEqualsToken) &&
      !REGEX_CAN_FOLLOW.has(previous)
    ) {
      kind = scanner.reScanSlashToken();
    } else if (kind === ts.SyntaxKind.TemplateHead) {
      templateDepths.push(braceDepth);
    } else if (kind === ts.SyntaxKind.OpenBraceToken) {
      braceDepth += 1;
    } else if (kind === ts.SyntaxKind.CloseBraceToken) {
      if (templateDepths.at(-1) === braceDepth) {
        kind = scanner.reScanTemplateToken(false);
        if (kind === ts.SyntaxKind.TemplateTail) {
          templateDepths.pop();
        }
      } else {
        braceDepth -= 1;
      }
    }
    previous = kind;
  }
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

const readTouchedFiles = (base) => {
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
