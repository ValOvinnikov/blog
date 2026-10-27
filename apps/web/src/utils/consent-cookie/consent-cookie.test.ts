import { CONSENT_CATEGORY } from '@blog/config';
import { faker } from '@faker-js/faker';

import {
  CONSENT_COOKIE_NAME,
  decodeConsent,
  encodeConsent,
} from './consent-cookie';

faker.seed(108);

const { EXTERNAL_MEDIA, NECESSARY } = CONSENT_CATEGORY;
const COOKIE_VERSION = '1';
const OLDER_COOKIE_VERSION = '0';
const SIX_MONTHS_IN_SECONDS = 60 * 60 * 24 * 180;
const MOCK_UNKNOWN_CATEGORY = faker.string.alpha({
  length: 8,
  casing: 'upper',
});
const MOCK_EXTRA_SEGMENT = faker.lorem.word();

const cookieValue = (list: string) => `${COOKIE_VERSION}.${list}`;

describe(decodeConsent, () => {
  it.each([
    {
      case: 'a granted category',
      value: cookieValue(EXTERNAL_MEDIA),
      expected: [EXTERNAL_MEDIA],
    },
    { case: 'a declined choice', value: cookieValue(''), expected: [] },
  ])('reads $case', ({ value, expected }) => {
    expect(decodeConsent(value)).toEqual(expected);
  });

  it.each([
    { case: 'a missing cookie', value: undefined },
    { case: 'an empty value', value: '' },
    { case: 'a malformed value', value: EXTERNAL_MEDIA },
    {
      case: 'an older version',
      value: `${OLDER_COOKIE_VERSION}.${EXTERNAL_MEDIA}`,
    },
    {
      case: 'an unknown category',
      value: cookieValue(`${EXTERNAL_MEDIA},${MOCK_UNKNOWN_CATEGORY}`),
    },
    {
      case: 'a value with an extra separator',
      value: `${cookieValue(EXTERNAL_MEDIA)}.${MOCK_EXTRA_SEGMENT}`,
    },
  ])('treats $case as unanswered', ({ value }) => {
    expect(decodeConsent(value)).toBeUndefined();
  });
});

describe(encodeConsent, () => {
  it('records the granted categories as the cookie value', () => {
    const [assignment] = encodeConsent([EXTERNAL_MEDIA]).split('; ');

    expect(assignment).toBe(
      `${CONSENT_COOKIE_NAME}=${cookieValue(EXTERNAL_MEDIA)}`,
    );
  });

  it('records a decline as an empty category list', () => {
    const [assignment] = encodeConsent([]).split('; ');

    expect(assignment).toBe(`${CONSENT_COOKIE_NAME}=${cookieValue('')}`);
  });

  it('never records the necessary category', () => {
    const [assignment] = encodeConsent([NECESSARY]).split('; ');

    expect(assignment).toBe(`${CONSENT_COOKIE_NAME}=${cookieValue('')}`);
  });

  it('keeps the cookie for six months, site-wide, Lax and Secure', () => {
    const [, ...attributes] = encodeConsent([EXTERNAL_MEDIA]).split('; ');

    expect(attributes).toEqual([
      `Max-Age=${SIX_MONTHS_IN_SECONDS}`,
      'Path=/',
      'SameSite=Lax',
      'Secure',
    ]);
  });

  it('reads back what it writes', () => {
    const [assignment] = encodeConsent([EXTERNAL_MEDIA]).split('; ');

    expect(
      decodeConsent(assignment?.slice(`${CONSENT_COOKIE_NAME}=`.length)),
    ).toEqual([EXTERNAL_MEDIA]);
  });
});
