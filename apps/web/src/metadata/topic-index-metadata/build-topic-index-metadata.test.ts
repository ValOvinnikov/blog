import { urlForSanityImage } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { buildTopicIndexMetadata } from './build-topic-index-metadata';

const { getTopicIndexPageMock } = vi.hoisted(() => ({
  getTopicIndexPageMock: vi.fn(),
}));

vi.mock('@web/server/topic-index/get-topic-index-page/get-topic-index-page', () => ({
  getTopicIndexPage: getTopicIndexPageMock,
}));

vi.mock('@web/server/request-context/request-context');

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

describe('buildTopicIndexMetadata', () => {
  beforeEach(() => {
    getTopicIndexPageMock.mockReset();
  });

  it('reads the page through getTopicIndexPage, the loader TopicIndexPage reads', async () => {
    getTopicIndexPageMock.mockResolvedValue({
      ok: true,
      data: { headingBlock: { heading: 'Topics' }, seo, modules: [] },
    });

    await buildTopicIndexMetadata();

    expect(getTopicIndexPageMock).toHaveBeenCalledWith();
  });

  it('builds metadata from the resolved seo, self-canonical to /topics', async () => {
    getTopicIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: { heading: 'Topics' },
        seo,
        modules: [],
      },
    });

    const metadata = await buildTopicIndexMetadata();

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

  it('returns empty metadata and logs when the index page fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTopicIndexMetadata();

    expect(metadata).toEqual({});
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('topic_index_metadata.fetch_failed'),
    );
    errorSpy.mockRestore();
  });

  it('returns empty metadata without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildTopicIndexMetadata();

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
