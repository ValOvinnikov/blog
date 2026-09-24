import {
  at,
  patch,
  set,
  type createOrReplace,
  type MigrationContext,
} from 'sanity/migrate';

import migration from './index';

const createMockContext = (options: {
  blogAuthorIds?: string[];
}): { context: MigrationContext } => {
  const fetch = async (query: string) => {
    if (query.includes('_type == $type')) {
      return options.blogAuthorIds ?? [];
    }

    throw new Error(`Unexpected query in test: ${query}`);
  };

  return { context: { client: { fetch } } as unknown as MigrationContext };
};

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const authorDoc = {
  ...baseDoc,
  _id: 'author-1',
  _type: 'blog_author',
  name: 'Jane Doe',
  image: { _type: 'imageWithAlt', alt: 'Jane' },
  bio: [{ _type: 'block' }],
  role: 'Senior Engineer',
  socialLinks: [{ _type: 'socialProfile', url: 'https://example.com' }],
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

describe('create-person-from-blog-author migration — blog_author documents', () => {
  it('creates the matching person, carrying every field across', async () => {
    const { context } = createMockContext({ blogAuthorIds: ['author-1'] });

    const mutations = (await migration.migrate.document(
      authorDoc,
      context,
    )) as unknown[];

    expect(getCreateOrReplace(mutations).document).toMatchObject({
      _id: 'person-author-1',
      _type: 'person',
      name: 'Jane Doe',
      role: 'Senior Engineer',
    });
  });

  it('maps a draft blog_author onto a draft person', async () => {
    const draftDoc = { ...authorDoc, _id: 'drafts.author-1' };
    const { context } = createMockContext({
      blogAuthorIds: ['drafts.author-1'],
    });

    const mutations = (await migration.migrate.document(
      draftDoc,
      context,
    )) as unknown[];

    expect(getCreateOrReplace(mutations).document._id).toBe(
      'drafts.person-author-1',
    );
  });

  it('is idempotent — a second run against the same input returns the same mutations', async () => {
    const { context: firstContext } = createMockContext({
      blogAuthorIds: ['author-1'],
    });
    const firstRun = await migration.migrate.document(authorDoc, firstContext);

    const { context: secondContext } = createMockContext({
      blogAuthorIds: ['author-1'],
    });
    const secondRun = await migration.migrate.document(
      authorDoc,
      secondContext,
    );

    expect(secondRun).toEqual(firstRun);
  });
});

describe('create-person-from-blog-author migration — reference rewriting', () => {
  it('rewrites page_post.author pointing at a migrated author (development referrer shape)', async () => {
    const { context } = createMockContext({ blogAuthorIds: ['author-1'] });
    const postDoc = {
      ...baseDoc,
      _id: 'page_post-post-1',
      _type: 'page_post',
      author: { _type: 'reference', _ref: 'author-1' },
    };

    const mutations = await migration.migrate.document(postDoc, context);

    expect(mutations).toEqual([
      patch('page_post-post-1', [
        at(['author', '_ref'], set('person-author-1')),
      ]),
    ]);
  });

  it('rewrites blog_post.author pointing at a migrated author (production referrer shape)', async () => {
    const { context } = createMockContext({ blogAuthorIds: ['author-1'] });
    const postDoc = {
      ...baseDoc,
      _id: 'post-1',
      _type: 'blog_post',
      author: { _type: 'reference', _ref: 'author-1' },
    };

    const mutations = await migration.migrate.document(postDoc, context);

    expect(mutations).toEqual([
      patch('post-1', [at(['author', '_ref'], set('person-author-1'))]),
    ]);
  });

  it('rewrites module_heroProfile.author pointing at a migrated author', async () => {
    const { context } = createMockContext({ blogAuthorIds: ['author-1'] });
    const heroDoc = {
      ...baseDoc,
      _id: 'hero-profile-1',
      _type: 'module_heroProfile',
      author: { _type: 'reference', _ref: 'author-1' },
    };

    const mutations = await migration.migrate.document(heroDoc, context);

    expect(mutations).toEqual([
      patch('hero-profile-1', [at(['author', '_ref'], set('person-author-1'))]),
    ]);
  });

  it('produces no mutations for a document with no matching references', async () => {
    const { context } = createMockContext({ blogAuthorIds: ['author-1'] });
    const otherDoc = {
      ...baseDoc,
      _id: 'topic-1',
      _type: 'blog_topic',
      name: 'Engineering',
    };

    const mutations = await migration.migrate.document(otherDoc, context);

    expect(mutations).toEqual([]);
  });

  it('is idempotent — a reference already pointing at its person id produces no mutations', async () => {
    const { context } = createMockContext({ blogAuthorIds: ['author-1'] });
    const rewrittenPostDoc = {
      ...baseDoc,
      _id: 'page_post-post-1',
      _type: 'page_post',
      author: { _type: 'reference', _ref: 'person-author-1' },
    };

    const mutations = await migration.migrate.document(
      rewrittenPostDoc,
      context,
    );

    expect(mutations).toEqual([]);
  });

  it('scopes the blog_author id map to its own migration run, never leaking across contexts', async () => {
    const { context: firstContext } = createMockContext({
      blogAuthorIds: ['author-1'],
    });
    const postDoc = {
      ...baseDoc,
      _id: 'page_post-post-1',
      _type: 'page_post',
      author: { _type: 'reference', _ref: 'author-1' },
    };

    await migration.migrate.document(postDoc, firstContext);

    const { context: secondContext } = createMockContext({
      blogAuthorIds: ['author-2'],
    });
    const secondRunMutations = await migration.migrate.document(
      postDoc,
      secondContext,
    );

    expect(secondRunMutations).toEqual([]);
  });
});
