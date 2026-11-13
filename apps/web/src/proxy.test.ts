import {
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  NEWSLETTER_RESULT,
  routes,
  SITE_MESSAGES_BY_LOCALE,
  type TLocaleIsoCode,
} from '@blog/config';
import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { SUSPENSION_REASON, TENANT_STATUS } from '@blog/db/constants';
import type { TTranslationMap } from '@blog/service';
import {
  type IPreviewTokenClaims,
  signPreviewToken,
} from '@blog/utils/preview-token';
import { faker } from '@faker-js/faker';
import { CACHE_CONTROL, ROBOTS_DIRECTIVE } from '@web/constants/http';
import { PROXY_LOG } from '@web/constants/proxy';
import {
  DRAFT_PREVIEW_MARKER,
  PREVIEW_TOKEN_HEADER,
  PREVIEW_TOKEN_QUERY_PARAM,
} from '@web/server/draft-preview/constants/constants';
import {
  TENANT_ID_HEADER,
  UNRESOLVED_TENANT_PLACEHOLDER,
} from '@web/server/tenant/constants/constants';
import type { TTenantRouting } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { CACHE_CONTROL_HEADER } from '@web/testing/shared/http/constants';
import { MOCK_TAG_SLUG } from '@web/testing/shared/tag/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_HOST,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { PRODUCTION_DATASET } from '@web/utils/is-production-environment';
import { LANGUAGE_COOKIE_NAME } from '@web/utils/language-cookie';
import { logger } from '@web/utils/logger/logger';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest, NextResponse } from 'next/server';

faker.seed(6012);

const {
  resolveTenantRoutingMock,
  resolveUncachedTenantMock,
  getTenantTranslationMapMock,
  intlMock,
  isReaderAccountEnabledForTenantMock,
  env,
} = vi.hoisted(() => ({
  isReaderAccountEnabledForTenantMock: vi.fn(),
  resolveTenantRoutingMock: vi.fn(),
  resolveUncachedTenantMock: vi.fn(),
  getTenantTranslationMapMock: vi.fn(),
  intlMock: vi.fn(),
  env: {
    NEXT_PUBLIC_SANITY_DATASET: 'development',
    PREVIEW_LINK_SECRET: 'preview-link-secret-of-thirty-two-chars',
    PLATFORM_APP_URL: 'https://platform.example.test/dashboard',
  },
}));

vi.mock('next-intl/middleware', () => ({
  default: (routing: unknown) => (request: NextRequest) =>
    intlMock(request, routing),
}));

vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant', () => ({
  resolveTenantRouting: resolveTenantRoutingMock,
  resolveUncachedTenant: resolveUncachedTenantMock,
}));

vi.mock(
  '@web/server/translation-map/get-tenant-translation-map/get-tenant-translation-map',
  () => ({ getTenantTranslationMap: getTenantTranslationMapMock }),
);

vi.mock('@web/utils/env/env', () => ({ env }));

vi.mock(
  '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled',
  () => ({
    isReaderAccountEnabledForTenant: isReaderAccountEnabledForTenantMock,
  }),
);

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
const DOTTED_SEGMENT_PATH = '/blog/v1.2/post';
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
const NEXT_HEADER = 'x-middleware-next';
const NEWSLETTER_CONFIRM_PATH = '/api/newsletter/confirm';
const NEWSLETTER_UNSUBSCRIBE_API_PATH = routes.newsletterUnsubscribeSubmit();
const SITE_UNAVAILABLE_HEADING = {
  EN: SITE_MESSAGES_BY_LOCALE.EN.siteUnavailable.heading,
  NL: SITE_MESSAGES_BY_LOCALE.NL.siteUnavailable.heading,
};
const FORWARDED_PREVIEW_TOKEN_HEADER = `x-middleware-request-${PREVIEW_TOKEN_HEADER}`;
const MOCK_PLATFORM_ORIGIN = 'https://platform.example.test';
const FRAME_OPTIONS_HEADER = 'x-frame-options';
const CSP_HEADER = 'content-security-policy';
const REFERRER_POLICY_HEADER = 'referrer-policy';
const ROBOTS_TAG_HEADER = 'x-robots-tag';
const REVALIDATE_API_PATH = '/api/revalidate';
const MOCK_PREVIEW_CLAIMS: IPreviewTokenClaims = {
  tenantId: MOCK_TENANT_ID,
  path: BLOG_POST_PATH,
  expiresAt: Date.now() + 60_000,
};
const MANAGE_ACCOUNT_LABEL = {
  EN: SITE_MESSAGES_BY_LOCALE.EN.siteUnavailable.manageAccount,
  NL: SITE_MESSAGES_BY_LOCALE.NL.siteUnavailable.manageAccount,
};
const DUTCH_PREFIX = `/${LOCALE_BCP47_TAGS[NL]}`;
const ACCOUNT_PATH = routes.account();
const DUTCH_ACCOUNT_PATH = `${DUTCH_PREFIX}${ACCOUNT_PATH}`;

