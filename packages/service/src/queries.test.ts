import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create a plain mock function before vi.mock is evaluated.
// vi.hoisted runs in the same hoisted position as vi.mock so the factory
// can close over it safely.
const mockFetch = vi.hoisted(() =>
  vi.fn<(...args: unknown[]) => Promise<unknown>>()
);

// Mock the client module before importing query functions.
vi.mock('./client', () => ({
  client: {
    fetch: mockFetch,
    config: () => ({ projectId: 'test', dataset: 'test' }),
  },
}));

import {
  getAuthor,
  getCategories,
  getPage,
  getPost,
  getPosts,
  getPostsByCategory,
  getSiteSettings,
} from './queries';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getPosts', () => {
  it('returns the array from client.fetch', async () => {
    const fixture = [{ _id: '1', title: 'Hello' }];
    mockFetch.mockResolvedValue(fixture);

    const result = await getPosts();

    expect(result).toEqual(fixture);
  });

  it('calls client.fetch with the posts tag', async () => {
    mockFetch.mockResolvedValue([]);
    await getPosts();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "post"'),
      {},
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['posts'] }),
      })
    );
  });
});

describe('getPost', () => {
  it('returns null when client.fetch returns null', async () => {
    mockFetch.mockResolvedValue(null);

    const result = await getPost('non-existent');

    expect(result).toBeNull();
  });

  it('passes the slug parameter to client.fetch', async () => {
    mockFetch.mockResolvedValue(null);
    await getPost('my-post');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('slug.current == $slug'),
      { slug: 'my-post' },
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['post'] }),
      })
    );
  });
});

describe('getPostsByCategory', () => {
  it('passes the category slug and uses posts tag', async () => {
    mockFetch.mockResolvedValue([]);
    await getPostsByCategory('tech');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      { slug: 'tech' },
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['posts'] }),
      })
    );
  });
});

describe('getCategories', () => {
  it('returns the array from client.fetch', async () => {
    const fixture = [{ _id: '1', name: 'Tech' }];
    mockFetch.mockResolvedValue(fixture);

    const result = await getCategories();

    expect(result).toEqual(fixture);
  });

  it('uses the categories tag', async () => {
    mockFetch.mockResolvedValue([]);
    await getCategories();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "category"'),
      {},
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['categories'] }),
      })
    );
  });
});

describe('getAuthor', () => {
  it('returns null when client.fetch returns null', async () => {
    mockFetch.mockResolvedValue(null);

    const result = await getAuthor('jane-doe');

    expect(result).toBeNull();
  });

  it('passes the slug parameter and uses author tag', async () => {
    mockFetch.mockResolvedValue(null);
    await getAuthor('jane-doe');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "author"'),
      { slug: 'jane-doe' },
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['author'] }),
      })
    );
  });
});

describe('getPage', () => {
  it('returns null when client.fetch returns null', async () => {
    mockFetch.mockResolvedValue(null);

    const result = await getPage('about');

    expect(result).toBeNull();
  });

  it('passes the slug parameter and uses page tag', async () => {
    mockFetch.mockResolvedValue(null);
    await getPage('about');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "page"'),
      { slug: 'about' },
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['page'] }),
      })
    );
  });
});

describe('getSiteSettings', () => {
  it('returns null when client.fetch returns null', async () => {
    mockFetch.mockResolvedValue(null);

    const result = await getSiteSettings();

    expect(result).toBeNull();
  });

  it('uses the siteSettings tag', async () => {
    mockFetch.mockResolvedValue(null);
    await getSiteSettings();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "siteSettings"'),
      {},
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['siteSettings'] }),
      })
    );
  });
});

describe('ISR revalidation', () => {
  it('every query uses revalidate: 3600', async () => {
    mockFetch.mockResolvedValue(null);

    await getPosts();
    await getCategories();
    await getSiteSettings();

    for (const call of mockFetch.mock.calls) {
      const options = call[2];
      expect(options).toMatchObject({
        next: { revalidate: 3600 },
      });
    }
  });
});
