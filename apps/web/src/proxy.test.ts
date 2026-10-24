import { LOCALE_ISO_CODES, routes, type TLocaleIsoCode } from '@blog/config';
import {
  HTTP_METHOD,
  HTTP_STATUS,
  type THttpMethod,
} from '@blog/config/constants';
import { TENANT_ID_HEADER } from '@web/server/tenant/constants/constants';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TAG_SLUG } from '@web/testing/shared/tag/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_HOST,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
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

const loggerErrorMock = vi.mocked(logger.error);

const { config, default: proxy } = await import('./proxy');

const tenantRouting = (
  tenantId: string,
  defaultLocale: TLocaleIsoCode = LOCALE_ISO_CODES.EN,
  liveLocales: TLocaleIsoCode[] = [defaultLocale],
) => ({
  tenant: mockTenant({ id: tenantId }),
  tenantId,
  defaultLocale,
  liveLocales,
});

const ROBOTS_PATH = '/robots.txt';
const SITEMAP_PATH = '/sitemap.xml';
const TAG_RSS_PATH = routes.tagRssFeed(MOCK_TAG_SLUG);
const SITE_RSS_PATH = routes.rssFeed();
const BOTID_PREFIX =
  '/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3';
const BLOG_POST_PATH = '/blog/hello-world';
const REWRITE_HEADER = 'x-middleware-rewrite';
const SPOOFED_TENANT = 'spoofed-tenant';
const UNKNOWN_HOST = 'unknown.example.com';
const BLOG_URL = `${MOCK_TENANT_BASE_URL}/blog`;
const DUTCH_ACCEPT_LANGUAGE = 'nl-NL,nl;q=0.9,en;q=0.8';
const DUTCH_ABOUT_PATH = '/nl/over-ons';

const buildRequest = (
  host: string | null,
  extraHeaders?: Record<string, string>,
  pathname = '/blog',
): NextRequest => {
  const headers = new Headers(extraHeaders);
  if (host) headers.set('host', host);
  return new NextRequest(`${MOCK_TENANT_BASE_URL}${pathname}`, { headers });
};

const buildMatcherRegExp = () => {
  return new RegExp(`^${config.matcher}$`);
};

describe('proxy matcher', () => {
  let matcher: RegExp;

  beforeEach(() => {
    matcher = buildMatcherRegExp();
  });

  it.each([
    { case: 'a root-level Next.js metadata-file route', path: '/icon' },
    { case: 'a sibling sharing an excluded prefix', path: '/icons' },
    { case: 'a dashed sibling of an excluded prefix', path: '/icon-something' },
    { case: 'an api route', path: '/api/whatever' },
    { case: 'a _next asset', path: '/_next/static/chunk.js' },
    { case: 'a _vercel path', path: '/_vercel/insights' },
    {
      case: 'a .well-known devtools path',
      path: '/.well-known/appspecific/com.chrome.devtools.json',
    },
    {
      case: 'a .well-known ACME challenge',
      path: '/.well-known/acme-challenge/token',
    },
    {
      case: 'a BotID challenge script',
      path: `${BOTID_PREFIX}/a-4-a/c.js`,
    },
    { case: 'a BotID proxy path', path: `${BOTID_PREFIX}/fp` },
  ])('bypasses the proxy for $case', ({ path }) => {
    expect(matcher.test(path)).toBe(false);
  });

  it.each([
    { case: 'the home page', path: '/' },
    { case: 'the blog index', path: '/blog' },
    { case: 'a post', path: '/blog/some-post-slug' },
    { case: 'robots.txt', path: ROBOTS_PATH },
    { case: 'the favicon', path: '/favicon.ico' },
    { case: 'the sitemap', path: SITEMAP_PATH },
    { case: 'the site feed', path: SITE_RSS_PATH },
    { case: 'a dotted multi-segment tag feed', path: TAG_RSS_PATH },
  ])('runs the proxy for $case', ({ path }) => {
    expect(matcher.test(path)).toBe(true);
  });
});

