export {};

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(),
}));

const { config } = await import('./proxy');

function buildMatcherRegExp() {
  return new RegExp(`^${config.matcher}$`);
}

describe('proxy matcher', () => {
  it('rewrites real content routes through locale middleware', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/')).toBe(true);
    expect(matcher.test('/tenants')).toBe(true);
    expect(matcher.test('/t/acme/look')).toBe(true);
    expect(matcher.test('/unauthorized')).toBe(true);
    expect(matcher.test('/dashboard')).toBe(true);
    expect(matcher.test('/dashboard/look')).toBe(true);
    expect(matcher.test('/dashboard/select-tenant')).toBe(true);
  });

  it('excludes api, _next, _vercel, and dotted-extension paths', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/api/auth/signin')).toBe(false);
    expect(matcher.test('/_next/static/chunk.js')).toBe(false);
    expect(matcher.test('/_vercel/insights')).toBe(false);
    expect(matcher.test('/favicon.ico')).toBe(false);
  });
});
