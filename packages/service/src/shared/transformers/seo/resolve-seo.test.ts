import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import {
  mockRawSanityImage,
  mockRawSeo,
} from '@blog/service/testing/shared/fixtures';

import { resolveSeo, type TRawSeo } from './resolve-seo';

const AUTHORED_TITLE = 'Authored title';
const AUTHORED_DESCRIPTION = 'Authored description';
const AUTHORED_OG_TITLE = 'Authored OG title';
const AUTHORED_OG_DESCRIPTION = 'Authored OG description';

function mockAuthoredSeo(overrides: Partial<TRawSeo> = {}): TRawSeo {
  return mockRawSeo({
    metaTitle: AUTHORED_TITLE,
    metaDescription: AUTHORED_DESCRIPTION,
    openGraph: {
      ogTitle: AUTHORED_OG_TITLE,
      ogDescription: AUTHORED_OG_DESCRIPTION,
      ogImage: mockRawSanityImage(),
    },
    ...overrides,
  });
}

describe(resolveSeo, () => {
  it('uses authored values when present', () => {
    const result = resolveSeo(mockAuthoredSeo());

    expect(result).toEqual({
      title: AUTHORED_TITLE,
      description: AUTHORED_DESCRIPTION,
      ogTitle: AUTHORED_OG_TITLE,
      ogDescription: AUTHORED_OG_DESCRIPTION,
      ogImage: toSanityImage(mockRawSanityImage()),
    });
  });

  it('leaves metaDescription undefined when unauthored, with no fallback', () => {
    const result = resolveSeo(mockAuthoredSeo({ metaDescription: null }));

    expect(result.description).toBeUndefined();
  });

  it.each([
    {
      openGraphState: 'an empty',
      openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
    },
    { openGraphState: 'an absent', openGraph: null },
  ])(
    'leaves every og field unset for $openGraphState openGraph, with no fallback',
    ({ openGraph }) => {
      const { ogTitle, ogDescription, ogImage } = resolveSeo(
        mockAuthoredSeo({ openGraph }),
      );

      expect(ogTitle).toBeUndefined();
      expect(ogDescription).toBeUndefined();
      expect(ogImage).toBeUndefined();
    },
  );
});
