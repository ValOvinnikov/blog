import type { TSeoResolved } from '@blog/service';
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
