import { mockDocument } from '@blog/studio/testing/mock-documents';
import { mockMigrationContext } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { at, set, setIfMissing, type MigrationContext } from 'sanity/migrate';
import type { MockInstance } from 'vitest';

import migration, {
  resolveHeroHeading,
  resolveOwningPage,
  resolvePostListHeading,
  toHeadingMutations,
  toPublishedId,
} from './index';

faker.seed(5106);

const PAGE_TAG_TYPE = 'page_tag';
const PAGE_TOPIC_TYPE = 'page_topic';
const PAGE_HOME_TYPE = 'page_home';
const PAGE_BLOG_TYPE = 'page_blog';
const MODULE_POST_LIST_TYPE = 'module_postList';
const MODULE_HERO_TYPE = 'module_hero';
const MODULE_HERO_BLOG_TYPE = 'module_heroBlog';
const MODULE_HERO_STATEMENT_TYPE = 'module_heroStatement';

const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_POST_LIST_ID = faker.string.uuid();
const MOCK_TAG_ID = faker.string.uuid();
const MOCK_TOPIC_ID = faker.string.uuid();
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_TAG_TITLE = faker.lorem.words();
const MOCK_TOPIC_TITLE = faker.lorem.words();
const MOCK_HERO_TITLE = faker.lorem.words();
const MOCK_HERO_BLOG_HEADING = faker.lorem.words();
const MOCK_BLOG_HEADING = faker.lorem.words();
const MOCK_AUTHORED_HEADING = faker.lorem.words();

type TFakeContextOptions = {
  entities?: Record<string, unknown>;
  owners?: Record<string, unknown>;
};

const mockContext = ({ entities, owners }: TFakeContextOptions = {}) =>
  mockMigrationContext({
    fetch: vi
      .fn()
      .mockImplementation(
        async (_query: string, params: { ref?: string; pageTag?: string }) => {
          const store = 'pageTag' in params ? owners : entities;

          return store?.[params.ref ?? ''] ?? null;
        },
      ),
  });

const runDocument = (doc: Record<string, unknown>, context: MigrationContext) =>
  migration.migrate.document?.(mockDocument(doc), context);

describe(toHeadingMutations, () => {
  it('builds the setIfMissing and set pair targeting headingBlock.heading', () => {
    const result = toHeadingMutations(MOCK_TAG_TITLE);

    expect(result).toEqual([
      at('headingBlock', setIfMissing({})),
      at('headingBlock.heading', set(MOCK_TAG_TITLE)),
    ]);
  });
});

describe(toPublishedId, () => {
  it.each([
    ['leaves a published id as it is', MOCK_POST_LIST_ID],
    ['strips the drafts. prefix', `drafts.${MOCK_POST_LIST_ID}`],
  ])('%s', (_name, id) => {
    const result = toPublishedId(id);

    expect(result).toBe(MOCK_POST_LIST_ID);
  });
});

describe(resolveHeroHeading, () => {
  it('returns undefined without a ref and performs no lookup', async () => {
    const fetch = vi.fn().mockResolvedValue(null);

    const result = await resolveHeroHeading(
      mockMigrationContext({ fetch }),
      undefined,
    );

    expect(result).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [
      'reads the trimmed heroTitle of a module_hero',
      { _type: MODULE_HERO_TYPE, heroTitle: `  ${MOCK_HERO_TITLE}  ` },
      MOCK_HERO_TITLE,
    ],
    [
      'reads the heading of a module_heroBlog',
      { _type: MODULE_HERO_BLOG_TYPE, heading: MOCK_HERO_BLOG_HEADING },
      MOCK_HERO_BLOG_HEADING,
    ],
    [
      'returns undefined when the hero has no title set',
      { _type: MODULE_HERO_TYPE },
      undefined,
    ],
    [
      'returns undefined for an unrecognized hero type',
      { _type: MODULE_HERO_STATEMENT_TYPE, heading: MOCK_HERO_TITLE },
      undefined,
    ],
  ])('%s', async (_name, hero, expected) => {
    const context = mockContext({ entities: { [MOCK_HERO_ID]: hero } });

    const result = await resolveHeroHeading(context, MOCK_HERO_ID);

    expect(result).toBe(expected);
  });
});

describe(resolveOwningPage, () => {
  it('finds the owner of a draft list through its published id', async () => {
    const owner = { _type: PAGE_BLOG_TYPE };
    const context = mockContext({ owners: { [MOCK_POST_LIST_ID]: owner } });

    const result = await resolveOwningPage(
      context,
      `drafts.${MOCK_POST_LIST_ID}`,
    );

    expect(result).toEqual(owner);
  });

  it('returns undefined when no page references the list', async () => {
    const result = await resolveOwningPage(mockContext(), MOCK_POST_LIST_ID);

    expect(result).toBeUndefined();
  });
});

