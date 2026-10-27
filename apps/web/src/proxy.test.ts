import {
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  routes,
  type TLocaleIsoCode,
} from '@blog/config';
import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import type { TTranslationMap } from '@blog/service';
import { faker } from '@faker-js/faker';
import {
  TENANT_ID_HEADER,
  UNRESOLVED_TENANT_PLACEHOLDER,
} from '@web/server/tenant/constants/constants';
import type { TTenantRouting } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { LANGUAGE_COOKIE_NAME } from '@web/testing/shared/language-cookie/fixtures';
import { PRODUCTION_DATASET } from '@web/testing/shared/sanity-dataset/fixtures';
import { MOCK_TAG_SLUG } from '@web/testing/shared/tag/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_HOST,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { NextRequest, NextResponse } from 'next/server';

faker.seed(6012);

const { resolveTenantRoutingMock, getTenantTranslationMapMock, intlMock, env } =
  vi.hoisted(() => ({
    resolveTenantRoutingMock: vi.fn(),
    getTenantTranslationMapMock: vi.fn(),
    intlMock: vi.fn(),
    env: { NEXT_PUBLIC_SANITY_DATASET: 'development' },
  }));

vi.mock('next-intl/middleware', () => ({
  default: (routing: unknown) => (request: NextRequest) =>
    intlMock(request, routing),
}));

vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant', () => ({
  resolveTenantRouting: resolveTenantRoutingMock,
}));

vi.mock(
  '@web/server/translation-map/get-tenant-translation-map/get-tenant-translation-map',
  () => ({ getTenantTranslationMap: getTenantTranslationMapMock }),
);

vi.mock('@web/utils/env/env', () => ({ env }));

const { config, default: proxy } = await import('./proxy');

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_SPOOFED_TENANT_ID = faker.string.uuid();
const MOCK_UNKNOWN_HOST = faker.internet.domainName();
const MOCK_BROWSER_USER_AGENT = faker.internet.userAgent();
const MOCK_CRAWLER_USER_AGENT = 'Googlebot/2.1';
const MOCK_QUERY = `?ref=${faker.word.noun()}`;
const BOTID_PREFIX =
  '/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3';
const ROBOTS_PATH = '/robots.txt';
const SITEMAP_PATH = '/sitemap.xml';
const SITE_RSS_PATH = routes.rssFeed();
const TAG_RSS_PATH = routes.tagRssFeed(MOCK_TAG_SLUG);
const BLOG_PATH = '/blog';
const BLOG_POST_PATH = `${BLOG_PATH}/hello-world`;
const ABOUT_PATH = '/about';
const DUTCH_ABOUT_PATH = '/nl/over-ons';
const REWRITE_HEADER = 'x-middleware-rewrite';
const FORWARDED_TENANT_HEADER = `x-middleware-request-${TENANT_ID_HEADER}`;
const ACCEPT_DUTCH = 'nl-NL,nl;q=0.9,en;q=0.8';
const DEVELOPMENT_DATASET = 'development';

