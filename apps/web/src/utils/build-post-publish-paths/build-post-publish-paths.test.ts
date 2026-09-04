import { buildPostPublishPaths } from './build-post-publish-paths';

describe(buildPostPublishPaths, () => {
  it('builds the home, blog index and post detail paths for every locale', () => {
    const paths = buildPostPublishPaths({
      tenantId: 'tenant-1',
      locales: ['EN'],
      postSlug: 'my-post',
      tagSlugs: [],
      topicSlug: undefined,
      blogIndexPageParams: [],
      tagPaginationParams: [],
      topicPaginationParams: [],
    });

    expect(paths).toEqual([
      '/tenant-1/EN',
      '/tenant-1/EN/blog',
      '/tenant-1/EN/blog/my-post',
    ]);
  });

  it('includes every blog index pagination page', () => {
    const paths = buildPostPublishPaths({
      tenantId: 'tenant-1',
      locales: ['EN'],
      postSlug: 'my-post',
      tagSlugs: [],
      topicSlug: undefined,
      blogIndexPageParams: [{ page: '2' }, { page: '3' }],
      tagPaginationParams: [],
      topicPaginationParams: [],
    });

    expect(paths).toEqual(
      expect.arrayContaining([
        '/tenant-1/EN/blog/page/2',
        '/tenant-1/EN/blog/page/3',
      ]),
    );
  });

  it('includes the base and pagination paths for every tag the post belongs to', () => {
    const paths = buildPostPublishPaths({
      tenantId: 'tenant-1',
      locales: ['EN'],
      postSlug: 'my-post',
      tagSlugs: ['typescript', 'react'],
      topicSlug: undefined,
      blogIndexPageParams: [],
      tagPaginationParams: [
        { slug: 'typescript', page: '2' },
        { slug: 'unrelated-tag', page: '2' },
      ],
      topicPaginationParams: [],
    });

    expect(paths).toEqual(
      expect.arrayContaining([
        '/tenant-1/EN/tags/typescript',
        '/tenant-1/EN/tags/react',
        '/tenant-1/EN/tags/typescript/page/2',
      ]),
    );
    expect(paths).not.toEqual(
      expect.arrayContaining(['/tenant-1/EN/tags/unrelated-tag/page/2']),
    );
  });

  it('includes the base and pagination paths for the post topic only', () => {
    const paths = buildPostPublishPaths({
      tenantId: 'tenant-1',
      locales: ['EN'],
      postSlug: 'my-post',
      tagSlugs: [],
      topicSlug: 'engineering',
      blogIndexPageParams: [],
      tagPaginationParams: [],
      topicPaginationParams: [
        { slug: 'engineering', page: '2' },
        { slug: 'unrelated-topic', page: '2' },
      ],
    });

    expect(paths).toEqual(
      expect.arrayContaining([
        '/tenant-1/EN/topics/engineering',
        '/tenant-1/EN/topics/engineering/page/2',
      ]),
    );
    expect(paths).not.toEqual(
      expect.arrayContaining(['/tenant-1/EN/topics/unrelated-topic/page/2']),
    );
  });

  it('omits the topic paths entirely when the post has no topic', () => {
    const paths = buildPostPublishPaths({
      tenantId: 'tenant-1',
      locales: ['EN'],
      postSlug: 'my-post',
      tagSlugs: [],
      topicSlug: undefined,
      blogIndexPageParams: [],
      tagPaginationParams: [],
      topicPaginationParams: [{ slug: 'engineering', page: '2' }],
    });

    expect(paths.some((path) => path.includes('/topics/'))).toBe(false);
  });

  it('scopes every path to each configured locale', () => {
    const paths = buildPostPublishPaths({
      tenantId: 'tenant-1',
      locales: ['EN', 'FR'],
      postSlug: 'my-post',
      tagSlugs: [],
      topicSlug: undefined,
      blogIndexPageParams: [],
      tagPaginationParams: [],
      topicPaginationParams: [],
    });

    expect(paths).toEqual(
      expect.arrayContaining([
        '/tenant-1/EN/blog/my-post',
        '/tenant-1/FR/blog/my-post',
      ]),
    );
  });

  it('returns no duplicate paths', () => {
    const paths = buildPostPublishPaths({
      tenantId: 'tenant-1',
      locales: ['EN'],
      postSlug: 'my-post',
      tagSlugs: [],
      topicSlug: undefined,
      blogIndexPageParams: [],
      tagPaginationParams: [],
      topicPaginationParams: [],
    });

    expect(new Set(paths).size).toBe(paths.length);
  });
});
