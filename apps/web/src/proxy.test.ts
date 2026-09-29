import { logger } from '@web/utils/logger/logger';
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

vi.mock('@web/utils/logger/logger');

const loggerErrorMock = vi.mocked(logger.error);

const { config, default: proxy } = await import('./proxy');

const FOREIGN_TENANT_ID = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

const buildRequest = (
  host: string | null,
  extraHeaders?: Record<string, string>,
  pathname = '/blog',
): NextRequest => {
  const headers = new Headers(extraHeaders);
  if (host) headers.set('host', host);
  return new NextRequest(`https://example.com${pathname}`, { headers });
};

const buildMatcherRegExp = () => {
  return new RegExp(`^${config.matcher}$`);
};

describe('proxy matcher', () => {
  it('excludes root-level Next.js metadata-file routes from locale rewriting', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/icon')).toBe(false);
  });

  it('still rewrites real content routes through locale middleware', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/')).toBe(true);
    expect(matcher.test('/blog')).toBe(true);
    expect(matcher.test('/blog/some-post-slug')).toBe(true);
  });

  it('still excludes the pre-existing api/_next/_vercel paths', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/api/whatever')).toBe(false);
    expect(matcher.test('/_next/static/chunk.js')).toBe(false);
    expect(matcher.test('/_vercel/insights')).toBe(false);
  });

  it('matches dotted-extension paths, so the proxy itself can guard them', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/robots.txt')).toBe(true);
    expect(matcher.test('/favicon.ico')).toBe(true);
    expect(matcher.test('/sitemap.xml')).toBe(true);
    expect(matcher.test('/rss.xml')).toBe(true);
    expect(matcher.test('/tags/typescript/rss.xml')).toBe(true);
  });

  it('bypasses locale middleware for sibling paths sharing an excluded prefix', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/icons')).toBe(false);
    expect(matcher.test('/icon-something')).toBe(false);
  });

  it('excludes .well-known paths, which should never reach app routing', () => {
    const matcher = buildMatcherRegExp();

    expect(
      matcher.test('/.well-known/appspecific/com.chrome.devtools.json'),
    ).toBe(false);
    expect(matcher.test('/.well-known/acme-challenge/token')).toBe(false);
  });

  it('still matches other dotted multi-segment paths, so per-tag RSS keeps working', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/tags/typescript/rss.xml')).toBe(true);
  });
});

