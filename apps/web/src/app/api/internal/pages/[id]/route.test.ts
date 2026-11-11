import { HTTP_STATUS, LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { INTERNAL_PAGES_LOG } from '@web/constants/internal-pages';
import { readInternalPageRequest } from '@web/server/internal-pages/read-internal-page-request/read-internal-page-request';
import {
  MOCK_INTERNAL_PAGE_ID,
  MOCK_INTERNAL_PAGE_REQUEST,
  mockInternalPageRouteContext,
} from '@web/testing/server/internal-pages/fixtures';
import { mockTenantSanityCredentials } from '@web/testing/server/tenant/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { POST } from './route';

const readInternalPageRequestMock = vi.mocked(readInternalPageRequest);

const { getPageTitleMock } = vi.hoisted(() => ({
  getPageTitleMock: vi.fn(),
}));

vi.mock(
  '@web/server/internal-pages/read-internal-page-request/read-internal-page-request',
);

vi.mock('@blog/service', () => ({
  service: { pages: { pageTitle: { v1: { getPageTitle: getPageTitleMock } } } },
}));

faker.seed(6009);

const { NL } = LOCALE_ISO_CODES;
const MOCK_PAGE_TITLE = faker.lorem.words(3);
const MOCK_CREDENTIALS = mockTenantSanityCredentials();
const MOCK_BODY = { tenantId: MOCK_TENANT_ID, locale: NL };

const callRoute = () =>
  POST(MOCK_INTERNAL_PAGE_REQUEST, mockInternalPageRouteContext());

describe(POST, () => {
  beforeEach(() => {
    readInternalPageRequestMock.mockResolvedValue({
      body: MOCK_BODY,
      tenant: MOCK_CREDENTIALS,
    });
    getPageTitleMock.mockResolvedValue({ ok: true, data: MOCK_PAGE_TITLE });
  });

  it("returns the page's title in the requested language", async () => {
    const response = await callRoute();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(await response.json()).toEqual({ title: MOCK_PAGE_TITLE });
    expect(getPageTitleMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_INTERNAL_PAGE_ID,
      {
        ...MOCK_CREDENTIALS,
        locale: NL,
      },
    );
  });

  it('answers not found for an unknown page', async () => {
    getPageTitleMock.mockResolvedValue({ ok: true, data: undefined });

    expect((await callRoute()).status).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it('logs and fails when the title read fails', async () => {
    getPageTitleMock.mockResolvedValue({ ok: false, error: MOCK_ERROR });

    expect((await callRoute()).status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      INTERNAL_PAGES_LOG.TITLE_FETCH_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        id: MOCK_INTERNAL_PAGE_ID,
        locale: NL,
        error: MOCK_ERROR,
      },
    );
  });
});
