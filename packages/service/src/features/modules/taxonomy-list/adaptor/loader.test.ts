import { TAXONOMY_KIND } from '@blog/config';
import { makeRawTopicWithPostCount } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTaxonomyListModule } from '@blog/service/testing/modules/fixtures';

import { getTaxonomyList } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

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

    const module = await getTaxonomyList('taxonomy-list-1', TAXONOMY_KIND.TAGS);

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

  it('tags the module query with modules:taxonomyList and the per-document tag', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTaxonomyListModule())
      .mockResolvedValueOnce([]);

    await getTaxonomyList('taxonomy-list-1', TAXONOMY_KIND.TOPICS);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['modules:taxonomyList', 'module:taxonomy-list-1'],
        }),
      }),
    );
  });

  it('propagates when the module document is missing', async () => {
    mockRun
      .mockRejectedValueOnce(new Error('ValidationError'))
      .mockResolvedValueOnce([]);

    await expect(
      getTaxonomyList('missing', TAXONOMY_KIND.TOPICS),
    ).rejects.toThrow();
  });
});
