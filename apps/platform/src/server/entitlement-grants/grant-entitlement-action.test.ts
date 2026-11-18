import {
  ENTITLEMENT_GRANT_EXPIRY,
  ENTITLEMENT_GRANT_REFUSAL,
} from '@platform/constants/entitlement-grant';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { resolveLiveTenant } from '@platform/server/tenants/resolve-live-tenant';
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
import { ERROR_CODE } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND, queries } from '@shinefold/db';
import { errorResult, okResult } from '@shinefold/utils';
import { notFound } from 'next/navigation';

import { grantEntitlementAction } from './grant-entitlement-action';

vi.mock('@platform/server/auth/require-super-admin');
vi.mock('@platform/server/audit/record-audit-event');
vi.mock('@platform/server/site-config/revalidate-site-config');
vi.mock('@platform/server/tenants/resolve-live-tenant');

vi.mock('@shinefold/db', async () => ({
  ...(await (
    await import('@platform/testing/mock-db-constants')
  ).mockDbConstants()),
  queries: { tenantEntitlementGrants: { grantEntitlement: vi.fn() } },
}));

const grantEntitlement = vi.mocked(
  queries.tenantEntitlementGrants.grantEntitlement,
);
const MOCK_NOTE = 'Launch partner';
const MOCK_NOW = new Date('2026-11-18T10:00:00.000Z');
const MOCK_IN_30_DAYS = new Date('2026-12-18T10:00:00.000Z');
const CONTACT_FORM_ITEM = {
  kind: ENTITLEMENT_KIND.CAPABILITY,
  key: CAPABILITY.CONTACT_FORM,
} as const;

const grant = (overrides = {}) =>
  grantEntitlementAction(MOCK_TENANT_ID, {
    item: CONTACT_FORM_ITEM,
    expiry: ENTITLEMENT_GRANT_EXPIRY.DAYS_30,
    note: MOCK_NOTE,
    ...overrides,
  });

describe(grantEntitlementAction, () => {
  usePassedGrantActionGate();

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useFakeTimers({ now: MOCK_NOW });
    grantEntitlement.mockResolvedValue(
      okResult(
        mockEntitlementGrantRow({
          expiresAt: MOCK_IN_30_DAYS,
          note: MOCK_NOTE,
        }),
      ),
    );
  });

  it('refuses anyone short of a super admin before writing anything', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(() => notFound());

    await expect(grant()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(grantEntitlement).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('writes the grant as the super admin, revalidates the site and audits it', async () => {
    const result = await grant();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(grantEntitlement).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      item: CONTACT_FORM_ITEM,
      grantedBy: MOCK_SUPER_ADMIN.id,
      expiresAt: MOCK_IN_30_DAYS,
      note: MOCK_NOTE,
    });
    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(firstRecordedAuditEvent(vi.mocked(recordAuditEvent))).toEqual({
      action: AUDIT_ACTION.ENTITLEMENT_GRANTED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: {
        grantId: MOCK_GRANT_ID,
        kind: ENTITLEMENT_KIND.CAPABILITY,
        key: CAPABILITY.CONTACT_FORM,
        value: null,
        expiresAt: MOCK_IN_30_DAYS,
        note: MOCK_NOTE,
      },
    });
  });

  it('stores a blank note as none', async () => {
    await grant({ note: ' ' });

    expect(grantEntitlement).toHaveBeenCalledWith(
      expect.objectContaining({ note: null }),
    );
  });

  it('refuses a coming-soon capability without writing', async () => {
    const result = await grant({
      item: { kind: ENTITLEMENT_KIND.CAPABILITY, key: CAPABILITY.NEWSLETTER },
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: ENTITLEMENT_GRANT_REFUSAL.COMING_SOON,
    });
    expect(grantEntitlement).not.toHaveBeenCalled();
  });

  it('stores no expiry for a grant that never expires', async () => {
    await grant({ expiry: ENTITLEMENT_GRANT_EXPIRY.NEVER });

    expect(grantEntitlement).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: null }),
    );
  });

  it('rejects a language limit no plan could need', async () => {
    const result = await grant({
      item: { kind: ENTITLEMENT_KIND.LOCALE_LIMIT, value: 1 },
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
  });

  it('passes on the refusal for an archived tenant without writing', async () => {
    const refusal = {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    } as const;
    vi.mocked(resolveLiveTenant).mockResolvedValueOnce(refusal);

    const result = await grant();

    expect(result).toEqual(refusal);
    expect(grantEntitlement).not.toHaveBeenCalled();
  });

  it('refuses a second open grant of the same item and audits nothing', async () => {
    grantEntitlement.mockResolvedValueOnce(
      errorResult(ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED),
    );

    const result = await grant();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: ENTITLEMENT_GRANT_REFUSAL.ALREADY_GRANTED,
    });
    expect(recordAuditEvent).not.toHaveBeenCalled();
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it('reports a failed write as a server error and audits nothing', async () => {
    grantEntitlement.mockRejectedValueOnce(new Error(ERROR_CODE.DB_NOT_FOUND));

    const result = await grant();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
