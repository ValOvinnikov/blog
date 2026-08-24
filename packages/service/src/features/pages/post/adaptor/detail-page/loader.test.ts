import { MissingPagePostError } from '@blog/service/features/pages/post/adaptor/missing-page-post-error';
import { getRelatedPosts } from '@blog/service/features/pages/post/adaptor/related/loader';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  makeRawPostCard,
  makeRawPostDetail,
  makeRawPostPage,
} from '@blog/service/testing/pages/fixtures';
import { makeRawImage } from '@blog/service/testing/shared/fixtures';

import { getPost } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
}));

vi.mock('@blog/service/features/pages/post/adaptor/related/loader', () => ({
  getRelatedPosts: vi.fn().mockResolvedValue([]),
}));

const mockGetRelatedPosts = vi.mocked(getRelatedPosts);

describe('getPost', () => {
  it('throws MissingPagePostError when no page_post matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    await expect(getPost('missing-slug')).rejects.toThrow(MissingPagePostError);
  });

  it('maps the raw post into a domain detail object', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({ _id: 'post-abc', title: 'Test Post' }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('test-post');

    expect(result.id).toBe('post-abc');
    expect(result.title).toBe('Test Post');
  });

  it('takes slug and publishedAt from page_post, not the wrapped post', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          slug: 'page-post-slug',
          publishedAt: '2026-02-01T00:00:00Z',
          post: makeRawPostDetail({
            slug: 'wrapped-post-slug',
            publishedAt: '2020-01-01T00:00:00Z',
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('page-post-slug');

    expect(result.slug).toBe('page-post-slug');
    expect(result.publishedAt).toBe('2026-02-01T00:00:00Z');
  });

  it('maps the required author onto the post detail', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({
            author: {
              _id: 'author-9',
              name: 'Jane Doe',
              image: makeRawImage('Jane avatar'),
              profilePage: { slug: 'jane-doe' },
              role: 'Editor',
              bio: null,
              socialLinks: null,
            },
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.author).toEqual({
      id: 'author-9',
      name: 'Jane Doe',
      profilePageSlug: 'jane-doe',
      imageUrl: 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
      role: 'Editor',
      bio: undefined,
      socialLinks: [],
    });
  });

  it('requests a right-sized author avatar instead of the full-resolution asset', async () => {
    const { urlForImage } = await import('@blog/service/sanity/image');
    const authorImage = makeRawImage('Jane avatar');
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({
            author: {
              _id: 'author-9',
              name: 'Jane Doe',
              image: authorImage,
              profilePage: { slug: 'jane-doe' },
              role: 'Editor',
              bio: null,
              socialLinks: null,
            },
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getPost('hello-world');

    expect(urlForImage).toHaveBeenCalledWith(authorImage, {
      width: 64,
      height: 64,
      fit: 'crop',
      quality: 75,
    });
  });

  it('maps a post with no heroImage to undefined image fields', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({ heroImage: null, heroImageAsset: null }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.heroImageUrl).toBeUndefined();
    expect(result.heroImageAlt).toBeUndefined();
    expect(result.heroImageSanity).toBeUndefined();
  });

  it('passes the slug as a query parameter', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getPost('my-slug');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'my-slug' } }),
    );
  });

  it('tags the query with post/author/topic alongside page_post', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getPost('my-slug');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['page_post', 'post', 'author', 'topic'],
        }),
      }),
    );
  });

  it('lets page_post.seo override the resolved defaults', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          seo: {
            metaTitle: 'Authored Title',
            metaDescription: 'Authored description',
            openGraph: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.seo.title).toBe('Authored Title');
    expect(result.seo.description).toBe('Authored description');
    expect(result.seo.ogTitle).toBe('Authored Title');
  });

  it('falls back to the post title, excerpt, and hero image when unauthored', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          seo: null,
          post: makeRawPostDetail({
            title: 'Fallback Post',
            excerpt: 'Fallback excerpt',
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.seo.title).toBe('Fallback Post');
    expect(result.seo.description).toBe('Fallback excerpt');
    expect(result.seo.ogImageUrl).toContain('sanity.io');
  });

  it('falls back to the site settings default OG image when there is no hero image', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          seo: null,
          post: makeRawPostDetail({ heroImage: null, heroImageAsset: null }),
        }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({
          defaultOgImage: undefined,
        }),
      );

    const result = await getPost('hello-world');

    expect(result.seo.ogImageUrl).toBeUndefined();
  });

  it('maps tags from raw input', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({
            tags: [{ _id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.tags).toEqual([
      { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
    ]);
  });

  it('maps newsletterEnabled straight through from the raw post', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({ newsletterEnabled: false }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.newsletterEnabled).toBe(false);
  });

  it('defaults newsletterEnabled to true when absent', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({ newsletterEnabled: null }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.newsletterEnabled).toBe(true);
  });

  it('maps an absent tags field to an empty array', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({ post: makeRawPostDetail({ tags: null }) }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.tags).toEqual([]);
  });

  it('computes readingTimeMinutes from the server-computed word count', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({ post: makeRawPostDetail({ wordCount: 401 }) }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.readingTimeMinutes).toBe(3);
  });

  it('rounds a wordless post up to a 1-minute read', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({ post: makeRawPostDetail({ wordCount: 0 }) }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.readingTimeMinutes).toBe(1);
  });

  it('exposes relatedPosts from getRelatedPosts', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({ post: makeRawPostDetail({ _id: 'post-abc' }) }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());
    mockGetRelatedPosts.mockResolvedValueOnce([
      toPostCard(makeRawPostCard({ _id: 'related-1' })),
    ]);

    const result = await getPost('hello-world');

    expect(result.relatedPosts.map((post) => post.id)).toEqual(['related-1']);
  });

  it('calls getRelatedPosts with the post id, tag ids, and topic id', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({
            _id: 'post-abc',
            tags: [{ _id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
            topic: {
              _id: 'topic-1',
              title: 'Engineering',
              slug: 'engineering',
              description: null,
            },
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getPost('hello-world');

    expect(mockGetRelatedPosts).toHaveBeenCalledWith(
      'post-abc',
      ['tag-1'],
      'topic-1',
    );
  });

  it('maps a skim with 3+ takeaways onto the post detail', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({
            skim: {
              takeaways: ['One', 'Two', 'Three'],
              generatedAt: '2026-07-20T00:00:00Z',
              model: 'claude-haiku-4-5',
            },
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.skim).toEqual({
      takeaways: ['One', 'Two', 'Three'],
      generatedAt: '2026-07-20T00:00:00Z',
      model: 'claude-haiku-4-5',
    });
  });

  it('treats an absent skim as undefined', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({ post: makeRawPostDetail({ skim: null }) }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.skim).toBeUndefined();
  });

  it('treats a skim with fewer than 3 takeaways as undefined, mirroring the schema min(3) rule', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({
            skim: {
              takeaways: ['One', 'Two'],
              generatedAt: null,
              model: null,
            },
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.skim).toBeUndefined();
  });

  it('reports hasAsides true when the body contains an aside block', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({
            body: [{ _type: 'aside', _key: 'a1', kind: 'WHY_NOT', body: [] }],
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.hasAsides).toBe(true);
  });

  it('reports hasAsides false when the body has no aside blocks', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({ post: makeRawPostDetail({ body: [] }) }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.hasAsides).toBe(false);
  });

  it('preserves the optional layout field on a bodyImage body block', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostPage({
          post: makeRawPostDetail({
            body: [
              {
                _type: 'bodyImage',
                _key: 'image-1',
                asset: undefined,
                media: undefined,
                hotspot: undefined,
                crop: undefined,
                alt: 'A diagram',
                layout: 'FLOAT_RIGHT',
              },
            ],
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: 'FLOAT_RIGHT',
    });
  });
});
