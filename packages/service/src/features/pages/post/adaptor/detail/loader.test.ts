import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostDetail } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

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
});
