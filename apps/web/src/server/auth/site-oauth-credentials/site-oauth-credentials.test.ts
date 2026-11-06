import { queries } from '@blog/db';
import { TENANT_PLAN } from '@blog/db/constants';
import { AUTH_ACTION } from '@web/constants/session';
import { SIGN_IN_LOG } from '@web/constants/sign-in';
import { getEffectivePlan } from '@web/server/site-config/get-effective-plan/get-effective-plan';
import { resolveTenantId } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { MOCK_SITE_OAUTH_CREDENTIALS } from '@web/testing/server/auth/site-oauth-credentials-fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_HOST,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { NextRequest } from 'next/server';

import {
  getRequestSiteOAuthCredentials,
  getSiteOAuthCredentials,
} from './site-oauth-credentials';

vi.mock('@blog/db', () => ({
  queries: {
    tenantOAuthCredentials: { getTenantOAuthCredentials: vi.fn() },
  },
}));

vi.mock('@web/server/site-config/get-effective-plan/get-effective-plan');

vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant', () => ({
  resolveTenantId: vi.fn(),
}));

const getTenantOAuthCredentialsMock = vi.mocked(
  queries.tenantOAuthCredentials.getTenantOAuthCredentials,
);
const getEffectivePlanMock = vi.mocked(getEffectivePlan);
const resolveTenantIdMock = vi.mocked(resolveTenantId);

const mockTenantRequest = (action = 'signin'): NextRequest =>
  new NextRequest(`https://${MOCK_TENANT_HOST}/api/auth/${action}`, {
    headers: { host: MOCK_TENANT_HOST },
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
  });

  it("returns the credentials of the site the request's host names", async () => {
    resolveTenantIdMock.mockResolvedValueOnce(MOCK_TENANT_ID);

    await expect(
      getRequestSiteOAuthCredentials(mockTenantRequest()),
    ).resolves.toEqual(MOCK_SITE_OAUTH_CREDENTIALS);
    expect(resolveTenantIdMock).toHaveBeenCalledWith(MOCK_TENANT_HOST);
  });

  it('reads nothing when there is no request', async () => {
    await expect(getRequestSiteOAuthCredentials(undefined)).resolves.toEqual(
      {},
    );
    expect(resolveTenantIdMock).not.toHaveBeenCalled();
  });

  it('reads nothing for a session read', async () => {
    await expect(
      getRequestSiteOAuthCredentials(mockTenantRequest(AUTH_ACTION.SESSION)),
    ).resolves.toEqual({});
    expect(resolveTenantIdMock).not.toHaveBeenCalled();
    expect(getTenantOAuthCredentialsMock).not.toHaveBeenCalled();
  });

  it('falls back to the shared apps and logs when the host cannot be resolved', async () => {
    resolveTenantIdMock.mockRejectedValueOnce(MOCK_ERROR);

    await expect(
      getRequestSiteOAuthCredentials(mockTenantRequest()),
    ).resolves.toEqual({});
    expect(logger.error).toHaveBeenCalledWith(
      SIGN_IN_LOG.SITE_CREDENTIALS_FAILED,
      { error: MOCK_ERROR },
    );
  });
});
