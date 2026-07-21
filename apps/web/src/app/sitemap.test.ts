import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  getPostParamsMock,
  getCategoryParamsMock,
  getIndexPageParamsMock,
  getPageSlugsMock,
} = vi.hoisted(() => ({
  getPostParamsMock: vi.fn(),
  getCategoryParamsMock: vi.fn(),
  getIndexPageParamsMock: vi.fn(),
  getPageSlugsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      post: { v1: { getPostParams: getPostParamsMock } },
      category: { v1: { getCategoryParams: getCategoryParamsMock } },
      blog: { v1: { getIndexPageParams: getIndexPageParamsMock } },
      generic: { v1: { getPageSlugs: getPageSlugsMock } },
    },
  },
}));

vi.mock('@web/utils/env/env', () => ({
  env: { NEXT_PUBLIC_SITE_URL: 'https://example.com' },
}));

describe('sitemap', () => {
  afterEach(() => {
    vi.resetModules();
    getPostParamsMock.mockReset();
    getCategoryParamsMock.mockReset();
    getIndexPageParamsMock.mockReset();
    getPageSlugsMock.mockReset();
  });

  it('includes home, blog index, post, category, blog page and generic page entries', async () => {
    getPostParamsMock.mockResolvedValue([
      { slug: 'first-post' },
      { slug: 'second-post' },
    ]);
    getCategoryParamsMock.mockResolvedValue([{ slug: 'news' }]);
    getIndexPageParamsMock.mockResolvedValue({
      ok: true,
      data: [{ page: '2' }, { page: '3' }],
    });
    getPageSlugsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'about' }],
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://example.com/');
    expect(urls).toContain('https://example.com/blog');
    expect(urls).toContain('https://example.com/blog/page/2');
    expect(urls).toContain('https://example.com/blog/page/3');
    expect(urls).toContain('https://example.com/blog/first-post');
    expect(urls).toContain('https://example.com/blog/second-post');
    expect(urls).toContain('https://example.com/category/news');
    expect(urls).toContain('https://example.com/about');
  });

  it('carries a languages alternate for each configured locale', async () => {
    getPostParamsMock.mockResolvedValue([]);
    getCategoryParamsMock.mockResolvedValue([]);
    getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
    getPageSlugsMock.mockResolvedValue({ ok: true, data: [] });
    const sitemap = (await import('./sitemap')).default;

    const [homeEntry] = await sitemap();

    expect(homeEntry?.alternates?.languages).toEqual({
      EN: 'https://example.com/',
    });
  });

  it('omits numbered blog pages when the params fetch fails', async () => {
    getPostParamsMock.mockResolvedValue([]);
    getCategoryParamsMock.mockResolvedValue([]);
    getIndexPageParamsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    getPageSlugsMock.mockResolvedValue({ ok: true, data: [] });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/blog/page/2');
    expect(urls).toContain('https://example.com/');
    expect(urls).toContain('https://example.com/blog');
  });

  it('omits generic pages when the slugs fetch fails', async () => {
    getPostParamsMock.mockResolvedValue([]);
    getCategoryParamsMock.mockResolvedValue([]);
    getIndexPageParamsMock.mockResolvedValue({ ok: true, data: [] });
    getPageSlugsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).not.toContain('https://example.com/about');
    expect(urls).toContain('https://example.com/');
  });

  it('returns an empty sitemap when NEXT_PUBLIC_SITE_URL is unset', async () => {
    vi.doMock('@web/utils/env/env', () => ({ env: {} }));
    const sitemap = (await import('./sitemap')).default;

    const entries = await sitemap();

    expect(entries).toEqual([]);
    expect(getPostParamsMock).not.toHaveBeenCalled();
  });
});
