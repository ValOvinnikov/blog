/**
 * @vitest-environment jsdom
 */
import type { TFeedPost } from '@blog/service';

const { getAllPublishedPostsMock, getSiteSettingsMock } = vi.hoisted(() => ({
  getAllPublishedPostsMock: vi.fn(),
  getSiteSettingsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      posts: { v1: { getAllPublishedPosts: getAllPublishedPostsMock } },
    },
    global: { siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } } },
  },
}));

const post: TFeedPost = {
  title: 'Hello & Welcome',
  slug: 'hello-welcome',
  excerpt: 'A <first> post.',
  publishedAt: '2026-01-15T00:00:00Z',
};

describe('GET /rss.xml', () => {
  afterEach(() => {
    vi.resetModules();
    getAllPublishedPostsMock.mockReset();
    getSiteSettingsMock.mockReset();
  });

  it('returns a valid RSS 2.0 feed with the correct content type', async () => {
    getAllPublishedPostsMock.mockResolvedValue({ ok: true, data: [post] });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: {
        brand: { name: 'My Blog' },
        description: 'A blog about things',
      },
    });
    const { GET } = await import('./route');

    const response = await GET();
    const xml = await response.text();

    expect(response.headers.get('Content-Type')).toBe(
      'application/rss+xml; charset=utf-8',
    );

    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.querySelector('channel > title')?.textContent).toBe('My Blog');
    expect(doc.querySelector('channel > description')?.textContent).toBe(
      'A blog about things',
    );
    expect(doc.querySelector('item > title')?.textContent).toBe(
      'Hello & Welcome',
    );
    expect(doc.querySelector('item > link')?.textContent).toBe(
      'https://example.com/blog/hello-welcome',
    );
    expect(doc.querySelector('item > description')?.textContent).toBe(
      'A <first> post.',
    );
    expect(doc.querySelector('item > pubDate')?.textContent).toBe(
      new Date(post.publishedAt).toUTCString(),
    );
  });

  it('falls back to a generic channel title/description when site settings fail', async () => {
    getAllPublishedPostsMock.mockResolvedValue({ ok: true, data: [] });
    getSiteSettingsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    const { GET } = await import('./route');

    const response = await GET();
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelector('channel > title')?.textContent).toBe('Blog');
    expect(doc.querySelector('channel > description')?.textContent).toBe(
      'Latest posts',
    );
  });

  it('returns an empty feed (no items) when the posts fetch fails', async () => {
    getAllPublishedPostsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { name: 'My Blog' }, description: 'desc' },
    });
    const { GET } = await import('./route');

    const response = await GET();
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    expect(doc.querySelectorAll('item')).toHaveLength(0);
  });
});
