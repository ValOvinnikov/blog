import { urlForSanityImage } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { buildTagIndexMetadata } from './build-tag-index-metadata';

const { getTagIndexPageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getTagIndexPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@web/server/tag-index/get-tag-index-page', () => ({
  getTagIndexPage: getTagIndexPageMock,
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
  title: 'Tags',
  description: 'Browse every post by tag.',
  ogTitle: 'Tags OG',
  ogDescription: 'Browse every post by tag OG.',
  ogImage,
});

describe('buildTagIndexMetadata', () => {
  beforeEach(() => {
    getTagIndexPageMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('forwards the tenant to getTagIndexPage — the same cached loader TagIndexPage reads', async () => {
    getTagIndexPageMock.mockResolvedValue({
      ok: true,
      data: { headingBlock: { heading: 'Tags' }, seo, modules: [] },
    });

    await buildTagIndexMetadata('tenant-1');

    expect(getTagIndexPageMock).toHaveBeenCalledWith('tenant-1');
  });

  it('builds metadata from the resolved seo, self-canonical to /tags', async () => {
    getTagIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: { heading: 'Tags' },
        seo,
        modules: [],
      },
    });

    const metadata = await buildTagIndexMetadata('tenant-1');

    expect(metadata.title).toBe('Tags');
    expect(metadata.description).toBe('Browse every post by tag.');
    expect(metadata.alternates?.canonical).toBe('/tags');
    expect(metadata.openGraph?.title).toBe('Tags OG');
    expect(metadata.openGraph?.description).toBe(
      'Browse every post by tag OG.',
    );
    expect(metadata.openGraph?.images).toEqual([
      { url: EXPECTED_OG_IMAGE_URL },
    ]);
  });

  it('returns empty metadata when the index page fetch fails', async () => {
    getTagIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTagIndexMetadata('tenant-1');

    expect(metadata).toEqual({});
  });

  it('returns empty metadata without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildTagIndexMetadata('tenant-1');

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
