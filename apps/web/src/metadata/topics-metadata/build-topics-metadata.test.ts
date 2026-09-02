import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { buildTopicsMetadata } from './build-topics-metadata';

const { getIndexPageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      topicIndex: { v1: { getIndexPage: getIndexPageMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const seo = makeSeo({
  title: 'Topics',
  description: 'Browse every post by topic.',
  ogTitle: 'Topics OG',
  ogDescription: 'Browse every post by topic OG.',
  ogImageUrl: 'https://cdn.example.com/topics-og.jpg',
});

describe('buildTopicsMetadata', () => {
  beforeEach(() => {
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('forwards the resolved tenant Sanity context to getIndexPage', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: { heading: 'Topics', seo, taxonomyListId: 'topic-list-1' },
    });

    await buildTopicsMetadata();

    expect(getIndexPageMock).toHaveBeenCalledWith(tenant);
  });

  it('builds metadata from the resolved seo, self-canonical to /topics', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Topics',
        seo,
        taxonomyListId: 'topic-list-1',
      },
    });

    const metadata = await buildTopicsMetadata();

    expect(metadata.title).toBe('Topics');
    expect(metadata.description).toBe('Browse every post by topic.');
    expect(metadata.alternates?.canonical).toBe('/topics');
    expect(metadata.openGraph?.title).toBe('Topics OG');
    expect(metadata.openGraph?.description).toBe(
      'Browse every post by topic OG.',
    );
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/topics-og.jpg' },
    ]);
  });

  it('returns empty metadata when the index page fetch fails', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTopicsMetadata();

    expect(metadata).toEqual({});
  });

  it('returns empty metadata without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildTopicsMetadata();

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
