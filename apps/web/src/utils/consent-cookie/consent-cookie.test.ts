import { CONSENT_CATEGORY } from '@blog/config';

import { decodeConsent, encodeConsent } from './consent-cookie';

describe(decodeConsent, () => {
  it.each([
    [
      'a granted category',
      '1.EXTERNAL_MEDIA',
      [CONSENT_CATEGORY.EXTERNAL_MEDIA],
    ],
    ['a declined choice', '1.', []],
  ])('reads %s', (_label, value, expected) => {
    expect(decodeConsent(value)).toEqual(expected);
  });

  it.each([
    ['a missing cookie', undefined],
    ['an empty value', ''],
    ['a malformed value', 'EXTERNAL_MEDIA'],
    ['an older version', '0.EXTERNAL_MEDIA'],
    ['an unknown category', '1.EXTERNAL_MEDIA,TRACKING'],
    ['a value with an extra separator', '1.EXTERNAL_MEDIA.x'],
  ])('treats %s as unanswered', (_label, value) => {
    expect(decodeConsent(value)).toBeUndefined();
  });
});

describe(encodeConsent, () => {
  it('records the granted categories as the cookie value', () => {
    expect(
      encodeConsent([CONSENT_CATEGORY.EXTERNAL_MEDIA]).split('; '),
    ).toContain('consent=1.EXTERNAL_MEDIA');
  });

  it('records a decline as an empty category list', () => {
    expect(encodeConsent([]).split('; ')).toContain('consent=1.');
  });

  it('never records the necessary category', () => {
    expect(encodeConsent([CONSENT_CATEGORY.NECESSARY]).split('; ')).toContain(
      'consent=1.',
    );
  });

  it('writes the same cookie as before, byte for byte', () => {
    expect(encodeConsent([CONSENT_CATEGORY.EXTERNAL_MEDIA])).toBe(
      'consent=1.EXTERNAL_MEDIA; Max-Age=15552000; Path=/; SameSite=Lax; Secure',
    );
  });

  it('reads back what it writes', () => {
    const [assignment] = encodeConsent([CONSENT_CATEGORY.EXTERNAL_MEDIA]).split(
      '; ',
    );

    expect(decodeConsent(assignment?.slice('consent='.length))).toEqual([
      CONSENT_CATEGORY.EXTERNAL_MEDIA,
    ]);
  });
});
