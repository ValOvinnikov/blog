import { NextRequest, NextResponse } from 'next/server';

const { resolveTenantIdMock, isProductionEnvironmentMock, loggerErrorMock } =
  vi.hoisted(() => ({
    resolveTenantIdMock: vi.fn(),
    isProductionEnvironmentMock: vi.fn(),
    loggerErrorMock: vi.fn(),
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

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: loggerErrorMock,
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

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
    expect(matcher.test('/opengraph-image')).toBe(false);
    expect(matcher.test('/twitter-image')).toBe(false);
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

  it('now matches dotted-extension paths, so the proxy function itself can guard them instead of skipping them entirely', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/robots.txt')).toBe(true);
    expect(matcher.test('/favicon.ico')).toBe(true);
    expect(matcher.test('/sitemap.xml')).toBe(true);
    expect(matcher.test('/rss.xml')).toBe(true);
    expect(matcher.test('/tags/typescript/rss.xml')).toBe(true);
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

describe('proxy security guard', () => {
  beforeEach(() => {
    resolveTenantIdMock.mockReset();
    intlMiddlewareMock.mockClear();
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

  it('refuses a tenant-shaped first segment even when the path also carries a dotted extension, closing the bypass a dot-anywhere matcher exclusion would otherwise leave open', async () => {
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

  it("refuses a percent-encoded tenant-shaped first segment, which Next's own route matcher would decode back to the raw UUID after this proxy waved it through as harmless", async () => {
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

  it('refuses a tenant-shaped first segment with trailing garbage appended, rather than requiring an exact-length match', async () => {
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

  it("refuses a first segment that cannot be percent-decoded at all, the same way Next's own route matcher would refuse to pass it through", async () => {
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
    intlMiddlewareMock.mockClear();
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

  it('strips a client-supplied x-tenant-id header even on the pass-through branch, so it never reaches the downstream request Next forwards', async () => {
    const request = buildRequest(
      'acme.example.com',
      { 'x-tenant-id': 'spoofed-tenant' },
      '/robots.txt',
    );

    const response = await proxy(request);

    // Asserting on `request.headers` here would prove nothing — `.delete()`
    // always mutates that local object regardless of whether the mutation
    // reaches the response. What Next actually forwards downstream is read
    // from the RESPONSE's own `x-middleware-override-headers` instruction
    // (next/dist/server/web/adapter.js), so that is what must be asserted.
    const overriddenHeaderNames = response.headers.get(
      'x-middleware-override-headers',
    );
    expect(overriddenHeaderNames).not.toBeNull();
    expect(overriddenHeaderNames?.split(',')).not.toContain('x-tenant-id');
    expect(response.headers.get('x-middleware-request-x-tenant-id')).toBeNull();

    // Proves the override list is the real, non-empty header set (not an
    // empty `Headers()` that would vacuously satisfy the assertions above)
    // by checking a legitimate header actually survived alongside it.
    expect(overriddenHeaderNames?.split(',')).toContain('host');
    expect(response.headers.get('x-middleware-request-host')).toBe(
      'acme.example.com',
    );
  });
});

describe('proxy tenant resolution', () => {
  beforeEach(() => {
    resolveTenantIdMock.mockReset();
    intlMiddlewareMock.mockClear();
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

  it('404s an archived or unprovisioned tenant domain in production the same as an unmatched host — resolveTenantId refuses both identically', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    resolveTenantIdMock.mockResolvedValue(undefined);

    const response = await proxy(buildRequest('archived-tenant.example.com'));

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

describe('proxy tenant segment rewrite', () => {
  beforeEach(() => {
    resolveTenantIdMock.mockReset();
    intlMiddlewareMock.mockClear();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it('prepends the resolved tenant id to the locale-rewritten pathname next-intl already produced', async () => {
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

  it('uses a stable placeholder tenant segment when no tenant resolves outside production, so the route tree still matches', async () => {
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
    intlMiddlewareMock.mockClear();
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

  it('fails closed in production the same way a lookup failure fails in dev, distinct from the plain 404 for an unmatched host', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    resolveTenantIdMock.mockRejectedValue(new Error('connection refused'));

    const response = await proxy(buildRequest('acme.example.com'));

    expect(response.status).toBe(503);
    expect(response.status).not.toBe(404);
  });

  it('does not set x-tenant-id, and does not fall back to a previously-resolved or default tenant, when the lookup fails', async () => {
    resolveTenantIdMock.mockRejectedValue(new Error('connection refused'));

    await proxy(
      buildRequest('acme.example.com', { 'x-tenant-id': 'spoofed-tenant' }),
    );

    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('does not log when a host simply resolves to no tenant, distinguishing that from an actual lookup failure', async () => {
    resolveTenantIdMock.mockResolvedValue(undefined);

    await proxy(buildRequest('unknown.example.com'));

    expect(loggerErrorMock).not.toHaveBeenCalled();
  });
});
