import {
  BRAND_VARIANT,
  LOCALE_ISO_CODES,
  TAXONOMY_KIND,
  TAXONOMY_SORT,
} from '@blog/config/constants';
import {
  MOCK_DUTCH_MODULE_HEADING,
  MOCK_ENGLISH_MODULE_HEADING,
  MOCK_MODULE_ID,
  mockModuleDocument,
  mockRawTaxonomyListModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockLocalizedStrings } from '@blog/service/testing/shared/localized';
import {
  MOCK_DESIGN_EN_POST_ID,
  MOCK_DESIGN_NL_POST_ID,
  MOCK_ONLY_EN_POST_ID,
  MOCK_TRANSLATED_POST_DOCUMENTS,
  toIds,
} from '@blog/service/testing/shared/translated-posts-dataset';
import { faker } from '@faker-js/faker';

import { taxonomyListModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

faker.seed(6014);

const MOCK_TOPIC_ID = faker.string.uuid();
const MOCK_TOPIC_TITLE = faker.lorem.word();
const MOCK_TAG_ID = faker.string.uuid();
const MOCK_TAG_TITLE = faker.lorem.word();
const MOCK_HEADING_BY_LOCALE = {
  [EN]: MOCK_ENGLISH_MODULE_HEADING,
  [NL]: MOCK_DUTCH_MODULE_HEADING,
};

const MOCK_MODULE_DOCUMENT = mockModuleDocument({
  _type: 'module_taxonomyList',
  taxonomy: TAXONOMY_KIND.TOPICS,
});

const MOCK_TAXONOMY_TERM_DOCUMENTS = [
  {
    _id: MOCK_TOPIC_ID,
    _type: 'blog_topic',
    title: mockLocalizedStrings({ [EN]: MOCK_TOPIC_TITLE }),
  },
  {
    _id: MOCK_TAG_ID,
    _type: 'blog_tag',
    title: mockLocalizedStrings({ [EN]: MOCK_TAG_TITLE }),
  },
];

async function runTaxonomyList(
  locale: string,
  overrides: Record<string, unknown> = {},
) {
  const raw = await evaluateGroqExpression(
    taxonomyListModuleQuery.query,
    [
      { ...MOCK_MODULE_DOCUMENT, ...overrides },
      ...MOCK_TAXONOMY_TERM_DOCUMENTS,
    ],
    undefined,
    { id: MOCK_MODULE_ID, locale, defaultLocale: EN },
  );

  return taxonomyListModuleQuery.parse(raw);
}

describe('taxonomyListModuleQuery', () => {
  it('parses a module with no layout set', () => {
    const raw = mockRawTaxonomyListModule({ layout: null });

    expect(() => taxonomyListModuleQuery.parse(raw)).not.toThrow();
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...mockRawTaxonomyListModule(), headingBlock: null };

    expect(() => taxonomyListModuleQuery.parse(raw)).toThrow();
  });

  it('defaults the sort order and latest posts, listing the topic entries', async () => {
    const module = await runTaxonomyList(EN);

    expect(module).toEqual({
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: {
        heading: MOCK_ENGLISH_MODULE_HEADING,
        supportingText: null,
      },
      layout: null,
      contentAlignment: null,
      taxonomy: TAXONOMY_KIND.TOPICS,
      sortOrder: TAXONOMY_SORT.ALPHABETICAL,
      limit: null,
      showLatestPosts: true,
      entries: [
        {
          _id: MOCK_TOPIC_ID,
          title: MOCK_TOPIC_TITLE,
          slug: null,
          description: null,
          postCount: 0,
          latestPosts: [],
        },
      ],
    });
  });

  it('lists the tag entries when the authored taxonomy is tags', async () => {
    const { entries } = await runTaxonomyList(EN, {
      taxonomy: TAXONOMY_KIND.TAGS,
    });

    expect(entries?.map((entry) => entry._id)).toEqual([MOCK_TAG_ID]);
  });

  it('resolves no taxonomy and no entries when none is authored', async () => {
    const { taxonomy, entries } = await runTaxonomyList(EN, {
      taxonomy: undefined,
    });

    expect(taxonomy).toBeNull();
    expect(entries).toBeNull();
  });

  it.each([
    [NL, NL],
    [FR, EN],
  ])('resolves a %s visitor to the %s heading', async (locale, language) => {
    const { headingBlock } = await runTaxonomyList(locale);

    expect(headingBlock.heading).toBe(MOCK_HEADING_BY_LOCALE[language]);
  });

  describe('language scoping', () => {
    async function runEntry(locale: string) {
      const raw = (await evaluateGroqExpression(
        taxonomyListModuleQuery.query,
        [MOCK_MODULE_DOCUMENT, ...MOCK_TRANSLATED_POST_DOCUMENTS],
        undefined,
        { id: MOCK_MODULE_ID, locale, defaultLocale: EN },
      )) as { entries: { postCount: number; latestPosts: unknown }[] };
      const [entry] = raw.entries;
      if (!entry) throw new Error('expected a topic entry');

      return { postCount: entry.postCount, latest: toIds(entry.latestPosts) };
    }

    it.each([
      [
        EN,
        {
          postCount: 3,
          latest: [MOCK_ONLY_EN_POST_ID, MOCK_DESIGN_EN_POST_ID],
        },
      ],
      [NL, { postCount: 1, latest: [MOCK_DESIGN_NL_POST_ID] }],
    ])(
      'counts and lists only published posts in the %s request language',
      async (locale, expected) => {
        expect(await runEntry(locale)).toEqual(expected);
      },
    );
  });
});
