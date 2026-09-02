import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { buildTopicMetadata } from './build-topic-metadata';

const { getTopicPageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      topic: { v1: { getTopicPage: getTopicPageMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const seo = makeSeo({
  title: 'Engineering',
  description: 'Posts about building things.',
  ogTitle: 'Engineering OG',
  ogDescription: 'Posts about building things OG.',
  ogImageUrl: 'https://cdn.example.com/engineering-og.jpg',
});

describe('buildTopicMetadata', () => {
  beforeEach(() => {
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('forwards the resolved tenant Sanity context to getTopicPage', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic: {}, modules: [], seo, postListId: 'post-list-1' },
    });

    await buildTopicMetadata('engineering');

    expect(getTopicPageMock).toHaveBeenCalledWith('engineering', tenant);
  });

  it('builds page-1 metadata from the resolved seo, self-canonical to /topics/[slug]', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic: {}, modules: [], seo, postListId: 'post-list-1' },
    });

    const metadata = await buildTopicMetadata('engineering');

    expect(metadata.title).toBe('Engineering');
    expect(metadata.description).toBe('Posts about building things.');
    expect(metadata.alternates?.canonical).toBe('/topics/engineering');
    expect(metadata.openGraph?.title).toBe('Engineering OG');
    expect(metadata.openGraph?.description).toBe(
      'Posts about building things OG.',
    );
    expect(getTopicPageMock).toHaveBeenCalledWith(
      'engineering',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns empty metadata when the topic fetch fails', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTopicMetadata('engineering');

    expect(metadata).toEqual({});
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /topics/[slug]/page/N — never /topics/[slug]', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic: {}, modules: [], seo, postListId: 'post-list-1' },
    });

    const metadata = await buildTopicMetadata('engineering', 2);

    expect(metadata.title).toBe('Engineering – Page 2');
    expect(metadata.openGraph?.title).toBe('Engineering OG – Page 2');
    expect(metadata.alternates?.canonical).toBe('/topics/engineering/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/topics/engineering');
    expect(getTopicPageMock).toHaveBeenCalledWith(
      'engineering',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns empty metadata for page N when the topic fetch fails', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTopicMetadata('missing', 2);

    expect(metadata).toEqual({});
  });

  it('returns empty metadata without logging when the topic simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildTopicMetadata('missing');

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
