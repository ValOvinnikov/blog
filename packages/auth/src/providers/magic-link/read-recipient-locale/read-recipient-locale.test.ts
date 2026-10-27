import {
  MOCK_FRENCH_PATH,
  MOCK_READER_EMAIL,
  MOCK_TOKEN,
} from '@blog/auth/testing/magic-link-fixtures';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

import { readRecipientLocale } from './read-recipient-locale';

faker.seed(6027);

const MOCK_ORIGIN = faker.internet.url({ appendSlash: false });
const LIVE_LOCALES = [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR];

const magicLinkTo = (callbackUrl: string) =>
  `${MOCK_ORIGIN}/api/auth/callback/email?${new URLSearchParams({
    callbackUrl,
    token: MOCK_TOKEN,
    email: MOCK_READER_EMAIL,
  })}`;

describe(readRecipientLocale, () => {
  it.each([
    ['an absolute', `${MOCK_ORIGIN}${MOCK_FRENCH_PATH}`],
    ['an upper-case', `${MOCK_ORIGIN}/FR`],
    ['a relative', MOCK_FRENCH_PATH],
  ])('reads the language from %s return-to path prefix', (_, callbackUrl) => {
    const locale = readRecipientLocale(
      magicLinkTo(callbackUrl),
      LIVE_LOCALES,
      LOCALE_ISO_CODES.EN,
    );

    expect(locale).toBe(LOCALE_ISO_CODES.FR);
  });

  it.each([
    ['an unprefixed path', magicLinkTo(`${MOCK_ORIGIN}/blog/hello`)],
    ['the site root', magicLinkTo(`${MOCK_ORIGIN}/`)],
    ['a language the tenant does not offer', magicLinkTo(`${MOCK_ORIGIN}/de`)],
    ['an unknown prefix', magicLinkTo(`${MOCK_ORIGIN}/xx/blog`)],
    ['a link with no return-to path', `${MOCK_ORIGIN}/api/auth/callback/email`],
    ['a link that is not a url', 'not a url'],
  ])("falls back to the tenant's default language for %s", (_, magicLink) => {
    const locale = readRecipientLocale(
      magicLink,
      LIVE_LOCALES,
      LOCALE_ISO_CODES.EN,
    );

    expect(locale).toBe(LOCALE_ISO_CODES.EN);
  });
});
