import {
  deriveRevalidatePaths,
  isDerivableRevalidateType,
} from './derive-revalidate-paths';

const {
  getPostsByIdsMock,
  getPostTaxonomySlugsMock,
  getIndexPageParamsMock,
  getTagPaginationParamsMock,
  getTopicPaginationParamsMock,
} = vi.hoisted(() => ({
  getPostsByIdsMock: vi.fn(),
  getPostTaxonomySlugsMock: vi.fn(),
  getIndexPageParamsMock: vi.fn(),
  getTagPaginationParamsMock: vi.fn(),
  getTopicPaginationParamsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      posts: {
        v1: {
          getPostsByIds: getPostsByIdsMock,
          getPostTaxonomySlugs: getPostTaxonomySlugsMock,
        },
      },
    },
    pages: {
      blog: { v1: { getIndexPageParams: getIndexPageParamsMock } },
      tag: { v1: { getTagPaginationParams: getTagPaginationParamsMock } },
      topic: { v1: { getTopicPaginationParams: getTopicPaginationParamsMock } },
    },
  },
}));

const { loggerErrorMock } = vi.hoisted(() => ({ loggerErrorMock: vi.fn() }));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: loggerErrorMock,
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const tenant = {
  projectId: 'project-1',
  dataset: 'production',
  token: 'token',
};

const okPost = { id: 'post-1', slug: 'my-post' };
const okTaxonomy = { tagSlugs: ['typescript'], topicSlug: 'engineering' };

describe('isDerivableRevalidateType', () => {
  it('is true only for blog_post', () => {
    expect(isDerivableRevalidateType('blog_post')).toBe(true);
    expect(isDerivableRevalidateType('blog_author')).toBe(false);
    expect(isDerivableRevalidateType('page_home')).toBe(false);
  });
});

describe(deriveRevalidatePaths, () => {
  beforeEach(() => {
    getPostsByIdsMock.mockReset();
    getPostTaxonomySlugsMock.mockReset();
    getIndexPageParamsMock.mockReset();
    getTagPaginationParamsMock.mockReset();
    getTopicPaginationParamsMock.mockReset();
    loggerErrorMock.mockReset();
  });

  it('falls back with unsupported_type for a type it cannot derive, without calling the service', async () => {
    const result = await deriveRevalidatePaths({
      type: 'blog_author',
      id: 'author-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({ ok: false, reason: 'unsupported_type' });
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('resolves the full path set for a published post', async () => {
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [okPost] });
    getPostTaxonomySlugsMock.mockResolvedValue({ ok: true, data: okTaxonomy });
    getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTagPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTopicPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });

    const result = await deriveRevalidatePaths({
      type: 'blog_post',
      id: 'post-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({
      ok: true,
      paths: expect.arrayContaining([
        '/tenant-1/EN',
        '/tenant-1/EN/blog',
        '/tenant-1/EN/blog/my-post',
        '/tenant-1/EN/tags/typescript',
        '/tenant-1/EN/topics/engineering',
      ]),
    });
  });

  it('falls back with document_not_found when the id matches no post (e.g. a delete)', async () => {
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [] });
    getPostTaxonomySlugsMock.mockResolvedValue({ ok: true, data: undefined });
    getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTagPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTopicPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });

    const result = await deriveRevalidatePaths({
      type: 'blog_post',
      id: 'post-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({ ok: false, reason: 'document_not_found' });
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('falls back with fetch_failed and logs when the post lookup fails', async () => {
    getPostsByIdsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    getPostTaxonomySlugsMock.mockResolvedValue({ ok: true, data: okTaxonomy });
    getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTagPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTopicPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });

    const result = await deriveRevalidatePaths({
      type: 'blog_post',
      id: 'post-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({ ok: false, reason: 'fetch_failed' });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'revalidate.post_lookup_failed',
      expect.objectContaining({ id: 'post-1' }),
    );
  });

  it('falls back with fetch_failed and logs when the taxonomy lookup fails', async () => {
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [okPost] });
    getPostTaxonomySlugsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTagPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTopicPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });

    const result = await deriveRevalidatePaths({
      type: 'blog_post',
      id: 'post-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({ ok: false, reason: 'fetch_failed' });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'revalidate.post_taxonomy_lookup_failed',
      expect.objectContaining({ id: 'post-1' }),
    );
  });

  it('falls back with fetch_failed and logs when the blog index pagination lookup fails', async () => {
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [okPost] });
    getPostTaxonomySlugsMock.mockResolvedValue({ ok: true, data: okTaxonomy });
    getIndexPageParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    getTagPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTopicPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });

    const result = await deriveRevalidatePaths({
      type: 'blog_post',
      id: 'post-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({ ok: false, reason: 'fetch_failed' });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'revalidate.blog_pagination_lookup_failed',
      expect.objectContaining({ id: 'post-1' }),
    );
  });

  it('falls back with fetch_failed and logs when the tag pagination lookup fails', async () => {
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [okPost] });
    getPostTaxonomySlugsMock.mockResolvedValue({ ok: true, data: okTaxonomy });
    getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTagPaginationParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    getTopicPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });

    const result = await deriveRevalidatePaths({
      type: 'blog_post',
      id: 'post-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({ ok: false, reason: 'fetch_failed' });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'revalidate.tag_pagination_lookup_failed',
      expect.objectContaining({ id: 'post-1' }),
    );
  });

  it('falls back with fetch_failed and logs when the topic pagination lookup fails', async () => {
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [okPost] });
    getPostTaxonomySlugsMock.mockResolvedValue({ ok: true, data: okTaxonomy });
    getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTagPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTopicPaginationParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const result = await deriveRevalidatePaths({
      type: 'blog_post',
      id: 'post-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({ ok: false, reason: 'fetch_failed' });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'revalidate.topic_pagination_lookup_failed',
      expect.objectContaining({ id: 'post-1' }),
    );
  });
});
