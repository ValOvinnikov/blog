import { at, set, setIfMissing, type MigrationContext } from 'sanity/migrate';

import migration, {
  resolveEntityTitle,
  resolveHeroHeading,
  resolveOwningPage,
  resolvePostListHeading,
  toHeadingMutations,
  toPublishedId,
} from './index';

type TFakeContextOptions = {
  entities?: Record<string, unknown>;
  owners?: Record<string, unknown>;
};

const fakeContext = (opts: TFakeContextOptions = {}): MigrationContext =>
  ({
    client: {
      fetch: async (
        _query: string,
        params: { ref?: string; pageTag?: string },
      ) => {
        if ('pageTag' in params) {
          return opts.owners?.[params.ref ?? ''] ?? null;
        }

        return opts.entities?.[params.ref ?? ''] ?? null;
      },
    },
  }) as unknown as MigrationContext;

const runDocument = (doc: Record<string, unknown>, context: MigrationContext) =>
  migration.migrate.document?.(
    // @ts-expect-error -- only the fields the migration reads are needed
    doc,
    context,
  );

describe(toHeadingMutations, () => {
  it('builds the setIfMissing + set pair targeting headingBlock.heading', () => {
    expect(toHeadingMutations('Tag Title')).toEqual([
      at('headingBlock', setIfMissing({})),
      at('headingBlock.heading', set('Tag Title')),
    ]);
  });
});

describe(toPublishedId, () => {
  it('returns the id unchanged when not draft-prefixed', () => {
    expect(toPublishedId('postList-tag-1')).toBe('postList-tag-1');
  });

  it('strips the drafts. prefix', () => {
    expect(toPublishedId('drafts.postList-tag-1')).toBe('postList-tag-1');
  });
});

describe(resolveEntityTitle, () => {
  it('returns undefined without a ref, performing no lookup', async () => {
    const fetch = vi.fn(async () => null);
    const context = { client: { fetch } } as unknown as MigrationContext;

    expect(await resolveEntityTitle(context, undefined)).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns the trimmed title of the referenced entity', async () => {
    const context = fakeContext({
      entities: { 'blog_tag-1': { title: '  TypeScript  ' } },
    });

    expect(await resolveEntityTitle(context, 'blog_tag-1')).toBe('TypeScript');
  });

  it('returns undefined when the referenced entity has no title', async () => {
    const context = fakeContext({ entities: { 'blog_tag-1': { title: '' } } });

    expect(await resolveEntityTitle(context, 'blog_tag-1')).toBeUndefined();
  });

  it('returns undefined when the referenced entity cannot be found', async () => {
    const context = fakeContext({});

    expect(await resolveEntityTitle(context, 'missing')).toBeUndefined();
  });
});

describe(resolveHeroHeading, () => {
  it('returns undefined without a ref, performing no lookup', async () => {
    const fetch = vi.fn(async () => null);
    const context = { client: { fetch } } as unknown as MigrationContext;

    expect(await resolveHeroHeading(context, undefined)).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reads heroTitle from a module_hero reference', async () => {
    const context = fakeContext({
      entities: {
        'hero-1': { _type: 'module_hero', heroTitle: '  Welcome  ' },
      },
    });

    expect(await resolveHeroHeading(context, 'hero-1')).toBe('Welcome');
  });

  it('reads heading from a module_heroBlog reference', async () => {
    const context = fakeContext({
      entities: {
        'hero-2': { _type: 'module_heroBlog', heading: 'Latest from the blog' },
      },
    });

    expect(await resolveHeroHeading(context, 'hero-2')).toBe(
      'Latest from the blog',
    );
  });

  it('returns undefined when the hero has no title field set', async () => {
    const context = fakeContext({
      entities: { 'hero-1': { _type: 'module_hero' } },
    });

    expect(await resolveHeroHeading(context, 'hero-1')).toBeUndefined();
  });

  it('returns undefined for an unrecognized hero type', async () => {
    const context = fakeContext({
      entities: { 'hero-3': { _type: 'module_heroStatement', heading: 'x' } },
    });

    expect(await resolveHeroHeading(context, 'hero-3')).toBeUndefined();
  });
});

describe(resolveOwningPage, () => {
  it('strips the drafts. prefix before looking up the owning page', async () => {
    const fetch = vi.fn(async () => null);
    const context = { client: { fetch } } as unknown as MigrationContext;

    await resolveOwningPage(context, 'drafts.postList-tag-1');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ ref: 'postList-tag-1' }),
    );
  });

  it('returns undefined when no page references the list', async () => {
    const context = fakeContext({});

    expect(await resolveOwningPage(context, 'postList-tag-1')).toBeUndefined();
  });
});

