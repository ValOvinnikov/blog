import { privateRedirect } from './private-redirect';

describe('privateRedirect', () => {
  it('redirects to the target and forbids any cache from storing it', () => {
    const response = privateRedirect(new URL('https://example.com/nl'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/nl');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
});
