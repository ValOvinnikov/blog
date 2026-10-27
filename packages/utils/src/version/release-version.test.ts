import {
  isReleaseVersionGreater,
  parseReleaseVersion,
} from './release-version';

describe(parseReleaseVersion, () => {
  it('parses a vMAJOR.MINOR.PATCH tag into numbers', () => {
    expect(parseReleaseVersion('v1.20.3')).toEqual({
      major: 1,
      minor: 20,
      patch: 3,
    });
  });

  it.each([
    '1.2.3',
    'v1.2',
    'v1.2.3.4',
    'v1.2.3-rc.1',
    'v01.2.3',
    'V1.2.3',
    ' v1.2.3',
    'v1.2.x',
    '',
  ])('rejects %j', (tag) => {
    expect(parseReleaseVersion(tag)).toBeNull();
  });
});

describe(isReleaseVersionGreater, () => {
  it.each([
    ['a higher minor, compared numerically', 'v0.10.0', 'v0.9.0', true],
    ['a lower minor, compared numerically', 'v0.9.0', 'v0.10.0', false],
    ['a higher major against a higher minor', 'v2.0.0', 'v1.99.99', true],
    ['a higher minor against a higher patch', 'v1.3.0', 'v1.2.9', true],
    ['a higher patch, compared numerically', 'v1.2.10', 'v1.2.9', true],
    ['an equal version', 'v1.2.3', 'v1.2.3', false],
    ['a malformed candidate', 'v1.2', 'v1.0.0', false],
    ['a malformed current version', 'v2.0.0', 'latest', false],
  ])('judges %s', (_label, candidate, current, expected) => {
    expect(isReleaseVersionGreater(candidate, current)).toBe(expected);
  });
});
