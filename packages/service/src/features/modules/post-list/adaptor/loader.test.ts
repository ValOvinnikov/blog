import { MODULE_PAGE_CONTEXT } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostListModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { getPostList } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPostList', () => {
  it('bounds the posts query by the module limit and maps the result', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostListModule({
          sectionHeader: {
            heading: 'Recent writing',
            supportingText: null,
            align: null,
          },
          limit: 3,
        }),
      )
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

    const postList = await getPostList('post-list-1');

    // The module's `limit` is threaded into the GROQ posts query's slice bound.
    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('[0...3]');
    expect(postList.sectionHeader.heading).toBe('Recent writing');
    expect(postList.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPostList('missing')).rejects.toThrow();
  });

  it('tags the posts query with author/topic alongside posts', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ limit: 3 }))
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

    await getPostList('post-list-1');

    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['posts', 'author', 'topic'],
        }),
      }),
    );
  });

  it.each([
    MODULE_PAGE_CONTEXT.HOME,
    MODULE_PAGE_CONTEXT.BLOG,
    MODULE_PAGE_CONTEXT.GENERIC,
  ] as const)(
    'emits the same query and output for a %s context as when omitted',
    async (type) => {
      mockRun
        .mockResolvedValueOnce(makeRawPostListModule({ limit: 3 }))
        .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

      const withoutContext = await getPostList('post-list-1');
      const withoutContextQuery = mockRun.mock.calls[1]?.[0]?.query;

      mockRun
        .mockResolvedValueOnce(makeRawPostListModule({ limit: 3 }))
        .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

      const withContext = await getPostList('post-list-1', {
        type,
        isPaginated: false,
      });
      const withContextQuery = mockRun.mock.calls[3]?.[0]?.query;

      expect(withContextQuery).toBe(withoutContextQuery);
      expect(withContext).toEqual(withoutContext);
    },
  );

  it('scopes the posts query by topicSlug for a TOPIC context', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ limit: 3 }))
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

    await getPostList('post-list-1', {
      type: MODULE_PAGE_CONTEXT.TOPIC,
      topicSlug: 'engineering',
      isPaginated: false,
    });

    expect(mockRun.mock.calls[1]?.[0]?.query).toContain(
      'topic->slug.current == $slug',
    );
    expect(mockRun.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ parameters: { slug: 'engineering' } }),
    );
  });

  it('scopes the posts query by tagSlug for a TAG context', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ limit: 3 }))
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

    await getPostList('post-list-1', {
      type: MODULE_PAGE_CONTEXT.TAG,
      tagSlug: 'react',
      isPaginated: false,
    });

    expect(mockRun.mock.calls[1]?.[0]?.query).toContain(
      '$slug in tags[]->slug.current',
    );
    expect(mockRun.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ parameters: { slug: 'react' } }),
    );
  });

  it('windows by page/pageSize and returns the total for a paginated context', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ limit: 3 }))
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 25,
      });

    const postList = await getPostList('post-list-1', {
      type: MODULE_PAGE_CONTEXT.BLOG,
      isPaginated: true,
      page: 2,
      pageSize: 9,
    });

    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('[9...18]');
    expect(postList.posts.map((p) => p.id)).toEqual(['a']);
    expect(postList.total).toBe(25);
  });
});
