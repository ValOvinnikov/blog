import { toTenantScopedPath } from './to-tenant-scoped-path';

describe(toTenantScopedPath, () => {
  it('prefixes a non-home path with the tenant and locale segments', () => {
    expect(toTenantScopedPath('tenant-1', 'EN', '/blog/my-post')).toBe(
      '/tenant-1/EN/blog/my-post',
    );
  });

  it('drops the trailing slash for the home path', () => {
    expect(toTenantScopedPath('tenant-1', 'EN', '/')).toBe('/tenant-1/EN');
  });
});