describe(resolvePostListHeading, () => {
  it.each([
    [
      'the referenced tag title of a page_tag owner',
      { _type: PAGE_TAG_TYPE, tag: { _ref: MOCK_TAG_ID } },
      { [MOCK_TAG_ID]: { title: MOCK_TAG_TITLE } },
      MOCK_TAG_TITLE,
    ],
    [
      'the referenced topic title of a page_topic owner',
      { _type: PAGE_TOPIC_TYPE, topic: { _ref: MOCK_TOPIC_ID } },
      { [MOCK_TOPIC_ID]: { title: MOCK_TOPIC_TITLE } },
      MOCK_TOPIC_TITLE,
    ],
    [
      'the own heading of a page_blog owner',
      { _type: PAGE_BLOG_TYPE, headingBlock: { heading: MOCK_BLOG_HEADING } },
      {},
      MOCK_BLOG_HEADING,
    ],
    [
      'nothing for a page_blog owner without a heading',
      { _type: PAGE_BLOG_TYPE },
      {},
      undefined,
    ],
    ['nothing when no owning page exists', undefined, {}, undefined],
  ])('resolves %s', async (_name, owner, entities, expected) => {
    const context = mockContext({
      owners: owner ? { [MOCK_POST_LIST_ID]: owner } : {},
      entities,
    });

    const result = await resolvePostListHeading(context, MOCK_POST_LIST_ID);

    expect(result).toBe(expected);
  });
});

describe('backfill headingBlock.heading migration', () => {
  let warnSpy: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('skips a document that already has a heading without any lookups', async () => {
    const fetch = vi.fn().mockResolvedValue(null);

    const result = await runDocument(
      {
        _id: MOCK_PAGE_ID,
        _type: PAGE_TAG_TYPE,
        headingBlock: { heading: MOCK_AUTHORED_HEADING },
      },
      mockMigrationContext({ fetch }),
    );

    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it.each([
    [
      PAGE_TAG_TYPE,
      { tag: { _ref: MOCK_TAG_ID } },
      { [MOCK_TAG_ID]: { title: MOCK_TAG_TITLE } },
      MOCK_TAG_TITLE,
    ],
    [
      PAGE_TOPIC_TYPE,
      { topic: { _ref: MOCK_TOPIC_ID } },
      { [MOCK_TOPIC_ID]: { title: MOCK_TOPIC_TITLE } },
      MOCK_TOPIC_TITLE,
    ],
    [
      PAGE_HOME_TYPE,
      { hero: { _ref: MOCK_HERO_ID } },
      {
        [MOCK_HERO_ID]: { _type: MODULE_HERO_TYPE, heroTitle: MOCK_HERO_TITLE },
      },
      MOCK_HERO_TITLE,
    ],
    [
      PAGE_HOME_TYPE,
      { hero: { _ref: MOCK_HERO_ID } },
      {
        [MOCK_HERO_ID]: {
          _type: MODULE_HERO_BLOG_TYPE,
          heading: MOCK_HERO_BLOG_HEADING,
        },
      },
      MOCK_HERO_BLOG_HEADING,
    ],
  ])(
    'backfills %s from its source',
    async (_type, fields, entities, heading) => {
      const result = await runDocument(
        { _id: MOCK_PAGE_ID, _type, ...fields },
        mockContext({ entities }),
      );

      expect(result).toEqual(toHeadingMutations(heading));
    },
  );

  it.each([
    [
      'page_tag',
      { _type: PAGE_TAG_TYPE, tag: { _ref: MOCK_TAG_ID } },
      { [MOCK_TAG_ID]: { title: MOCK_TAG_TITLE } },
      MOCK_TAG_TITLE,
    ],
    [
      'page_blog',
      { _type: PAGE_BLOG_TYPE, headingBlock: { heading: MOCK_BLOG_HEADING } },
      {},
      MOCK_BLOG_HEADING,
    ],
  ])(
    'backfills a module_postList from its owning %s',
    async (_name, owner, entities, heading) => {
      const context = mockContext({
        owners: { [MOCK_POST_LIST_ID]: owner },
        entities,
      });

      const result = await runDocument(
        { _id: MOCK_POST_LIST_ID, _type: MODULE_POST_LIST_TYPE },
        context,
      );

      expect(result).toEqual(toHeadingMutations(heading));
    },
  );

  it.each([
    ['a page_tag with no tag reference', PAGE_TAG_TYPE],
    ['a module_postList with no owning page', MODULE_POST_LIST_TYPE],
  ])('warns and skips %s', async (_name, _type) => {
    const result = await runDocument(
      { _id: MOCK_PAGE_ID, _type },
      mockContext(),
    );

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      `Skipping ${MOCK_PAGE_ID}: no derivable headingBlock.heading source found`,
    );
  });
});
