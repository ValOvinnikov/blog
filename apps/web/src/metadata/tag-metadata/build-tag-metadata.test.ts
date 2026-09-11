import { urlForSanityImage } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { makeTagDetailPage } from '@web/testing/shared/tag/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { buildTagMetadata } from './build-tag-metadata';

const { getTagPageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@web/server/tag/get-tag-page', () => ({
  getTagPage: getTagPageMock,
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
  title: 'TypeScript',
  description: 'Posts about TypeScript.',
  ogTitle: 'TypeScript',
  ogDescription: 'Posts about TypeScript.',
  ogImage,
});

describe('buildTagMetadata', () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('forwards the slug and tenant to getTagPage — the same cached loader TagPage reads', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage({ seo }),
    });

    await buildTagMetadata('typescript', 'tenant-1');

    expect(getTagPageMock).toHaveBeenCalledWith('typescript', 'tenant-1');
  });

  it('builds page-1 metadata from the resolved seo, self-canonical to /tags/[slug]', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage({ seo }),
    });

    const metadata = await buildTagMetadata('typescript', 'tenant-1');

    expect(metadata.title).toBe('TypeScript');
    expect(metadata.description).toBe('Posts about TypeScript.');
    expect(metadata.alternates?.canonical).toBe('/tags/typescript');
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/tags/typescript/rss.xml',
    });
    expect(metadata.openGraph?.title).toBe('TypeScript');
    expect(metadata.openGraph?.description).toBe('Posts about TypeScript.');
    expect(metadata.openGraph?.images).toEqual([
      { url: EXPECTED_OG_IMAGE_URL },
    ]);
  });

  it('returns empty metadata when the tag fetch fails', async () => {
    getTagPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTagMetadata('typescript', 'tenant-1');

    expect(metadata).toEqual({});
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /tags/[slug]/page/N — never /tags/[slug]', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage({ seo }),
    });

    const metadata = await buildTagMetadata('typescript', 'tenant-1', 2);

    expect(metadata.title).toBe('TypeScript – Page 2');
    expect(metadata.openGraph?.title).toBe('TypeScript – Page 2');
    expect(metadata.alternates?.canonical).toBe('/tags/typescript/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/tags/typescript');
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/tags/typescript/rss.xml',
    });
  });

  it('leaves ogTitle omitted on page 2+ when unauthored, rather than suffixing "undefined"', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage({ seo: makeSeo({ ogTitle: undefined }) }),
    });

    const metadata = await buildTagMetadata('typescript', 'tenant-1', 2);

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
  });

  it('returns empty metadata for page N when the tag fetch fails', async () => {
    getTagPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTagMetadata('missing', 'tenant-1', 2);

    expect(metadata).toEqual({});
  });

  it('returns empty metadata without logging when the tag simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildTagMetadata('missing', 'tenant-1');

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
