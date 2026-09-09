import {
  createIfNotExists,
  patch,
  at,
  set,
  type createOrReplace,
  type MigrationContext,
} from 'sanity/migrate';

import {
  SHARED_MODULE_IDS,
  sharedNewsletterModule,
  sharedPostRelatedModule,
} from './shared-modules';

import migration from './index';

type TExistingPagePost = {
  title?: string;
  slug?: { _type: 'slug'; current?: string };
  publishedAt?: string;
  seo?: unknown;
} | null;

const createMockContext = (options: {
  blogPostIds?: string[];
  existingPagePosts?: Record<string, TExistingPagePost>;
}): {
  context: MigrationContext;
  fetchCalls: { query: string; params: unknown }[];
} => {
  const fetchCalls: { query: string; params: unknown }[] = [];

  const fetch = async (query: string, params: unknown) => {
    fetchCalls.push({ query, params });

    if (query.includes('_type == $type')) {
      return options.blogPostIds ?? [];
    }

    if (query.includes('_id == $id')) {
      const id = (params as { id: string }).id;
      return options.existingPagePosts?.[id] ?? null;
    }

    throw new Error(`Unexpected query in test: ${query}`);
  };

  const context = { client: { fetch } } as unknown as MigrationContext;

  return { context, fetchCalls };
};

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const postDoc = {
  ...baseDoc,
  _id: 'post-1',
  _type: 'blog_post',
  title: 'Understanding GROQ',
  slug: { _type: 'slug' as const, current: 'understanding-groq' },
  excerpt:
    'A deep dive into GROQ query composition, filters, and projections for real-world Sanity schemas.',
  author: { _type: 'reference', _ref: 'author-1' },
  topic: { _type: 'reference', _ref: 'topic-1' },
  publishedAt: '2026-02-01T09:00:00Z',
  body: [],
  featured: true,
  newsletterEnabled: true,
  seo: { metaTitle: 'Understanding GROQ' },
};

type TCreateOrReplaceMutation = ReturnType<typeof createOrReplace>;

const isCreateOrReplace = (
  mutation: unknown,
): mutation is TCreateOrReplaceMutation =>
  Boolean(
    mutation &&
    typeof mutation === 'object' &&
    'type' in mutation &&
    mutation.type === 'createOrReplace',
  );

const getCreateOrReplace = (mutations: unknown[]): TCreateOrReplaceMutation => {
  const mutation = mutations.find(isCreateOrReplace);

  if (!mutation) {
    throw new Error('Expected a createOrReplace mutation.');
  }

  return mutation;
};

describe('absorb-blog-post-into-page-post migration — blog_post documents', () => {
  it('creates the two shared modules and the page_post when none exists yet (production shape)', async () => {
    const { context } = createMockContext({ blogPostIds: ['post-1'] });

    const mutations = (await migration.migrate.document(
      postDoc,
      context,
    )) as unknown[];

    expect(mutations).toEqual(
      expect.arrayContaining([
        createIfNotExists(sharedPostRelatedModule),
        createIfNotExists(sharedNewsletterModule),
      ]),
    );

    expect(getCreateOrReplace(mutations).document).toMatchObject({
      _id: 'page_post-post-1',
      _type: 'page_post',
      title: 'Understanding GROQ',
      slug: { _type: 'slug', current: 'understanding-groq' },
      publishedAt: '2026-02-01T09:00:00Z',
      sectionHeader: {
        _type: 'requiredHeadingSectionHeader',
        heading: 'Understanding GROQ',
        supportingText: postDoc.excerpt,
      },
    });
    expect(getCreateOrReplace(mutations).document).not.toHaveProperty('post');
  });

  it('keeps the existing page_post’s own title/slug/publishedAt/seo (development shape)', async () => {
    const { context } = createMockContext({
      blogPostIds: ['post-1'],
      existingPagePosts: {
        'page_post-post-1': {
          title: 'Editor-Chosen Wrapper Label',
          slug: { _type: 'slug', current: 'custom-slug' },
          publishedAt: '2025-01-01T00:00:00Z',
          seo: { metaTitle: 'Custom title' },
        },
      },
    });

    const mutations = (await migration.migrate.document(
      postDoc,
      context,
    )) as unknown[];

    expect(getCreateOrReplace(mutations).document).toMatchObject({
      title: 'Editor-Chosen Wrapper Label',
      slug: { _type: 'slug', current: 'custom-slug' },
      publishedAt: '2025-01-01T00:00:00Z',
      seo: { metaTitle: 'Custom title' },
    });
  });

  it('maps a draft blog_post onto a draft page_post', async () => {
    const draftDoc = { ...postDoc, _id: 'drafts.post-1' };
    const { context } = createMockContext({ blogPostIds: ['drafts.post-1'] });

    const mutations = (await migration.migrate.document(
      draftDoc,
      context,
    )) as unknown[];

    expect(getCreateOrReplace(mutations).document._id).toBe(
      'drafts.page_post-post-1',
    );
  });

  it('omits the newsletter module when newsletterEnabled is false', async () => {
    const { context } = createMockContext({ blogPostIds: ['post-1'] });

    const mutations = (await migration.migrate.document(
      { ...postDoc, newsletterEnabled: false },
      context,
    )) as unknown[];

    const document = getCreateOrReplace(mutations).document as unknown as {
      modules: { _ref: string }[];
    };

    expect(document.modules.map((module) => module._ref)).toEqual([
      SHARED_MODULE_IDS.POST_RELATED,
    ]);
  });

  it('is idempotent — a second run against the same inputs returns the same mutations', async () => {
    const { context: firstContext } = createMockContext({
      blogPostIds: ['post-1'],
    });
    const firstRun = await migration.migrate.document(postDoc, firstContext);

    const { context: secondContext } = createMockContext({
      blogPostIds: ['post-1'],
      existingPagePosts: {
        'page_post-post-1': {
          title: postDoc.title,
          slug: postDoc.slug,
          publishedAt: postDoc.publishedAt,
          seo: postDoc.seo,
        },
      },
    });
    const secondRun = await migration.migrate.document(postDoc, secondContext);

    expect(secondRun).toEqual(firstRun);
  });
});

describe('absorb-blog-post-into-page-post migration — reference rewriting', () => {
  it('rewrites module_hero.featuredPost pointing at a migrated post', async () => {
    const { context } = createMockContext({ blogPostIds: ['post-1'] });
    const heroDoc = {
      ...baseDoc,
      _id: 'hero-1',
      _type: 'module_hero',
      featuredPost: { _type: 'reference', _ref: 'post-1' },
    };

    const mutations = await migration.migrate.document(heroDoc, context);

    expect(mutations).toEqual([
      patch('hero-1', [at(['featuredPost', '_ref'], set('page_post-post-1'))]),
    ]);
  });

  it('never rewrites page_post.post — that field intentionally keeps its blog_post reference', async () => {
    const { context } = createMockContext({ blogPostIds: ['post-1'] });
    const pagePostDoc = {
      ...baseDoc,
      _id: 'page_post-post-1',
      _type: 'page_post',
      post: { _type: 'reference', _ref: 'post-1' },
    };

    const mutations = await migration.migrate.document(pagePostDoc, context);

    expect(mutations).toEqual([]);
  });

  it('produces no mutations for a document with no matching references', async () => {
    const { context } = createMockContext({ blogPostIds: ['post-1'] });
    const otherDoc = {
      ...baseDoc,
      _id: 'author-1',
      _type: 'blog_author',
      name: 'Jane',
    };

    const mutations = await migration.migrate.document(otherDoc, context);

    expect(mutations).toEqual([]);
  });
});
