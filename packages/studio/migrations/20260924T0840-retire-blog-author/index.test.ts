import { del, type MigrationContext } from 'sanity/migrate';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const createContext = (result: {
  target: { name?: string } | null;
  refCount: number;
}): MigrationContext => {
  const fetch = async () => result;

  return { client: { fetch } } as unknown as MigrationContext;
};

const deletableContext = createContext({
  target: { name: 'Jane Doe' },
  refCount: 0,
});

describe('retire-blog-author migration — blog_author documents', () => {
  it('deletes a blog_author once its person counterpart is verified deletable', async () => {
    const doc = { ...baseDoc, _id: 'author-1', _type: 'blog_author' };

    const mutations = await migration.migrate.document(doc, deletableContext);

    expect(mutations).toEqual([del('author-1')]);
  });

  it('deletes a draft blog_author, checking its counterpart drafts.person id', async () => {
    const doc = { ...baseDoc, _id: 'drafts.author-1', _type: 'blog_author' };
    const fetchCalls: unknown[] = [];
    const context = {
      client: {
        fetch: async (_query: string, params: unknown) => {
          fetchCalls.push(params);
          return { target: { name: 'Jane Doe' }, refCount: 0 };
        },
      },
    } as unknown as MigrationContext;

    const mutations = await migration.migrate.document(doc, context);

    expect(mutations).toEqual([del('drafts.author-1')]);
    expect(fetchCalls).toEqual([
      { personId: 'drafts.person-author-1', id: 'drafts.author-1' },
    ]);
  });

  it('rejects (aborting the run) when the precondition fails', async () => {
    const doc = { ...baseDoc, _id: 'author-1', _type: 'blog_author' };
    const context = createContext({ target: null, refCount: 0 });

    await expect(migration.migrate.document(doc, context)).rejects.toThrow(
      /does not exist/,
    );
  });

  it('leaves unrelated document types untouched', async () => {
    const doc = { ...baseDoc, _id: 'person-author-1', _type: 'person' };

    const mutations = await migration.migrate.document(doc, deletableContext);

    expect(mutations).toEqual([]);
  });
});
