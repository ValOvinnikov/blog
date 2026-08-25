import { makeSeo } from '@web/testing/shared/seo/fixtures';

import { buildTagsMetadata } from './build-tags-metadata';

const { getIndexPageMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tagIndex: { v1: { getIndexPage: getIndexPageMock } },
    },
  },
}));

const seo = makeSeo({
  title: 'Tags',
  description: 'Browse every post by tag.',
  ogTitle: 'Tags OG',
  ogDescription: 'Browse every post by tag OG.',
  ogImageUrl: 'https://cdn.example.com/tags-og.jpg',
});

describe('buildTagsMetadata', () => {
  it('builds metadata from the resolved seo, self-canonical to /tags', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Tags',
        seo,
        taxonomyListId: 'tag-list-1',
      },
    });

    const metadata = await buildTagsMetadata();

    expect(metadata.title).toBe('Tags');
    expect(metadata.description).toBe('Browse every post by tag.');
    expect(metadata.alternates?.canonical).toBe('/tags');
    expect(metadata.openGraph?.title).toBe('Tags OG');
    expect(metadata.openGraph?.description).toBe(
      'Browse every post by tag OG.',
    );
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/tags-og.jpg' },
    ]);
  });

  it('returns empty metadata when the index page fetch fails', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTagsMetadata();

    expect(metadata).toEqual({});
  });

  it('returns empty metadata without logging when the index page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildTagsMetadata();

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
