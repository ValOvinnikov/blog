import { HTTP_STATUS } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { INTERNAL_PAGES_LOG } from '@web/constants/internal-pages';
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

const { getDraftPagePathMock } = vi.hoisted(() => ({
  getDraftPagePathMock: vi.fn(),
}));

vi.mock(
  '@web/server/internal-pages/read-internal-page-request/read-internal-page-request',
);

vi.mock('@blog/service', () => ({
  service: {
    pages: { pagePath: { v1: { getDraftPagePath: getDraftPagePathMock } } },
  },
}));

faker.seed(7181);

const MOCK_HREF = `/blog/${faker.lorem.slug()}`;
const MOCK_CREDENTIALS = mockTenantSanityCredentials();

const callRoute = () =>
  POST(MOCK_INTERNAL_PAGE_REQUEST, mockInternalPageRouteContext());

describe(POST, () => {
  beforeEach(() => {
    getDraftPagePathMock.mockResolvedValue({
      ok: true,
      data: { href: MOCK_HREF, locale: MOCK_CREDENTIALS.defaultLocale },
    });
  });

  it("returns the draft's public path for the tenant's site", async () => {
    const response = await callRoute();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(await response.json()).toEqual({ path: MOCK_HREF });
    expect(getDraftPagePathMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_INTERNAL_PAGE_ID,
      MOCK_CREDENTIALS,
    );
  });

  it('answers not found for a page with no public path', async () => {
    getDraftPagePathMock.mockResolvedValue({ ok: true, data: undefined });

    expect((await callRoute()).status).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it('logs and fails when the path read fails', async () => {
    getDraftPagePathMock.mockResolvedValue({ ok: false, error: MOCK_ERROR });

    expect((await callRoute()).status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      INTERNAL_PAGES_LOG.PATH_FETCH_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        id: MOCK_INTERNAL_PAGE_ID,
        error: MOCK_ERROR,
      },
    );
  });
});
