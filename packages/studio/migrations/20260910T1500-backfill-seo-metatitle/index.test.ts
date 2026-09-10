import { at, set, setIfMissing, type MigrationContext } from 'sanity/migrate';

import migration from './index';

const BRAND = 'valstack.dev';
const TAGLINE = 'Field notes on building software';
const DESCRIPTION =
  'Practical write-ups on TypeScript, design systems, and the craft of building for the web';

type TFakeDocStore = Record<string, unknown>;

const fakeContext = (docStore: TFakeDocStore): MigrationContext =>
  ({
    client: {
      getDocument: async (id: string) => docStore[id],
    },
  }) as unknown as MigrationContext;

const settingsSite = (overrides: Record<string, unknown> = {}) => ({
  settings_site: {
    brand: { name: BRAND },
    tagline: TAGLINE,
    description: DESCRIPTION,
    ...overrides,
  },
});

const expectedMutations = (metaTitle: string) => [
  at('seo', setIfMissing({})),
  at('seo.metaTitle', set(metaTitle)),
];

const runDocument = (doc: Record<string, unknown>, context: MigrationContext) =>
  migration.migrate.document?.(
    // @ts-expect-error -- only the fields the migration reads are needed
    doc,
    context,
  );

describe('seo.metaTitle backfill document() wiring', () => {
  it('skips a document that already has a metaTitle, without any lookups', async () => {
    const getDocument = vi.fn(async () => undefined);
    const context = {
      client: { getDocument },
    } as unknown as MigrationContext;

    const result = await runDocument(
      {
        _id: 'page_tag-1',
        _type: 'page_tag',
        seo: { metaTitle: 'Already authored, never touched here' },
      },
      context,
    );

    expect(result).toEqual([]);
    expect(getDocument).not.toHaveBeenCalled();
  });

  it('backfills page_blog from headingBlock.heading padded with the tagline', async () => {
    const result = await runDocument(
      {
        _id: 'page_blog',
        _type: 'page_blog',
        headingBlock: { heading: 'Blog' },
      },
      fakeContext(settingsSite()),
    );

    expect(result).toEqual(
      expectedMutations('Blog — Field notes on building software'),
    );
  });

  it('falls back to the site description when page_blog has no tagline', async () => {
    const result = await runDocument(
      {
        _id: 'page_blog',
        _type: 'page_blog',
        headingBlock: { heading: 'Blog' },
      },
      fakeContext(settingsSite({ tagline: undefined })),
    );

    expect(result).toEqual(
      expectedMutations(`Blog — ${DESCRIPTION}`.slice(0, 60)),
    );
  });

  it('backfills page_tagIndex from its own heading', async () => {
    const result = await runDocument(
      {
        _id: 'page_tagIndex',
        _type: 'page_tagIndex',
        headingBlock: { heading: 'Tags' },
      },
      fakeContext(settingsSite()),
    );

    expect(result).toEqual(
      expectedMutations('Tags — Field notes on building software'),
    );
  });

  it('backfills page_topicIndex from its own heading', async () => {
    const result = await runDocument(
      {
        _id: 'page_topicIndex',
        _type: 'page_topicIndex',
        headingBlock: { heading: 'Topics' },
      },
      fakeContext(settingsSite()),
    );

    expect(result).toEqual(
      expectedMutations('Topics — Field notes on building software'),
    );
  });

  it('backfills page_tag from the referenced blog_tag title when no heading is authored', async () => {
    const result = await runDocument(
      {
        _id: 'page_tag-seo',
        _type: 'page_tag',
        tag: { _ref: 'blog_tag-seo' },
      },
      fakeContext({ ...settingsSite(), 'blog_tag-seo': { title: 'SEO' } }),
    );

    expect(result).toEqual(
      expectedMutations('SEO — Articles on valstack.dev'),
    );
  });

  it('prefers page_tag headingBlock.heading over the referenced tag title', async () => {
    const result = await runDocument(
      {
        _id: 'page_tag-seo',
        _type: 'page_tag',
        headingBlock: { heading: 'Everything We Have Written About SEO' },
        tag: { _ref: 'blog_tag-seo' },
      },
      fakeContext({ ...settingsSite(), 'blog_tag-seo': { title: 'SEO' } }),
    );

    expect(result).toEqual(
      expectedMutations('Everything We Have Written About SEO'),
    );
  });

  it('backfills page_topic from the referenced blog_topic title', async () => {
    const result = await runDocument(
      {
        _id: 'page_topic-ai',
        _type: 'page_topic',
        topic: { _ref: 'blog_topic-ai' },
      },
      fakeContext({
        ...settingsSite(),
        'blog_topic-ai': { title: 'Building with AI' },
      }),
    );

    expect(result).toEqual(
      expectedMutations('Building with AI — Articles on valstack.dev'),
    );
  });

  it('backfills page_post from its required headingBlock.heading', async () => {
    const result = await runDocument(
      {
        _id: 'page_post-1',
        _type: 'page_post',
        headingBlock: { heading: 'SEO That Generates Itself' },
      },
      fakeContext(settingsSite()),
    );

    expect(result).toEqual(
      expectedMutations('SEO That Generates Itself — valstack.dev'),
    );
  });

  it('leaves an already-long page_post heading untouched', async () => {
    const heading = 'Shipping Heroes Without a Designer';

    const result = await runDocument(
      {
        _id: 'page_post-2',
        _type: 'page_post',
        headingBlock: { heading },
      },
      fakeContext(settingsSite()),
    );

    expect(result).toEqual(expectedMutations(heading));
  });

  it('skips a page_tag with neither a heading nor a resolvable tag reference', async () => {
    const result = await runDocument(
      { _id: 'page_tag-orphan', _type: 'page_tag' },
      fakeContext(settingsSite()),
    );

    expect(result).toEqual([]);
  });

  it('is a no-op on a second run once metaTitle is already set (idempotency)', async () => {
    const first = await runDocument(
      {
        _id: 'page_blog',
        _type: 'page_blog',
        headingBlock: { heading: 'Blog' },
      },
      fakeContext(settingsSite()),
    );

    const second = await runDocument(
      {
        _id: 'page_blog',
        _type: 'page_blog',
        headingBlock: { heading: 'Blog' },
        seo: { metaTitle: 'Blog — Field notes on building software' },
      },
      fakeContext(settingsSite()),
    );

    expect(first).not.toEqual([]);
    expect(second).toEqual([]);
  });
});
