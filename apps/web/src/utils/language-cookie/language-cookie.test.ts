import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  LANGUAGE_COOKIE_NAME,
  ONE_YEAR_IN_SECONDS,
} from '@web/testing/shared/language-cookie/fixtures';
import { NextRequest, NextResponse } from 'next/server';

import { readRememberedLanguage, rememberLanguage } from './language-cookie';

faker.seed(122);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_NOW = faker.date.recent({ refDate: '2026-06-01T00:00:00Z' });
const LIVE_LOCALES = [EN, NL];
const MOCK_OTHER_COOKIE = `${faker.lorem.word()}=${faker.lorem.word()}`;

const cookiesOf = (cookie: string) =>
  new NextRequest(faker.internet.url(), { headers: { cookie } }).cookies;

describe(readRememberedLanguage, () => {
  it('reads a remembered live language', () => {
    const cookies = cookiesOf(`${LANGUAGE_COOKIE_NAME}=${NL}`);

    expect(readRememberedLanguage(cookies, LIVE_LOCALES)).toBe(NL);
  });

  it('ignores a remembered language the tenant no longer serves', () => {
    const cookies = cookiesOf(`${LANGUAGE_COOKIE_NAME}=${FR}`);

    expect(readRememberedLanguage(cookies, LIVE_LOCALES)).toBeUndefined();
  });

  it('is undefined without the cookie', () => {
    const cookies = cookiesOf(MOCK_OTHER_COOKIE);

    expect(readRememberedLanguage(cookies, LIVE_LOCALES)).toBeUndefined();
  });
});

describe(rememberLanguage, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('remembers the language for a year across the whole site', () => {
    const response = NextResponse.next();

    rememberLanguage(response.cookies, FR);

    expect(response.cookies.get(LANGUAGE_COOKIE_NAME)).toEqual({
      name: LANGUAGE_COOKIE_NAME,
      value: FR,
      path: '/',
      maxAge: ONE_YEAR_IN_SECONDS,
      expires: new Date(MOCK_NOW.getTime() + ONE_YEAR_IN_SECONDS * 1000),
      sameSite: 'lax',
    });
  });
});
