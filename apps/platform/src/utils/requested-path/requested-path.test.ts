import { toRequestedPath } from './requested-path';

describe(toRequestedPath, () => {
  it('keeps the path and query of the requested page', () => {
    expect(
      toRequestedPath(
        new URL('https://admin.example.com/dashboard/leads?page=2'),
      ),
    ).toBe('/dashboard/leads?page=2');
  });

  it('returns the bare path when there is no query', () => {
    expect(toRequestedPath(new URL('https://admin.example.com/tenants'))).toBe(
      '/tenants',
    );
  });

  it('drops the client-navigation cache-buster', () => {
    expect(
      toRequestedPath(
        new URL('https://admin.example.com/tenants?archived=1&_rsc=abc123'),
      ),
    ).toBe('/tenants?archived=1');
  });
});
