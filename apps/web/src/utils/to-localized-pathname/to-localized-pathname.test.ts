import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';

import { toLocalizedPathname } from './to-localized-pathname';

faker.seed(6012);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_HREF = `/${faker.lorem.slug(2)}`;

describe(toLocalizedPathname, () => {
  it('leaves the default language unprefixed', () => {
    expect(
      toLocalizedPathname({ href: MOCK_HREF, locale: EN, defaultLocale: EN }),
    ).toBe(MOCK_HREF);
  });

  it('prefixes a non-default language with its tag', () => {
    expect(
      toLocalizedPathname({ href: MOCK_HREF, locale: NL, defaultLocale: EN }),
    ).toBe(`/${LOCALE_BCP47_TAGS[NL]}${MOCK_HREF}`);
  });

  it("follows the tenant's default language", () => {
    expect(
      toLocalizedPathname({ href: MOCK_HREF, locale: NL, defaultLocale: NL }),
    ).toBe(MOCK_HREF);
    expect(
      toLocalizedPathname({ href: MOCK_HREF, locale: EN, defaultLocale: NL }),
    ).toBe(`/${LOCALE_BCP47_TAGS[EN]}${MOCK_HREF}`);
  });
});
