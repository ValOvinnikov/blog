import { at, del, patch, unset, type MigrationContext } from 'sanity/migrate';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const createContext = (
  result: { target: { content?: unknown } | null; refCount: number },
): MigrationContext => {
  const fetch = async () => result;

  return { client: { fetch } } as unknown as MigrationContext;
};

const deletableContext = createContext({
  target: { content: [{ _type: 'block' }] },
  refCount: 0,
});

describe('retire-blog-post migration — blog_post documents', () => {
  it('deletes a blog_post once its page_post counterpart is verified deletable', async () => {
    const doc = { ...baseDoc, _id: 'post-1', _type: 'blog_post' };

    const mutations = await migration.migrate.document(doc, deletableContext);

    expect(mutations).toEqual([del('post-1')]);
  });

  it('deletes a draft blog_post, checking its counterpart drafts.page_post id', async () => {
    const doc = { ...baseDoc, _id: 'drafts.post-1', _type: 'blog_post' };
    const fetchCalls: unknown[] = [];
    const context = {
      client: {
        fetch: async (_query: string, params: unknown) => {
          fetchCalls.push(params);
          return { target: { content: [{ _type: 'block' }] }, refCount: 0 };
        },
      },
    } as unknown as MigrationContext;

    const mutations = await migration.migrate.document(doc, context);

    expect(mutations).toEqual([del('drafts.post-1')]);
    expect(fetchCalls).toEqual([
      { pagePostId: 'drafts.page_post-post-1', id: 'drafts.post-1' },
    ]);
  });

  it('rejects (aborting the run) when the precondition fails', async () => {
    const doc = { ...baseDoc, _id: 'post-1', _type: 'blog_post' };
    const context = createContext({ target: null, refCount: 0 });

    await expect(
      migration.migrate.document(doc, context),
    ).rejects.toThrow(/does not exist/);
  });
});

describe('retire-blog-post migration — page_post.post cleanup', () => {
  it('unsets a leftover post field', async () => {
    const doc = {
      ...baseDoc,
      _id: 'page_post-post-1',
      _type: 'page_post',
      post: { _type: 'reference', _ref: 'page_post-post-1' },
    };

    const mutations = await migration.migrate.document(doc, deletableContext);

    expect(mutations).toEqual([
      patch('page_post-post-1', [at('post', unset())]),
    ]);
  });

  it('is a no-op for a page_post with no post field (idempotent on re-run)', async () => {
    const doc = { ...baseDoc, _id: 'page_post-post-1', _type: 'page_post' };

    const mutations = await migration.migrate.document(doc, deletableContext);

    expect(mutations).toEqual([]);
  });

  it('leaves unrelated document types untouched', async () => {
    const doc = { ...baseDoc, _id: 'author-1', _type: 'blog_author' };

    const mutations = await migration.migrate.document(doc, deletableContext);

    expect(mutations).toEqual([]);
  });
});
