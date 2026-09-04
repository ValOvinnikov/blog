import { isTenantShapedPathSegment } from './is-tenant-shaped-path-segment';

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
});
