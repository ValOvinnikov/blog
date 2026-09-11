import type { ISanityImage } from '@blog/config';
import {
  type TSanityProjectRef,
  type TSeoResolved,
  urlForSanityImage,
} from '@blog/service';
// Next's real per-segment metadata resolver — used below to prove an absent
// `ogImage` resolves to no image at all, the way the App Router does it
// at request time, rather than an injected default. Not a public `next`
// export, but there's no other way to verify this without standing up a
// full Next render.
import {
  resolveOpenGraph,
  resolveTwitter,
} from 'next/dist/lib/metadata/resolvers/resolve-opengraph';

import { toMetadata } from './to-metadata';

type TOpenGraphWithType = { type?: string };
type TTwitterWithCard = { card?: string };

const project: TSanityProjectRef = {
  projectId: 'test-project',
  dataset: 'test-dataset',
};

const ogImage: ISanityImage = {
  assetId: 'image-6205dacc42424f7a83d8e20a7000d895f7cdc7de-800x600-jpg',
  alt: 'The blog OG image',
  hotspot: undefined,
  crop: undefined,
  lqip: undefined,
  dimensions: { width: 800, height: 600, aspectRatio: 800 / 600 },
};

const EXPECTED_OG_IMAGE_URL = urlForSanityImage(ogImage, project);

const seo: TSeoResolved = {
  title: 'The Blog',
  description: 'All the posts.',
  ogTitle: 'The Blog OG',
  ogDescription: 'All the posts OG.',
  ogImage,
};

describe('toMetadata', () => {
  it('maps canonical, description, and ogType', () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/blog',
      ogType: 'website',
    });

    expect(metadata.alternates?.canonical).toBe('/blog');
    expect(metadata.description).toBe('All the posts.');
    expect((metadata.openGraph as TOpenGraphWithType | null)?.type).toBe(
      'website',
    );
  });

  it('maps title as a plain string when titleAbsolute is not set', () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/blog',
      ogType: 'website',
    });

    expect(metadata.title).toBe('The Blog');
  });

  it('maps title as an absolute title object when titleAbsolute is true', () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/',
      ogType: 'website',
      titleAbsolute: true,
    });

    expect(metadata.title).toEqual({ absolute: 'The Blog' });
  });

  it('maps ogType article', () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/blog/my-post',
      ogType: 'article',
    });

    expect((metadata.openGraph as TOpenGraphWithType | null)?.type).toBe(
      'article',
    );
  });

  it('maps openGraph title/description/images from ogTitle/ogDescription/ogImage', () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/blog',
      ogType: 'website',
    });

    expect(metadata.openGraph?.title).toBe('The Blog OG');
    expect(metadata.openGraph?.description).toBe('All the posts OG.');
    expect(metadata.openGraph?.images).toEqual([
      { url: EXPECTED_OG_IMAGE_URL },
    ]);
  });

  it('omits openGraph and twitter images when ogImage is absent', () => {
    const metadata = toMetadata({ ...seo, ogImage: undefined }, project, {
      canonical: '/',
      ogType: 'website',
    });

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter?.images).toBeUndefined();
    expect((metadata.twitter as TTwitterWithCard | null)?.card).toBe('summary');
  });

  it('omits description, openGraph.title/description, and twitter.title/description when the source fields are absent', () => {
    const metadata = toMetadata(
      {
        title: 'Example Title',
        description: undefined,
        ogTitle: undefined,
        ogDescription: undefined,
        ogImage: undefined,
      },
      project,
      { canonical: '/', ogType: 'website' },
    );

    expect(metadata.title).toBe('Example Title');
    expect(metadata.description).toBeUndefined();
    expect(metadata.openGraph?.title).toBeUndefined();
    expect(metadata.openGraph?.description).toBeUndefined();
    expect(metadata.twitter?.title).toBeUndefined();
    expect(metadata.twitter?.description).toBeUndefined();
  });

  it('maps twitter card, title, description, and images', () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/blog',
      ogType: 'website',
    });

    expect((metadata.twitter as TTwitterWithCard | null)?.card).toBe(
      'summary_large_image',
    );
    expect(metadata.twitter?.title).toBe('The Blog OG');
    expect(metadata.twitter?.description).toBe('All the posts OG.');
    expect(metadata.twitter?.images).toEqual([EXPECTED_OG_IMAGE_URL]);
  });

  it('adds openGraph.publishedTime and authors for article type when provided', () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/blog/my-post',
      ogType: 'article',
      article: {
        publishedTime: '2026-01-15T00:00:00Z',
        authors: ['Jane Doe'],
      },
    });

    expect(
      (metadata.openGraph as { publishedTime?: string })?.publishedTime,
    ).toBe('2026-01-15T00:00:00Z');
    expect((metadata.openGraph as { authors?: string[] })?.authors).toEqual([
      'Jane Doe',
    ]);
  });

  it('omits openGraph.publishedTime and authors when article option is not passed', () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/blog',
      ogType: 'website',
    });

    expect(
      (metadata.openGraph as { publishedTime?: string })?.publishedTime,
    ).toBeUndefined();
    expect(
      (metadata.openGraph as { authors?: string[] })?.authors,
    ).toBeUndefined();
  });

  it('adds alternates.types["application/rss+xml"] when feedUrl is provided', () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/blog',
      ogType: 'website',
      feedUrl: '/rss.xml',
    });

    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/rss.xml',
    });
    expect(metadata.alternates?.canonical).toBe('/blog');
  });

  it('omits alternates.types when feedUrl is not provided', () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/blog',
      ogType: 'website',
    });

    expect(metadata.alternates?.types).toBeUndefined();
  });
});

describe('toMetadata output resolved by Next itself', () => {
  // Mirrors `[locale]/layout.tsx`'s `metadataBase` — the leaf route (this
  // function's output) never sets its own, so Next's resolver falls back to
  // this parent-segment value even though the leaf's `openGraph`/`twitter`
  // objects themselves are NOT merged with the parent's.
  const metadataBase = new URL('https://example.com');
  const metadataContext = {
    trailingSlash: false,
    isStaticMetadataRouteFile: false,
  };

  it('resolves openGraph.images to undefined, never an injected default, when ogImage is absent', async () => {
    const metadata = toMetadata({ ...seo, ogImage: undefined }, project, {
      canonical: '/',
      ogType: 'website',
    });

    const resolved = await resolveOpenGraph(
      metadata.openGraph,
      metadataBase,
      Promise.resolve('/'),
      metadataContext,
      null,
    );

    expect(resolved?.images).toBeUndefined();
  });

  it('resolves twitter.images to undefined, never an injected default, when ogImage is absent', () => {
    const metadata = toMetadata({ ...seo, ogImage: undefined }, project, {
      canonical: '/',
      ogType: 'website',
    });

    const resolved = resolveTwitter(
      metadata.twitter,
      metadataBase,
      metadataContext,
      null,
    );

    expect(resolved?.images).toBeUndefined();
  });

  it('still resolves an explicit ogImage unchanged (no fallback applied)', async () => {
    const metadata = toMetadata(seo, project, {
      canonical: '/blog',
      ogType: 'website',
    });

    const resolved = await resolveOpenGraph(
      metadata.openGraph,
      metadataBase,
      Promise.resolve('/blog'),
      metadataContext,
      null,
    );

    expect(resolved?.images).toEqual([{ url: new URL(EXPECTED_OG_IMAGE_URL) }]);
  });
});
