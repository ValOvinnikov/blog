import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { OPERATOR_EMAIL, OPERATOR_ID } from '@platform/testing/admins/operator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { updateTenantLanguagesAction } from './update-tenant-languages-action';

const { setTenantAdditionalLocalesMock, insertAuditEventMock } = vi.hoisted(
  () => ({
    setTenantAdditionalLocalesMock: vi.fn(),
    insertAuditEventMock: vi.fn(),
  }),
);

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { setTenantAdditionalLocales: setTenantAdditionalLocalesMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const loggerWarnMock = vi.mocked(logger.warn);
const revalidateSiteConfigMock = vi.mocked(revalidateSiteConfig);

const { NL, FR } = LOCALE_ISO_CODES;

describe(updateTenantLanguagesAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: TENANT_ID, plan: TENANT_PLAN.GROWTH },
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: OPERATOR_ID, email: OPERATOR_EMAIL },
    });
    setTenantAdditionalLocalesMock.mockReset();
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerWarnMock.mockReset();
  });

  it('saves the languages and audits the change', async () => {
    setTenantAdditionalLocalesMock.mockResolvedValue({
      ok: true,
      data: [NL, FR],
    });

    const result = await updateTenantLanguagesAction(TENANT_ID, [NL, FR]);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(setTenantAdditionalLocalesMock).toHaveBeenCalledWith(TENANT_ID, [
      NL,
      FR,
    ]);
    expect(insertAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: TENANT_ID,
        details: { additionalLocales: [NL, FR] },
      }),
    );
  });

  it('refreshes the public site for the tenant after saving', async () => {
    setTenantAdditionalLocalesMock.mockResolvedValue({ ok: true, data: [NL] });

    await updateTenantLanguagesAction(TENANT_ID, [NL]);

    expect(revalidateSiteConfigMock).toHaveBeenCalledWith(TENANT_ID);
  });

  it('rejects a language outside the supported list without saving', async () => {
    const result = await updateTenantLanguagesAction(TENANT_ID, ['xx']);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(setTenantAdditionalLocalesMock).not.toHaveBeenCalled();
  });

  it('reports a save over the plan limit without auditing it', async () => {
    setTenantAdditionalLocalesMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED,
    });

    const result = await updateTenantLanguagesAction(TENANT_ID, [NL, FR]);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'tenants.update_languages_rejected',
      expect.objectContaining({ error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED }),
    );
  });

  it('reports the default language among the additional ones as invalid input', async () => {
    setTenantAdditionalLocalesMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_DEFAULT_LOCALE_REPEATED,
    });

    const result = await updateTenantLanguagesAction(TENANT_ID, [NL]);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('refuses a save for a tenant that no longer exists, without a warning', async () => {
    setTenantAdditionalLocalesMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const result = await updateTenantLanguagesAction(TENANT_ID, [NL]);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_FOUND,
    });
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });
});
