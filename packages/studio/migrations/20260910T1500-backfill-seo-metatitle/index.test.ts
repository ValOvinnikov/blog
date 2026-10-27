import { mockDocument } from '@blog/studio/testing/mock-documents';
import { mockMigrationContext } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { at, set, setIfMissing, type MigrationContext } from 'sanity/migrate';

import { META_TITLE_MAX_LENGTH } from './build-meta-title';

import migration from './index';

faker.seed(5104);

const PAGE_HOME_TYPE = 'page_home';
const PAGE_BLOG_TYPE = 'page_blog';
const PAGE_TAG_INDEX_TYPE = 'page_tagIndex';
const PAGE_TOPIC_INDEX_TYPE = 'page_topicIndex';
const PAGE_TAG_TYPE = 'page_tag';
const PAGE_TOPIC_TYPE = 'page_topic';
const PAGE_POST_TYPE = 'page_post';
const PAGE_LANDING_TYPE = 'page_landing';
const MODULE_HERO_TYPE = 'module_hero';
const MODULE_HERO_BLOG_TYPE = 'module_heroBlog';
const SETTINGS_SITE_ID = 'settings_site';

const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_ENTITY_ID = faker.string.uuid();
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_BRAND = 'valstack.dev';
const MOCK_TAGLINE = 'Field notes on building software';
const MOCK_DESCRIPTION =
  'Practical write-ups on TypeScript, design systems, and the craft of building for the web';
const MOCK_SHORT_HEADING = 'Blog';
const MOCK_BRAND_PADDED_HEADING = 'SEO That Generates Itself';
const MOCK_LONG_HEADING = 'Shipping Heroes Without a Designer';
const MOCK_LONG_HERO_TITLE = 'Everything We Have Written About SEO';
const MOCK_SHORT_HERO_TITLE = 'Welcome';
const MOCK_ENTITY_TITLE = 'SEO';

const mockSettingsSite = (overrides: Record<string, unknown> = {}) => ({
  brand: { name: MOCK_BRAND },
  tagline: MOCK_TAGLINE,
  description: MOCK_DESCRIPTION,
  ...overrides,
});

const mockContext = (docStore: Record<string, unknown> = {}) => {
  const store: Record<string, unknown> = {
    [SETTINGS_SITE_ID]: mockSettingsSite(),
    ...docStore,
  };

  return mockMigrationContext({
    fetch: vi
      .fn()
      .mockImplementation(
        async (_query: string, params: { id?: string; ref?: string }) =>
          store[params.id ?? params.ref ?? ''] ?? null,
      ),
  });
};

const expectedMutations = (metaTitle: string) => [
  at('seo', setIfMissing({})),
  at('seo.metaTitle', set(metaTitle)),
];

const runDocument = (doc: Record<string, unknown>, context: MigrationContext) =>
  migration.migrate.document?.(
    mockDocument({ _id: MOCK_PAGE_ID, ...doc }),
    context,
  );

