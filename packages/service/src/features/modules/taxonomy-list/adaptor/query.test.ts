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

import { taxonomyListModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const TOPIC_ID = 'topic-craft';
const TOPIC_TITLE = 'Craft';
const TAG_ID = 'tag-tooling';

const moduleDocument = mockModuleDocument({
  _type: 'module_taxonomyList',
  taxonomy: TAXONOMY_KIND.TOPICS,
});

const taxonomyTermDocuments = [
  {
    _id: TOPIC_ID,
    _type: 'blog_topic',
    title: mockLocalizedStrings({ [EN]: TOPIC_TITLE }),
  },
  {
    _id: TAG_ID,
    _type: 'blog_tag',
    title: mockLocalizedStrings({ [EN]: 'Tooling' }),
  },
];

async function runTaxonomyList(
  locale: string,
  overrides: Record<string, unknown> = {},
) {
  const raw = await evaluateGroqExpression(
    taxonomyListModuleQuery.query,
    [{ ...moduleDocument, ...overrides }, ...taxonomyTermDocuments],
    undefined,
    { id: MOCK_MODULE_ID, locale, defaultLocale: EN },
  );

  return taxonomyListModuleQuery.parse(raw);
}

describe('taxonomyListModuleQuery', () => {
  it('filters to module_taxonomyList documents by id', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      '_type == "module_taxonomyList"',
    );
    expect(taxonomyListModuleQuery.query).toContain('_id == $id');
  });

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
          _id: TOPIC_ID,
          title: TOPIC_TITLE,
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

    expect(entries?.map((entry) => entry._id)).toEqual([TAG_ID]);
  });

  it('resolves no taxonomy and no entries when none is authored', async () => {
    const { taxonomy, entries } = await runTaxonomyList(EN, {
      taxonomy: undefined,
    });

    expect(taxonomy).toBeNull();
    expect(entries).toBeNull();
  });

  it.each([
    [NL, MOCK_DUTCH_MODULE_HEADING],
    [FR, MOCK_ENGLISH_MODULE_HEADING],
  ])('resolves the %s heading to %s', async (locale, heading) => {
    const { headingBlock } = await runTaxonomyList(locale);

    expect(headingBlock.heading).toBe(heading);
  });
});

describe('taxonomyListModuleQuery language scoping', () => {
  async function runEntry(locale: string) {
    const raw = (await evaluateGroqExpression(
      taxonomyListModuleQuery.query,
      [moduleDocument, ...MOCK_TRANSLATED_POST_DOCUMENTS],
      undefined,
      { id: MOCK_MODULE_ID, locale, defaultLocale: EN },
    )) as { entries: { postCount: number; latestPosts: unknown }[] };
    const [entry] = raw.entries;
    if (!entry) throw new Error('expected a topic entry');

    return { postCount: entry.postCount, latest: toIds(entry.latestPosts) };
  }

  it('counts and lists only published posts in the request language', async () => {
    expect(await runEntry(EN)).toEqual({
      postCount: 3,
      latest: [MOCK_ONLY_EN_POST_ID, MOCK_DESIGN_EN_POST_ID],
    });
    expect(await runEntry(NL)).toEqual({
      postCount: 1,
      latest: [MOCK_DESIGN_NL_POST_ID],
    });
  });
});
