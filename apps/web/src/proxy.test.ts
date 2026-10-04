import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { logger } from '@web/utils/logger/logger';
import { NextRequest, NextResponse } from 'next/server';

const {
  resolveTenantRoutingMock,
  isProductionEnvironmentMock,
  getTenantTranslationMapMock,
} = vi.hoisted(() => ({
  resolveTenantRoutingMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
  getTenantTranslationMapMock: vi.fn(),
}));

const intlMiddlewareMock = vi.fn<(request: NextRequest) => NextResponse>(() =>
  NextResponse.next(),
);

const createMiddlewareMock = vi.fn<
  (routing: unknown) => typeof intlMiddlewareMock
>(() => intlMiddlewareMock);

vi.mock('next-intl/middleware', () => ({
  default: (routing: unknown) => createMiddlewareMock(routing),
}));

vi.mock('./server/tenant/resolve-tenant/resolve-tenant', () => ({
  resolveTenantRouting: resolveTenantRoutingMock,
}));

vi.mock(
  '@web/server/translation-map/get-tenant-translation-map/get-tenant-translation-map',
  () => ({ getTenantTranslationMap: getTenantTranslationMapMock }),
);

vi.mock('./utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

vi.mock('@web/utils/logger/logger');

const loggerErrorMock = vi.mocked(logger.error);

const { config, default: proxy } = await import('./proxy');

const tenantRouting = (
  tenantId: string,
  defaultLocale: TLocaleIsoCode = LOCALE_ISO_CODES.EN,
  liveLocales: TLocaleIsoCode[] = [defaultLocale],
) => ({
  tenant: { id: tenantId } as TTenant,
  tenantId,
  defaultLocale,
  liveLocales,
});

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
    resolveTenantRoutingMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it('refuses a request whose first path segment is already tenant-shaped', async () => {
    const response = await proxy(
      buildRequest('acme.example.com', undefined, `/${FOREIGN_TENANT_ID}/blog`),
    );

    expect(response.status).toBe(404);
    expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
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
    expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
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
    expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
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
    expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('refuses a first segment that cannot be percent-decoded', async () => {
    const response = await proxy(
      buildRequest('acme.example.com', undefined, '/%E0%A4%A'),
    );

    expect(response.status).toBe(404);
    expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('does not refuse an ordinary content path', async () => {
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting('tenant-1'));

    const response = await proxy(
      buildRequest('acme.example.com', undefined, '/blog/hello-world'),
    );

    expect(response.status).not.toBe(404);
  });
});

describe('proxy dotted-path pass-through', () => {
  beforeEach(() => {
    resolveTenantRoutingMock.mockReset();
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

      expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
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
    resolveTenantRoutingMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it('sets x-tenant-id on the request handed to next-intl when a tenant resolves', async () => {
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting('tenant-1'));

    await proxy(buildRequest('acme.example.com'));

    expect(resolveTenantRoutingMock).toHaveBeenCalledWith('acme.example.com');
    const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
    expect(forwardedRequest.headers.get('x-tenant-id')).toBe('tenant-1');
  });

  it('calls resolveTenantId with null when the request has no Host header', async () => {
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting('tenant-1'));

    await proxy(buildRequest(null));

    expect(resolveTenantRoutingMock).toHaveBeenCalledWith(null);
  });

  it('falls through to next-intl with no header outside production and no tenant', async () => {
    resolveTenantRoutingMock.mockResolvedValue(undefined);

    const response = await proxy(buildRequest('unknown.example.com'));

    expect(intlMiddlewareMock).toHaveBeenCalledTimes(1);
    const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
    expect(forwardedRequest.headers.has('x-tenant-id')).toBe(false);
    expect(response.status).not.toBe(404);
  });

  it('404s without calling next-intl when no tenant resolves in production', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    resolveTenantRoutingMock.mockResolvedValue(undefined);

    const response = await proxy(buildRequest('unknown.example.com'));

    expect(response.status).toBe(404);
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('404s an archived or unprovisioned tenant domain in production', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    resolveTenantRoutingMock.mockResolvedValue(undefined);

    const response = await proxy(buildRequest('archived-tenant.example.com'));

    expect(response.status).toBe(404);
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('strips a client-supplied x-tenant-id header before forwarding a resolved tenant', async () => {
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting('tenant-1'));

    await proxy(
      buildRequest('acme.example.com', { 'x-tenant-id': 'spoofed-tenant' }),
    );

    const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
    expect(forwardedRequest.headers.get('x-tenant-id')).toBe('tenant-1');
  });

  it('strips a client-supplied x-tenant-id header when resolution fails outside prod', async () => {
    resolveTenantRoutingMock.mockResolvedValue(undefined);

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
    resolveTenantRoutingMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it("prepends the resolved tenant id to next-intl's locale-rewritten pathname", async () => {
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting('tenant-1'));
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
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting('tenant-1'));
    intlMiddlewareMock.mockImplementationOnce(() => NextResponse.next());

    const response = await proxy(
      buildRequest('acme.example.com', undefined, '/blog'),
    );

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://example.com/tenant-1/blog',
    );
  });

  it('uses a placeholder tenant segment outside production when no tenant resolves', async () => {
    resolveTenantRoutingMock.mockResolvedValue(undefined);
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
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting('tenant-1'));
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
    resolveTenantRoutingMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it('returns a controlled 503 instead of throwing when resolveTenantId rejects', async () => {
    resolveTenantRoutingMock.mockRejectedValue(new Error('connection refused'));

    const response = await proxy(buildRequest('acme.example.com'));

    expect(response.status).toBe(503);
  });

  it('never calls next-intl when the tenant lookup fails', async () => {
    resolveTenantRoutingMock.mockRejectedValue(new Error('connection refused'));

    await proxy(buildRequest('acme.example.com'));

    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('logs the lookup failure exactly once with host and error context', async () => {
    const error = new Error('connection refused');
    resolveTenantRoutingMock.mockRejectedValue(error);

    await proxy(buildRequest('acme.example.com'));

    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    expect(loggerErrorMock).toHaveBeenCalledWith('proxy.tenant_lookup_failed', {
      host: 'acme.example.com',
      error,
    });
  });

  it('fails closed in production when the tenant lookup fails', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    resolveTenantRoutingMock.mockRejectedValue(new Error('connection refused'));

    const response = await proxy(buildRequest('acme.example.com'));

    expect(response.status).toBe(503);
    expect(response.status).not.toBe(404);
  });

  it('sets no x-tenant-id and uses no fallback tenant when the lookup fails', async () => {
    resolveTenantRoutingMock.mockRejectedValue(new Error('connection refused'));

    await proxy(
      buildRequest('acme.example.com', { 'x-tenant-id': 'spoofed-tenant' }),
    );

    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('does not log when a host resolves to no tenant, unlike a lookup failure', async () => {
    resolveTenantRoutingMock.mockResolvedValue(undefined);

    await proxy(buildRequest('unknown.example.com'));

    expect(loggerErrorMock).not.toHaveBeenCalled();
  });
});

describe('proxy language routing', () => {
  beforeEach(() => {
    resolveTenantRoutingMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(true);
    intlMiddlewareMock.mockClear();
  });

  it('redirects a switched-off language prefix to the same path in the default language', async () => {
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting('tenant-1'));

    const response = await proxy(
      buildRequest('acme.example.com', undefined, '/nl/blog/hello'),
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get('location') ?? '').pathname).toBe(
      '/blog/hello',
    );
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('passes a live language prefix through to the locale middleware', async () => {
    resolveTenantRoutingMock.mockResolvedValue(
      tenantRouting('tenant-1', LOCALE_ISO_CODES.EN, [
        LOCALE_ISO_CODES.EN,
        LOCALE_ISO_CODES.NL,
      ]),
    );

    await proxy(buildRequest('acme.example.com', undefined, '/nl/blog'));

    expect(intlMiddlewareMock).toHaveBeenCalled();
  });

  it("routes with the tenant's own default and live languages", async () => {
    resolveTenantRoutingMock.mockResolvedValue(
      tenantRouting('tenant-1', LOCALE_ISO_CODES.FR),
    );

    await proxy(buildRequest('acme.example.com'));

    expect(createMiddlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultLocale: LOCALE_ISO_CODES.FR,
        locales: [LOCALE_ISO_CODES.FR],
      }),
    );
  });
});

describe('proxy language detection', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;
  const BROWSER =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

  const translationMap = {
    groups: [
      [
        { documentType: 'page_landing', language: EN, slug: 'about' },
        { documentType: 'page_landing', language: NL, slug: 'over-ons' },
      ],
    ],
  };

  const visit = (
    pathname: string,
    headers: Record<string, string> = {},
    method = 'GET',
  ) =>
    proxy(
      new NextRequest(`https://acme.example.com${pathname}`, {
        method,
        headers: {
          host: 'acme.example.com',
          'user-agent': BROWSER,
          ...headers,
        },
      }),
    );

  const redirectPath = (response: NextResponse) =>
    response.headers.get('location') &&
    new URL(response.headers.get('location')!).pathname;

  beforeEach(() => {
    resolveTenantRoutingMock.mockReset();
    resolveTenantRoutingMock.mockResolvedValue(
      tenantRouting('tenant-1', EN, [EN, NL, FR]),
    );
    isProductionEnvironmentMock.mockReturnValue(true);
    getTenantTranslationMapMock.mockReset();
    getTenantTranslationMapMock.mockResolvedValue(translationMap);
    intlMiddlewareMock.mockClear();
  });

  it("redirects to the page's translation in the browser's language", async () => {
    const response = await visit('/about?ref=mail', {
      'accept-language': 'nl-NL,nl;q=0.9,en;q=0.8',
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://acme.example.com/nl/over-ons?ref=mail',
    );
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('stays on the page when it has no translation in that language', async () => {
    const response = await visit('/about', { 'accept-language': 'fr' });

    expect(redirectPath(response)).toBeNull();
    expect(intlMiddlewareMock).toHaveBeenCalled();
  });

  it('stays on a page outside the translation map', async () => {
    const response = await visit('/blog', { 'accept-language': 'nl' });

    expect(redirectPath(response)).toBeNull();
  });

  it('lets the remembered language override the browser language', async () => {
    const remembersDefault = await visit('/about', {
      'accept-language': 'nl',
      cookie: 'NEXT_LOCALE=EN',
    });
    const remembersDutch = await visit('/about', {
      'accept-language': 'fr',
      cookie: 'NEXT_LOCALE=NL',
    });

    expect(redirectPath(remembersDefault)).toBeNull();
    expect(redirectPath(remembersDutch)).toBe('/nl/over-ons');
  });

  it('never redirects a crawler', async () => {
    const response = await visit('/about', {
      'accept-language': 'nl',
      'user-agent':
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    });

    expect(redirectPath(response)).toBeNull();
    expect(getTenantTranslationMapMock).not.toHaveBeenCalled();
  });

  it('never redirects a form submission', async () => {
    const response = await visit('/about', { 'accept-language': 'nl' }, 'POST');

    expect(redirectPath(response)).toBeNull();
  });

  it('leaves a language-prefixed URL alone', async () => {
    await visit('/nl/over-ons', { 'accept-language': 'en' });

    expect(getTenantTranslationMapMock).not.toHaveBeenCalled();
    expect(intlMiddlewareMock).toHaveBeenCalled();
  });

  it('never looks a single-language tenant up', async () => {
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting('tenant-1', EN));

    const response = await visit('/about', { 'accept-language': 'nl' });

    expect(redirectPath(response)).toBeNull();
    expect(getTenantTranslationMapMock).not.toHaveBeenCalled();
  });

  it('stays on the page when the map cannot be loaded', async () => {
    getTenantTranslationMapMock.mockResolvedValue(undefined);

    const response = await visit('/about', { 'accept-language': 'nl' });

    expect(redirectPath(response)).toBeNull();
    expect(intlMiddlewareMock).toHaveBeenCalled();
  });
});
