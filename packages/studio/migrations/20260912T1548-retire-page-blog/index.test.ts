import { del, type MigrationContext } from 'sanity/migrate';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const createContext = (result: {
  target: { modules?: unknown } | null;
  refCount: number;
}): MigrationContext => {
  const fetch = async () => result;

  return { client: { fetch } } as unknown as MigrationContext;
};

const deletableContext = createContext({
  target: { modules: [{ _type: 'reference', _ref: 'module-1' }] },
  refCount: 0,
});

describe('retire-page-blog migration', () => {
  it('deletes the published page_blog once its page_postIndex counterpart is verified deletable', async () => {
    const doc = { ...baseDoc, _id: 'page_blog', _type: 'page_blog' };

    const mutations = await migration.migrate.document(doc, deletableContext);

    expect(mutations).toEqual([del('page_blog')]);
  });

  it('deletes the draft page_blog, checking its counterpart drafts.page_postIndex id', async () => {
    const doc = { ...baseDoc, _id: 'drafts.page_blog', _type: 'page_blog' };
    const fetchCalls: unknown[] = [];
    const context = {
      client: {
        fetch: async (_query: string, params: unknown) => {
          fetchCalls.push(params);
          return {
            target: { modules: [{ _type: 'reference', _ref: 'module-1' }] },
            refCount: 0,
          };
        },
      },
    } as unknown as MigrationContext;

    const mutations = await migration.migrate.document(doc, context);

    expect(mutations).toEqual([del('drafts.page_blog')]);
    expect(fetchCalls).toEqual([
      {
        postIndexId: 'drafts.page_postIndex',
        id: 'drafts.page_blog',
      },
    ]);
  });

  it('rejects (aborting the run) when the precondition fails', async () => {
    const doc = { ...baseDoc, _id: 'page_blog', _type: 'page_blog' };
    const context = createContext({ target: null, refCount: 0 });

    await expect(migration.migrate.document(doc, context)).rejects.toThrow(
      /does not exist/,
    );
  });

  it('is a no-op for a page_blog id with no known counterpart (idempotent on re-run)', async () => {
    const doc = { ...baseDoc, _id: 'some-other-id', _type: 'page_blog' };

    const mutations = await migration.migrate.document(doc, deletableContext);

    expect(mutations).toEqual([]);
  });
});
