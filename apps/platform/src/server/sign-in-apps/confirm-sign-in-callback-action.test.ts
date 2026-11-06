import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { OAUTH_PROVIDER } from '@blog/config/constants';
import { queries } from '@blog/db';
import {
  SIGN_IN_APP_LOG,
  SIGN_IN_APP_REFUSAL,
} from '@platform/constants/sign-in-apps';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { mockOwnerContext } from '@platform/testing/custom-domain/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { confirmSignInCallbackAction } from './confirm-sign-in-callback-action';

vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('@blog/db', async () => {
  const { mockSignInAppsDb } =
    await import('@platform/testing/sign-in-apps/fixtures');
  return mockSignInAppsDb();
});

const { tenantOAuthCredentials } = queries;

const confirm = () =>
  confirmSignInCallbackAction(MOCK_TENANT_ID, OAUTH_PROVIDER.GOOGLE);

describe(confirmSignInCallbackAction, () => {
  beforeEach(() => {
    vi.mocked(requireTenantMembership)
      .mockReset()
      .mockResolvedValue(
        mockOwnerContext({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
      );
    vi.mocked(tenantOAuthCredentials.confirmTenantOAuthCallbackDomain)
      .mockReset()
      .mockResolvedValue(undefined);
  });

  it('rejects a caller without access to the tenant', async () => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
      notFound();
    });

    await expect(confirm()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it('records the current main address as the registered callback', async () => {
    expect(await confirm()).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(
      tenantOAuthCredentials.confirmTenantOAuthCallbackDomain,
    ).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      OAUTH_PROVIDER.GOOGLE,
      MOCK_CUSTOM_DOMAIN,
    );
  });

  it('refuses an archived site', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockOwnerContext({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    );

    expect(await confirm()).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_IN_APP_REFUSAL.ARCHIVED,
    });
    expect(
      tenantOAuthCredentials.confirmTenantOAuthCallbackDomain,
    ).not.toHaveBeenCalled();
  });

  it('logs and reports a server error when the write throws', async () => {
    vi.mocked(
      tenantOAuthCredentials.confirmTenantOAuthCallbackDomain,
    ).mockRejectedValue(new Error('db down'));

    expect(await confirm()).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      SIGN_IN_APP_LOG.CONFIRM_CALLBACK_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
