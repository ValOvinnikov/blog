import { makeRawSanityImage } from '@blog/service/testing/shared/fixtures';

import { resolveSeo, type TRawSeo } from './resolve-seo';

function makeAuthoredSeo(overrides: Partial<TRawSeo> = {}): TRawSeo {
  return {
    metaTitle: 'Authored title',
    metaDescription: 'Authored description',
    openGraph: {
      ogTitle: 'Authored OG title',
      ogDescription: 'Authored OG description',
      ogImage: makeRawSanityImage('OG image'),
    },
    ...overrides,
  };
}

describe(resolveSeo, () => {
  it('uses authored values when present', () => {
    const result = resolveSeo(makeAuthoredSeo());

    expect(result.title).toBe('Authored title');
    expect(result.description).toBe('Authored description');
    expect(result.ogTitle).toBe('Authored OG title');
    expect(result.ogDescription).toBe('Authored OG description');
    expect(result.ogImage).toEqual(
      expect.objectContaining({ assetId: 'image-abc123-800x600-jpg' }),
    );
  });

  it('leaves metaDescription undefined when unauthored, with no fallback', () => {
    const result = resolveSeo(makeAuthoredSeo({ metaDescription: null }));

    expect(result.description).toBeUndefined();
  });

  it('leaves ogTitle/ogDescription undefined when unauthored, without inheriting the meta title/description', () => {
    const result = resolveSeo(
      makeAuthoredSeo({
        openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
      }),
    );

    expect(result.ogTitle).toBeUndefined();
    expect(result.ogDescription).toBeUndefined();
  });

  it('treats an absent openGraph object the same as an empty one', () => {
    const result = resolveSeo(makeAuthoredSeo({ openGraph: null }));

    expect(result.ogTitle).toBeUndefined();
    expect(result.ogDescription).toBeUndefined();
    expect(result.ogImage).toBeUndefined();
  });

  it('leaves ogImage undefined when unauthored, with no site or content fallback', () => {
    const result = resolveSeo(
      makeAuthoredSeo({
        openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
      }),
    );

    expect(result.ogImage).toBeUndefined();
  });
});
