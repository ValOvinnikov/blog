import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readTouchedFiles } from './check-diff-hygiene.mjs';
import { missingBaseMessage, repoRoot, resolveBase } from './touched-files.mjs';

const MAX_TEST_FILE_LINES = 500;
const MIN_FIXTURE_LITERAL_LENGTH = 4;

export const HIT = {
  LEFTOVER: 'TODO/FIXME left in — may cite an open issue',
  SECRET: 'possible secret — fixtures carry fakes',
  SANITY_PROJECT_ID: 'possible real Sanity project id in a copied error',
  SUPPRESSION: 'lint or type suppression — judge its reason',
  RESTATED_SOURCE: 'test may restate its source',
  OWN_COMPONENT_FAKE:
    'vi.mock of our own component outside a renderer or route test',
  MOCK_CALLS: 'reads mock.calls — blocking for a faked component',
  COMMENT: 'comment added outside a test — read it against the comment rule',
  UNNAMED_FIXTURE: 'fixed fake value not named MOCK_<THING> or mock<Thing>',
  LARGE_TEST_FILE: `touched test file over ${MAX_TEST_FILE_LINES} lines — read it for pruning`,
  EXISTING_FIXTURE: 'fake value already in testing/ or __mocks__/',
};

// This script and its test spell out the patterns they detect.
const SELF = new Set([
  'scripts/check-review-hits.mjs',
  'scripts/check-review-hits.test.mjs',
]);

const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const TEST_FILE = /\.test\.tsx?$/;
const FIXTURE_FILE =
  /(\.test\.tsx?|\/testing\/.*\.tsx?|\/__mocks__\/.*\.tsx?)$/;
const RENDERER_OR_ROUTE_TEST = /(module-renderer|\/src\/app\/.*)\.test/;
const GENERATED = /(^|\/)sanity\/generated\//;
const DIRECTIVE = /(eslint-disable|@ts-(ignore|expect-error|nocheck))/;
const SECRET_ASSIGNMENT =
  /(_TOKEN|_SECRET|API_KEY)\s*[:=]\s*['"`]?([A-Za-z0-9_-]{12,})['"`]?\s*[,;]?\s*$/;
const CONST_REFERENCE = /^[A-Z][A-Z0-9_]*$/;

const LINE_HITS = [
  {
    hit: HIT.LEFTOVER,
    applies: (file) => SOURCE_FILE.test(file),
    matches: (text) => /\b(TODO|FIXME|XXX|HACK)\b/.test(text),
  },
  {
    hit: HIT.SECRET,
    applies: () => true,
    matches: (text) => {
      const value = SECRET_ASSIGNMENT.exec(text)?.[2];
      return value !== undefined && !CONST_REFERENCE.test(value);
    },
  },
  {
    hit: HIT.SANITY_PROJECT_ID,
    applies: () => true,
    matches: (text) => /\/access\/project\/[a-z0-9]{8}\//.test(text),
  },
  {
    hit: HIT.SUPPRESSION,
    applies: (file) => SOURCE_FILE.test(file),
    matches: (text) => DIRECTIVE.test(text),
  },
  {
    hit: HIT.RESTATED_SOURCE,
    applies: (file) => TEST_FILE.test(file),
    matches: (text) =>
      /(fields\.map\(\(f\) => f\.name\)|typeof [^)]*\)\.toBe\(.function.\)|\.name\)\.toBe\()/.test(
        text,
      ),
  },
  {
    hit: HIT.OWN_COMPONENT_FAKE,
    applies: (file) =>
      TEST_FILE.test(file) && !RENDERER_OR_ROUTE_TEST.test(file),
    matches: (text) =>
      /^vi\.mock\(.(@web\/(components|modules)|@platform\/components|@blog\/ui)/.test(
        text,
      ),
  },
  {
    hit: HIT.MOCK_CALLS,
    applies: (file) => TEST_FILE.test(file),
    matches: (text) => /mock\.calls/.test(text),
  },
  {
    hit: HIT.COMMENT,
    applies: (file) => SOURCE_FILE.test(file) && !TEST_FILE.test(file),
    matches: (text) =>
      /^\s*(\/\/|\/\*|\*(?!\/))/.test(text) && !DIRECTIVE.test(text),
  },
  {
    hit: HIT.UNNAMED_FIXTURE,
    applies: (file) => FIXTURE_FILE.test(file),
    matches: (text) =>
      /^(export )?const [A-Za-z_][A-Za-z0-9_]* = ('|"|`|\[|\{|-?[0-9]|faker\.)/.test(
        text,
      ) && !/^(export )?const (MOCK_|mock)/.test(text),
  },
];

