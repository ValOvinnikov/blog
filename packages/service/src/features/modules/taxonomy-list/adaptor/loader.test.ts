import { TAXONOMY_KIND } from '@blog/config';
import { makeRawTopicWithPostCount } from '@blog/service/testing/entities/fixtures';
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
  it('composes topic entries when asked for TAXONOMY_KIND.TOPICS', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTaxonomyListModule())
      .mockResolvedValueOnce([
        makeRawTopicWithPostCount({ _id: 'topic-1', title: 'Engineering' }),
      ]);

    const module = await getTaxonomyList(
      'taxonomy-list-1',
      TAXONOMY_KIND.TOPICS,
      tenant,
    );

    // The entries query itself must run against blog_topic, not blog_tag —
    // the two entity queries share nothing else that would tell them apart.
    expect(mockRun.mock.calls[1]?.[0]?.query).toContain(
      '_type == "blog_topic"',
    );
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

  it('composes tag entries when asked for TAXONOMY_KIND.TAGS', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTaxonomyListModule())
      .mockResolvedValueOnce([
        {
          _id: 'tag-1',
          title: 'TypeScript',
          slug: 'typescript',
          description: 'TypeScript posts',
          postCount: 4,
        },
      ]);

    const module = await getTaxonomyList(
      'taxonomy-list-1',
      TAXONOMY_KIND.TAGS,
      tenant,
    );

    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('_type == "blog_tag"');
    expect(module.entries).toEqual([
      {
        id: 'tag-1',
        title: 'TypeScript',
        slug: 'typescript',
        description: 'TypeScript posts',
        postCount: 4,
      },
    ]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun
      .mockRejectedValueOnce(new Error('ValidationError'))
      .mockResolvedValueOnce([]);

    await expect(
      getTaxonomyList('missing', TAXONOMY_KIND.TOPICS, tenant),
    ).rejects.toThrow();
  });

  it('threads tenant context into both queries and scopes their tags to it', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTaxonomyListModule())
      .mockResolvedValueOnce([]);

    await getTaxonomyList('taxonomy-list-1', TAXONOMY_KIND.TOPICS, tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:taxonomyList',
            't:tenant-a:module:taxonomy-list-1',
          ],
        }),
      }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:topics', 't:tenant-a:posts'],
        }),
      }),
    );
  });
});
