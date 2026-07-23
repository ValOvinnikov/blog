import { makeRawImage } from '@blog/service/testing/shared/fixtures';

import { type TRawSeo, resolveSeo } from './resolve-seo';

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
}));

const content = {
  title: 'Content title',
  description: 'Content description',
  imageUrl: 'https://cdn.sanity.io/content.jpg',
};
const settings = {
  description: 'Settings description',
  defaultOgImageUrl: 'https://cdn.sanity.io/settings.jpg',
};

function makeAuthoredSeo(overrides: Partial<TRawSeo> = {}): TRawSeo {
  return {
    metaTitle: 'Authored title',
    metaDescription: 'Authored description',
    openGraph: {
      ogTitle: 'Authored OG title',
      ogDescription: 'Authored OG description',
      ogImage: makeRawImage('OG image'),
    },
    ...overrides,
  };
}

describe(resolveSeo, () => {
  it('uses authored values when present', () => {
    const result = resolveSeo(makeAuthoredSeo(), content, settings);

    expect(result.title).toBe('Authored title');
    expect(result.description).toBe('Authored description');
    expect(result.ogTitle).toBe('Authored OG title');
    expect(result.ogDescription).toBe('Authored OG description');
    expect(result.ogImageUrl).toContain('sanity.io');
  });

  it('falls back to content-derived defaults when unauthored', () => {
    const result = resolveSeo(undefined, content, settings);

    expect(result.title).toBe('Content title');
    expect(result.description).toBe('Content description');
    expect(result.ogImageUrl).toBe(content.imageUrl);
  });

  it('bottoms out at site settings when neither authored nor content-derived', () => {
    const result = resolveSeo(undefined, { title: 'Content title' }, settings);

    expect(result.description).toBe(settings.description);
    expect(result.ogImageUrl).toBe(settings.defaultOgImageUrl);
  });

  it('yields an undefined ogImageUrl when no image resolves at any rung', () => {
    const result = resolveSeo(
      makeAuthoredSeo({ openGraph: null }),
      { title: 'Content title' },
      { description: 'Settings description', defaultOgImageUrl: undefined },
    );

    expect(result.ogImageUrl).toBeUndefined();
  });

  it('defaults ogTitle/ogDescription to the resolved title/description, not the raw authored openGraph', () => {
    const result = resolveSeo(
      makeAuthoredSeo({
        openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
      }),
      content,
      settings,
    );

    expect(result.ogTitle).toBe(result.title);
    expect(result.ogDescription).toBe(result.description);
  });

  it('treats an absent openGraph object the same as an empty one', () => {
    const result = resolveSeo(
      makeAuthoredSeo({ openGraph: null }),
      content,
      settings,
    );

    expect(result.ogTitle).toBe(result.title);
    expect(result.ogDescription).toBe(result.description);
    expect(result.ogImageUrl).toBe(content.imageUrl);
  });

  it('resolves title ladder: authored wins over content title', () => {
    const result = resolveSeo(
      makeAuthoredSeo({ metaTitle: 'Authored title' }),
      { title: 'Content title' },
      settings,
    );

    expect(result.title).toBe('Authored title');
  });

  it('resolves the ogImageUrl ladder: authored wins over content and settings', () => {
    const result = resolveSeo(makeAuthoredSeo(), content, settings);

    expect(result.ogImageUrl).not.toBe(content.imageUrl);
    expect(result.ogImageUrl).not.toBe(settings.defaultOgImageUrl);
  });

  it('resolves the ogImageUrl ladder: content wins over settings when unauthored', () => {
    const result = resolveSeo(
      makeAuthoredSeo({ openGraph: null }),
      content,
      settings,
    );

    expect(result.ogImageUrl).toBe(content.imageUrl);
  });
});
