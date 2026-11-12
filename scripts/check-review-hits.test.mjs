import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  findRestatedConsts,
  findReviewHits,
  fixtureLiteralsOf,
  HIT,
  valueLiteralsOf,
} from './check-review-hits.mjs';

const COMPONENT = 'apps/web/src/components/card/card.tsx';
const COMPONENT_TEST = 'apps/web/src/components/card/card.test.tsx';
const RENDERER_TEST = 'apps/web/src/modules/hero/hero-module-renderer.test.tsx';
const BUILDER = 'apps/web/src/testing/posts/fixtures.ts';
const DOC = 'docs/context/claude-code.md';
const GENERATED_TYPES = 'packages/config/src/sanity/generated/types.ts';

const added = (file, ...texts) => ({
  file,
  added: texts.map((text, index) => ({ line: index + 1, text })),
});

const hitsOf = (files) => findReviewHits(files).map(({ hit }) => hit);

describe('findReviewHits', () => {
  it('reports a leftover marker in source and not in a doc', () => {
    assert.deepEqual(
      hitsOf([
        added(COMPONENT, "const label = 'TODO: remove';"),
        added(DOC, 'A TODO may cite an open issue.'),
      ]),
      [HIT.LEFTOVER],
    );
  });

  it('reports a quoted literal assigned to a secret-shaped name', () => {
    assert.deepEqual(
      hitsOf([
        added(
          COMPONENT,
          "AUTH_SECRET='q8Zx3+/kLm9PqR2sT4uV6wXyZ0aBcDeF='",
          "const SANITY_API_TOKEN = 'skAbCdEf123456789012'; // dev",
          "STRIPE_SECRET_KEY: 'sk_live_51Habcdefghijk',",
        ),
      ]).filter((hit) => hit === HIT.SECRET),
      [HIT.SECRET, HIT.SECRET, HIT.SECRET],
    );
  });

  it('reports a bare secret value outside source and not an expression in it', () => {
    assert.deepEqual(
      hitsOf([
        added(DOC, 'SANITY_API_TOKEN=sk1234567890abcdef', 'SANITY_API_TOKEN='),
        added(
          COMPONENT,
          'RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,',
          'envMock.INTERNAL_PAGES_SECRET = MOCK_OTHER_SECRET;',
          'const MOCK_SECRET = faker.string.alphanumeric(32);',
          "PERSIST_TOKEN: 'PERSIST_TOKEN',",
          "const DEPTH_STORAGE_KEY = 'reading-depth-total';",
          "const PREVIEW_TOKEN_HEADER = 'x-preview-token-v2';",
        ),
      ]),
      [HIT.SECRET],
    );
  });

  it('reports a suppression even when it gives a reason', () => {
    assert.deepEqual(
      hitsOf([
        added(
          COMPONENT_TEST,
          '// eslint-disable-next-line blog-test/no-nested-query -- legacy',
        ),
      ]),
      [HIT.SUPPRESSION],
    );
  });

  it('reports a comment in source and leaves a test file to lint', () => {
    assert.deepEqual(
      hitsOf([
        added(
          COMPONENT,
          '  // tuned for the 390px viewport',
          'const gap = 12; //tuned',
          '      {/* spacer */}',
          "const url = 'https://example.com';",
          "const separator = 'a // b';",
        ),
        added(COMPONENT_TEST, '// arrange'),
      ]),
      [HIT.COMMENT, HIT.COMMENT, HIT.COMMENT],
    );
  });

  it('allows a fake of our own component only in a renderer test', () => {
    const fake = "  vi.mock('@web/components/card', () => ({}));";
    assert.deepEqual(
      hitsOf([added(COMPONENT_TEST, fake), added(RENDERER_TEST, fake)]),
      [HIT.OWN_COMPONENT_FAKE],
    );
  });

  it('reports a fixed fake value under any other name', () => {
    assert.deepEqual(
      hitsOf([
        added(
          BUILDER,
          "export const POST_TITLE = 'Hello';",
          "export const MOCK_POST_TITLE = 'Hello';",
          'export const mockPost = () => ({});',
        ),
      ]),
      [HIT.UNNAMED_FIXTURE],
    );
  });

  it('reports a touched test file over the line limit', () => {
    assert.deepEqual(
      hitsOf([
        { ...added(COMPONENT_TEST), lineCount: 501 },
        { ...added(COMPONENT), lineCount: 501 },
      ]),
      [HIT.LARGE_TEST_FILE],
    );
  });

  it('skips generated files', () => {
    assert.deepEqual(hitsOf([added(GENERATED_TYPES, '// TODO generated')]), []);
  });
});

describe('fixtureLiteralsOf', () => {
  it('keeps quoted values and drops imports, role queries and short ones', () => {
    assert.deepEqual(
      fixtureLiteralsOf(
        added(
          COMPONENT_TEST,
          "import { render } from '@testing-library/react';",
          "const button = screen.getByRole('button');",
          "const post = mockPost({ slug: 'hello-world', id: 'p1' });",
        ).added,
      ),
      ["'hello-world'"],
    );
  });
});

describe('valueLiteralsOf', () => {
  it('keeps value-shaped literals and drops imports, vocabulary and indexed values', () => {
    assert.deepEqual(
      valueLiteralsOf(
        added(
          COMPONENT,
          "import { Card } from '@blog/ui/card';",
          "const kind = 'hero-profile';",
          "const type = 'button';",
          "const shape = 'PILL';",
          "const label = 'Read more';",
          "const t = await getTranslations('heroProfile');",
          "const title = t('readMoreLabel');",
          "const id = 'p1';",
        ).added,
        { PILL: [] },
      ),
      ["'hero-profile'"],
    );
  });
});

const ref = (name, key) => ({
  ref: `${name}.${key}`,
  file: `packages/config/src/constants/${name.toLowerCase()}.ts`,
});

const indexOf = (...consts) => ({
  strings: Object.fromEntries(
    [...new Set(consts.flatMap(([, keys]) => keys))].map((key) => [
      key,
      consts
        .filter(([, keys]) => keys.includes(key))
        .map(([name]) => ref(name, key)),
    ]),
  ),
  numbers: {},
});

describe('findRestatedConsts', () => {
  const BUTTON_SHAPE = ['BUTTON_SHAPE', ['PILL', 'SQUARE', 'CIRCLE']];

  it('reports a new const whose values an existing const already holds', () => {
    assert.deepEqual(
      findRestatedConsts(
        indexOf(BUTTON_SHAPE, ['CHIP_SHAPE', ['PILL', 'SQUARE']]),
        indexOf(BUTTON_SHAPE),
      ).map(({ hit, text }) => [hit, text]),
      [
        [
          HIT.RESTATED_CONST,
          'CHIP_SHAPE restates BUTTON_SHAPE (packages/config/src/constants/button_shape.ts)',
        ],
      ],
    );
  });

  it('leaves a const already on the base, a new value and a single shared value', () => {
    assert.deepEqual(
      findRestatedConsts(
        indexOf(
          BUTTON_SHAPE,
          ['NAV_SHAPE', ['PILL', 'SQUARE']],
          ['TAG_SHAPE', ['PILL', 'ROUNDED']],
          ['BADGE_SHAPE', ['PILL']],
        ),
        indexOf(BUTTON_SHAPE, ['NAV_SHAPE', ['PILL', 'SQUARE']]),
      ),
      [],
    );
  });
});
