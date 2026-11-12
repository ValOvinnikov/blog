import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GENERATED,
  isFile,
  matchesInCode,
  readTouchedFiles,
  SOURCE_FILE,
  TEST_FILE,
} from './check-diff-hygiene.mjs';
import {
  missingBaseMessage,
  readAtBase,
  repoRoot,
  resolveBase,
} from './touched-files.mjs';

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
  REPEATED_VALUE: 'value already written in another file of this workspace',
  RESTATED_CONST: 'new const restates the values of an existing one',
};

// This script and its test spell out the patterns they detect.
const SELF = new Set([
  'scripts/check-review-hits.mjs',
  'scripts/check-review-hits.test.mjs',
]);

const FIXTURE_FILE =
  /(\.test\.tsx?|\/testing\/.*\.tsx?|\/__mocks__\/.*\.tsx?)$/;
const RENDERER_OR_ROUTE_TEST = /(module-renderer|\/src\/app\/.*)\.test/;
const DIRECTIVE = /(eslint-disable|@ts-(ignore|expect-error|nocheck))/;
const SECRET_NAME = '(_TOKEN|_SECRET|_KEY)\\b';
const SECRET_VALUE = '([A-Za-z0-9_+/=.-]{12,})';
const QUOTED_SECRET = new RegExp(
  `${SECRET_NAME}['"]?\\s*[:=]\\s*['"\`]${SECRET_VALUE}`,
);
const BARE_SECRET = new RegExp(`${SECRET_NAME}\\s*[:=]\\s*${SECRET_VALUE}`);
const CONST_VALUE = /^[A-Z][A-Z0-9_]*$/;

// A generated secret carries digits; vocabulary and copy do not.
const looksGenerated = (value) =>
  value !== undefined && /[0-9]/.test(value) && !CONST_VALUE.test(value);

const TRAILING_COMMENT = /\s\/\/|\{\/\*/;

const LINE_HITS = [
  {
    hit: HIT.LEFTOVER,
    applies: (file) => SOURCE_FILE.test(file),
    matches: (text) => /\b(TODO|FIXME|XXX|HACK)\b/.test(text),
  },
  {
    hit: HIT.SECRET,
    applies: () => true,
    matches: (text) => looksGenerated(QUOTED_SECRET.exec(text)?.[2]),
  },
  {
    hit: HIT.SECRET,
    applies: (file) => !SOURCE_FILE.test(file),
    matches: (text) =>
      !QUOTED_SECRET.test(text) && looksGenerated(BARE_SECRET.exec(text)?.[2]),
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
      /^\s*vi\.mock\(.(@web\/(components|modules)|@platform\/components|@blog\/ui)/.test(
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
      (/^\s*(\/\/|\/\*|\*(?!\/))/.test(text) ||
        matchesInCode(TRAILING_COMMENT, text)) &&
      !DIRECTIVE.test(text),
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

const holderOf = (literal, pathspecs, except) => {
  try {
    return execFileSync(
      'git',
      ['grep', '-l', '-F', '-e', literal, '--', ...pathspecs],
      { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .split('\n')
      .find((file) => file && file !== except);
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
        const holder = holderOf(literal, [
          `${workspace}/src/testing`,
          `:(glob)${workspace}/src/**/__mocks__/**`,
        ]);
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

const VALUE_SOURCE = /^(apps|packages)\/[^/]+\/src\/.*\.tsx?$/;
const NOT_VALUE_SOURCE =
  /(\.(test|stories)\.tsx?|-variants\.ts|\/testing\/|\/__mocks__\/|\/schema\/)/;
const NOT_A_VALUE_LINE =
  /^\s*(import |export .* from |\} from )|process\.env|_type|ByRole\(|\b(t|useTranslations|getTranslations)\(/;
const MIN_VALUE_LENGTH = 4;

// Vocabulary an outside standard spells, which CLAUDE.md exempts from the const rule.
const STANDARD_VOCABULARY = new Set([
  'button',
  'submit',
  'reset',
  '_blank',
  'production',
  'development',
  'strict',
  'utf8',
  'utf-8',
]);

export const valueLiteralsOf = (added, indexed = {}) => [
  ...new Set(
    added
      .filter(({ text }) => !NOT_A_VALUE_LINE.test(text))
      .flatMap(({ text }) => text.match(/'[A-Za-z0-9_.:/-]+'/g) ?? [])
      .filter((literal) => {
        const value = literal.slice(1, -1);
        return (
          value.length >= MIN_VALUE_LENGTH &&
          !STANDARD_VOCABULARY.has(value) &&
          !Object.hasOwn(indexed, value)
        );
      }),
  ),
];

const findRepeatedValues = (files, indexed) =>
  files
    .filter(
      ({ file }) => VALUE_SOURCE.test(file) && !NOT_VALUE_SOURCE.test(file),
    )
    .flatMap(({ file, added }) => {
      const workspace = file.split('/').slice(0, 2).join('/');
      return valueLiteralsOf(added, indexed).flatMap((literal) => {
        const holder = holderOf(
          literal,
          [
            `${workspace}/src`,
            ':(exclude,glob)**/*.test.*',
            ':(exclude,glob)**/*.stories.*',
          ],
          file,
        );
        return holder
          ? [
              {
                file,
                line: added.find(({ text }) => text.includes(literal)).line,
                hit: HIT.REPEATED_VALUE,
                text: `${literal} is also in ${holder}`,
              },
            ]
          : [];
      });
    });

const constsOf = (index) => {
  const consts = new Map();
  for (const [value, refs] of Object.entries({
    ...index.strings,
    ...index.numbers,
  })) {
    for (const { ref, file } of refs) {
      const name = ref.split('.')[0];
      const entry = consts.get(name) ?? { file, values: new Set() };
      entry.values.add(value);
      consts.set(name, entry);
    }
  }
  return consts;
};

export const findRestatedConsts = (index, baseIndex) => {
  const consts = constsOf(index);
  const known = constsOf(baseIndex);
  return [...consts]
    .filter(([name, { values }]) => !known.has(name) && values.size > 1)
    .flatMap(([name, { file, values }]) => {
      const twin = [...consts].find(
        ([other, { values: theirs }]) =>
          other !== name && [...values].every((value) => theirs.has(value)),
      );
      return twin
        ? [
            {
              file,
              line: 1,
              hit: HIT.RESTATED_CONST,
              text: `${name} restates ${twin[0]} (${twin[1].file})`,
            },
          ]
        : [];
    });
};

const CONST_INDEX = 'packages/config/const-index.json';
const EMPTY_INDEX = { strings: {}, numbers: {} };

const readIndex = (text) => (text ? JSON.parse(text) : EMPTY_INDEX);

const withLineCount = (entry) => ({
  ...entry,
  lineCount: isFile(entry.file)
    ? readFileSync(join(repoRoot, entry.file), 'utf8').split('\n').length
    : 0,
});

const main = () => {
  const base = resolveBase();
  if (!base) {
    console.error(`error: ${missingBaseMessage()}`);
    process.exit(1);
  }
  const files = readTouchedFiles(base).map(withLineCount);
  const index = readIndex(
    isFile(CONST_INDEX)
      ? readFileSync(join(repoRoot, CONST_INDEX), 'utf8')
      : undefined,
  );
  const hits = [
    ...findReviewHits(files),
    ...findExistingFixtures(files),
    ...findRepeatedValues(files, index.strings),
    ...findRestatedConsts(index, readIndex(readAtBase(base, CONST_INDEX))),
  ];
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
