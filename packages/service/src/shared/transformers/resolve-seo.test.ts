import { makeRawImage } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { MissingSeoTitleError, resolveSeo, type TRawSeo } from './resolve-seo';

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
}));

const tenant = makeTenant();

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
    const result = resolveSeo(makeAuthoredSeo(), tenant);

    expect(result.title).toBe('Authored title');
    expect(result.description).toBe('Authored description');
    expect(result.ogTitle).toBe('Authored OG title');
    expect(result.ogDescription).toBe('Authored OG description');
    expect(result.ogImageUrl).toContain('sanity.io');
  });

  it('leaves metaDescription undefined when unauthored, with no fallback', () => {
    const result = resolveSeo(
      makeAuthoredSeo({ metaDescription: null }),
      tenant,
    );

    expect(result.description).toBeUndefined();
  });

  it('leaves ogTitle/ogDescription undefined when unauthored, without inheriting the meta title/description', () => {
    const result = resolveSeo(
      makeAuthoredSeo({
        openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
      }),
      tenant,
    );

    expect(result.ogTitle).toBeUndefined();
    expect(result.ogDescription).toBeUndefined();
  });

  it('treats an absent openGraph object the same as an empty one', () => {
    const result = resolveSeo(makeAuthoredSeo({ openGraph: null }), tenant);

    expect(result.ogTitle).toBeUndefined();
    expect(result.ogDescription).toBeUndefined();
    expect(result.ogImageUrl).toBeUndefined();
  });

  it('leaves ogImageUrl undefined when unauthored, with no site or content fallback', () => {
    const result = resolveSeo(
      makeAuthoredSeo({
        openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
      }),
      tenant,
    );

    expect(result.ogImageUrl).toBeUndefined();
  });

  it('throws MissingSeoTitleError when no seo object is authored at all', () => {
    expect(() => resolveSeo(undefined, tenant)).toThrow(MissingSeoTitleError);
  });

  it('throws MissingSeoTitleError when the seo object carries a blank metaTitle', () => {
    expect(() =>
      resolveSeo(makeAuthoredSeo({ metaTitle: '' }), tenant),
    ).toThrow(MissingSeoTitleError);
  });
});