export const findReviewHits = (files) =>
  files
    .filter(({ file }) => !SELF.has(file) && !GENERATED.test(file))
    .flatMap(({ file, added, lineCount = 0 }) => [
      ...(TEST_FILE.test(file) && lineCount > MAX_TEST_FILE_LINES
        ? [
            {
              file,
              line: 1,
              hit: HIT.LARGE_TEST_FILE,
              text: `${lineCount} lines`,
            },
          ]
        : []),
      ...added.flatMap(({ line, text }) =>
        LINE_HITS.filter(
          ({ applies, matches }) => applies(file) && matches(text),
        ).map(({ hit }) => ({ file, line, hit, text: text.trim() })),
      ),
    ]);

const NOT_A_FIXTURE_LINE =
  /^\s*(import |\} from |vi\.mock\()|ByRole\(|stubEnv|process\.env/;

export const fixtureLiteralsOf = (added) => [
  ...new Set(
    added
      .filter(({ text }) => !NOT_A_FIXTURE_LINE.test(text))
      .flatMap(({ text }) => text.match(/'[^' ]+'/g) ?? [])
      .filter((literal) => literal.length - 2 >= MIN_FIXTURE_LITERAL_LENGTH),
  ),
];

const holderOf = (workspace, literal) => {
  try {
    return execFileSync(
      'git',
      [
        'grep',
        '-l',
        '-F',
        '-e',
        literal,
        '--',
        `${workspace}/src/testing`,
        `:(glob)${workspace}/src/**/__mocks__/**`,
      ],
      { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).split('\n')[0];
  } catch {
    return undefined;
  }
};

const findExistingFixtures = (files) =>
  files
    .filter(({ file }) => TEST_FILE.test(file))
    .flatMap(({ file, added }) => {
      const workspace = file.split('/').slice(0, 2).join('/');
      return fixtureLiteralsOf(added).flatMap((literal) => {
        const holder = holderOf(workspace, literal);
        return holder
          ? [
              {
                file,
                line: added.find(({ text }) => text.includes(literal)).line,
                hit: HIT.EXISTING_FIXTURE,
                text: `${literal} is in ${holder}`,
              },
            ]
          : [];
      });
    });

const withLineCount = (entry) => {
  const path = join(repoRoot, entry.file);
  return {
    ...entry,
    lineCount: existsSync(path)
      ? readFileSync(path, 'utf8').split('\n').length
      : 0,
  };
};

const main = () => {
  const base = resolveBase();
  if (!base) {
    console.error(`error: ${missingBaseMessage()}`);
    process.exit(1);
  }
  const files = readTouchedFiles(base).map(withLineCount);
  const hits = [...findReviewHits(files), ...findExistingFixtures(files)];
  for (const kind of Object.values(HIT)) {
    const ofKind = hits.filter(({ hit }) => hit === kind);
    if (ofKind.length > 0) {
      console.log(`\n${kind} (${ofKind.length})`);
      for (const { file, line, text } of ofKind) {
        console.log(`  ${file}:${line}: ${text}`);
      }
    }
  }
  console.log(
    `\n${hits.length} hit(s) for a reader. None is a finding until read (code-review-practices §0).`,
  );
};

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
