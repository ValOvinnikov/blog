import { describe, expect, it, vi } from 'vitest';

import { buildBlogListMetadata } from './build-blog-list-metadata';

const { getIndexPageMock, getSiteSettingsMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
  getSiteSettingsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      blog: { v1: { getIndexPage: getIndexPageMock } },
    },
    global: {
      siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
    },
  },
}));

describe('buildBlogListMetadata', () => {
  it('builds page-1 metadata from page_blog SEO, self-canonical to /blog', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        seo: {
          metaTitle: 'The Blog',
          metaDescription: 'All the posts.',
          ogTitle: 'The Blog OG',
          ogDescription: 'All the posts OG.',
          ogImageUrl: 'https://cdn.example.com/blog-og.jpg',
        },
        posts: [],
        currentPage: 1,
        totalPages: 3,
        total: 20,
      },
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { description: 'A great blog.' },
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

  it('builds page-N metadata, self-canonical to /blog/page/N — never /blog', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        seo: { metaTitle: 'The Blog' },
        posts: [],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { description: 'A great blog.' },
    });

    const metadata = await buildBlogListMetadata(2);

    expect(metadata.title).toBe('The Blog – Page 2');
    expect(metadata.alternates?.canonical).toBe('/blog/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/blog');
  });

  it('falls back to site settings ogTitle when page_blog is unavailable', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: {
        ogTitle: 'Site OG Title',
        ogDescription: 'Site OG description.',
        description: 'A great blog.',
        ogImageUrl: 'https://cdn.example.com/site-og.jpg',
      },
    });

    const metadata = await buildBlogListMetadata(1);

    expect(metadata.title).toBe('Site OG Title');
    expect(metadata.description).toBe('Site OG description.');
  });

  it('falls back to the page_blog heading when no SEO is authored', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        posts: [],
        currentPage: 1,
        totalPages: 3,
        total: 20,
      },
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { description: 'A great blog.' },
    });

    const metadata = await buildBlogListMetadata(1);

    expect(metadata.title).toBe('Blog');
    expect(metadata.description).toBe('A great blog.');
  });

  it('falls back to the literal "Blog" when neither page_blog nor site settings is available', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildBlogListMetadata(1);

    expect(metadata.title).toBe('Blog');
    expect(metadata.description).toBe('');
  });
});
