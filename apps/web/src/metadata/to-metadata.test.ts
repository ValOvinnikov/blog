import { routes } from '@blog/config';
import { MOCK_EN_POST_SLUG } from '@web/testing/shared/post/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  MOCK_OG_IMAGE,
  MOCK_OG_IMAGE_URL,
} from '@web/testing/shared/seo/og-image-fixtures';
import { MOCK_TENANT_BASE_URL } from '@web/testing/shared/tenant/fixtures';
import type { Metadata } from 'next';
import {
  resolveOpenGraph,
  resolveTwitter,
} from 'next/dist/lib/metadata/resolvers/resolve-opengraph';

import { toMetadata } from './to-metadata';

const TITLE = 'The Blog';
const DESCRIPTION = 'All the posts.';
const OG_TITLE = 'The Blog OG';
const OG_DESCRIPTION = 'All the posts OG.';
const POST_PATH = routes.post(MOCK_EN_POST_SLUG);
const BLOG_PATH = routes.blogIndex();
const DEFAULT_SEO_TITLE = 'Example Title';
const PUBLISHED_AT = '2026-01-15T00:00:00Z';
const AUTHOR_NAME = 'Jane Doe';

type TOpenGraphWithType = { type?: string };
type TTwitterWithCard = { card?: string };

vi.mock('@web/server/request-context/request-context');

const seo = mockSeo({
  title: TITLE,
  description: DESCRIPTION,
  ogTitle: OG_TITLE,
  ogDescription: OG_DESCRIPTION,
  ogImage: MOCK_OG_IMAGE,
});

describe(toMetadata, () => {
  it('maps title as an absolute title object when titleAbsolute is true', async () => {
    const metadata = await toMetadata(seo, {
      canonical: '/',
      ogType: 'website',
      titleAbsolute: true,
    });

    expect(metadata.title).toEqual({ absolute: TITLE });
  });

  it('maps ogType article', async () => {
    const metadata = await toMetadata(seo, {
      canonical: POST_PATH,
      ogType: 'article',
    });

    expect((metadata.openGraph as TOpenGraphWithType | null)?.type).toBe(
      'article',
    );
  });

  it('omits openGraph and twitter images when ogImage is absent', async () => {
    const metadata = await toMetadata(
      { ...seo, ogImage: undefined },
      {
        canonical: '/',
        ogType: 'website',
      },
    );

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter?.images).toBeUndefined();
    expect((metadata.twitter as TTwitterWithCard | null)?.card).toBe('summary');
  });

  it('omits the description and OG and twitter title/description when absent', async () => {
    const metadata = await toMetadata(
      {
        title: DEFAULT_SEO_TITLE,
        description: undefined,
        ogTitle: undefined,
        ogDescription: undefined,
        ogImage: undefined,
      },
      { canonical: '/', ogType: 'website' },
    );

    expect(metadata.title).toBe(DEFAULT_SEO_TITLE);
    expect(metadata.description).toBeUndefined();
    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.openGraph?.description).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
    expect(metadata.twitter?.description).toBeUndefined();
  });

  it('adds openGraph.publishedTime and authors for article type when provided', async () => {
    const metadata = await toMetadata(seo, {
      canonical: POST_PATH,
      ogType: 'article',
      article: {
        publishedTime: PUBLISHED_AT,
        authors: [AUTHOR_NAME],
      },
    });

    expect(
      (metadata.openGraph as { publishedTime?: string })?.publishedTime,
    ).toBe(PUBLISHED_AT);
    expect((metadata.openGraph as { authors?: string[] })?.authors).toEqual([
      AUTHOR_NAME,
    ]);
  });

  it('adds alternates.types["application/rss+xml"] when feedUrl is provided', async () => {
    const metadata = await toMetadata(seo, {
      canonical: BLOG_PATH,
      ogType: 'website',
      feedUrl: routes.rssFeed(),
    });

    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': routes.rssFeed(),
    });
  });

  describe('for a website page at /blog', () => {
    let metadata: Metadata;

    beforeEach(async () => {
      metadata = await toMetadata(seo, {
        canonical: BLOG_PATH,
        ogType: 'website',
      });
    });

    it('maps canonical, description, and ogType', async () => {
      expect(metadata.alternates?.canonical).toBe(BLOG_PATH);
      expect(metadata.description).toBe(DESCRIPTION);
      expect((metadata.openGraph as TOpenGraphWithType | null)?.type).toBe(
        'website',
      );
    });

    it('maps title as a plain string when titleAbsolute is not set', async () => {
      expect(metadata.title).toBe(TITLE);
    });

    it('maps openGraph title/description/images from ogTitle/ogDescription/ogImage', async () => {
      expect(metadata.openGraph?.title).toBe(OG_TITLE);
      expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
      expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
    });

    it('maps twitter card, title, description, and images', async () => {
      expect((metadata.twitter as TTwitterWithCard | null)?.card).toBe(
        'summary_large_image',
      );
      expect(metadata.twitter?.title).toBe(OG_TITLE);
      expect(metadata.twitter?.description).toBe(OG_DESCRIPTION);
      expect(metadata.twitter?.images).toEqual([MOCK_OG_IMAGE_URL]);
    });

    it('omits openGraph.publishedTime and authors when article option is not passed', async () => {
      expect(
        (metadata.openGraph as { publishedTime?: string })?.publishedTime,
      ).toBeUndefined();
      expect(
        (metadata.openGraph as { authors?: string[] })?.authors,
      ).toBeUndefined();
    });

    it('omits alternates.types when feedUrl is not provided', async () => {
      expect(metadata.alternates?.types).toBeUndefined();
    });
  });
});

describe('toMetadata output resolved by Next itself', () => {
  const metadataBase = new URL(MOCK_TENANT_BASE_URL);
  const metadataContext = {
    trailingSlash: false,
    isStaticMetadataRouteFile: false,
  };

  describe('without an ogImage', () => {
    let metadata: Metadata;

    beforeEach(async () => {
      metadata = await toMetadata(
        { ...seo, ogImage: undefined },
        {
          canonical: '/',
          ogType: 'website',
        },
      );
    });

    it('resolves openGraph.images to undefined, never an injected default', async () => {
      const resolved = await resolveOpenGraph(
        metadata.openGraph,
        metadataBase,
        Promise.resolve('/'),
        metadataContext,
        null,
      );

      expect(resolved?.images).toBeUndefined();
    });

    it('resolves twitter.images to undefined, never an injected default', async () => {
      const resolved = resolveTwitter(
        metadata.twitter,
        metadataBase,
        metadataContext,
        null,
      );

      expect(resolved?.images).toBeUndefined();
    });
  });

  it('still resolves an explicit ogImage unchanged (no fallback applied)', async () => {
    const metadata = await toMetadata(seo, {
      canonical: BLOG_PATH,
      ogType: 'website',
    });

    const resolved = await resolveOpenGraph(
      metadata.openGraph,
      metadataBase,
      Promise.resolve(BLOG_PATH),
      metadataContext,
      null,
    );

    expect(resolved?.images).toEqual([{ url: new URL(MOCK_OG_IMAGE_URL) }]);
  });
});
