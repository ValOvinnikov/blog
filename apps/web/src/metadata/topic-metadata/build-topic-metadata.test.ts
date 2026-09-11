import { urlForSanityImage } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { buildTopicMetadata } from './build-topic-metadata';

const { getTopicPageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@web/server/topic/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
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
  title: 'Engineering',
  description: 'Posts about building things.',
  ogTitle: 'Engineering OG',
  ogDescription: 'Posts about building things OG.',
  ogImage,
});

describe('buildTopicMetadata', () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('forwards the slug and tenant to getTopicPage — the same cached loader TopicPage reads', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic: {}, modules: [], seo },
    });

    await buildTopicMetadata('engineering', 'tenant-1');

    expect(getTopicPageMock).toHaveBeenCalledWith('engineering', 'tenant-1');
  });

  it('builds page-1 metadata from the resolved seo, self-canonical to /topics/[slug]', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic: {}, modules: [], seo },
    });

    const metadata = await buildTopicMetadata('engineering', 'tenant-1');

    expect(metadata.title).toBe('Engineering');
    expect(metadata.description).toBe('Posts about building things.');
    expect(metadata.alternates?.canonical).toBe('/topics/engineering');
    expect(metadata.openGraph?.title).toBe('Engineering OG');
    expect(metadata.openGraph?.description).toBe(
      'Posts about building things OG.',
    );
    expect(metadata.openGraph?.images).toEqual([
      { url: EXPECTED_OG_IMAGE_URL },
    ]);
  });

  it('returns empty metadata when the topic fetch fails', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTopicMetadata('engineering', 'tenant-1');

    expect(metadata).toEqual({});
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /topics/[slug]/page/N — never /topics/[slug]', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic: {}, modules: [], seo },
    });

    const metadata = await buildTopicMetadata('engineering', 'tenant-1', 2);

    expect(metadata.title).toBe('Engineering – Page 2');
    expect(metadata.openGraph?.title).toBe('Engineering OG – Page 2');
    expect(metadata.alternates?.canonical).toBe('/topics/engineering/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/topics/engineering');
  });

  it('leaves ogTitle omitted on page 2+ when unauthored, rather than suffixing "undefined"', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic: {}, modules: [], seo: makeSeo({ ogTitle: undefined }) },
    });

    const metadata = await buildTopicMetadata('engineering', 'tenant-1', 2);

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
  });

  it('returns empty metadata for page N when the topic fetch fails', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTopicMetadata('missing', 'tenant-1', 2);

    expect(metadata).toEqual({});
  });

  it('returns empty metadata without logging when the topic simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildTopicMetadata('missing', 'tenant-1');

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
