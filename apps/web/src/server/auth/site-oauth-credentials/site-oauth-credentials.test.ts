import { TENANT_PLAN } from '@blog/config/constants';
import { queries } from '@blog/db';
import { AUTH_ACTION } from '@web/constants/session';
import { SIGN_IN_LOG } from '@web/constants/sign-in';
import { getEffectivePlan } from '@web/server/site-config/get-effective-plan/get-effective-plan';
import { resolveTenant } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { MOCK_SITE_OAUTH_CREDENTIALS } from '@web/testing/server/auth/site-oauth-credentials-fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_HOST,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { NextRequest } from 'next/server';

import {
  getHostSiteOAuthCredentials,
  getRequestSiteOAuthCredentials,
  getSiteOAuthCredentials,
} from './site-oauth-credentials';

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock('next/headers', () => ({ headers: headersMock }));

vi.mock('@blog/db', () => ({
  queries: {
    tenantOAuthCredentials: { getTenantOAuthCredentials: vi.fn() },
  },
}));

vi.mock('@web/server/site-config/get-effective-plan/get-effective-plan');

vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant', () => ({
  resolveTenant: vi.fn(),
}));

const getTenantOAuthCredentialsMock = vi.mocked(
  queries.tenantOAuthCredentials.getTenantOAuthCredentials,
);
const getEffectivePlanMock = vi.mocked(getEffectivePlan);
const resolveTenantMock = vi.mocked(resolveTenant);

const MOCK_SECONDARY_HOST = 'secondary.example.com';

const mockTenantRequest = (
  action = 'signin',
  host = MOCK_TENANT_HOST,
): NextRequest =>
  new NextRequest(`https://${host}/api/auth/${action}`, {
    headers: { host },
  });

describe(getSiteOAuthCredentials, () => {
  beforeEach(() => {
    getTenantOAuthCredentialsMock.mockResolvedValue(
      MOCK_SITE_OAUTH_CREDENTIALS,
    );
  });

  it("returns the site's own credentials on a plan that includes them", async () => {
    await expect(getSiteOAuthCredentials(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_SITE_OAUTH_CREDENTIALS,
    );
    expect(getTenantOAuthCredentialsMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('keeps the shared apps after a downgrade, without reading stored credentials', async () => {
    getEffectivePlanMock.mockResolvedValueOnce(TENANT_PLAN.FREE);

    await expect(getSiteOAuthCredentials(MOCK_TENANT_ID)).resolves.toEqual({});
    expect(getTenantOAuthCredentialsMock).not.toHaveBeenCalled();
  });

  it('keeps the shared apps with no tenant', async () => {
    await expect(getSiteOAuthCredentials(undefined)).resolves.toEqual({});
    expect(getTenantOAuthCredentialsMock).not.toHaveBeenCalled();
  });

  it('falls back to the shared apps and logs when the credentials cannot be read', async () => {
    getTenantOAuthCredentialsMock.mockRejectedValueOnce(MOCK_ERROR);

    await expect(getSiteOAuthCredentials(MOCK_TENANT_ID)).resolves.toEqual({});
    expect(logger.error).toHaveBeenCalledWith(
      SIGN_IN_LOG.SITE_CREDENTIALS_FAILED,
      { error: MOCK_ERROR },
    );
  });
});

describe(getRequestSiteOAuthCredentials, () => {
  beforeEach(() => {
    getTenantOAuthCredentialsMock.mockResolvedValue(
      MOCK_SITE_OAUTH_CREDENTIALS,
    );
    resolveTenantMock.mockResolvedValue(mockTenant());
  });

  it("returns the site's own credentials on its main address", async () => {
    await expect(
      getRequestSiteOAuthCredentials(mockTenantRequest()),
    ).resolves.toEqual(MOCK_SITE_OAUTH_CREDENTIALS);
    expect(resolveTenantMock).toHaveBeenCalledWith(MOCK_TENANT_HOST);
    expect(getTenantOAuthCredentialsMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it("keeps the shared apps on another of the site's addresses", async () => {
    await expect(
      getRequestSiteOAuthCredentials(
        mockTenantRequest(undefined, MOCK_SECONDARY_HOST),
      ),
    ).resolves.toEqual({});
    expect(resolveTenantMock).toHaveBeenCalledWith(MOCK_SECONDARY_HOST);
    expect(getTenantOAuthCredentialsMock).not.toHaveBeenCalled();
  });

  it('keeps the shared apps when the host names no site', async () => {
    resolveTenantMock.mockResolvedValueOnce(undefined);

    await expect(
      getRequestSiteOAuthCredentials(mockTenantRequest()),
    ).resolves.toEqual({});
    expect(getTenantOAuthCredentialsMock).not.toHaveBeenCalled();
  });

  it('reads nothing when there is no request', async () => {
    await expect(getRequestSiteOAuthCredentials(undefined)).resolves.toEqual(
      {},
    );
    expect(resolveTenantMock).not.toHaveBeenCalled();
  });

  it('reads nothing for a session read', async () => {
    await expect(
      getRequestSiteOAuthCredentials(mockTenantRequest(AUTH_ACTION.SESSION)),
    ).resolves.toEqual({});
    expect(resolveTenantMock).not.toHaveBeenCalled();
    expect(getTenantOAuthCredentialsMock).not.toHaveBeenCalled();
  });

  it('falls back to the shared apps and logs when the host cannot be resolved', async () => {
    resolveTenantMock.mockRejectedValueOnce(MOCK_ERROR);

    await expect(
      getRequestSiteOAuthCredentials(mockTenantRequest()),
    ).resolves.toEqual({});
    expect(logger.error).toHaveBeenCalledWith(
      SIGN_IN_LOG.SITE_CREDENTIALS_FAILED,
      { error: MOCK_ERROR },
    );
  });
});

describe(getHostSiteOAuthCredentials, () => {
  beforeEach(() => {
    getTenantOAuthCredentialsMock.mockResolvedValue(
      MOCK_SITE_OAUTH_CREDENTIALS,
    );
    resolveTenantMock.mockResolvedValue(mockTenant());
  });

  it("advertises the site's own apps when the page is served on its main address", async () => {
    headersMock.mockResolvedValueOnce(new Headers({ host: MOCK_TENANT_HOST }));

    await expect(getHostSiteOAuthCredentials()).resolves.toEqual(
      MOCK_SITE_OAUTH_CREDENTIALS,
    );
  });

  it('advertises the shared apps when the page is served on another address', async () => {
    headersMock.mockResolvedValueOnce(
      new Headers({ host: MOCK_SECONDARY_HOST }),
    );

    await expect(getHostSiteOAuthCredentials()).resolves.toEqual({});
    expect(getTenantOAuthCredentialsMock).not.toHaveBeenCalled();
  });
});
