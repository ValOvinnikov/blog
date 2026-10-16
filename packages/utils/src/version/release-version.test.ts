import {
  isReleaseVersionGreater,
  parseReleaseVersion,
} from './release-version';

describe('parseReleaseVersion', () => {
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

describe('isReleaseVersionGreater', () => {
  it('orders minor versions numerically, not as text', () => {
    expect(isReleaseVersionGreater('v0.10.0', 'v0.9.0')).toBe(true);
    expect(isReleaseVersionGreater('v0.9.0', 'v0.10.0')).toBe(false);
  });

  it('compares major before minor and minor before patch', () => {
    expect(isReleaseVersionGreater('v2.0.0', 'v1.99.99')).toBe(true);
    expect(isReleaseVersionGreater('v1.3.0', 'v1.2.9')).toBe(true);
    expect(isReleaseVersionGreater('v1.2.10', 'v1.2.9')).toBe(true);
  });

  it('is false for an equal version', () => {
    expect(isReleaseVersionGreater('v1.2.3', 'v1.2.3')).toBe(false);
  });

  it('is false when either version is malformed', () => {
    expect(isReleaseVersionGreater('v1.2', 'v1.0.0')).toBe(false);
    expect(isReleaseVersionGreater('v2.0.0', 'latest')).toBe(false);
  });
});
