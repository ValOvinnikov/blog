import { getRelatedPosts } from '@blog/service/features/pages/post/adaptor/related/loader';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  makeRawPostCard,
  makeRawPostDetail,
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
  it('returns null when the post is not found', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('missing-slug');

    expect(result).toBeNull();
  });

  it('maps the raw post into a domain detail object', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({ _id: 'post-abc', title: 'Test Post' }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('test-post');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('post-abc');
    expect(result?.title).toBe('Test Post');
    expect(result?.slug).toBe('hello-world');
  });

  it('maps the required author onto the post detail', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          author: {
            _id: 'author-9',
            name: 'Jane Doe',
            slug: 'jane-doe',
            image: makeRawImage('Jane avatar'),
            role: 'Editor',
            bio: null,
            socialLinks: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result?.author).toEqual({
      id: 'author-9',
      name: 'Jane Doe',
      slug: 'jane-doe',
      imageUrl: 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
      role: 'Editor',
      bio: undefined,
      socialLinks: [],
    });
  });

  it('maps a post with no heroImage to undefined image fields', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({ heroImage: null, heroImageAsset: null }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result?.heroImageUrl).toBeUndefined();
    expect(result?.heroImageAlt).toBeUndefined();
    expect(result?.heroImageSanity).toBeUndefined();
  });

  it('passes the slug as a query parameter', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getPost('my-slug');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'my-slug' } }),
    );
  });

  it('tags the query with author/category alongside post', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getPost('my-slug');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        next: {
          revalidate: 3600,
          tags: ['post', 'author', 'category'],
        },
      }),
    );
  });

  it('lets authored seo override the resolved defaults', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          seo: {
            metaTitle: 'Authored Title',
            metaDescription: 'Authored description',
            openGraph: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result?.seo.title).toBe('Authored Title');
    expect(result?.seo.description).toBe('Authored description');
    expect(result?.seo.ogTitle).toBe('Authored Title');
  });

  it('falls back to the post title, excerpt, and hero image when unauthored', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          title: 'Fallback Post',
          excerpt: 'Fallback excerpt',
          seo: null,
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result?.seo.title).toBe('Fallback Post');
    expect(result?.seo.description).toBe('Fallback excerpt');
    expect(result?.seo.ogImageUrl).toContain('sanity.io');
  });

  it('falls back to the site settings default OG image when there is no hero image', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({ heroImage: null, heroImageAsset: null, seo: null }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({
          defaultOgImage: undefined,
        }),
      );

    const result = await getPost('hello-world');

    expect(result?.seo.ogImageUrl).toBeUndefined();
  });

  it('maps tags from raw input', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          tags: [{ _id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result?.tags).toEqual([
      { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
    ]);
  });

  it('maps an absent tags field to an empty array', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail({ tags: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result?.tags).toEqual([]);
  });

  it('computes readingTimeMinutes from the server-computed word count', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail({ wordCount: 401 }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result?.readingTimeMinutes).toBe(3);
  });

  it('rounds a wordless post up to a 1-minute read', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail({ wordCount: 0 }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world');

    expect(result?.readingTimeMinutes).toBe(1);
  });

  it('exposes relatedPosts from getRelatedPosts', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail({ _id: 'post-abc' }))
      .mockResolvedValueOnce(makeRawSiteSettings());
    mockGetRelatedPosts.mockResolvedValueOnce([
      toPostCard(makeRawPostCard({ _id: 'related-1' })),
    ]);

    const result = await getPost('hello-world');

    expect(result?.relatedPosts.map((post) => post.id)).toEqual(['related-1']);
  });

  it('calls getRelatedPosts with the post id, tag ids, and category id', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          _id: 'post-abc',
          tags: [{ _id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
          category: {
            _id: 'cat-1',
            title: 'Engineering',
            slug: 'engineering',
            description: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getPost('hello-world');

    expect(mockGetRelatedPosts).toHaveBeenCalledWith(
      'post-abc',
      ['tag-1'],
      'cat-1',
    );
  });
});
