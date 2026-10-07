import { logger } from '@web/utils/logger/logger';

import {
  deriveRevalidatePaths,
  isDerivableRevalidateType,
} from './derive-revalidate-paths';

const {
  getPostsByIdsMock,
  getIndexPageParamsMock,
  getTagParamsMock,
  getTagPaginationParamsMock,
  getTopicParamsMock,
  getTopicPaginationParamsMock,
} = vi.hoisted(() => ({
  getPostsByIdsMock: vi.fn(),
  getIndexPageParamsMock: vi.fn(),
  getTagParamsMock: vi.fn(),
  getTagPaginationParamsMock: vi.fn(),
  getTopicParamsMock: vi.fn(),
  getTopicPaginationParamsMock: vi.fn(),
}));

vi.mock('@blog/db', async () => {
  const { LOCALE_ISO_CODES } = await import('@blog/config');
  return {
    queries: {
      tenants: {
        getTenantLiveLocales: vi.fn().mockResolvedValue([LOCALE_ISO_CODES.EN]),
      },
    },
  };
});

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      posts: {
        v1: {
          getPostsByIds: getPostsByIdsMock,
        },
      },
    },
    pages: {
      blog: { v1: { getIndexPageParams: getIndexPageParamsMock } },
      tag: {
        v1: {
          getTagParams: getTagParamsMock,
          getTagPaginationParams: getTagPaginationParamsMock,
        },
      },
      topic: {
        v1: {
          getTopicParams: getTopicParamsMock,
          getTopicPaginationParams: getTopicPaginationParamsMock,
        },
      },
    },
  },
}));

vi.mock('@web/utils/logger/logger');

const loggerErrorMock = vi.mocked(logger.error);

const tenant = {
  projectId: 'project-1',
  dataset: 'production',
  token: 'token',
};

const okPost = { id: 'post-1', slug: 'my-post' };

describe('isDerivableRevalidateType', () => {
  it('is true only for page_post', () => {
    expect(isDerivableRevalidateType('page_post')).toBe(true);
    expect(isDerivableRevalidateType('person')).toBe(false);
    expect(isDerivableRevalidateType('page_home')).toBe(false);
  });
});

describe(deriveRevalidatePaths, () => {
  beforeEach(() => {
    getPostsByIdsMock.mockReset();
    getIndexPageParamsMock.mockReset();
    getTagParamsMock.mockReset();
    getTagPaginationParamsMock.mockReset();
    getTopicParamsMock.mockReset();
    getTopicPaginationParamsMock.mockReset();
    loggerErrorMock.mockReset();
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [okPost] });
    getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTagParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTagPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTopicParamsMock.mockResolvedValue({ ok: true, data: [] });
    getTopicPaginationParamsMock.mockResolvedValue({ ok: true, data: [] });
  });

  it('falls back with unsupported_type for an unknown type, skipping the service', async () => {
    const result = await deriveRevalidatePaths({
      type: 'person',
      id: 'author-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({ ok: false, reason: 'unsupported_type' });
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('resolves every path for a published post, including its tag and topic pages', async () => {
    getTagParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'typescript' }, { slug: 'unrelated-tag' }],
    });
    getTopicParamsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'engineering' }],
    });

    const result = await deriveRevalidatePaths({
      type: 'page_post',
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
        '/tenant-1/EN/tags/unrelated-tag',
        '/tenant-1/EN/topics/engineering',
      ]),
    });
  });

  it('falls back with document_not_found when the id matches no post (e.g. a delete)', async () => {
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [] });
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [] });

    const result = await deriveRevalidatePaths({
      type: 'page_post',
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

    const result = await deriveRevalidatePaths({
      type: 'page_post',
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

  it('falls back with fetch_failed and logs when the blog pagination lookup fails', async () => {
    getIndexPageParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const result = await deriveRevalidatePaths({
      type: 'page_post',
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

  it('falls back with fetch_failed and logs when the tag params lookup fails', async () => {
    getTagParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const result = await deriveRevalidatePaths({
      type: 'page_post',
      id: 'post-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({ ok: false, reason: 'fetch_failed' });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'revalidate.tag_params_lookup_failed',
      expect.objectContaining({ id: 'post-1' }),
    );
  });

  it('falls back with fetch_failed and logs when the tag pagination lookup fails', async () => {
    getTagPaginationParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const result = await deriveRevalidatePaths({
      type: 'page_post',
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

  it('falls back with fetch_failed and logs when the topic params lookup fails', async () => {
    getTopicParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const result = await deriveRevalidatePaths({
      type: 'page_post',
      id: 'post-1',
      tenantId: 'tenant-1',
      tenant,
    });

    expect(result).toEqual({ ok: false, reason: 'fetch_failed' });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'revalidate.topic_params_lookup_failed',
      expect.objectContaining({ id: 'post-1' }),
    );
  });

  it('falls back with fetch_failed and logs when the topic pagination lookup fails', async () => {
    getTopicPaginationParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const result = await deriveRevalidatePaths({
      type: 'page_post',
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