describe('proxy security guard', () => {
  beforeEach(() => {
    resolveTenantIdMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it('refuses a request whose first path segment is already tenant-shaped', async () => {
    const response = await proxy(
      buildRequest('acme.example.com', undefined, `/${FOREIGN_TENANT_ID}/blog`),
    );

    expect(response.status).toBe(404);
    expect(resolveTenantIdMock).not.toHaveBeenCalled();
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('refuses a tenant-shaped first segment even when the path has a dotted extension', async () => {
    const response = await proxy(
      buildRequest(
        'acme.example.com',
        undefined,
        `/${FOREIGN_TENANT_ID}/EN/blog/x.html`,
      ),
    );

    expect(response.status).toBe(404);
    expect(resolveTenantIdMock).not.toHaveBeenCalled();
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('refuses an uppercase tenant-shaped first segment too', async () => {
    const response = await proxy(
      buildRequest(
        'acme.example.com',
        undefined,
        `/${FOREIGN_TENANT_ID.toUpperCase()}/blog`,
      ),
    );

    expect(response.status).toBe(404);
  });

  it('refuses a percent-encoded tenant-shaped first segment', async () => {
    const percentEncodedForeignTenantId =
      '%61%31%62%32%63%33%64%34%2d%65%35%66%36%2d%34%37%38%39%2d%61%30%31%32%2d%33%34%35%36%37%38%39%61%62%63%64%65';

    const response = await proxy(
      buildRequest(
        'acme.example.com',
        undefined,
        `/${percentEncodedForeignTenantId}/EN/blog/x.html`,
      ),
    );

    expect(response.status).toBe(404);
    expect(resolveTenantIdMock).not.toHaveBeenCalled();
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('refuses a tenant-shaped first segment with trailing characters appended', async () => {
    const response = await proxy(
      buildRequest(
        'acme.example.com',
        undefined,
        `/${FOREIGN_TENANT_ID}./EN/blog`,
      ),
    );

    expect(response.status).toBe(404);
    expect(resolveTenantIdMock).not.toHaveBeenCalled();
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('refuses a first segment that cannot be percent-decoded', async () => {
    const response = await proxy(
      buildRequest('acme.example.com', undefined, '/%E0%A4%A'),
    );

    expect(response.status).toBe(404);
    expect(resolveTenantIdMock).not.toHaveBeenCalled();
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('does not refuse an ordinary content path', async () => {
    resolveTenantIdMock.mockResolvedValue('tenant-1');

    const response = await proxy(
      buildRequest('acme.example.com', undefined, '/blog/hello-world'),
    );

    expect(response.status).not.toBe(404);
  });
});

describe('proxy dotted-path pass-through', () => {
  beforeEach(() => {
    resolveTenantIdMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it.each([
    '/robots.txt',
    '/sitemap.xml',
    '/rss.xml',
    '/tags/typescript/rss.xml',
  ])(
    'passes %s through unrewritten, without resolving a tenant or invoking next-intl',
    async (pathname) => {
      const response = await proxy(
        buildRequest('acme.example.com', undefined, pathname),
      );

      expect(resolveTenantIdMock).not.toHaveBeenCalled();
      expect(intlMiddlewareMock).not.toHaveBeenCalled();
      expect(response.headers.get('x-middleware-rewrite')).toBeNull();
      expect(response.status).not.toBe(404);
    },
  );

  it('strips a client-supplied x-tenant-id header on the pass-through branch', async () => {
    const request = buildRequest(
      'acme.example.com',
      { 'x-tenant-id': 'spoofed-tenant' },
      '/robots.txt',
    );

    const response = await proxy(request);

    const overriddenHeaderNames = response.headers.get(
      'x-middleware-override-headers',
    );
    expect(overriddenHeaderNames).not.toBeNull();
    expect(overriddenHeaderNames?.split(',')).not.toContain('x-tenant-id');
    expect(response.headers.get('x-middleware-request-x-tenant-id')).toBeNull();

    expect(overriddenHeaderNames?.split(',')).toContain('host');
    expect(response.headers.get('x-middleware-request-host')).toBe(
      'acme.example.com',
    );
  });
});

describe('proxy tenant resolution', () => {
  beforeEach(() => {
    resolveTenantIdMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
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

  it('falls through to next-intl with no header outside production and no tenant', async () => {
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

  it('404s an archived or unprovisioned tenant domain in production', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    resolveTenantIdMock.mockResolvedValue(undefined);

    const response = await proxy(buildRequest('archived-tenant.example.com'));

    expect(response.status).toBe(404);
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('strips a client-supplied x-tenant-id header before forwarding a resolved tenant', async () => {
    resolveTenantIdMock.mockResolvedValue('tenant-1');

    await proxy(
      buildRequest('acme.example.com', { 'x-tenant-id': 'spoofed-tenant' }),
    );

    const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
    expect(forwardedRequest.headers.get('x-tenant-id')).toBe('tenant-1');
  });

  it('strips a client-supplied x-tenant-id header when resolution fails outside prod', async () => {
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

describe('proxy tenant segment rewrite', () => {
  beforeEach(() => {
    resolveTenantIdMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it("prepends the resolved tenant id to next-intl's locale-rewritten pathname", async () => {
    resolveTenantIdMock.mockResolvedValue('tenant-1');
    intlMiddlewareMock.mockImplementationOnce((request) =>
      NextResponse.rewrite(
        new URL(`/EN${request.nextUrl.pathname}`, request.url),
      ),
    );

    const response = await proxy(
      buildRequest('acme.example.com', undefined, '/blog/hello-world'),
    );

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://example.com/tenant-1/EN/blog/hello-world',
    );
  });

  it('falls back to the original request URL when next-intl did not need to rewrite', async () => {
    resolveTenantIdMock.mockResolvedValue('tenant-1');
    intlMiddlewareMock.mockImplementationOnce(() => NextResponse.next());

    const response = await proxy(
      buildRequest('acme.example.com', undefined, '/blog'),
    );

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://example.com/tenant-1/blog',
    );
  });

  it('uses a placeholder tenant segment outside production when no tenant resolves', async () => {
    resolveTenantIdMock.mockResolvedValue(undefined);
    intlMiddlewareMock.mockImplementationOnce((request) =>
      NextResponse.rewrite(
        new URL(`/EN${request.nextUrl.pathname}`, request.url),
      ),
    );

    const response = await proxy(
      buildRequest('unknown.example.com', undefined, '/blog'),
    );

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://example.com/unresolved-tenant/EN/blog',
    );
  });

  it('never rewrites the tenant-shaped segment onto a redirect response', async () => {
    resolveTenantIdMock.mockResolvedValue('tenant-1');
    intlMiddlewareMock.mockImplementationOnce(() =>
      NextResponse.redirect(new URL('https://example.com/blog')),
    );

    const response = await proxy(
      buildRequest('acme.example.com', undefined, '/blog'),
    );

    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    expect(response.headers.get('location')).toBe('https://example.com/blog');
  });
});

describe('proxy tenant lookup failure', () => {
  beforeEach(() => {
    resolveTenantIdMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it('returns a controlled 503 instead of throwing when resolveTenantId rejects', async () => {
    resolveTenantIdMock.mockRejectedValue(new Error('connection refused'));

    const response = await proxy(buildRequest('acme.example.com'));

    expect(response.status).toBe(503);
  });

  it('never calls next-intl when the tenant lookup fails', async () => {
    resolveTenantIdMock.mockRejectedValue(new Error('connection refused'));

    await proxy(buildRequest('acme.example.com'));

    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('logs the lookup failure exactly once with host and error context', async () => {
    const error = new Error('connection refused');
    resolveTenantIdMock.mockRejectedValue(error);

    await proxy(buildRequest('acme.example.com'));

    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    expect(loggerErrorMock).toHaveBeenCalledWith('proxy.tenant_lookup_failed', {
      host: 'acme.example.com',
      error,
    });
  });

  it('fails closed in production when the tenant lookup fails', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    resolveTenantIdMock.mockRejectedValue(new Error('connection refused'));

    const response = await proxy(buildRequest('acme.example.com'));

    expect(response.status).toBe(503);
    expect(response.status).not.toBe(404);
  });

  it('sets no x-tenant-id and uses no fallback tenant when the lookup fails', async () => {
    resolveTenantIdMock.mockRejectedValue(new Error('connection refused'));

    await proxy(
      buildRequest('acme.example.com', { 'x-tenant-id': 'spoofed-tenant' }),
    );

    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('does not log when a host resolves to no tenant, unlike a lookup failure', async () => {
    resolveTenantIdMock.mockResolvedValue(undefined);

    await proxy(buildRequest('unknown.example.com'));

    expect(loggerErrorMock).not.toHaveBeenCalled();
  });
});