const MOCK_OPERATOR_SUSPENDED_TENANT = mockTenant({
  id: MOCK_TENANT_ID,
  status: TENANT_STATUS.SUSPENDED,
  suspensionReason: SUSPENSION_REASON.OPERATOR,
});

const MOCK_INACTIVITY_SUSPENDED_TENANT = mockTenant({
  id: MOCK_TENANT_ID,
  status: TENANT_STATUS.SUSPENDED,
  suspensionReason: SUSPENSION_REASON.INACTIVITY,
});

const MOCK_TRANSLATION_MAP: TTranslationMap = {
  homeLanguages: [],
  postIndexLanguages: [],
  topicIndexLanguages: [],
  tagIndexLanguages: [],
  privacyIndexLanguages: [],
  legalIndexLanguages: [],
  cookieStatementLanguages: [],
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
  tenant = mockTenant({ id: MOCK_TENANT_ID }),
): TTenantRouting => ({
  tenant,
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
    const [pageMatcher] = config.matcher;
    matcher = new RegExp(`^${pageMatcher}$`);
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
    { case: 'robots.txt', path: ROBOTS_PATH },
    { case: 'the favicon', path: '/favicon.ico' },
    { case: 'the sitemap', path: SITEMAP_PATH },
    { case: 'a root-level bot probe', path: '/wp-login.php' },
    { case: 'a nested bot probe', path: '/wp-admin/setup-config.php' },
  ])('bypasses the proxy for $case', ({ path }) => {
    expect(matcher.test(path)).toBe(false);
  });

  it.each([
    { case: 'the home page', path: '/' },
    { case: 'the blog index', path: BLOG_PATH },
    { case: 'a post', path: '/blog/some-post-slug' },
    { case: 'the site feed', path: SITE_RSS_PATH },
    { case: 'a dotted multi-segment tag feed', path: TAG_RSS_PATH },
    { case: 'a dot in a non-final segment', path: DOTTED_SEGMENT_PATH },
    { case: 'an RSC request', path: `${BLOG_PATH}.rsc` },
    {
      case: 'an RSC segment prefetch',
      path: `${BLOG_PATH}.segments/_tree.segment.rsc`,
    },
  ])('runs the proxy for $case', ({ path }) => {
    expect(matcher.test(path)).toBe(true);
  });
});

describe('proxy matcher for an operator-suspended site', () => {
  const matches = (path: string) =>
    unstable_doesMiddlewareMatch({
      config,
      url: `${MOCK_TENANT_BASE_URL}${path}`,
    });

  it.each([
    SITEMAP_PATH,
    NEWSLETTER_CONFIRM_PATH,
    '/api/switch-language',
    '/api/generate-skim',
  ])('runs the proxy for %s', (path) => {
    expect(matches(path)).toBe(true);
  });

  it.each([
    NEWSLETTER_UNSUBSCRIBE_API_PATH,
    routes.accountExport(),
    '/api/auth/session',
    '/api/auth/signin/email',
    '/api/auth/callback/email',
    REVALIDATE_API_PATH,
    '/api/revalidate-site-config',
    '/api/client-log',
  ])('bypasses the proxy for %s', (path) => {
    expect(matches(path)).toBe(false);
  });
});