describe('proxy security guard', () => {
  beforeEach(() => {
    resolveTenantRoutingMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it.each([
    {
      case: 'is already tenant-shaped',
      path: `/${MOCK_TENANT_ID}/blog`,
    },
    {
      case: 'is tenant-shaped on a dotted-extension path',
      path: `/${MOCK_TENANT_ID}/EN/blog/x.html`,
    },
    {
      case: 'is an uppercase tenant id',
      path: `/${MOCK_TENANT_ID.toUpperCase()}/blog`,
    },
    {
      case: 'is a percent-encoded tenant id',
      path: '/%61%31%62%32%63%33%64%34%2d%65%35%66%36%2d%34%37%38%39%2d%61%30%31%32%2d%33%34%35%36%37%38%39%61%62%63%64%65/EN/blog/x.html',
    },
    {
      case: 'is a tenant id with trailing characters',
      path: `/${MOCK_TENANT_ID}./EN/blog`,
    },
    { case: 'cannot be percent-decoded', path: '/%E0%A4%A' },
  ])('refuses a request whose first path segment $case', async ({ path }) => {
    const response = await proxy(
      buildRequest(MOCK_TENANT_HOST, undefined, path),
    );

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('does not refuse an ordinary content path', async () => {
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting(MOCK_TENANT_ID));

    const response = await proxy(
      buildRequest(MOCK_TENANT_HOST, undefined, BLOG_POST_PATH),
    );

    expect(response.status).not.toBe(HTTP_STATUS.NOT_FOUND);
  });
});

describe('proxy dotted-path pass-through', () => {
  beforeEach(() => {
    resolveTenantRoutingMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it.each([ROBOTS_PATH, SITEMAP_PATH])(
    'passes %s through unrewritten, without resolving a tenant or invoking next-intl',
    async (pathname) => {
      const response = await proxy(
        buildRequest(MOCK_TENANT_HOST, undefined, pathname),
      );

      expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
      expect(intlMiddlewareMock).not.toHaveBeenCalled();
      expect(response.headers.get(REWRITE_HEADER)).toBeNull();
      expect(response.status).not.toBe(HTTP_STATUS.NOT_FOUND);
    },
  );

  it('strips a client-supplied x-tenant-id header on the pass-through branch', async () => {
    const request = buildRequest(
      MOCK_TENANT_HOST,
      { TENANT_ID_HEADER: SPOOFED_TENANT },
      ROBOTS_PATH,
    );

    const response = await proxy(request);

    const overriddenHeaderNames = response.headers.get(
      'x-middleware-override-headers',
    );
    expect(overriddenHeaderNames).not.toBeNull();
    expect(overriddenHeaderNames?.split(',')).not.toContain(TENANT_ID_HEADER);
    expect(response.headers.get('x-middleware-request-x-tenant-id')).toBeNull();

    expect(overriddenHeaderNames?.split(',')).toContain('host');
    expect(response.headers.get('x-middleware-request-host')).toBe(
      MOCK_TENANT_HOST,
    );
  });
});

describe('proxy RSS feeds', () => {
  beforeEach(() => {
    resolveTenantRoutingMock.mockReset();
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting(MOCK_TENANT_ID));
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    intlMiddlewareMock.mockClear();
  });

  it.each([SITE_RSS_PATH, TAG_RSS_PATH])(
    'routes %s into the tenant and language like a page',
    async (pathname) => {
      intlMiddlewareMock.mockImplementationOnce((request) =>
        NextResponse.rewrite(
          new URL(`/EN${request.nextUrl.pathname}`, request.url),
        ),
      );

      const response = await proxy(
        buildRequest(MOCK_TENANT_HOST, undefined, pathname),
      );

      expect(resolveTenantRoutingMock).toHaveBeenCalledWith(MOCK_TENANT_HOST);
      expect(response.headers.get(REWRITE_HEADER)).toBe(
        `${MOCK_TENANT_BASE_URL}/${MOCK_TENANT_ID}/EN${pathname}`,
      );
    },
  );

  it('redirects the feed of a switched-off language to the default-language feed', async () => {
    const response = await proxy(
      buildRequest(MOCK_TENANT_HOST, undefined, '/nl/rss.xml'),
    );

    expect(new URL(response.headers.get('location') ?? '').pathname).toBe(
      '/rss.xml',
    );
  });
});

describe('proxy tenant resolution', () => {
  beforeEach(() => {
    resolveTenantRoutingMock.mockReset();
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting(MOCK_TENANT_ID));
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it('sets x-tenant-id on the request handed to next-intl when a tenant resolves', async () => {
    await proxy(buildRequest(MOCK_TENANT_HOST));

    expect(resolveTenantRoutingMock).toHaveBeenCalledWith(MOCK_TENANT_HOST);
    const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
    expect(forwardedRequest.headers.get(TENANT_ID_HEADER)).toBe(MOCK_TENANT_ID);
  });

  it('calls resolveTenantId with null when the request has no Host header', async () => {
    await proxy(buildRequest(null));

    expect(resolveTenantRoutingMock).toHaveBeenCalledWith(null);
  });

  it('strips a client-supplied x-tenant-id header before forwarding a resolved tenant', async () => {
    await proxy(
      buildRequest(MOCK_TENANT_HOST, { TENANT_ID_HEADER: SPOOFED_TENANT }),
    );

    const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
    expect(forwardedRequest.headers.get(TENANT_ID_HEADER)).toBe(MOCK_TENANT_ID);
  });

  describe('when no tenant resolves', () => {
    beforeEach(() => {
      resolveTenantRoutingMock.mockResolvedValue(undefined);
    });

    it('falls through to next-intl with no header outside production and no tenant', async () => {
      const response = await proxy(buildRequest(UNKNOWN_HOST));

      expect(intlMiddlewareMock).toHaveBeenCalledTimes(1);
      const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
      expect(forwardedRequest.headers.has(TENANT_ID_HEADER)).toBe(false);
      expect(response.status).not.toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('strips a client-supplied x-tenant-id header when resolution fails outside prod', async () => {
      await proxy(
        buildRequest(UNKNOWN_HOST, {
          TENANT_ID_HEADER: SPOOFED_TENANT,
        }),
      );

      const [forwardedRequest] = intlMiddlewareMock.mock.calls[0]!;
      expect(forwardedRequest.headers.has(TENANT_ID_HEADER)).toBe(false);
    });

    describe('in production', () => {
      beforeEach(() => {
        isProductionEnvironmentMock.mockReturnValue(true);
      });

      it('404s without calling next-intl when no tenant resolves in production', async () => {
        const response = await proxy(buildRequest(UNKNOWN_HOST));

        expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        expect(intlMiddlewareMock).not.toHaveBeenCalled();
      });
    });
  });
});

describe('proxy tenant segment rewrite', () => {
  beforeEach(() => {
    resolveTenantRoutingMock.mockReset();
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting(MOCK_TENANT_ID));
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it("prepends the resolved tenant id to next-intl's locale-rewritten pathname", async () => {
    intlMiddlewareMock.mockImplementationOnce((request) =>
      NextResponse.rewrite(
        new URL(`/EN${request.nextUrl.pathname}`, request.url),
      ),
    );

    const response = await proxy(
      buildRequest(MOCK_TENANT_HOST, undefined, BLOG_POST_PATH),
    );

    expect(response.headers.get(REWRITE_HEADER)).toBe(
      `${MOCK_TENANT_BASE_URL}/${MOCK_TENANT_ID}/EN${BLOG_POST_PATH}`,
    );
  });

  it('falls back to the original request URL when next-intl did not need to rewrite', async () => {
    intlMiddlewareMock.mockImplementationOnce(() => NextResponse.next());

    const response = await proxy(
      buildRequest(MOCK_TENANT_HOST, undefined, '/blog'),
    );

    expect(response.headers.get(REWRITE_HEADER)).toBe(
      `${MOCK_TENANT_BASE_URL}/${MOCK_TENANT_ID}/blog`,
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
      buildRequest(UNKNOWN_HOST, undefined, '/blog'),
    );

    expect(response.headers.get(REWRITE_HEADER)).toBe(
      `${MOCK_TENANT_BASE_URL}/unresolved-tenant/EN/blog`,
    );
  });

  it('never rewrites the tenant-shaped segment onto a redirect response', async () => {
    intlMiddlewareMock.mockImplementationOnce(() =>
      NextResponse.redirect(new URL(BLOG_URL)),
    );

    const response = await proxy(
      buildRequest(MOCK_TENANT_HOST, undefined, '/blog'),
    );

    expect(response.headers.get(REWRITE_HEADER)).toBeNull();
    expect(response.headers.get('location')).toBe(BLOG_URL);
  });
});

describe('proxy tenant lookup failure', () => {
  beforeEach(() => {
    resolveTenantRoutingMock.mockReset();
    resolveTenantRoutingMock.mockRejectedValue(MOCK_ERROR);
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    loggerErrorMock.mockReset();
  });

  it('returns a controlled 503 instead of throwing when resolveTenantId rejects', async () => {
    const response = await proxy(buildRequest(MOCK_TENANT_HOST));

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
  });

  it('never calls next-intl, even with a spoofed tenant header, when the lookup fails', async () => {
    await proxy(
      buildRequest(MOCK_TENANT_HOST, { TENANT_ID_HEADER: SPOOFED_TENANT }),
    );

    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('logs the lookup failure exactly once with host and error context', async () => {
    await proxy(buildRequest(MOCK_TENANT_HOST));

    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    expect(loggerErrorMock).toHaveBeenCalledWith('proxy.tenant_lookup_failed', {
      host: MOCK_TENANT_HOST,
      error: MOCK_ERROR,
    });
  });

  it('fails closed in production when the tenant lookup fails', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    const response = await proxy(buildRequest(MOCK_TENANT_HOST));

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
  });

  it('does not log when a host resolves to no tenant, unlike a lookup failure', async () => {
    resolveTenantRoutingMock.mockResolvedValue(undefined);

    await proxy(buildRequest(UNKNOWN_HOST));

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
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting(MOCK_TENANT_ID));

    const response = await proxy(
      buildRequest(MOCK_TENANT_HOST, undefined, '/nl/blog/hello'),
    );

    expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
    expect(new URL(response.headers.get('location') ?? '').pathname).toBe(
      '/blog/hello',
    );
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('passes a live language prefix through to the locale middleware', async () => {
    resolveTenantRoutingMock.mockResolvedValue(
      tenantRouting(MOCK_TENANT_ID, LOCALE_ISO_CODES.EN, [
        LOCALE_ISO_CODES.EN,
        LOCALE_ISO_CODES.NL,
      ]),
    );

    await proxy(buildRequest(MOCK_TENANT_HOST, undefined, '/nl/blog'));

    expect(intlMiddlewareMock).toHaveBeenCalled();
  });

  it("routes with the tenant's own default and live languages", async () => {
    resolveTenantRoutingMock.mockResolvedValue(
      tenantRouting(MOCK_TENANT_ID, LOCALE_ISO_CODES.FR),
    );

    await proxy(buildRequest(MOCK_TENANT_HOST));

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
    homeLanguages: [],
    postIndexLanguages: [],
    topicIndexLanguages: [],
    tagIndexLanguages: [],
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
    method: THttpMethod = HTTP_METHOD.GET,
  ) =>
    proxy(
      new NextRequest(`https://${MOCK_TENANT_HOST}${pathname}`, {
        method,
        headers: {
          host: MOCK_TENANT_HOST,
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
      tenantRouting(MOCK_TENANT_ID, EN, [EN, NL, FR]),
    );
    isProductionEnvironmentMock.mockReturnValue(true);
    getTenantTranslationMapMock.mockReset();
    getTenantTranslationMapMock.mockResolvedValue(translationMap);
    intlMiddlewareMock.mockClear();
  });

  it("redirects to the page's translation in the browser's language", async () => {
    const response = await visit('/about?ref=mail', {
      'accept-language': DUTCH_ACCEPT_LANGUAGE,
    });

    expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
    expect(response.headers.get('location')).toBe(
      `https://${MOCK_TENANT_HOST}${DUTCH_ABOUT_PATH}?ref=mail`,
    );
    expect(intlMiddlewareMock).not.toHaveBeenCalled();
  });

  it('forbids any cache from storing the visitor-specific redirect', async () => {
    const response = await visit('/about', {
      'accept-language': DUTCH_ACCEPT_LANGUAGE,
    });

    expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
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
    expect(redirectPath(remembersDutch)).toBe(DUTCH_ABOUT_PATH);
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
    const response = await visit(
      '/about',
      { 'accept-language': 'nl' },
      HTTP_METHOD.POST,
    );

    expect(redirectPath(response)).toBeNull();
  });

  it('leaves a language-prefixed URL alone', async () => {
    await visit(DUTCH_ABOUT_PATH, { 'accept-language': 'en' });

    expect(getTenantTranslationMapMock).not.toHaveBeenCalled();
    expect(intlMiddlewareMock).toHaveBeenCalled();
  });

  it('never looks a single-language tenant up', async () => {
    resolveTenantRoutingMock.mockResolvedValue(
      tenantRouting(MOCK_TENANT_ID, EN),
    );

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
