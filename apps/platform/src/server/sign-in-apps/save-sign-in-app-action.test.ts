import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { OAUTH_PROVIDER } from '@blog/config/constants';
import { queries } from '@blog/db';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  SIGN_IN_APP_FIELD_ERROR,
  SIGN_IN_APP_LOG,
  SIGN_IN_APP_REFUSAL,
} from '@platform/constants/sign-in-apps';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockOwnerContext } from '@platform/testing/custom-domain/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_CLIENT_ID,
  MOCK_CLIENT_SECRET,
  MOCK_REPLACEMENT_CLIENT_ID,
  mockOAuthClient,
} from '@platform/testing/sign-in-apps/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { saveSignInAppAction } from './save-sign-in-app-action';

vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('@platform/server/audit/record-audit-event');
vi.mock('@platform/server/site-config/revalidate-site-config');
vi.mock('@blog/db', async () => {
  const { mockSignInAppsDb } =
    await import('@platform/testing/sign-in-apps/fixtures');
  return mockSignInAppsDb();
});

const { tenantOAuthCredentials } = queries;

const NEW_APP_INPUT = {
  provider: OAUTH_PROVIDER.GOOGLE,
  clientId: MOCK_CLIENT_ID,
  clientSecret: MOCK_CLIENT_SECRET,
};

const asTenant = (overrides: Partial<TTenant>) =>
  vi
    .mocked(requireTenantMembership)
    .mockResolvedValueOnce(
      mockOwnerContext({ plan: TENANT_PLAN.GROWTH, ...overrides }),
    );

describe(saveSignInAppAction, () => {
  beforeEach(() => {
    vi.mocked(requireTenantMembership)
      .mockReset()
      .mockResolvedValue(mockOwnerContext({ plan: TENANT_PLAN.GROWTH }));
    vi.mocked(tenantOAuthCredentials.listTenantOAuthClients)
      .mockReset()
      .mockResolvedValue([]);
    vi.mocked(tenantOAuthCredentials.saveTenantOAuthCredentials)
      .mockReset()
      .mockResolvedValue(undefined);
    vi.mocked(tenantOAuthCredentials.updateTenantOAuthClient)
      .mockReset()
      .mockResolvedValue(true);
  });

  it.each([
    [
      'a caller without access to the tenant',
      () =>
        vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
          notFound();
        }),
    ],
    [
      'a member who is not the owner',
      () =>
        vi.mocked(requireTenantMembership).mockResolvedValueOnce({
          ...mockOwnerContext({ plan: TENANT_PLAN.GROWTH }),
          membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
        }),
    ],
    [
      'an operator acting through a virtual owner membership',
      () =>
        vi.mocked(requireTenantMembership).mockResolvedValueOnce({
          ...mockOwnerContext({ plan: TENANT_PLAN.GROWTH }),
          membership: buildVirtualAdminMembership(
            mockAdmin().userId,
            MOCK_TENANT_ID,
          ),
        }),
    ],
  ])('rejects %s', async (_name, arrange) => {
    arrange();

    await expect(
      saveSignInAppAction(MOCK_TENANT_ID, NEW_APP_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(
      tenantOAuthCredentials.saveTenantOAuthCredentials,
    ).not.toHaveBeenCalled();
  });

  it('saves a new app against the main address, revalidates and audits it without the secret', async () => {
    const result = await saveSignInAppAction(MOCK_TENANT_ID, NEW_APP_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(
      tenantOAuthCredentials.saveTenantOAuthCredentials,
    ).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      ...NEW_APP_INPUT,
      callbackDomain: MOCK_TENANT_DOMAIN,
    });
    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(recordAuditEvent).toHaveBeenCalledWith({
      logEvent: SIGN_IN_APP_LOG.SAVE_AUDIT_FAILED,
      action: AUDIT_ACTION.OAUTH_APP_SAVED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { provider: OAUTH_PROVIDER.GOOGLE, isSecretReplaced: true },
    });
  });

  it('changes a saved client ID and keeps the stored secret when none is given', async () => {
    vi.mocked(tenantOAuthCredentials.listTenantOAuthClients).mockResolvedValue([
      mockOAuthClient(),
    ]);

    const result = await saveSignInAppAction(MOCK_TENANT_ID, {
      provider: OAUTH_PROVIDER.GOOGLE,
      clientId: MOCK_REPLACEMENT_CLIENT_ID,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(tenantOAuthCredentials.updateTenantOAuthClient).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      {
        provider: OAUTH_PROVIDER.GOOGLE,
        clientId: MOCK_REPLACEMENT_CLIENT_ID,
        callbackDomain: MOCK_TENANT_DOMAIN,
      },
    );
    expect(
      tenantOAuthCredentials.saveTenantOAuthCredentials,
    ).not.toHaveBeenCalled();
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: AUDIT_ACTION.OAUTH_APP_REPLACED }),
    );
  });

  it('marks every empty field and saves nothing', async () => {
    const result = await saveSignInAppAction(MOCK_TENANT_ID, {
      provider: OAUTH_PROVIDER.GITHUB,
      clientId: ' ',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        clientId: { reason: SIGN_IN_APP_FIELD_ERROR.REQUIRED },
        clientSecret: { reason: SIGN_IN_APP_FIELD_ERROR.REQUIRED },
      },
    });
    expect(
      tenantOAuthCredentials.saveTenantOAuthCredentials,
    ).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it.each([
    [
      'an archived site',
      { deprovisionedAt: MOCK_ARCHIVED_AT },
      SIGN_IN_APP_REFUSAL.ARCHIVED,
    ],
    [
      'a Free site',
      { plan: TENANT_PLAN.FREE },
      SIGN_IN_APP_REFUSAL.NOT_ON_PLAN,
    ],
  ])('refuses %s', async (_name, overrides, reason) => {
    asTenant(overrides);

    const result = await saveSignInAppAction(MOCK_TENANT_ID, NEW_APP_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
    expect(
      tenantOAuthCredentials.saveTenantOAuthCredentials,
    ).not.toHaveBeenCalled();
  });

  it('refuses a client ID change for an app removed meanwhile, recording nothing', async () => {
    vi.mocked(tenantOAuthCredentials.listTenantOAuthClients).mockResolvedValue([
      mockOAuthClient(),
    ]);
    vi.mocked(tenantOAuthCredentials.updateTenantOAuthClient).mockResolvedValue(
      false,
    );

    const result = await saveSignInAppAction(MOCK_TENANT_ID, {
      provider: OAUTH_PROVIDER.GOOGLE,
      clientId: MOCK_REPLACEMENT_CLIENT_ID,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_IN_APP_REFUSAL.NO_SAVED_APP,
    });
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('logs and reports a server error, recording nothing, when the write throws', async () => {
    const error = new Error('db down');
    vi.mocked(
      tenantOAuthCredentials.saveTenantOAuthCredentials,
    ).mockRejectedValue(error);

    const result = await saveSignInAppAction(MOCK_TENANT_ID, NEW_APP_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      SIGN_IN_APP_LOG.SAVE_FAILED,
      expect.objectContaining({
        tenantId: MOCK_TENANT_ID,
        provider: OAUTH_PROVIDER.GOOGLE,
      }),
    );
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
