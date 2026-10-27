import { routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import { mockMetadataSeo } from '@web/testing/metadata/to-metadata/fixtures';
import { MOCK_EN_POST_SLUG } from '@web/testing/shared/post/fixtures';
import { MOCK_OG_IMAGE_URL } from '@web/testing/shared/seo/og-image-fixtures';
import { MOCK_TENANT_BASE_URL } from '@web/testing/shared/tenant/fixtures';
import type { Metadata } from 'next';
import {
  resolveOpenGraph,
  resolveTwitter,
} from 'next/dist/lib/metadata/resolvers/resolve-opengraph';

import { toMetadata } from './to-metadata';

vi.mock('@web/server/request-context/request-context');

faker.seed(5210);

const OG_TYPE = { WEBSITE: 'website', ARTICLE: 'article' } as const;
const TWITTER_CARD = {
  SUMMARY: 'summary',
  SUMMARY_LARGE_IMAGE: 'summary_large_image',
} as const;
const RSS_FEED_TYPE = 'application/rss+xml';

const HOME_PATH = routes.home();
const POST_PATH = routes.post(MOCK_EN_POST_SLUG);
const BLOG_PATH = routes.blogIndex();
const MOCK_PUBLISHED_AT = faker.date.past().toISOString();
const MOCK_AUTHOR_NAME = faker.person.fullName();

type TOpenGraphWithType = { type?: string };
type TTwitterWithCard = { card?: string };

const MOCK_SEO = mockMetadataSeo();
const { title, description, ogTitle, ogDescription } = MOCK_SEO;

describe(toMetadata, () => {
  it('maps title as an absolute title object when titleAbsolute is true', async () => {
    const metadata = await toMetadata(MOCK_SEO, {
      canonical: HOME_PATH,
      ogType: OG_TYPE.WEBSITE,
      titleAbsolute: true,
    });

    expect(metadata.title).toEqual({ absolute: title });
  });

  it.each([OG_TYPE.WEBSITE, OG_TYPE.ARTICLE])(
    'maps the %s og type',
    async (ogType) => {
      const metadata = await toMetadata(MOCK_SEO, {
        canonical: POST_PATH,
        ogType,
      });

      expect((metadata.openGraph as TOpenGraphWithType | null)?.type).toBe(
        ogType,
      );
    },
  );

  it('omits openGraph and twitter images when ogImage is absent', async () => {
    const metadata = await toMetadata(
      { ...MOCK_SEO, ogImage: undefined },
      { canonical: HOME_PATH, ogType: OG_TYPE.WEBSITE },
    );

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter?.images).toBeUndefined();
    expect((metadata.twitter as TTwitterWithCard | null)?.card).toBe(
      TWITTER_CARD.SUMMARY,
    );
  });

  it('omits the description and OG and twitter title/description when absent', async () => {
    const metadata = await toMetadata(
      {
        title,
        description: undefined,
        ogTitle: undefined,
        ogDescription: undefined,
        ogImage: undefined,
      },
      { canonical: HOME_PATH, ogType: OG_TYPE.WEBSITE },
    );

    expect(metadata.title).toBe(title);
    expect(metadata.description).toBeUndefined();
    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.openGraph?.description).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
    expect(metadata.twitter?.description).toBeUndefined();
  });

  it('adds the published time and authors for an article when provided', async () => {
    const metadata = await toMetadata(MOCK_SEO, {
      canonical: POST_PATH,
      ogType: OG_TYPE.ARTICLE,
      article: {
        publishedTime: MOCK_PUBLISHED_AT,
        authors: [MOCK_AUTHOR_NAME],
      },
    });

    const { publishedTime, authors } = metadata.openGraph as {
      publishedTime?: string;
      authors?: string[];
    };

    expect(publishedTime).toBe(MOCK_PUBLISHED_AT);
    expect(authors).toEqual([MOCK_AUTHOR_NAME]);
  });

  it('adds the rss feed to the alternates when a feed url is provided', async () => {
    const metadata = await toMetadata(MOCK_SEO, {
      canonical: BLOG_PATH,
      ogType: OG_TYPE.WEBSITE,
      feedUrl: routes.rssFeed(),
    });

    expect(metadata.alternates?.types).toEqual({
      [RSS_FEED_TYPE]: routes.rssFeed(),
    });
  });

  describe('for a website page at the blog index', () => {
    let metadata: Metadata;

    beforeEach(async () => {
      metadata = await toMetadata(MOCK_SEO, {
        canonical: BLOG_PATH,
        ogType: OG_TYPE.WEBSITE,
      });
    });

    it('maps canonical and description', () => {
      expect(metadata.alternates?.canonical).toBe(BLOG_PATH);
      expect(metadata.description).toBe(description);
    });

    it('maps title as a plain string when titleAbsolute is not set', () => {
      expect(metadata.title).toBe(title);
    });

    it('maps the OG title, description and images from the seo', () => {
      expect(metadata.openGraph?.title).toBe(ogTitle);
      expect(metadata.openGraph?.description).toBe(ogDescription);
      expect(metadata.openGraph?.images).toEqual([{ url: MOCK_OG_IMAGE_URL }]);
    });

    it('maps twitter card, title, description, and images', () => {
      expect((metadata.twitter as TTwitterWithCard | null)?.card).toBe(
        TWITTER_CARD.SUMMARY_LARGE_IMAGE,
      );
      expect(metadata.twitter?.title).toBe(ogTitle);
      expect(metadata.twitter?.description).toBe(ogDescription);
      expect(metadata.twitter?.images).toEqual([MOCK_OG_IMAGE_URL]);
    });

    it('omits the published time and authors without article details', () => {
      const { publishedTime, authors } = metadata.openGraph as {
        publishedTime?: string;
        authors?: string[];
      };

      expect(publishedTime).toBeUndefined();
      expect(authors).toBeUndefined();
    });

    it('omits the alternate types without a feed url', () => {
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
        { ...MOCK_SEO, ogImage: undefined },
        { canonical: HOME_PATH, ogType: OG_TYPE.WEBSITE },
      );
    });

    it('resolves openGraph.images to undefined, never an injected default', async () => {
      const resolved = await resolveOpenGraph(
        metadata.openGraph,
        metadataBase,
        Promise.resolve(HOME_PATH),
        metadataContext,
        null,
      );

      expect(resolved?.images).toBeUndefined();
    });

    it('resolves twitter.images to undefined, never an injected default', () => {
      const resolved = resolveTwitter(
        metadata.twitter,
        metadataBase,
        metadataContext,
        null,
      );

      expect(resolved?.images).toBeUndefined();
    });
  });

  it('resolves an explicit ogImage unchanged', async () => {
    const metadata = await toMetadata(MOCK_SEO, {
      canonical: BLOG_PATH,
      ogType: OG_TYPE.WEBSITE,
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
