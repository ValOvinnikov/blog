import { faker } from '@faker-js/faker';

import { getDecodedFirstPathSegment } from './get-decoded-first-path-segment';

faker.seed(5143);

const MOCK_SEGMENT = faker.lorem.slug();
const MOCK_REST = faker.lorem.slug();

describe(getDecodedFirstPathSegment, () => {
  it('returns the first non-empty segment of the path', () => {
    expect(getDecodedFirstPathSegment(`/${MOCK_SEGMENT}/${MOCK_REST}`)).toBe(
      MOCK_SEGMENT,
    );
  });

  it('keeps an encoded slash inside the first segment', () => {
    expect(
      getDecodedFirstPathSegment(`/${MOCK_SEGMENT}%2f${MOCK_REST}/x`),
    ).toBe(`${MOCK_SEGMENT}/${MOCK_REST}`);
  });

  it('returns an empty string for the root path', () => {
    expect(getDecodedFirstPathSegment('/')).toBe('');
  });

  it('returns undefined for a segment that cannot be decoded', () => {
    expect(getDecodedFirstPathSegment('/%E0%A4%A')).toBeUndefined();
  });
});
