import { describe, expect, it, vi } from 'vitest';

import { makeRawImage } from '#/testing/shared/fixtures';

import type { TRawSeo } from './to-seo-meta';
import { toSeoMeta } from './to-seo-meta';

vi.mock('#/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
}));

function makeRawSeo(overrides: Partial<TRawSeo> = {}): TRawSeo {
  return {
    metaTitle: 'Page Title',
    metaDescription: 'A description',
    openGraph: {
      ogTitle: 'OG Title',
      ogDescription: 'OG description',
      ogImage: makeRawImage('OG image'),
    },
    ...overrides,
  };
}

describe('toSeoMeta', () => {
  it('maps all fields from raw input', () => {
    const result = toSeoMeta(makeRawSeo());

    expect(result.metaTitle).toBe('Page Title');
    expect(result.metaDescription).toBe('A description');
    expect(result.ogTitle).toBe('OG Title');
    expect(result.ogDescription).toBe('OG description');
    expect(result.ogImageUrl).toContain('sanity.io');
  });

  it('converts null optional fields to undefined', () => {
    const result = toSeoMeta(
      makeRawSeo({
        metaDescription: null,
        openGraph: null,
      }),
    );

    expect(result.metaDescription).toBeUndefined();
    expect(result.ogTitle).toBeUndefined();
    expect(result.ogDescription).toBeUndefined();
    expect(result.ogImageUrl).toBeUndefined();
  });
});
