import { ENTITLEMENT_GRANT_REFUSAL } from '@platform/constants/entitlement-grant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { notifyOwnerOfEntitlementRevoke } from '@platform/server/entitlement-grants/notify-owner-of-entitlement-change';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  MOCK_SUPER_ADMIN,
  usePassedGrantActionGate,
} from '@platform/testing/entitlement-grants/grant-action-gate';
import {
  MOCK_GRANT_ID,
  MOCK_TENANT_ID,
  mockEntitlementGrantRow,
} from '@platform/testing/tenants/fixtures';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  CAPABILITY,
  NEXT_NAVIGATION_ERROR,
} from '@shinefold/config';
import { ENTITLEMENT_KIND, queries } from '@shinefold/db';
import { notFound } from 'next/navigation';

import { revokeEntitlementGrantAction } from './revoke-entitlement-grant-action';

vi.mock('@platform/server/auth/require-super-admin');
vi.mock('@platform/server/audit/record-audit-event');
vi.mock(
  '@platform/server/entitlement-grants/notify-owner-of-entitlement-change',
);
vi.mock('@platform/server/site-config/revalidate-site-config');
vi.mock('@platform/server/tenants/resolve-live-tenant');

vi.mock('@shinefold/db', async () => ({
  ...(await (
    await import('@platform/testing/mock-db-constants')
  ).mockDbConstants()),
  queries: { tenantEntitlementGrants: { revokeEntitlementGrant: vi.fn() } },
}));

const revokeEntitlementGrant = vi.mocked(
  queries.tenantEntitlementGrants.revokeEntitlementGrant,
);
const MOCK_MALFORMED_GRANT_ID = 'not-a-grant';

const revoke = (grantId = MOCK_GRANT_ID) =>
  revokeEntitlementGrantAction(MOCK_TENANT_ID, grantId);

describe(revokeEntitlementGrantAction, () => {
  usePassedGrantActionGate();

  beforeEach(() => {
    revokeEntitlementGrant.mockResolvedValue(mockEntitlementGrantRow());
  });

  it('refuses anyone short of a super admin before writing anything', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(() => notFound());

    await expect(revoke()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(revokeEntitlementGrant).not.toHaveBeenCalled();
  });

  it('closes the grant as the super admin, revalidates the site, audits it and hands it to the owner email once', async () => {
    const result = await revoke();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(revokeEntitlementGrant).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_GRANT_ID,
      MOCK_SUPER_ADMIN.id,
    );
    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(firstRecordedAuditEvent(vi.mocked(recordAuditEvent))).toEqual({
      action: AUDIT_ACTION.ENTITLEMENT_REVOKED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: {
        grantId: MOCK_GRANT_ID,
        kind: ENTITLEMENT_KIND.CAPABILITY,
        key: CAPABILITY.CONTACT_FORM,
        value: null,
        expiresAt: null,
        note: null,
      },
    });
    expect(notifyOwnerOfEntitlementRevoke).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ id: MOCK_TENANT_ID }),
      mockEntitlementGrantRow(),
    );
  });

  it.each([
    {
      grantCase: 'no open grant',
      arrange: () => revokeEntitlementGrant.mockResolvedValueOnce(undefined),
      grantId: MOCK_GRANT_ID,
    },
    {
      grantCase: 'a malformed id',
      arrange: () => undefined,
      grantId: MOCK_MALFORMED_GRANT_ID,
    },
  ])('refuses $grantCase and audits nothing', async ({ arrange, grantId }) => {
    arrange();

    const result = await revoke(grantId);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: ENTITLEMENT_GRANT_REFUSAL.GRANT_NOT_OPEN,
    });
    expect(recordAuditEvent).not.toHaveBeenCalled();
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
    expect(notifyOwnerOfEntitlementRevoke).not.toHaveBeenCalled();
  });

  it('reports a failed write as a server error and audits nothing', async () => {
    revokeEntitlementGrant.mockRejectedValueOnce(
      new Error(MOCK_MALFORMED_GRANT_ID),
    );

    const result = await revoke();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
