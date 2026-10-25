import { REQUESTED_PATH_HEADER } from '@platform/utils/requested-path/requested-path';
import { NextRequest } from 'next/server';

const { handleI18nRoutingMock } = vi.hoisted(() => ({
  handleI18nRoutingMock: vi.fn(),
}));

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => handleI18nRoutingMock),
}));

const { config, default: proxy } = await import('./proxy');

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

  it("leaves BotID's challenge path to BotID", () => {
    expect(
      matcher.test('/149e9513-01fa-4fb0-aad4-566afd725d1b/a-4-a/c.js'),
    ).toBe(false);
  });

  it('excludes api, _next, _vercel, and root-level dotted paths', () => {
    expect(matcher.test('/api/auth/signin')).toBe(false);
    expect(matcher.test('/_next/static/chunk.js')).toBe(false);
    expect(matcher.test('/_vercel/insights')).toBe(false);
    expect(matcher.test('/favicon.ico')).toBe(false);
    expect(matcher.test('/robots.txt')).toBe(false);
  });
});

describe(proxy, () => {
  it('records the requested page for the sign-in gate, then routes the locale', () => {
    const request = new NextRequest(
      'https://admin.example.com/dashboard/leads?page=2',
    );

    proxy(request);

    expect(request.headers.get(REQUESTED_PATH_HEADER)).toBe(
      '/dashboard/leads?page=2',
    );
    expect(handleI18nRoutingMock).toHaveBeenCalledWith(request);
  });

  it('overwrites a requested path the client sent itself', () => {
    const request = new NextRequest('https://admin.example.com/tenants', {
      headers: { [REQUESTED_PATH_HEADER]: 'https://evil.example.com' },
    });

    proxy(request);

    expect(request.headers.get(REQUESTED_PATH_HEADER)).toBe('/tenants');
  });
});