describe('seo.metaTitle backfill migration', () => {
  let context: MigrationContext;

  beforeEach(() => {
    context = mockContext();
  });

  it('skips a document that already has a metaTitle without any lookups', async () => {
    const fetch = vi.fn().mockResolvedValue(null);

    const result = await runDocument(
      {
        _type: PAGE_TAG_TYPE,
        seo: { metaTitle: MOCK_LONG_HEADING },
      },
      mockMigrationContext({ fetch }),
    );

    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    PAGE_HOME_TYPE,
    PAGE_BLOG_TYPE,
    PAGE_TAG_INDEX_TYPE,
    PAGE_TOPIC_INDEX_TYPE,
  ])('pads the %s heading with the tagline', async (_type) => {
    const result = await runDocument(
      { _type, headingBlock: { heading: MOCK_SHORT_HEADING } },
      context,
    );

    expect(result).toEqual(
      expectedMutations(`${MOCK_SHORT_HEADING} — ${MOCK_TAGLINE}`),
    );
  });

  it('falls back to the site description when there is no tagline', async () => {
    const result = await runDocument(
      { _type: PAGE_BLOG_TYPE, headingBlock: { heading: MOCK_SHORT_HEADING } },
      mockContext({
        [SETTINGS_SITE_ID]: mockSettingsSite({ tagline: undefined }),
      }),
    );

    expect(result).toEqual(
      expectedMutations(
        `${MOCK_SHORT_HEADING} — ${MOCK_DESCRIPTION}`.slice(
          0,
          META_TITLE_MAX_LENGTH,
        ),
      ),
    );
  });

  it.each([
    [PAGE_TAG_TYPE, { tag: { _ref: MOCK_ENTITY_ID } }],
    [PAGE_TOPIC_TYPE, { topic: { _ref: MOCK_ENTITY_ID } }],
  ])(
    'backfills %s from the referenced entity title without a heading',
    async (_type, reference) => {
      const result = await runDocument(
        { _type, ...reference },
        mockContext({ [MOCK_ENTITY_ID]: { title: MOCK_ENTITY_TITLE } }),
      );

      expect(result).toEqual(
        expectedMutations(`${MOCK_ENTITY_TITLE} — Articles on ${MOCK_BRAND}`),
      );
    },
  );

  it('prefers the authored page_tag heading over the referenced tag title', async () => {
    const result = await runDocument(
      {
        _type: PAGE_TAG_TYPE,
        headingBlock: { heading: MOCK_LONG_HEADING },
        tag: { _ref: MOCK_ENTITY_ID },
      },
      mockContext({ [MOCK_ENTITY_ID]: { title: MOCK_ENTITY_TITLE } }),
    );

    expect(result).toEqual(expectedMutations(MOCK_LONG_HEADING));
  });

  it.each([PAGE_POST_TYPE, PAGE_LANDING_TYPE])(
    'pads a short %s heading with the brand name',
    async (_type) => {
      const result = await runDocument(
        { _type, headingBlock: { heading: MOCK_BRAND_PADDED_HEADING } },
        context,
      );

      expect(result).toEqual(
        expectedMutations(`${MOCK_BRAND_PADDED_HEADING} — ${MOCK_BRAND}`),
      );
    },
  );

  it.each([PAGE_POST_TYPE, PAGE_LANDING_TYPE])(
    'leaves a long %s heading as it is',
    async (_type) => {
      const result = await runDocument(
        { _type, headingBlock: { heading: MOCK_LONG_HEADING } },
        context,
      );

      expect(result).toEqual(expectedMutations(MOCK_LONG_HEADING));
    },
  );

  it('skips a page_tag with neither a heading nor a resolvable tag', async () => {
    const result = await runDocument({ _type: PAGE_TAG_TYPE }, context);

    expect(result).toEqual([]);
  });

  describe('with a hero reference', () => {
    it('skips page_home when the hero cannot be resolved', async () => {
      const result = await runDocument(
        { _type: PAGE_HOME_TYPE, hero: { _ref: MOCK_HERO_ID } },
        context,
      );

      expect(result).toEqual([]);
    });

    it('backfills page_home from the hero title when no heading is authored', async () => {
      const result = await runDocument(
        { _type: PAGE_HOME_TYPE, hero: { _ref: MOCK_HERO_ID } },
        mockContext({
          [MOCK_HERO_ID]: {
            _type: MODULE_HERO_TYPE,
            heroTitle: MOCK_SHORT_HERO_TITLE,
          },
        }),
      );

      expect(result).toEqual(
        expectedMutations(`${MOCK_SHORT_HERO_TITLE} — ${MOCK_TAGLINE}`),
      );
    });

    it('backfills page_tagIndex from the heading of a blog hero', async () => {
      const result = await runDocument(
        { _type: PAGE_TAG_INDEX_TYPE, hero: { _ref: MOCK_HERO_ID } },
        mockContext({
          [MOCK_HERO_ID]: {
            _type: MODULE_HERO_BLOG_TYPE,
            heading: MOCK_LONG_HERO_TITLE,
          },
        }),
      );

      expect(result).toEqual(expectedMutations(MOCK_LONG_HERO_TITLE));
    });

    it('prefers the authored heading over the hero', async () => {
      const result = await runDocument(
        {
          _type: PAGE_HOME_TYPE,
          headingBlock: { heading: MOCK_LONG_HEADING },
          hero: { _ref: MOCK_HERO_ID },
        },
        mockContext({
          [MOCK_HERO_ID]: {
            _type: MODULE_HERO_TYPE,
            heroTitle: MOCK_LONG_HERO_TITLE,
          },
        }),
      );

      expect(result).toEqual(expectedMutations(MOCK_LONG_HEADING));
    });

    it('skips page_home when the hero resolves without a usable title', async () => {
      const result = await runDocument(
        { _type: PAGE_HOME_TYPE, hero: { _ref: MOCK_HERO_ID } },
        mockContext({ [MOCK_HERO_ID]: { _type: MODULE_HERO_TYPE } }),
      );

      expect(result).toEqual([]);
    });

    it('prefers the hero title over the referenced tag title on page_tag', async () => {
      const result = await runDocument(
        {
          _type: PAGE_TAG_TYPE,
          tag: { _ref: MOCK_ENTITY_ID },
          hero: { _ref: MOCK_HERO_ID },
        },
        mockContext({
          [MOCK_ENTITY_ID]: { title: MOCK_ENTITY_TITLE },
          [MOCK_HERO_ID]: {
            _type: MODULE_HERO_TYPE,
            heroTitle: MOCK_LONG_HERO_TITLE,
          },
        }),
      );

      expect(result).toEqual(expectedMutations(MOCK_LONG_HERO_TITLE));
    });
  });

  it('skips a page_landing with no brand name to pad a short heading', async () => {
    const result = await runDocument(
      {
        _type: PAGE_LANDING_TYPE,
        headingBlock: { heading: MOCK_SHORT_HEADING },
      },
      mockContext({
        [SETTINGS_SITE_ID]: mockSettingsSite({ brand: undefined }),
      }),
    );

    expect(result).toEqual([]);
  });

  it('skips a document that padding still leaves too short', async () => {
    const result = await runDocument(
      {
        _type: PAGE_LANDING_TYPE,
        headingBlock: { heading: MOCK_SHORT_HEADING },
      },
      mockContext({
        [SETTINGS_SITE_ID]: mockSettingsSite({
          brand: { name: 'X' },
          tagline: undefined,
          description: undefined,
        }),
      }),
    );

    expect(result).toEqual([]);
  });
});
