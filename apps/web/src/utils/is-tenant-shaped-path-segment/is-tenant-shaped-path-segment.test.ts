import {
  isTenantShapedPathSegment,
  isValidTenantId,
} from './is-tenant-shaped-path-segment';

describe('isTenantShapedPathSegment', () => {
  it('recognizes a lowercase UUID', () => {
    expect(
      isTenantShapedPathSegment('a1b2c3d4-e5f6-4789-a012-3456789abcde'),
    ).toBe(true);
  });

  it('recognizes an uppercase UUID', () => {
    expect(
      isTenantShapedPathSegment('A1B2C3D4-E5F6-4789-A012-3456789ABCDE'),
    ).toBe(true);
  });

  it('rejects an ordinary content slug', () => {
    expect(isTenantShapedPathSegment('blog')).toBe(false);
    expect(isTenantShapedPathSegment('my-first-post')).toBe(false);
  });

  it('rejects a UUID-shaped value with the wrong segment lengths', () => {
    expect(
      isTenantShapedPathSegment('a1b2c3d4-e5f6-789-a012-3456789abcde'),
    ).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isTenantShapedPathSegment('')).toBe(false);
  });

  it('recognizes a UUID with trailing garbage appended as tenant-shaped', () => {
    expect(
      isTenantShapedPathSegment('a1b2c3d4-e5f6-4789-a012-3456789abcde-extra'),
    ).toBe(true);
  });
});

describe('isValidTenantId', () => {
  it('accepts a lowercase UUID', () => {
    expect(isValidTenantId('a1b2c3d4-e5f6-4789-a012-3456789abcde')).toBe(
      true,
    );
  });

  it('accepts an uppercase UUID', () => {
    expect(isValidTenantId('A1B2C3D4-E5F6-4789-A012-3456789ABCDE')).toBe(
      true,
    );
  });

  it('rejects an ordinary content slug', () => {
    expect(isValidTenantId('.well-known')).toBe(false);
    expect(isValidTenantId('blog')).toBe(false);
  });

  it('rejects a valid UUID with trailing garbage appended', () => {
    expect(
      isValidTenantId('a1b2c3d4-e5f6-4789-a012-3456789abcde-extra'),
    ).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidTenantId('')).toBe(false);
  });
});
