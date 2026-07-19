import type { TSeoResolved } from '@blog/service';
// Next's real per-segment metadata resolver — used below to prove the
// relative fallback image path actually resolves to an absolute URL via
// `metadataBase`, the way the App Router does it at request time. Not a
// public `next` export, but there's no other way to verify this without
// standing up a full Next render; the deep import mirrors how `reviewer`
// traced the underlying bug.
import {
  resolveOpenGraph,
  resolveTwitter,
} from 'next/dist/lib/metadata/resolvers/resolve-opengraph';
import { describe, expect, it } from 'vitest';

import { toMetadata } from './to-metadata';

type TOpenGraphWithType = { type?: string };
type TTwitterWithCard = { card?: string };

const seo: TSeoResolved = {
  title: 'The Blog',
  description: 'All the posts.',
  ogTitle: 'The Blog OG',
  ogDescription: 'All the posts OG.',
  ogImageUrl: 'https://cdn.example.com/blog-og.jpg',
};

describe('toMetadata', () => {
  it('maps canonical, description, and ogType', () => {
    const metadata = toMetadata(seo, {
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
    const metadata = toMetadata(seo, { canonical: '/blog', ogType: 'website' });

    expect(metadata.title).toBe('The Blog');
  });

  it('maps title as an absolute title object when titleAbsolute is true', () => {
    const metadata = toMetadata(seo, {
      canonical: '/',
      ogType: 'website',
      titleAbsolute: true,
    });

    expect(metadata.title).toEqual({ absolute: 'The Blog' });
  });

  it('maps ogType article', () => {
    const metadata = toMetadata(seo, {
      canonical: '/blog/my-post',
      ogType: 'article',
    });

    expect((metadata.openGraph as TOpenGraphWithType | null)?.type).toBe(
      'article',
    );
  });

  it('maps openGraph title/description/images from ogTitle/ogDescription/ogImageUrl', () => {
    const metadata = toMetadata(seo, { canonical: '/blog', ogType: 'website' });

    expect(metadata.openGraph?.title).toBe('The Blog OG');
    expect(metadata.openGraph?.description).toBe('All the posts OG.');
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/blog-og.jpg' },
    ]);
  });

  it('falls back to the default image routes when ogImageUrl is absent', () => {
    const metadata = toMetadata(
      { ...seo, ogImageUrl: undefined },
      { canonical: '/', ogType: 'website' },
    );

    expect(metadata.openGraph?.images).toEqual([{ url: '/opengraph-image' }]);
    expect(metadata.twitter?.images).toEqual(['/twitter-image']);
  });

  it('maps twitter card, title, description, and images', () => {
    const metadata = toMetadata(seo, { canonical: '/blog', ogType: 'website' });

    expect((metadata.twitter as TTwitterWithCard | null)?.card).toBe(
      'summary_large_image',
    );
    expect(metadata.twitter?.title).toBe('The Blog OG');
    expect(metadata.twitter?.description).toBe('All the posts OG.');
    expect(metadata.twitter?.images).toEqual([
      'https://cdn.example.com/blog-og.jpg',
    ]);
  });
});

describe('toMetadata output resolved by Next itself (regression for #490)', () => {
  // Mirrors the root layout's `metadataBase` — the leaf route (this
  // function's output) never sets its own, so Next's resolver falls back to
  // this parent-segment value even though the leaf's `openGraph`/`twitter`
  // objects themselves are NOT merged with the parent's.
  const metadataBase = new URL('https://example.com');
  const metadataContext = {
    trailingSlash: false,
    isStaticMetadataRouteFile: false,
  };

  it('resolves the relative opengraph-image fallback to an absolute URL', async () => {
    const metadata = toMetadata(
      { ...seo, ogImageUrl: undefined },
      { canonical: '/', ogType: 'website' },
    );

    const resolved = await resolveOpenGraph(
      metadata.openGraph,
      metadataBase,
      Promise.resolve('/'),
      metadataContext,
      null,
    );

    expect(resolved?.images).toEqual([
      { url: new URL('https://example.com/opengraph-image') },
    ]);
  });

  it('resolves the relative twitter-image fallback to an absolute URL', () => {
    const metadata = toMetadata(
      { ...seo, ogImageUrl: undefined },
      { canonical: '/', ogType: 'website' },
    );

    const resolved = resolveTwitter(
      metadata.twitter,
      metadataBase,
      metadataContext,
      null,
    );

    expect(resolved?.images).toEqual([
      { url: new URL('https://example.com/twitter-image') },
    ]);
  });

  it('still resolves an explicit ogImageUrl unchanged (no fallback applied)', async () => {
    const metadata = toMetadata(seo, { canonical: '/blog', ogType: 'website' });

    const resolved = await resolveOpenGraph(
      metadata.openGraph,
      metadataBase,
      Promise.resolve('/blog'),
      metadataContext,
      null,
    );

    expect(resolved?.images).toEqual([
      { url: new URL('https://cdn.example.com/blog-og.jpg') },
    ]);
  });
});