describe(resolvePostListHeading, () => {
  it("derives from the owning page_tag's referenced tag title", async () => {
    const context = fakeContext({
      owners: {
        'postList-tag-1': {
          _type: 'page_tag',
          tag: { _ref: 'blog_tag-1' },
        },
      },
      entities: { 'blog_tag-1': { title: 'TypeScript' } },
    });

    expect(await resolvePostListHeading(context, 'postList-tag-1')).toBe(
      'TypeScript',
    );
  });

  it("derives from the owning page_topic's referenced topic title", async () => {
    const context = fakeContext({
      owners: {
        'postList-topic-1': {
          _type: 'page_topic',
          topic: { _ref: 'blog_topic-1' },
        },
      },
      entities: { 'blog_topic-1': { title: 'Testing' } },
    });

    expect(await resolvePostListHeading(context, 'postList-topic-1')).toBe(
      'Testing',
    );
  });

  it("derives the blog archive's heading from the owning page_blog's own headingBlock", async () => {
    const context = fakeContext({
      owners: {
        'postList-blog': {
          _type: 'page_blog',
          headingBlock: { heading: 'Blog' },
        },
      },
    });

    expect(await resolvePostListHeading(context, 'postList-blog')).toBe('Blog');
  });

  it('returns undefined when page_blog has no heading of its own either', async () => {
    const context = fakeContext({
      owners: { 'postList-blog': { _type: 'page_blog' } },
    });

    expect(
      await resolvePostListHeading(context, 'postList-blog'),
    ).toBeUndefined();
  });

  it('returns undefined when no owning page can be found', async () => {
    const context = fakeContext({});

    expect(
      await resolvePostListHeading(context, 'postList-orphan'),
    ).toBeUndefined();
  });
});

describe('backfill headingBlock.heading document() wiring', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  beforeEach(() => {
    warnSpy.mockClear();
  });

  it('skips a document that already has a heading, without any lookups', async () => {
    const fetch = vi.fn(async () => null);
    const context = { client: { fetch } } as unknown as MigrationContext;

    const result = await runDocument(
      {
        _id: 'page_tag-1',
        _type: 'page_tag',
        headingBlock: { heading: 'Already authored, never touched here' },
      },
      context,
    );

    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('backfills page_tag from the referenced tag title', async () => {
    const context = fakeContext({
      entities: { 'blog_tag-1': { title: 'TypeScript' } },
    });

    const result = await runDocument(
      { _id: 'page_tag-1', _type: 'page_tag', tag: { _ref: 'blog_tag-1' } },
      context,
    );

    expect(result).toEqual(toHeadingMutations('TypeScript'));
  });

  it('backfills page_topic from the referenced topic title', async () => {
    const context = fakeContext({
      entities: { 'blog_topic-1': { title: 'Testing' } },
    });

    const result = await runDocument(
      {
        _id: 'page_topic-1',
        _type: 'page_topic',
        topic: { _ref: 'blog_topic-1' },
      },
      context,
    );

    expect(result).toEqual(toHeadingMutations('Testing'));
  });

  it('backfills page_home from its module_hero heroTitle', async () => {
    const context = fakeContext({
      entities: {
        'hero-1': { _type: 'module_hero', heroTitle: 'Welcome' },
      },
    });

    const result = await runDocument(
      { _id: 'page_home', _type: 'page_home', hero: { _ref: 'hero-1' } },
      context,
    );

    expect(result).toEqual(toHeadingMutations('Welcome'));
  });

  it('backfills page_home from its module_heroBlog heading', async () => {
    const context = fakeContext({
      entities: {
        'hero-2': { _type: 'module_heroBlog', heading: 'Latest from the blog' },
      },
    });

    const result = await runDocument(
      {
        _id: 'drafts.page_home',
        _type: 'page_home',
        hero: { _ref: 'hero-2' },
      },
      context,
    );

    expect(result).toEqual(toHeadingMutations('Latest from the blog'));
  });

  it('backfills module_postList from its owning page_tag', async () => {
    const context = fakeContext({
      owners: {
        'postList-tag-1': { _type: 'page_tag', tag: { _ref: 'blog_tag-1' } },
      },
      entities: { 'blog_tag-1': { title: 'TypeScript' } },
    });

    const result = await runDocument(
      { _id: 'postList-tag-1', _type: 'module_postList' },
      context,
    );

    expect(result).toEqual(toHeadingMutations('TypeScript'));
  });

  it('backfills the blog archive module_postList from page_blog', async () => {
    const context = fakeContext({
      owners: {
        'postList-blog': {
          _type: 'page_blog',
          headingBlock: { heading: 'Blog' },
        },
      },
    });

    const result = await runDocument(
      { _id: 'postList-blog', _type: 'module_postList' },
      context,
    );

    expect(result).toEqual(toHeadingMutations('Blog'));
  });

  it('reports rather than inventing copy when page_tag has no tag reference', async () => {
    const context = fakeContext({});

    const result = await runDocument(
      { _id: 'page_tag-orphan', _type: 'page_tag' },
      context,
    );

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('page_tag-orphan'),
    );
  });

  it('reports rather than inventing copy when a module_postList has no owning page', async () => {
    const context = fakeContext({});

    const result = await runDocument(
      { _id: 'postList-orphan', _type: 'module_postList' },
      context,
    );

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('postList-orphan'),
    );
  });

  it('is idempotent — running twice produces the same no-op once backfilled', async () => {
    const context = fakeContext({
      entities: { 'blog_tag-1': { title: 'TypeScript' } },
    });

    const doc = {
      _id: 'page_tag-1',
      _type: 'page_tag',
      tag: { _ref: 'blog_tag-1' },
    };

    const first = await runDocument(doc, context);
    expect(first).toEqual(toHeadingMutations('TypeScript'));

    const second = await runDocument(
      { ...doc, headingBlock: { heading: 'TypeScript' } },
      context,
    );
    expect(second).toEqual([]);
  });
});
