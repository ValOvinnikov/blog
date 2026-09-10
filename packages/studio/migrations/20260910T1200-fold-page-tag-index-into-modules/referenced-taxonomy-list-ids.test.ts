import type { MigrationContext } from 'sanity/migrate';

import {
  getReferencedTaxonomyListIds,
  stripDraftPrefix,
} from './referenced-taxonomy-list-ids';

const createMockContext = (
  docs: {
    taxonomyRef?: string | null;
    moduleRefs?: (string | null)[] | null;
  }[],
): { context: MigrationContext; fetchCalls: unknown[] } => {
  const fetchCalls: unknown[] = [];

  const fetch = async (query: string, params: unknown) => {
    fetchCalls.push({ query, params });
    return docs;
  };

  return {
    context: { client: { fetch } } as unknown as MigrationContext,
    fetchCalls,
  };
};

describe('stripDraftPrefix', () => {
  it('removes a drafts. prefix', () => {
    expect(stripDraftPrefix('drafts.list-1')).toBe('list-1');
  });

  it('leaves a published id unchanged', () => {
    expect(stripDraftPrefix('list-1')).toBe('list-1');
  });
});

describe('getReferencedTaxonomyListIds', () => {
  it('collects ids from both taxonomyList and modules[] refs', async () => {
    const { context } = createMockContext([
      { taxonomyRef: 'list-1', moduleRefs: [] },
      { taxonomyRef: null, moduleRefs: ['list-2'] },
    ]);

    const ids = await getReferencedTaxonomyListIds(context);

    expect(ids).toEqual(new Set(['list-1', 'list-2']));
  });

  it('normalises drafts. ids to their canonical form', async () => {
    const { context } = createMockContext([
      { taxonomyRef: 'drafts.list-1', moduleRefs: [] },
    ]);

    const ids = await getReferencedTaxonomyListIds(context);

    expect(ids).toEqual(new Set(['list-1']));
  });

  it('caches the result per context, fetching only once', async () => {
    const { context, fetchCalls } = createMockContext([
      { taxonomyRef: 'list-1', moduleRefs: [] },
    ]);

    await getReferencedTaxonomyListIds(context);
    await getReferencedTaxonomyListIds(context);

    expect(fetchCalls).toHaveLength(1);
  });

  it('produces an empty set when no page references anything', async () => {
    const { context } = createMockContext([
      { taxonomyRef: null, moduleRefs: null },
    ]);

    const ids = await getReferencedTaxonomyListIds(context);

    expect(ids).toEqual(new Set());
  });
});