const MOCK_TRANSLATION_MAP: TTranslationMap = {
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

const tenantRouting = (
  defaultLocale: TLocaleIsoCode = EN,
  liveLocales: TLocaleIsoCode[] = [defaultLocale],
): TTenantRouting => ({
  tenant: mockTenant({ id: MOCK_TENANT_ID }),
  tenantId: MOCK_TENANT_ID,
  defaultLocale,
  liveLocales,
});

const rewriteToDefaultLocale = (
  request: NextRequest,
  routing: { defaultLocale: TLocaleIsoCode },
) =>
  NextResponse.rewrite(
    new URL(
      `/${routing.defaultLocale}${request.nextUrl.pathname}`,
      request.url,
    ),
    { request: { headers: request.headers } },
  );

const rewrittenTo = (pathname: string, locale: TLocaleIsoCode = EN) =>
  `${MOCK_TENANT_BASE_URL}/${MOCK_TENANT_ID}/${locale}${pathname}`;

const visit = (
  pathname: string,
  {
    host = MOCK_TENANT_HOST,
    headers = {},
    method = HTTP_METHOD.GET,
  }: {
    host?: string | null;
    headers?: Record<string, string>;
    method?: string;
  } = {},
) => {
  const requestHeaders = new Headers({
    'user-agent': MOCK_BROWSER_USER_AGENT,
    ...headers,
  });
  if (host) requestHeaders.set('host', host);
  return proxy(
    new NextRequest(`${MOCK_TENANT_BASE_URL}${pathname}`, {
      method,
      headers: requestHeaders,
    }),
  );
};

const redirectPath = (response: NextResponse) => {
  const location = response.headers.get('location');
  return location ? new URL(location).pathname : null;
};

const useProductionDataset = (isProduction: boolean) => {
  env.NEXT_PUBLIC_SANITY_DATASET = isProduction
    ? PRODUCTION_DATASET
    : DEVELOPMENT_DATASET;
};

describe('proxy matcher', () => {
  let matcher: RegExp;

  beforeEach(() => {
    matcher = new RegExp(`^${config.matcher}$`);
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
    { case: 'the blog index', path: BLOG_PATH },
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

describe(proxy, () => {
  beforeEach(() => {
    resolveTenantRoutingMock.mockReset();
    resolveTenantRoutingMock.mockResolvedValue(tenantRouting());
    getTenantTranslationMapMock.mockReset();
    getTenantTranslationMapMock.mockResolvedValue(MOCK_TRANSLATION_MAP);
    intlMock.mockReset();
    intlMock.mockImplementation(rewriteToDefaultLocale);
    useProductionDataset(false);
  });

  describe('request guard', () => {
    it.each([
      {
        case: 'is already tenant-shaped',
        path: `/${MOCK_TENANT_ID}${BLOG_PATH}`,
      },
      {
        case: 'is tenant-shaped on a dotted-extension path',
        path: `/${MOCK_TENANT_ID}/EN/blog/x.html`,
      },
      {
        case: 'is a percent-encoded tenant id',
        path: `/${[...MOCK_TENANT_ID]
          .map((char) => `%${char.charCodeAt(0).toString(16)}`)
          .join('')}${BLOG_PATH}`,
      },
      { case: 'cannot be percent-decoded', path: '/%E0%A4%A' },
    ])('refuses a request whose first path segment $case', async ({ path }) => {
      const response = await visit(path);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
    });
  });

  describe('dotted paths', () => {
    it.each([ROBOTS_PATH, SITEMAP_PATH])(
      'passes %s through without resolving a tenant',
      async (pathname) => {
        const response = await visit(pathname);

        expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
        expect(response.headers.get(REWRITE_HEADER)).toBeNull();
      },
    );

    it('drops a client-supplied tenant header on a passed-through path', async () => {
      const response = await visit(ROBOTS_PATH, {
        headers: { [TENANT_ID_HEADER]: MOCK_SPOOFED_TENANT_ID },
      });

      const overriddenHeaderNames =
        response.headers.get('x-middleware-override-headers')?.split(',') ?? [];

      expect(overriddenHeaderNames).not.toContain(TENANT_ID_HEADER);
      expect(response.headers.get(FORWARDED_TENANT_HEADER)).toBeNull();
    });

    it('keeps the host header on a passed-through path', async () => {
      const response = await visit(ROBOTS_PATH);

      expect(response.headers.get('x-middleware-request-host')).toBe(
        MOCK_TENANT_HOST,
      );
    });
  });

  describe('tenant resolution', () => {
    it.each([BLOG_POST_PATH, SITE_RSS_PATH, TAG_RSS_PATH])(
      'routes %s into the resolved tenant and language',
      async (pathname) => {
        const response = await visit(pathname);

        expect(resolveTenantRoutingMock).toHaveBeenCalledWith(MOCK_TENANT_HOST);
        expect(response.headers.get(REWRITE_HEADER)).toBe(
          rewrittenTo(pathname),
        );
      },
    );

    it('resolves the tenant from a missing Host header as null', async () => {
      await visit(BLOG_PATH, { host: null });

      expect(resolveTenantRoutingMock).toHaveBeenCalledWith(null);
    });

    it('hands the resolved tenant id to the locale pipeline', async () => {
      const response = await visit(BLOG_PATH);

      expect(response.headers.get(FORWARDED_TENANT_HEADER)).toBe(
        MOCK_TENANT_ID,
      );
    });

    it('replaces a client-supplied tenant header with the resolved one', async () => {
      const response = await visit(BLOG_PATH, {
        headers: { [TENANT_ID_HEADER]: MOCK_SPOOFED_TENANT_ID },
      });

      expect(response.headers.get(FORWARDED_TENANT_HEADER)).toBe(
        MOCK_TENANT_ID,
      );
    });

    it('keeps the original URL when the locale pipeline does not rewrite', async () => {
      intlMock.mockImplementationOnce(() => NextResponse.next());

      const response = await visit(BLOG_PATH);

      expect(response.headers.get(REWRITE_HEADER)).toBe(
        `${MOCK_TENANT_BASE_URL}/${MOCK_TENANT_ID}${BLOG_PATH}`,
      );
    });

    it('passes a redirect from the locale pipeline through untouched', async () => {
      const target = `${MOCK_TENANT_BASE_URL}${BLOG_PATH}`;
      intlMock.mockImplementationOnce(() =>
        NextResponse.redirect(new URL(target)),
      );

      const response = await visit(BLOG_PATH);

      expect(response.headers.get(REWRITE_HEADER)).toBeNull();
      expect(response.headers.get('location')).toBe(target);
    });

    describe('when no tenant resolves', () => {
      beforeEach(() => {
        resolveTenantRoutingMock.mockResolvedValue(undefined);
      });

      it('serves a placeholder tenant segment outside production', async () => {
        const response = await visit(BLOG_PATH, { host: MOCK_UNKNOWN_HOST });

        expect(response.headers.get(REWRITE_HEADER)).toBe(
          `${MOCK_TENANT_BASE_URL}/${UNRESOLVED_TENANT_PLACEHOLDER}/${EN}${BLOG_PATH}`,
        );
      });

      it('drops a client-supplied tenant header outside production', async () => {
        const response = await visit(BLOG_PATH, {
          host: MOCK_UNKNOWN_HOST,
          headers: { [TENANT_ID_HEADER]: MOCK_SPOOFED_TENANT_ID },
        });

        expect(response.headers.get(FORWARDED_TENANT_HEADER)).toBeNull();
      });

      it('answers not found in production', async () => {
        useProductionDataset(true);

        const response = await visit(BLOG_PATH, { host: MOCK_UNKNOWN_HOST });

        expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        expect(response.headers.get(REWRITE_HEADER)).toBeNull();
      });

      it('does not log the unmatched host', async () => {
        await visit(BLOG_PATH, { host: MOCK_UNKNOWN_HOST });

        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('when the tenant lookup fails', () => {
      beforeEach(() => {
        resolveTenantRoutingMock.mockRejectedValue(MOCK_ERROR);
      });

      it.each([false, true])(
        'answers service unavailable with production %s',
        async (isProduction) => {
          useProductionDataset(isProduction);

          const response = await visit(BLOG_PATH, {
            headers: { [TENANT_ID_HEADER]: MOCK_SPOOFED_TENANT_ID },
          });

          expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
          expect(response.headers.get(REWRITE_HEADER)).toBeNull();
        },
      );

      it('logs the failure once with the host and error', async () => {
        await visit(BLOG_PATH);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
          'proxy.tenant_lookup_failed',
          { host: MOCK_TENANT_HOST, error: MOCK_ERROR },
        );
      });
    });
  });

  describe('language routing', () => {
    it.each([
      { from: '/nl/blog/hello', to: '/blog/hello' },
      { from: '/nl/rss.xml', to: SITE_RSS_PATH },
    ])(
      'redirects a switched-off language prefix on $from to $to',
      async ({ from, to }) => {
        const response = await visit(from);

        expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
        expect(redirectPath(response)).toBe(to);
      },
    );

    it('lets a live language prefix through to the locale pipeline', async () => {
      resolveTenantRoutingMock.mockResolvedValue(tenantRouting(EN, [EN, NL]));

      const response = await visit(`/nl${BLOG_PATH}`);

      expect(redirectPath(response)).toBeNull();
      expect(response.headers.get(REWRITE_HEADER)).not.toBeNull();
    });

    it("routes into the tenant's own default language", async () => {
      resolveTenantRoutingMock.mockResolvedValue(tenantRouting(FR));

      const response = await visit(BLOG_PATH);

      expect(response.headers.get(REWRITE_HEADER)).toBe(
        rewrittenTo(BLOG_PATH, FR),
      );
    });
  });

  describe('language detection', () => {
    beforeEach(() => {
      resolveTenantRoutingMock.mockResolvedValue(
        tenantRouting(EN, [EN, NL, FR]),
      );
    });

    it("redirects to the page's translation in the browser's language", async () => {
      const response = await visit(`${ABOUT_PATH}${MOCK_QUERY}`, {
        headers: { 'accept-language': ACCEPT_DUTCH },
      });

      expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
      expect(response.headers.get('location')).toBe(
        `${MOCK_TENANT_BASE_URL}${DUTCH_ABOUT_PATH}${MOCK_QUERY}`,
      );
    });

    it('forbids any cache from storing the visitor-specific redirect', async () => {
      const response = await visit(ABOUT_PATH, {
        headers: { 'accept-language': ACCEPT_DUTCH },
      });

      expect(response.headers.get('cache-control')).toBe('private, no-store');
    });

    it('stays on the page when it has no translation in that language', async () => {
      const response = await visit(ABOUT_PATH, {
        headers: { 'accept-language': LOCALE_BCP47_TAGS.FR },
      });

      expect(redirectPath(response)).toBeNull();
      expect(response.headers.get(REWRITE_HEADER)).not.toBeNull();
    });

    it.each([
      {
        case: 'a remembered default language over a Dutch browser',
        acceptLanguage: LOCALE_BCP47_TAGS.NL,
        remembered: EN,
        expected: null,
      },
      {
        case: 'a remembered Dutch over a French browser',
        acceptLanguage: LOCALE_BCP47_TAGS.FR,
        remembered: NL,
        expected: DUTCH_ABOUT_PATH,
      },
    ])('prefers $case', async ({ acceptLanguage, remembered, expected }) => {
      const response = await visit(ABOUT_PATH, {
        headers: {
          'accept-language': acceptLanguage,
          cookie: `${LANGUAGE_COOKIE_NAME}=${remembered}`,
        },
      });

      expect(redirectPath(response)).toBe(expected);
    });

    it('never redirects a crawler', async () => {
      const response = await visit(ABOUT_PATH, {
        headers: {
          'accept-language': LOCALE_BCP47_TAGS.NL,
          'user-agent': MOCK_CRAWLER_USER_AGENT,
        },
      });

      expect(redirectPath(response)).toBeNull();
      expect(getTenantTranslationMapMock).not.toHaveBeenCalled();
    });

    it('never redirects a form submission', async () => {
      const response = await visit(ABOUT_PATH, {
        headers: { 'accept-language': LOCALE_BCP47_TAGS.NL },
        method: HTTP_METHOD.POST,
      });

      expect(redirectPath(response)).toBeNull();
    });

    it('leaves a language-prefixed URL alone', async () => {
      const response = await visit(DUTCH_ABOUT_PATH, {
        headers: { 'accept-language': LOCALE_BCP47_TAGS.EN },
      });

      expect(getTenantTranslationMapMock).not.toHaveBeenCalled();
      expect(redirectPath(response)).toBeNull();
    });

    it('never looks a single-language tenant up', async () => {
      resolveTenantRoutingMock.mockResolvedValue(tenantRouting(EN));

      const response = await visit(ABOUT_PATH, {
        headers: { 'accept-language': LOCALE_BCP47_TAGS.NL },
      });

      expect(redirectPath(response)).toBeNull();
      expect(getTenantTranslationMapMock).not.toHaveBeenCalled();
    });

    it('stays on the page when the translation map cannot be loaded', async () => {
      getTenantTranslationMapMock.mockResolvedValue(undefined);

      const response = await visit(ABOUT_PATH, {
        headers: { 'accept-language': LOCALE_BCP47_TAGS.NL },
      });

      expect(redirectPath(response)).toBeNull();
      expect(response.headers.get(REWRITE_HEADER)).not.toBeNull();
    });
  });
});
