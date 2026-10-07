import { del, type MigrationContext } from 'sanity/migrate';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const createContext = (result: {
  target: { title?: string } | null;
  refCount: number;
}): MigrationContext => {
  const fetch = async () => result;

  return { client: { fetch } } as unknown as MigrationContext;
};

const deletableContext = createContext({
  target: { title: 'Section pages' },
  refCount: 0,
});

describe('retire-module-child-pages migration', () => {
  describe('with a published module_childPages', () => {
    let doc: typeof baseDoc & { _id: string; _type: string };

    beforeEach(() => {
      doc = { ...baseDoc, _id: 'abc123', _type: 'module_childPages' };
    });

    it('deletes it once its module_sectionPages counterpart is verified deletable', async () => {
      const mutations = await migration.migrate.document(doc, deletableContext);

      expect(mutations).toEqual([del('abc123')]);
    });

    it('rejects (aborting the run) when the counterpart does not exist', async () => {
      const context = createContext({ target: null, refCount: 0 });

      await expect(migration.migrate.document(doc, context)).rejects.toThrow(
        /does not exist/,
      );
    });

    it('rejects (aborting the run) while a document still references it', async () => {
      const context = createContext({
        target: { title: 'Section pages' },
        refCount: 1,
      });

      await expect(migration.migrate.document(doc, context)).rejects.toThrow(
        /still referenced/,
      );
    });
  });

  it('deletes a draft module_childPages, checking its drafts.sectionPages counterpart', async () => {
    const doc = {
      ...baseDoc,
      _id: 'drafts.abc123',
      _type: 'module_childPages',
    };
    const fetchCalls: unknown[] = [];
    const context = {
      client: {
        fetch: async (_query: string, params: unknown) => {
          fetchCalls.push(params);
          return { target: { title: 'Section pages' }, refCount: 0 };
        },
      },
    } as unknown as MigrationContext;

    const mutations = await migration.migrate.document(doc, context);

    expect(mutations).toEqual([del('drafts.abc123')]);
    expect(fetchCalls).toEqual([
      { sectionPagesId: 'drafts.sectionPages-abc123', id: 'drafts.abc123' },
    ]);
  });

  it('leaves unrelated document types untouched', async () => {
    const doc = {
      ...baseDoc,
      _id: 'sectionPages-abc123',
      _type: 'module_sectionPages',
    };

    const mutations = await migration.migrate.document(doc, deletableContext);

    expect(mutations).toEqual([]);
  });
});
