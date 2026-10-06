import { LOCALE_ISO_CODES } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

import { buildTopicMetadata } from './build-topic-metadata';

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@web/server/topic/get-topic-page/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
}));

vi.mock('@web/server/request-context/request-context');

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
  });

  it('forwards the slug to getTopicPage, the loader TopicPage reads', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic: {}, modules: [], seo, translations: [] },
    });

    await buildTopicMetadata('engineering');

    expect(getTopicPageMock).toHaveBeenCalledWith('engineering');
  });

  it('builds page-1 metadata from the resolved seo, self-canonical to /topics/[slug]', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic: {}, modules: [], seo, translations: [] },
    });

    const metadata = await buildTopicMetadata('engineering');

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

    const metadata = await buildTopicMetadata('engineering');

    expect(metadata).toEqual({});
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to its own URL', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic: {}, modules: [], seo, translations: [] },
    });

    const metadata = await buildTopicMetadata('engineering', 2);

    expect(metadata.title).toBe('Engineering – Page 2');
    expect(metadata.openGraph?.title).toBe('Engineering OG – Page 2');
    expect(metadata.alternates?.canonical).toBe('/topics/engineering/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/topics/engineering');
  });

  it('leaves ogTitle omitted on page 2+ when unauthored, never suffixing "undefined"', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic: {},
        modules: [],
        seo: makeSeo({ ogTitle: undefined }),
        translations: [],
      },
    });

    const metadata = await buildTopicMetadata('engineering', 2);

    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
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

describe('buildTopicMetadata per language', () => {
  const { EN, NL, DE } = LOCALE_ISO_CODES;

  beforeEach(() => {
    getTopicPageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: NL,
      liveLocales: [EN, NL],
    });
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic: {},
        modules: [],
        seo,
        translations: [
          { language: EN, slug: 'design' },
          { language: NL, slug: 'ontwerp' },
          { language: DE, slug: 'gestaltung' },
        ],
      },
    });
  });

  afterEach(() => {
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('lists each live language under its own slug as hreflang, canonical to its own prefixed address', async () => {
    const metadata = await buildTopicMetadata('ontwerp');

    expect(metadata.alternates).toMatchObject({
      canonical: '/nl/topics/ontwerp',
      languages: {
        en: '/topics/design',
        nl: '/nl/topics/ontwerp',
        'x-default': '/topics/design',
      },
    });
  });

  it('lists no hreflang past page 1', async () => {
    const metadata = await buildTopicMetadata('ontwerp', 2);

    expect(metadata.alternates?.canonical).toBe('/nl/topics/ontwerp/page/2');
    expect(metadata.alternates?.languages).toBeUndefined();
  });
});