describe('proxy matcher for a preview token', () => {
  it.each([
    `/${MOCK_TENANT_ID}${DRAFT_PREVIEW_MARKER}/en/blog/a.b`,
    '/en/%7Epreview/blog/a.b',
  ])('runs the proxy for the dotted draft path %s', (path) => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        url: `${MOCK_TENANT_BASE_URL}${path}`,
      }),
    ).toBe(true);
  });

  it.each([DOTTED_SEGMENT_PATH, REVALIDATE_API_PATH, ROBOTS_PATH])(
    'runs the proxy for %s when it carries a preview token',
    (path) => {
      expect(
        unstable_doesMiddlewareMatch({
          config,
          url: `${MOCK_TENANT_BASE_URL}${path}?${PREVIEW_TOKEN_QUERY_PARAM}=x`,
        }),
      ).toBe(true);
    },
  );
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

  describe('draft preview', () => {
    it.each([
      `/${DRAFT_PREVIEW_MARKER}${BLOG_POST_PATH}`,
      `/${MOCK_TENANT_ID}${DRAFT_PREVIEW_MARKER}/en${BLOG_POST_PATH}`,
      `/en/%7Epreview${BLOG_POST_PATH}`,
      `/en/%7epreview${BLOG_POST_PATH}`,
    ])('answers not found for the draft marker in %s', async (path) => {
      const response = await visit(path);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
    });

    const withToken = (
      pathname: string,
      claims: Partial<IPreviewTokenClaims> = {},
    ) =>
      `${pathname}?${PREVIEW_TOKEN_QUERY_PARAM}=${signPreviewToken(
        { ...MOCK_PREVIEW_CLAIMS, ...claims },
        env.PREVIEW_LINK_SECRET,
      )}`;

    describe('with a valid token for this tenant and path', () => {
      it('routes the request to the draft render without the token in its address', async () => {
        const response = await visit(withToken(BLOG_POST_PATH));

        expect(response.headers.get(REWRITE_HEADER)).toBe(
          `${MOCK_TENANT_BASE_URL}/${MOCK_TENANT_ID}${DRAFT_PREVIEW_MARKER}/${EN}/${DRAFT_PREVIEW_MARKER}${BLOG_POST_PATH}`,
        );
      });

      it('hands the verified token to the render', async () => {
        const path = withToken(BLOG_POST_PATH);

        const response = await visit(path);

        expect(response.headers.get(FORWARDED_PREVIEW_TOKEN_HEADER)).toBe(
          new URLSearchParams(path.split('?')[1]).get(
            PREVIEW_TOKEN_QUERY_PARAM,
          ),
        );
      });

      it('lets only the platform frame it and keeps it out of caches and indexes', async () => {
        const { headers } = await visit(withToken(BLOG_POST_PATH));

        expect(headers.get(CSP_HEADER)).toContain(
          `frame-ancestors ${MOCK_PLATFORM_ORIGIN};`,
        );
        expect(headers.get(FRAME_OPTIONS_HEADER)).toBeNull();
        expect(headers.get(CACHE_CONTROL_HEADER)).toBe(
          CACHE_CONTROL.PRIVATE_NO_STORE,
        );
        expect(headers.get(REFERRER_POLICY_HEADER)).toBe('no-referrer');
        expect(headers.get(ROBOTS_TAG_HEADER)).toBe(ROBOTS_DIRECTIVE.NOINDEX);
      });
    });

    describe.each([
      ['an expired', { expiresAt: Date.now() - 1 }],
      ["another tenant's", { tenantId: MOCK_SPOOFED_TENANT_ID }],
      ["another path's", { path: `${BLOG_POST_PATH}-other` }],
    ])('with %s token', (_label, claims) => {
      it('serves the published page without the token in its address', async () => {
        const response = await visit(withToken(BLOG_POST_PATH, claims));

        expect(response.headers.get(REWRITE_HEADER)).toBe(
          rewrittenTo(BLOG_POST_PATH),
        );
        expect(response.headers.get(FORWARDED_PREVIEW_TOKEN_HEADER)).toBeNull();
      });

      it('refuses to be framed', async () => {
        const { headers } = await visit(withToken(BLOG_POST_PATH, claims));

        expect(headers.get(CSP_HEADER)).toContain("frame-ancestors 'none';");
        expect(headers.get(FRAME_OPTIONS_HEADER)).toBe('DENY');
      });
    });

    it('serves the published page for a tampered token', async () => {
      const response = await visit(`${withToken(BLOG_POST_PATH)}tampered`);

      expect(response.headers.get(FORWARDED_PREVIEW_TOKEN_HEADER)).toBeNull();
      expect(response.headers.get(FRAME_OPTIONS_HEADER)).toBe('DENY');
    });

    it('drops a client-supplied preview header from a request without a token', async () => {
      const response = await visit(BLOG_POST_PATH, {
        headers: {
          [PREVIEW_TOKEN_HEADER]: signPreviewToken(
            MOCK_PREVIEW_CLAIMS,
            env.PREVIEW_LINK_SECRET,
          ),
        },
      });

      expect(response.headers.get(FORWARDED_PREVIEW_TOKEN_HEADER)).toBeNull();
    });

    it('refuses to frame a passed-through path carrying a token', async () => {
      const { headers } = await visit(withToken(DOTTED_SEGMENT_PATH));

      expect(headers.get(FRAME_OPTIONS_HEADER)).toBe('DENY');
    });

    it('leaves the framing headers to next.config without a token', async () => {
      const { headers } = await visit(BLOG_POST_PATH);

      expect(headers.get(CSP_HEADER)).toBeNull();
    });
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
    describe('with no client-supplied headers', () => {
      let response: NextResponse;

      beforeEach(async () => {
        response = await visit(DOTTED_SEGMENT_PATH);
      });

      it('passes a path with a dotted non-final segment through without resolving a tenant', () => {
        expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
        expect(response.headers.get(REWRITE_HEADER)).toBeNull();
      });

      it('keeps the host header on a passed-through path', () => {
        expect(response.headers.get('x-middleware-request-host')).toBe(
          MOCK_TENANT_HOST,
        );
      });
    });

    it('drops a client-supplied tenant header on a passed-through path', async () => {
      const response = await visit(DOTTED_SEGMENT_PATH, {
        headers: { [TENANT_ID_HEADER]: MOCK_SPOOFED_TENANT_ID },
      });

      const overriddenHeaderNames =
        response.headers.get('x-middleware-override-headers')?.split(',') ?? [];

      expect(overriddenHeaderNames).not.toContain(TENANT_ID_HEADER);
      expect(response.headers.get(FORWARDED_TENANT_HEADER)).toBeNull();
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
          PROXY_LOG.TENANT_LOOKUP_FAILED,
          { host: MOCK_TENANT_HOST, error: MOCK_ERROR },
        );
      });
    });
  });

  describe('operator suspension', () => {
    beforeEach(() => {
      resolveTenantRoutingMock.mockResolvedValue(
        tenantRouting(EN, [EN, NL], MOCK_OPERATOR_SUSPENDED_TENANT),
      );
      resolveUncachedTenantMock.mockReset();
      resolveUncachedTenantMock.mockResolvedValue(
        MOCK_OPERATOR_SUSPENDED_TENANT,
      );
      isReaderAccountEnabledForTenantMock.mockResolvedValue(false);
    });

    it('answers a page with an unindexed unavailable page', async () => {
      const response = await visit(BLOG_POST_PATH);

      expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(response.headers.get(ROBOTS_TAG_HEADER)).toBe(
        ROBOTS_DIRECTIVE.NOINDEX,
      );
      expect(response.headers.get(REWRITE_HEADER)).toBeNull();
      expect(intlMock).not.toHaveBeenCalled();
      expect(await response.text()).toContain(SITE_UNAVAILABLE_HEADING.EN);
    });

    it('shows the unavailable page in the language the path names', async () => {
      const response = await visit(`${DUTCH_PREFIX}${BLOG_PATH}`);
      const body = await response.text();

      expect(body).toContain(SITE_UNAVAILABLE_HEADING.NL);
      expect(body).toContain(`lang="${LOCALE_BCP47_TAGS[NL]}"`);
    });

    it.each([SITE_RSS_PATH, TAG_RSS_PATH])(
      'answers the feed %s with service unavailable and no page',
      async (path) => {
        const response = await visit(path);

        expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
        expect(await response.text()).toBe('');
      },
    );

    it.each([SITEMAP_PATH, NEWSLETTER_CONFIRM_PATH])(
      'answers %s with service unavailable',
      async (path) => {
        const response = await visit(path);

        expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
        expect(response.headers.get(NEXT_HEADER)).toBeNull();
        expect(resolveUncachedTenantMock).toHaveBeenCalledWith(
          MOCK_TENANT_HOST,
        );
      },
    );

    it.each([
      routes.newsletterUnsubscribeConfirmation(),
      routes.newsletterResult(NEWSLETTER_RESULT.UNSUBSCRIBED),
      routes.newsletterResult(NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID),
      routes.newsletterResult(NEWSLETTER_RESULT.UNSUBSCRIBE_FAILED),
      `${DUTCH_PREFIX}${routes.newsletterUnsubscribeConfirmation()}`,
    ])('keeps the unsubscribe page %s reachable', async (path) => {
      const response = await visit(path);

      expect(response.status).not.toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(response.headers.get(REWRITE_HEADER)).not.toBeNull();
    });

    it.each([ACCOUNT_PATH, DUTCH_ACCOUNT_PATH])(
      'keeps the account page %s reachable',
      async (path) => {
        const response = await visit(path);

        expect(response.status).not.toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
        expect(response.headers.get(REWRITE_HEADER)).not.toBeNull();
      },
    );

    it('still answers a page under the account path with the unavailable page', async () => {
      const response = await visit(`${ACCOUNT_PATH}${BLOG_PATH}`);

      expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    });

    describe('when the site has reader accounts', () => {
      beforeEach(() => {
        isReaderAccountEnabledForTenantMock.mockResolvedValue(true);
      });

      it('links the unavailable page to the account page', async () => {
        const body = await (await visit(BLOG_POST_PATH)).text();

        expect(body).toContain(
          `<a href="${ACCOUNT_PATH}">${MANAGE_ACCOUNT_LABEL.EN}</a>`,
        );
        expect(isReaderAccountEnabledForTenantMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
        );
      });

      it('links to the account page in the language the path names', async () => {
        const body = await (await visit(`${DUTCH_PREFIX}${BLOG_PATH}`)).text();

        expect(body).toContain(
          `<a href="${DUTCH_ACCOUNT_PATH}">${MANAGE_ACCOUNT_LABEL.NL}</a>`,
        );
      });
    });

    it('shows no account link when the site has no reader accounts', async () => {
      const body = await (await visit(BLOG_POST_PATH)).text();

      expect(body).not.toContain(MANAGE_ACCOUNT_LABEL.EN);
      expect(body).not.toContain('<a ');
    });

    it('still answers another newsletter page with the unavailable page', async () => {
      const response = await visit(
        routes.newsletterResult(NEWSLETTER_RESULT.CONFIRMED),
      );

      expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    });

    it('serves the site of a tenant suspended for inactivity', async () => {
      resolveTenantRoutingMock.mockResolvedValue(
        tenantRouting(EN, [EN], MOCK_INACTIVITY_SUSPENDED_TENANT),
      );

      const response = await visit(BLOG_PATH);

      expect(response.headers.get(REWRITE_HEADER)).toBe(rewrittenTo(BLOG_PATH));
    });

    it.each([SITEMAP_PATH, NEWSLETTER_CONFIRM_PATH])(
      'passes %s through for a tenant suspended for inactivity',
      async (path) => {
        resolveUncachedTenantMock.mockResolvedValue(
          MOCK_INACTIVITY_SUSPENDED_TENANT,
        );

        const response = await visit(path, {
          headers: { [TENANT_ID_HEADER]: MOCK_SPOOFED_TENANT_ID },
        });

        expect(response.headers.get(NEXT_HEADER)).toBe('1');
        expect(response.headers.get(FORWARDED_TENANT_HEADER)).toBeNull();
        expect(resolveTenantRoutingMock).not.toHaveBeenCalled();
      },
    );

    it('answers service unavailable and logs once when the sitemap lookup fails', async () => {
      resolveUncachedTenantMock.mockRejectedValue(MOCK_ERROR);

      const response = await visit(SITEMAP_PATH);

      expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        PROXY_LOG.TENANT_LOOKUP_FAILED,
        { host: MOCK_TENANT_HOST, error: MOCK_ERROR },
      );
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

      expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(
        CACHE_CONTROL.PRIVATE_NO_STORE,
      );
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
