import { describe, expect, it, vi } from 'vitest';

import { mockRun } from '#/testing/mock-run-query';
import { makeRawPostCard } from '#/testing/pages/fixtures';
import { makeRawSanityImage } from '#/testing/shared/fixtures';

import { getHomePage } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getHomePage', () => {
  it('maps the configured featured post into the hero', async () => {
    mockRun
      .mockResolvedValueOnce({
        title: 'Home Page',
        modules: [
          {
            _key: 'hero',
            _type: 'module_hero',
            featuredPost: makeRawPostCard({ _id: 'featured-ref' }),
            heroEyebrowMode: 'postCategory',
            heroEyebrow: null,
            heroTitleMode: 'postTitle',
            heroTitle: null,
            heroSubtitleMode: 'postExcerpt',
            heroSubtitle: null,
            heroImageMode: 'postImage',
            heroImage: null,
            heroImageAsset: null,
            primaryActionLabel: 'Start reading',
            secondaryAction: {
              label: 'Browse all',
              linkType: 'EXTERNAL',
              url: '/blog',
              internalReference: null,
            },
          },
          {
            _key: 'postList',
            _type: 'module_postList',
            title: 'Latest',
            limit: 2,
          },
        ],
        seo: null,
      })
      .mockResolvedValueOnce([
        makeRawPostCard({ _id: 'a', featured: true }),
        makeRawPostCard({ _id: 'b', featured: false }),
      ]);

    const page = await getHomePage();

    expect(page.hero.title).toBe('Hello World');
    expect(page.hero.primaryAction).toEqual({
      label: 'Start reading',
      href: '/blog/hello-world',
    });
    expect(page.hero.secondaryAction).toEqual({
      label: 'Browse all',
      href: '/blog',
    });
    expect(page.latestPosts.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('falls back to the newest featured post and excludes it from latest posts', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([
        makeRawPostCard({ _id: 'featured', featured: true }),
        makeRawPostCard({ _id: 'latest', featured: false }),
      ]);

    const page = await getHomePage();

    expect(page.hero.primaryAction?.href).toBe('/blog/hello-world');
    expect(page.latestPosts.map((p) => p.id)).toEqual(['latest']);
  });

  it('uses custom hero copy and custom image when configured', async () => {
    mockRun
      .mockResolvedValueOnce({
        title: 'Home Page',
        modules: [
          {
            _key: 'hero',
            _type: 'module_hero',
            featuredPost: null,
            heroEyebrowMode: 'custom',
            heroEyebrow: 'Field notes',
            heroTitleMode: 'custom',
            heroTitle: 'Custom home title',
            heroSubtitleMode: 'custom',
            heroSubtitle: 'Custom home subtitle.',
            heroImageMode: 'custom',
            heroImage: makeRawPostCard().mainImage,
            heroImageAsset: makeRawSanityImage(),
            primaryActionLabel: null,
            secondaryAction: null,
          },
          {
            _key: 'postList',
            _type: 'module_postList',
            title: 'Recent writing',
            limit: 1,
          },
        ],
        seo: null,
      })
      .mockResolvedValueOnce([
        makeRawPostCard({ _id: 'featured', featured: true }),
        makeRawPostCard({ _id: 'latest', featured: false }),
      ]);

    const page = await getHomePage();

    expect(page.hero.eyebrow).toBe('Field notes');
    expect(page.hero.title).toBe('Custom home title');
    expect(page.hero.subtitle).toBe('Custom home subtitle.');
    expect(page.hero.image?.src).toContain('cdn.sanity.io');
    expect(page.hero.image?.alt).toBe('Alt text');
    expect(page.hero.sanityImage).toEqual({
      assetId: 'image-abc123-800x600-jpg',
      alt: 'Alt text',
      hotspot: undefined,
      crop: undefined,
      lqip: 'data:image/png;base64,abc123',
      dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
    });
    expect(page.latestPostsTitle).toBe('Recent writing');
    expect(page.latestPosts).toHaveLength(1);
  });
});
