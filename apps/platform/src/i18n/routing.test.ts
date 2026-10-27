import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { adminRoutes } from '@platform/utils/routes/routes';
import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './routing';

faker.seed(6006);

const { EN, NL, DE, ES } = LOCALE_ISO_CODES;
const MOCK_ORIGIN = faker.internet.url({ appendSlash: false });
const TENANTS_URL = `${MOCK_ORIGIN}${adminRoutes.tenants()}`;
const LOCALE_COOKIE = 'NEXT_LOCALE';
const ACCEPT_LANGUAGE = 'accept-language';

type THeaders = Record<string, string>;

const respond = (url: string, headers: THeaders) =>
  createMiddleware(routing)(new NextRequest(url, { headers }));

const resolveLocale = async (headers: THeaders) => {
  const response = await respond(TENANTS_URL, headers);
  const rewrite = response.headers.get('x-middleware-rewrite') ?? '';
  return new URL(rewrite).pathname.split('/')[1];
};

describe('admin language detection', () => {
  it.each([
    {
      title: 'serves a supported browser language',
      acceptLanguage: `${NL.toLowerCase()}-${NL},${NL.toLowerCase()};q=0.9,${EN.toLowerCase()};q=0.8`,
      locale: NL,
    },
    {
      title: 'matches a regional variant to its language',
      acceptLanguage: `${DE.toLowerCase()}-AT`,
      locale: DE,
    },
    {
      title: 'falls back to English for an unsupported browser language',
      acceptLanguage: 'pt-BR',
      locale: EN,
    },
  ])('$title', async ({ acceptLanguage, locale }) => {
    const resolved = await resolveLocale({ [ACCEPT_LANGUAGE]: acceptLanguage });

    expect(resolved).toBe(locale);
  });

  it("ignores the public site's language cookie", async () => {
    const resolved = await resolveLocale({
      [ACCEPT_LANGUAGE]: EN.toLowerCase(),
      cookie: `${LOCALE_COOKIE}=${NL}`,
    });

    expect(resolved).toBe(EN);
  });

  it.each<{ title: string; url: string; headers: THeaders }>([
    {
      title: 'a prefixed path',
      url: `${MOCK_ORIGIN}/${NL.toLowerCase()}${adminRoutes.tenants()}`,
      headers: {},
    },
    { title: 'a missing browser language', url: TENANTS_URL, headers: {} },
    {
      title: 'an unsupported cookie value',
      url: TENANTS_URL,
      headers: {
        [ACCEPT_LANGUAGE]: DE.toLowerCase(),
        cookie: `${LOCALE_COOKIE}=pt`,
      },
    },
  ])('sets no language cookie on $title', async ({ url, headers }) => {
    const response = await respond(url, headers);

    const cookie = response.cookies.get(LOCALE_COOKIE);

    expect(cookie).toBeUndefined();
  });

  it('keeps the URL unprefixed', async () => {
    const response = await respond(TENANTS_URL, {
      [ACCEPT_LANGUAGE]: ES.toLowerCase(),
    });

    const location = response.headers.get('location');

    expect(location).toBeNull();
  });
});
