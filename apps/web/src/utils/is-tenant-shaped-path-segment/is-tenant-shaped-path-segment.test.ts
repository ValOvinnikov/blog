import { faker } from '@faker-js/faker';

import {
  isTenantShapedPathSegment,
  isValidTenantId,
} from './is-tenant-shaped-path-segment';

faker.seed(120);

const MOCK_UUID = faker.string.uuid();
const MOCK_UPPERCASE_UUID = MOCK_UUID.toUpperCase();
const MOCK_SHORT_GROUP_UUID = `${MOCK_UUID.slice(0, 14)}${MOCK_UUID.slice(15)}`;
const MOCK_UUID_WITH_SUFFIX = `${MOCK_UUID}-${faker.lorem.word()}`;
const MOCK_SLUG = faker.lorem.slug();
const DOT_SEGMENT = '.well-known';

const LOWERCASE_UUID = { case: 'a lowercase UUID', segment: MOCK_UUID };
const UPPERCASE_UUID = {
  case: 'an uppercase UUID',
  segment: MOCK_UPPERCASE_UUID,
};
const SUFFIXED_UUID = {
  case: 'a UUID with trailing text appended',
  segment: MOCK_UUID_WITH_SUFFIX,
};
const CONTENT_SLUG = { case: 'an ordinary content slug', segment: MOCK_SLUG };
const EMPTY_STRING = { case: 'an empty string', segment: '' };

describe(isTenantShapedPathSegment, () => {
  it.each([LOWERCASE_UUID, UPPERCASE_UUID, SUFFIXED_UUID])(
    'recognizes $case',
    ({ segment }) => {
      expect(isTenantShapedPathSegment(segment)).toBe(true);
    },
  );

  it.each([
    CONTENT_SLUG,
    {
      case: 'a UUID-like value with a short group',
      segment: MOCK_SHORT_GROUP_UUID,
    },
    EMPTY_STRING,
  ])('does not recognize $case', ({ segment }) => {
    expect(isTenantShapedPathSegment(segment)).toBe(false);
  });
});

describe(isValidTenantId, () => {
  it.each([LOWERCASE_UUID, UPPERCASE_UUID])('accepts $case', ({ segment }) => {
    expect(isValidTenantId(segment)).toBe(true);
  });

  it.each([
    CONTENT_SLUG,
    { case: 'a dot segment', segment: DOT_SEGMENT },
    SUFFIXED_UUID,
    EMPTY_STRING,
  ])('rejects $case', ({ segment }) => {
    expect(isValidTenantId(segment)).toBe(false);
  });
});
