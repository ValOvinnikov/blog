import { TAXONOMY_KIND } from '@blog/config';
import {
  makeRawTagWithPostCount,
  makeRawTopicWithPostCount,
} from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTaxonomyListModule } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTaxonomyList } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getTaxonomyList', () => {
  it('resolves topic entries from an authored taxonomy, with no fallback', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTaxonomyListModule({
        taxonomy: TAXONOMY_KIND.TOPICS,
        entries: [
          makeRawTopicWithPostCount({ _id: 'topic-1', title: 'Engineering' }),
        ],
      }),
    );

    const module = await getTaxonomyList('taxonomy-list-1', tenant);

    expect(module.taxonomy).toBe(TAXONOMY_KIND.TOPICS);
    expect(module.entries).toEqual([
      {
        id: 'topic-1',
        title: 'Engineering',
        slug: 'engineering',
        description: 'Engineering posts',
        postCount: 0,
      },
    ]);
  });

  it('resolves tag entries from a fallback when nothing is authored', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTaxonomyListModule({
        taxonomy: TAXONOMY_KIND.TAGS,
        entries: [
          makeRawTagWithPostCount({ _id: 'tag-1', title: 'TypeScript' }),
        ],
      }),
    );

    const module = await getTaxonomyList(
      'taxonomy-list-1',
      tenant,
      TAXONOMY_KIND.TAGS,
    );

    expect(module.taxonomy).toBe(TAXONOMY_KIND.TAGS);
    expect(module.entries).toEqual([
      {
        id: 'tag-1',
        title: 'TypeScript',
        slug: 'typescript',
        description: 'TypeScript posts',
        postCount: 0,
      },
    ]);
  });

  it('prefers the authored taxonomy over a conflicting fallback', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTaxonomyListModule({
        taxonomy: TAXONOMY_KIND.TOPICS,
        entries: [
          makeRawTopicWithPostCount({ _id: 'topic-1', title: 'Engineering' }),
        ],
      }),
    );

    const module = await getTaxonomyList(
      'taxonomy-list-1',
      tenant,
      TAXONOMY_KIND.TAGS,
    );

    expect(module.taxonomy).toBe(TAXONOMY_KIND.TOPICS);
  });

  it('throws when neither an authored taxonomy nor a fallback resolves', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTaxonomyListModule({ taxonomy: null, entries: null }),
    );

    await expect(getTaxonomyList('taxonomy-list-1', tenant)).rejects.toThrow(
      'module_taxonomyList has no resolvable taxonomy',
    );
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getTaxonomyList('missing', tenant)).rejects.toThrow();
  });

  it('scopes the cache tags to the fallback taxonomy kind, plus posts', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTaxonomyListModule({ taxonomy: TAXONOMY_KIND.TOPICS }),
    );

    await getTaxonomyList('taxonomy-list-1', tenant, TAXONOMY_KIND.TOPICS);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:taxonomyList',
            't:tenant-a:module:taxonomy-list-1',
            't:tenant-a:topics',
            't:tenant-a:posts',
          ],
        }),
      }),
    );
  });

  it('scopes the cache tags to a tags fallback kind', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTaxonomyListModule({ taxonomy: TAXONOMY_KIND.TAGS }),
    );

    await getTaxonomyList('taxonomy-list-1', tenant, TAXONOMY_KIND.TAGS);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: expect.arrayContaining(['t:tenant-a:tags']),
        }),
      }),
    );
  });
});
