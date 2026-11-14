import { faker } from '@faker-js/faker';
import { UPGRADE_SEARCH_PARAM } from '@platform/constants/billing';
import { MOCK_STRIPE_PROMOTION_CODE } from '@platform/testing/billing/fixtures';
import { REQUESTED_PATH_HEADER } from '@platform/utils/requested-path/requested-path';
import { adminRoutes } from '@platform/utils/routes/routes';
import { SIGNUP_PROMO_COOKIE } from '@platform/utils/signup-promo-cookie/signup-promo-cookie';
import { NextRequest, NextResponse } from 'next/server';

const { mockHandleI18nRouting } = vi.hoisted(() => ({
  mockHandleI18nRouting: vi.fn(),
}));

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => mockHandleI18nRouting),
}));

const { config, default: proxy } = await import('./proxy');

faker.seed(6006);

const MOCK_TENANT_ID = faker.string.uuid();
const MOCK_ORIGIN = faker.internet.url({ appendSlash: false });
const MOCK_STRUCTURE_ID = 'blog;page_post;page_post-provisioning.post.starter';
const BOT_ID_CHALLENGE_PATH =
  '/149e9513-01fa-4fb0-aad4-566afd725d1b/a-4-a/c.js';
const MOCK_EVIL_URL = faker.internet.url();

const MATCHER = new RegExp(`^${config.matcher}$`);

describe('proxy matcher', () => {
  it.each([
    adminRoutes.home(),
    adminRoutes.tenants(),
    adminRoutes.look(MOCK_TENANT_ID),
    adminRoutes.dashboard(),
    adminRoutes.dashboardLook(),
    adminRoutes.dashboardSelectTenant(),
  ])('rewrites the content route %s through locale middleware', (path) => {
    expect(MATCHER.test(path)).toBe(true);
  });

  it.each([
    `${adminRoutes.tenantStudio(MOCK_TENANT_ID)}/structure/${MOCK_STRUCTURE_ID}`,
    `${adminRoutes.dashboardStudio()}/structure/${MOCK_STRUCTURE_ID}`,
    `${adminRoutes.tenantStudio(MOCK_TENANT_ID)}/structure/settings.site`,
  ])('rewrites the Studio route %s whose structure id has dots', (path) => {
    expect(MATCHER.test(path)).toBe(true);
  });

  it("leaves BotID's challenge path to BotID", () => {
    expect(MATCHER.test(BOT_ID_CHALLENGE_PATH)).toBe(false);
  });

  it.each([
    '/api/auth/signin',
    '/_next/static/chunk.js',
    '/_vercel/insights',
    '/icon',
    '/apple-icon',
    '/favicon.ico',
    '/robots.txt',
  ])('excludes the api, _next, _vercel, icon or dotted path %s', (path) => {
    expect(MATCHER.test(path)).toBe(false);
  });
});

describe(proxy, () => {
  beforeEach(() => {
    mockHandleI18nRouting.mockImplementation(() => NextResponse.next());
  });

  it('records the requested page for the sign-in gate, then routes the locale', () => {
    const requestedPath = `${adminRoutes.dashboardLeads()}?page=2`;
    const request = new NextRequest(`${MOCK_ORIGIN}${requestedPath}`);

    proxy(request);

    expect(request.headers.get(REQUESTED_PATH_HEADER)).toBe(requestedPath);
    expect(mockHandleI18nRouting).toHaveBeenCalledWith(request);
  });

  it('overwrites a requested path the client sent itself', () => {
    const request = new NextRequest(`${MOCK_ORIGIN}${adminRoutes.tenants()}`, {
      headers: { [REQUESTED_PATH_HEADER]: MOCK_EVIL_URL },
    });

    proxy(request);

    expect(request.headers.get(REQUESTED_PATH_HEADER)).toBe(
      adminRoutes.tenants(),
    );
  });

  it("remembers the signup page's promo code on the routed response", () => {
    const request = new NextRequest(
      `${MOCK_ORIGIN}${adminRoutes.signUp()}?${UPGRADE_SEARCH_PARAM.PROMO}=${MOCK_STRIPE_PROMOTION_CODE}`,
    );

    const response = proxy(request);

    expect(response.cookies.get(SIGNUP_PROMO_COOKIE)?.value).toBe(
      MOCK_STRIPE_PROMOTION_CODE,
    );
  });
});
