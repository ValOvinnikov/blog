export {};

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(),
}));

const { config } = await import('./proxy');

const buildMatcherRegExp = () => {
  return new RegExp(`^${config.matcher}$`);
};

describe('proxy matcher', () => {
  let matcher: RegExp;

  beforeEach(() => {
    matcher = buildMatcherRegExp();
  });

  it('rewrites real content routes through locale middleware', () => {
    expect(matcher.test('/')).toBe(true);
    expect(matcher.test('/tenants')).toBe(true);
    expect(matcher.test('/tenants/tenant-1/look')).toBe(true);
    expect(matcher.test('/workspace-pending')).toBe(true);
    expect(matcher.test('/dashboard')).toBe(true);
    expect(matcher.test('/dashboard/look')).toBe(true);
    expect(matcher.test('/dashboard/select-tenant')).toBe(true);
  });

  it('rewrites Studio routes whose structure ids contain dots', () => {
    expect(
      matcher.test(
        '/tenants/tenant-1/studio/structure/blog;page_post;page_post-provisioning.post.starter',
      ),
    ).toBe(true);
    expect(
      matcher.test(
        '/dashboard/studio/structure/blog;page_post;page_post-provisioning.post.starter',
      ),
    ).toBe(true);
    expect(
      matcher.test('/tenants/tenant-1/studio/structure/settings.site'),
    ).toBe(true);
  });

  it('excludes api, _next, _vercel, and root-level dotted paths', () => {
    expect(matcher.test('/api/auth/signin')).toBe(false);
    expect(matcher.test('/_next/static/chunk.js')).toBe(false);
    expect(matcher.test('/_vercel/insights')).toBe(false);
    expect(matcher.test('/favicon.ico')).toBe(false);
    expect(matcher.test('/robots.txt')).toBe(false);
  });
});
