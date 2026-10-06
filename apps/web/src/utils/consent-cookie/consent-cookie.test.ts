import { CONSENT_CATEGORY } from '@blog/config';

import {
  parseConsentCookieValue,
  readConsentCookieValue,
  serializeConsentCookie,
} from './consent-cookie';

describe(parseConsentCookieValue, () => {
  it.each([
    [
      'a granted category',
      '1.EXTERNAL_MEDIA',
      [CONSENT_CATEGORY.EXTERNAL_MEDIA],
    ],
    ['a declined choice', '1.', []],
  ])('reads %s', (_label, value, expected) => {
    expect(parseConsentCookieValue(value)).toEqual(expected);
  });

  it.each([
    ['a missing cookie', ''],
    ['a malformed value', 'EXTERNAL_MEDIA'],
    ['an older version', '0.EXTERNAL_MEDIA'],
    ['an unknown category', '1.EXTERNAL_MEDIA,TRACKING'],
  ])('treats %s as unanswered', (_label, value) => {
    expect(parseConsentCookieValue(value)).toBeNull();
  });
});

describe(readConsentCookieValue, () => {
  it('finds the consent entry among other cookies', () => {
    expect(
      readConsentCookieValue('theme=dark; consent=1.EXTERNAL_MEDIA; a=b'),
    ).toBe('1.EXTERNAL_MEDIA');
  });

  it('returns an empty string when there is no consent cookie', () => {
    expect(readConsentCookieValue('theme=dark')).toBe('');
  });
});

describe(serializeConsentCookie, () => {
  it('records the granted categories as the cookie value', () => {
    expect(
      serializeConsentCookie([CONSENT_CATEGORY.EXTERNAL_MEDIA]).split('; '),
    ).toContain('consent=1.EXTERNAL_MEDIA');
  });

  it('records a decline as an empty category list', () => {
    expect(serializeConsentCookie([]).split('; ')).toContain('consent=1.');
  });

  it('never records the necessary category', () => {
    expect(
      serializeConsentCookie([CONSENT_CATEGORY.NECESSARY]).split('; '),
    ).toContain('consent=1.');
  });

  it('lasts 180 days, site-wide, over HTTPS and readable by script', () => {
    const attributes = serializeConsentCookie([]).split('; ');

    expect(attributes).toEqual(
      expect.arrayContaining([
        'Max-Age=15552000',
        'Path=/',
        'SameSite=Lax',
        'Secure',
      ]),
    );
    expect(attributes).not.toContain('HttpOnly');
  });
});
