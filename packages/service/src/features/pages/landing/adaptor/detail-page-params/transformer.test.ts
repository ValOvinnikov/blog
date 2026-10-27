import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockSlug } from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toLandingPageParams } from './transformer';

faker.seed(6015105);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_SECTION_SLUG = mockSlug();
const MOCK_NESTED_SLUG = `${MOCK_SECTION_SLUG}/${mockSlug()}`;

describe(toLandingPageParams, () => {
  it('keeps the pages whose path resolved and drops the rest', () => {
    expect(
      toLandingPageParams([
        { slug: MOCK_SECTION_SLUG, language: EN },
        { slug: null, language: EN },
        { slug: MOCK_NESTED_SLUG, language: NL },
      ]),
    ).toEqual([
      { slug: MOCK_SECTION_SLUG, language: EN },
      { slug: MOCK_NESTED_SLUG, language: NL },
    ]);
  });
});
