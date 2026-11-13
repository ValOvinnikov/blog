import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { OAUTH_PROVIDER, TENANT_PLAN } from '@blog/config/constants';
import { queries } from '@blog/db';
import {
  SIGN_IN_APP_LOG,
  SIGN_IN_APP_REFUSAL,
} from '@platform/constants/sign-in-apps';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { mockOwnerContext } from '@platform/testing/custom-domain/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { removeSignInAppAction } from './remove-sign-in-app-action';

vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('@platform/server/audit/record-audit-event');
vi.mock('@platform/server/site-config/revalidate-site-config');
vi.mock('@blog/db', async () => {
  const { mockSignInAppsDb } =
    await import('@platform/testing/sign-in-apps/fixtures');
  return mockSignInAppsDb();
});

const { tenantOAuthCredentials } = queries;

const remove = () =>
  removeSignInAppAction(MOCK_TENANT_ID, OAUTH_PROVIDER.GITHUB);

describe(removeSignInAppAction, () => {
  beforeEach(() => {
    vi.mocked(requireTenantMembership)
      .mockReset()
      .mockResolvedValue(mockOwnerContext({ plan: TENANT_PLAN.GROWTH }));
    vi.mocked(tenantOAuthCredentials.clearTenantOAuthCredentials)
      .mockReset()
      .mockResolvedValue(true);
  });

  it('rejects a caller without access to the tenant', async () => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
      notFound();
    });

    await expect(remove()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(
      tenantOAuthCredentials.clearTenantOAuthCredentials,
    ).not.toHaveBeenCalled();
  });

  it('deletes the app, revalidates the site and audits it', async () => {
    expect(await remove()).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(
      tenantOAuthCredentials.clearTenantOAuthCredentials,
    ).toHaveBeenCalledWith(MOCK_TENANT_ID, OAUTH_PROVIDER.GITHUB);
    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(recordAuditEvent).toHaveBeenCalledWith({
      logEvent: SIGN_IN_APP_LOG.REMOVE_AUDIT_FAILED,
      action: AUDIT_ACTION.OAUTH_APP_REMOVED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { provider: OAUTH_PROVIDER.GITHUB },
    });
  });

  it('refuses an archived site', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockOwnerContext({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    );

    expect(await remove()).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_IN_APP_REFUSAL.ARCHIVED,
    });
    expect(
      tenantOAuthCredentials.clearTenantOAuthCredentials,
    ).not.toHaveBeenCalled();
  });

  it('refuses an app that is already gone, recording nothing', async () => {
    vi.mocked(
      tenantOAuthCredentials.clearTenantOAuthCredentials,
    ).mockResolvedValue(false);

    expect(await remove()).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_IN_APP_REFUSAL.NO_SAVED_APP,
    });
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('logs and reports a server error, recording nothing, when the delete throws', async () => {
    vi.mocked(
      tenantOAuthCredentials.clearTenantOAuthCredentials,
    ).mockRejectedValue(new Error('db down'));

    expect(await remove()).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      SIGN_IN_APP_LOG.REMOVE_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
