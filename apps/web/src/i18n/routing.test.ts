import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { buildTenantRouting } from './routing';

faker.seed(6012);

const MOCK_SITE_URL = `https://${faker.internet.domainName()}`;
const LANGUAGE_COOKIE_NAME = 'NEXT_LOCALE';
const ENGLISH_PAGE_URL = `${MOCK_SITE_URL}/about`;
const DUTCH_PAGE_URL = `${MOCK_SITE_URL}/nl/over`;

const handleRequest = (url: string, headers: Record<string, string> = {}) =>
  createMiddleware(
    buildTenantRouting(LOCALE_ISO_CODES.EN, [
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]),
  )(new NextRequest(url, { headers }));

describe(buildTenantRouting, () => {
  it.each<{ case: string; url: string; headers: Record<string, string> }>([
    {
      case: 'a first visit with a Dutch browser to an English page',
      url: ENGLISH_PAGE_URL,
      headers: { 'accept-language': 'nl-NL,nl;q=0.9' },
    },
    {
      case: 'an English page after the reader picked Dutch',
      url: ENGLISH_PAGE_URL,
      headers: { cookie: `${LANGUAGE_COOKIE_NAME}=${LOCALE_ISO_CODES.NL}` },
    },
    {
      case: 'a link to a Dutch page with no remembered language',
      url: DUTCH_PAGE_URL,
      headers: {},
    },
    {
      case: 'a link to a Dutch page after the reader picked English',
      url: DUTCH_PAGE_URL,
      headers: { cookie: `${LANGUAGE_COOKIE_NAME}=${LOCALE_ISO_CODES.EN}` },
    },
  ])('sets no language cookie on $case', async ({ url, headers }) => {
    const response = await handleRequest(url, headers);

    expect(response.cookies.get(LANGUAGE_COOKIE_NAME)).toBeUndefined();
  });
});
