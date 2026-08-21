import { NextRequest, NextResponse } from 'next/server';

const { resolveTenantIdMock, isProductionEnvironmentMock } = vi.hoisted(() => ({
  resolveTenantIdMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
}));

const intlMiddlewareMock = vi.fn<(request: NextRequest) => NextResponse>(() =>
  NextResponse.next(),
);

vi.mock('next-intl/middleware', () => ({
  default: () => intlMiddlewareMock,
}));

vi.mock('./server/tenant/resolve-tenant-id', () => ({
  resolveTenantId: resolveTenantIdMock,
}));

vi.mock('./utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

const { config, default: proxy } = await import('./proxy');

const buildRequest = (
  host: string | null,
  extraHeaders?: Record<string, string>,
): NextRequest => {
  const headers = new Headers(extraHeaders);
  if (host) headers.set('host', host);
  return new NextRequest('https://example.com/blog', { headers });
};

const buildMatcherRegExp = () => {
  return new RegExp(`^${config.matcher}$`);
};

describe('proxy matcher', () => {
  it('excludes root-level Next.js metadata-file routes from locale rewriting', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/icon')).toBe(false);
    expect(matcher.test('/opengraph-image')).toBe(false);
    expect(matcher.test('/twitter-image')).toBe(false);
  });

  it('still rewrites real content routes through locale middleware', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/')).toBe(true);
    expect(matcher.test('/blog')).toBe(true);
    expect(matcher.test('/blog/some-post-slug')).toBe(true);
  });

  it('still excludes the pre-existing api/_next/_vercel and dotted-extension paths', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/api/whatever')).toBe(false);
    expect(matcher.test('/_next/static/chunk.js')).toBe(false);
    expect(matcher.test('/_vercel/insights')).toBe(false);
    expect(matcher.test('/robots.txt')).toBe(false);
    expect(matcher.test('/favicon.ico')).toBe(false);
  });

  it('documents the prefix-match caveat: sibling paths sharing an excluded prefix also bypass locale middleware', () => {
    const matcher = buildMatcherRegExp();

    // The exclusion is prefix-based, not exact-segment, so `/icons` and
    // `/icon-something` also fail to match here (and thus bypass locale
    // rewriting) even though they are not metadata-file routes — a
    // pre-existing limitation shared with the `api`/`_next`/`_vercel`
    // exclusions, just extended to the three new names.
    expect(matcher.test('/icons')).toBe(false);
    expect(matcher.test('/icon-something')).toBe(false);
  });
});

describe('proxy tenant resolution', () => {
  beforeEach(() => {
    resolveTenantIdMock.mockReset();
    intlMiddlewareMock.mockClear();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
  });

  it('sets x-tenant-id on the request handed to next-intl when a tenant resolves', async () => {
    resolveTenantIdMock.mockResolvedValue('tenant-1');

    await proxy(buildRequest('acme.example.com'));

    expect(resolveTenantIdMock).toHaveBeenCalledWith('acme.example.com');
    const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
    expect(forwardedRequest.headers.get('x-tenant-id')).toBe('tenant-1');
  });

  it('calls resolveTenantId with null when the request has no Host header', async () => {
    resolveTenantIdMock.mockResolvedValue('tenant-1');

    await proxy(buildRequest(null));

    expect(resolveTenantIdMock).toHaveBeenCalledWith(null);
  });

  it('falls through to next-intl without setting a header outside production when no tenant resolves', async () => {
    resolveTenantIdMock.mockResolvedValue(undefined);

    const response = await proxy(buildRequest('unknown.example.com'));

    expect(intlMiddlewareMock).toHaveBeenCalledTimes(1);
    const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
    expect(forwardedRequest.headers.has('x-tenant-id')).toBe(false);
    expect(response.status).not.toBe(404);
  });

  it('404s without calling next-intl when no tenant resolves in production', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    resolveTenantIdMock.mockResolvedValue(undefined);

    const response = await proxy(buildRequest('unknown.example.com'));

    expect(response.status).toBe(404);
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('strips a client-supplied x-tenant-id header before forwarding when resolution succeeds', async () => {
    resolveTenantIdMock.mockResolvedValue('tenant-1');

    await proxy(
      buildRequest('acme.example.com', { 'x-tenant-id': 'spoofed-tenant' }),
    );

    const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
    expect(forwardedRequest.headers.get('x-tenant-id')).toBe('tenant-1');
  });

  it('strips a client-supplied x-tenant-id header when resolution fails outside production', async () => {
    resolveTenantIdMock.mockResolvedValue(undefined);

    await proxy(
      buildRequest('unknown.example.com', {
        'x-tenant-id': 'spoofed-tenant',
      }),
    );

    const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
    expect(forwardedRequest.headers.has('x-tenant-id')).toBe(false);
  });
});
