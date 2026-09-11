import { urlForSanityImage } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { buildTopicsMetadata } from './build-topics-metadata';

const { getTopicsIndexPageMock, getTenantSanityContextMock } = vi.hoisted(
  () => ({
    getTopicsIndexPageMock: vi.fn(),
    getTenantSanityContextMock: vi.fn(),
  }),
);

vi.mock('@web/server/topics-index/get-topics-index-page', () => ({
  getTopicsIndexPage: getTopicsIndexPageMock,
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const ogImage = makeSanityImage();
const EXPECTED_OG_IMAGE_URL = urlForSanityImage(
  ogImage,
  DEFAULT_TENANT_SANITY_CONTEXT,
);

const seo = makeSeo({
  title: 'Topics',
  description: 'Browse every post by topic.',
  ogTitle: 'Topics OG',
  ogDescription: 'Browse every post by topic OG.',
  ogImage,
});

describe('buildTopicsMetadata', () => {
  beforeEach(() => {
    getTopicsIndexPageMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('forwards the tenant to getTopicsIndexPage — the same cached loader TopicsPage reads', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: { headingBlock: { heading: 'Topics' }, seo, modules: [] },
    });

    await buildTopicsMetadata('tenant-1');

    expect(getTopicsIndexPageMock).toHaveBeenCalledWith('tenant-1');
  });

  it('builds metadata from the resolved seo, self-canonical to /topics', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: { heading: 'Topics' },
        seo,
        modules: [],
      },
    });

    const metadata = await buildTopicsMetadata('tenant-1');

    expect(metadata.title).toBe('Topics');
    expect(metadata.description).toBe('Browse every post by topic.');
    expect(metadata.alternates?.canonical).toBe('/topics');
    expect(metadata.openGraph?.title).toBe('Topics OG');
    expect(metadata.openGraph?.description).toBe(
      'Browse every post by topic OG.',
    );
    expect(metadata.openGraph?.images).toEqual([
      { url: EXPECTED_OG_IMAGE_URL },
    ]);
  });

  it('returns empty metadata when the index page fetch fails', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTopicsMetadata('tenant-1');

    expect(metadata).toEqual({});
  });

  it('returns empty metadata without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicsIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildTopicsMetadata('tenant-1');

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
