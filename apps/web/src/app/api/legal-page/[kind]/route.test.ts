import {
  HTTP_STATUS,
  LEGAL_PAGE_KIND,
  LOCALE_ISO_CODES,
  routes,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { SECTION_DOCUMENT_LOG } from '@web/constants/section-document';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { getHostTenantSanityContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import {
  MOCK_TENANT_SANITY_CONTEXT,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { GET } from './route';

faker.seed(6525);

const { getSectionDocumentByKindMock } = vi.hoisted(() => ({
  getSectionDocumentByKindMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      sectionDocument: {
        v1: { getSectionDocumentByKind: getSectionDocumentByKindMock },
      },
    },
  },
}));
vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock(
  '@web/server/tenant/tenant-sanity-context/tenant-sanity-context',
  () => ({ getHostTenantSanityContext: vi.fn() }),
);

const { NL } = LOCALE_ISO_CODES;
const MOCK_ORIGIN = `https://${faker.internet.domainName()}`;
const MOCK_SLUG = faker.lorem.slug();
const MOCK_ERROR = new Error(faker.lorem.sentence());

const requestKind = (kind: string) =>
  GET(new Request(`${MOCK_ORIGIN}/api/legal-page/${kind}`), {
    params: Promise.resolve({ kind }),
  });

beforeEach(() => {
  vi.mocked(getHostTenantSanityContext).mockResolvedValue({
    isResolvable: true,
    tenant: MOCK_TENANT_SANITY_CONTEXT,
  });
  vi.mocked(resolveRequestTenant).mockResolvedValue(mockTenant({ locale: NL }));
});

describe(GET, () => {
  it.each([
    [LEGAL_PAGE_KIND.PRIVACY_POLICY, routes.privacyDocument(MOCK_SLUG)],
    [LEGAL_PAGE_KIND.TERMS, routes.legalDocument(MOCK_SLUG)],
    [LEGAL_PAGE_KIND.IMPRINT, routes.legalDocument(MOCK_SLUG)],
    [LEGAL_PAGE_KIND.COOKIE_STATEMENT, routes.cookieStatement()],
  ])('redirects %s to its published page', async (kind, href) => {
    getSectionDocumentByKindMock.mockResolvedValueOnce({
      ok: true,
      data: { href },
    });

    const response = await requestKind(kind);

    expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
    expect(response.headers.get('location')).toBe(`${MOCK_ORIGIN}${href}`);
  });

  it("looks the kind up in the tenant's default locale", async () => {
    getSectionDocumentByKindMock.mockResolvedValueOnce({
      ok: true,
      data: undefined,
    });

    await requestKind(LEGAL_PAGE_KIND.TERMS);

    expect(getSectionDocumentByKindMock).toHaveBeenCalledWith(
      LEGAL_PAGE_KIND.TERMS,
      { ...MOCK_TENANT_SANITY_CONTEXT, locale: NL, defaultLocale: NL },
    );
  });

  it.each([LEGAL_PAGE_KIND.OTHER, faker.lorem.word()])(
    'returns not found for the %s kind without a lookup',
    async (kind) => {
      const response = await requestKind(kind);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(getSectionDocumentByKindMock).not.toHaveBeenCalled();
    },
  );

  it('returns not found when no page of the kind is published', async () => {
    getSectionDocumentByKindMock.mockResolvedValueOnce({
      ok: true,
      data: undefined,
    });

    const response = await requestKind(LEGAL_PAGE_KIND.IMPRINT);

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it('returns not found when the host resolves to no tenant', async () => {
    vi.mocked(getHostTenantSanityContext).mockResolvedValueOnce({
      isResolvable: false,
    });

    const response = await requestKind(LEGAL_PAGE_KIND.TERMS);

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(getSectionDocumentByKindMock).not.toHaveBeenCalled();
  });

  it('logs and fails when the lookup fails', async () => {
    getSectionDocumentByKindMock.mockResolvedValueOnce({
      ok: false,
      error: MOCK_ERROR,
    });

    const response = await requestKind(LEGAL_PAGE_KIND.TERMS);

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      SECTION_DOCUMENT_LOG.BY_KIND_FETCH_FAILED,
      { kind: LEGAL_PAGE_KIND.TERMS, error: MOCK_ERROR },
    );
  });
});
