import { makeSeo } from '@web/testing/shared/seo/fixtures';

import { buildTopicsMetadata } from './build-topics-metadata';

const { getTopicsIndexPageMock } = vi.hoisted(() => ({
  getTopicsIndexPageMock: vi.fn(),
}));

vi.mock('@web/server/topics-index/get-topics-index-page', () => ({
  getTopicsIndexPage: getTopicsIndexPageMock,
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
    getTopicsIndexPageMock.mockReset();
  });

  it('forwards the tenant to getTopicsIndexPage — the same cached loader TopicsPage reads', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: { heading: 'Topics', seo, taxonomyListId: 'topic-list-1' },
    });

    await buildTopicsMetadata('tenant-1');

    expect(getTopicsIndexPageMock).toHaveBeenCalledWith('tenant-1');
  });

  it('builds metadata from the resolved seo, self-canonical to /topics', async () => {
    getTopicsIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Topics',
        seo,
        taxonomyListId: 'topic-list-1',
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
      { url: 'https://cdn.example.com/topics-og.jpg' },
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
