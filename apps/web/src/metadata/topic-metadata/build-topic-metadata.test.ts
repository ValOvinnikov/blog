import { makeSeo } from '@web/testing/shared/seo/fixtures';

import { buildTopicMetadata } from './build-topic-metadata';

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      topic: { v1: { getTopicPage: getTopicPageMock } },
    },
  },
}));

const seo = makeSeo({
  title: 'Engineering',
  description: 'Posts about building things.',
  ogTitle: 'Engineering OG',
  ogDescription: 'Posts about building things OG.',
  ogImageUrl: 'https://cdn.example.com/engineering-og.jpg',
});

describe('buildTopicMetadata', () => {
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
    expect(getTopicPageMock).toHaveBeenCalledWith('engineering');
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
    expect(getTopicPageMock).toHaveBeenCalledWith('engineering');
  });

  it('returns empty metadata for page N when the topic fetch fails', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTopicMetadata('missing', 2);

    expect(metadata).toEqual({});
  });
});
