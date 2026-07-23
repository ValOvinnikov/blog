import { makeSeo } from '@web/testing/shared/seo/fixtures';

import { buildBlogListMetadata } from './build-blog-list-metadata';

const { getIndexPageMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      blog: { v1: { getIndexPage: getIndexPageMock } },
    },
  },
}));

const seo = makeSeo({
  title: 'The Blog',
  description: 'All the posts.',
  ogTitle: 'The Blog OG',
  ogDescription: 'All the posts OG.',
  ogImageUrl: 'https://cdn.example.com/blog-og.jpg',
});

describe('buildBlogListMetadata', () => {
  it('builds page-1 metadata from the resolved seo, self-canonical to /blog', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        seo,
        posts: [],
        currentPage: 1,
        totalPages: 3,
        total: 20,
      },
    });

    const metadata = await buildBlogListMetadata(1);

    expect(metadata.title).toBe('The Blog');
    expect(metadata.description).toBe('All the posts.');
    expect(metadata.alternates?.canonical).toBe('/blog');
    expect(metadata.openGraph?.title).toBe('The Blog OG');
    expect(metadata.openGraph?.description).toBe('All the posts OG.');
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/blog-og.jpg' },
    ]);
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /blog/page/N — never /blog', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        seo,
        posts: [],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });

    const metadata = await buildBlogListMetadata(2);

    expect(metadata.title).toBe('The Blog – Page 2');
    expect(metadata.openGraph?.title).toBe('The Blog OG – Page 2');
    expect(metadata.twitter?.title).toBe('The Blog OG – Page 2');
    expect(metadata.alternates?.canonical).toBe('/blog/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/blog');
  });

  it('returns empty metadata when the index page fetch fails', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildBlogListMetadata(1);

    expect(metadata).toEqual({});
  });
});
