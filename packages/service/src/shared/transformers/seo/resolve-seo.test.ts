import {
  mockRawSanityImage,
  mockRawSeo,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { resolveSeo, type TRawSeo } from './resolve-seo';

faker.seed(6016);

const MOCK_TITLE = faker.lorem.sentence();
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_OG_TITLE = faker.lorem.sentence();
const MOCK_OG_DESCRIPTION = faker.lorem.sentence();

function mockAuthoredSeo(overrides: Partial<TRawSeo> = {}): TRawSeo {
  return mockRawSeo({
    metaTitle: MOCK_TITLE,
    metaDescription: MOCK_DESCRIPTION,
    openGraph: {
      ogTitle: MOCK_OG_TITLE,
      ogDescription: MOCK_OG_DESCRIPTION,
      ogImage: mockRawSanityImage(),
    },
    ...overrides,
  });
}

describe(resolveSeo, () => {
  it('uses authored values when present', () => {
    const result = resolveSeo(mockAuthoredSeo());

    expect(result).toEqual({
      title: MOCK_TITLE,
      description: MOCK_DESCRIPTION,
      ogTitle: MOCK_OG_TITLE,
      ogDescription: MOCK_OG_DESCRIPTION,
      ogImage: mockSanityImageView(),
    });
  });

  it('leaves an unauthored description undefined with no fallback', () => {
    const { description } = resolveSeo(
      mockAuthoredSeo({ metaDescription: null }),
    );

    expect(description).toBeUndefined();
  });

  it.each([
    {
      openGraphState: 'an empty',
      openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
    },
    { openGraphState: 'an absent', openGraph: null },
  ])(
    'leaves every og field unset for $openGraphState openGraph',
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
