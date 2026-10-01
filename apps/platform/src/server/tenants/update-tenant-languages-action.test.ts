import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
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

vi.mock('@platform/utils/logger/logger');

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

const { NL, FR } = LOCALE_ISO_CODES;

describe(updateTenantLanguagesAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1', plan: 'GROWTH' },
      membership: { role: 'OWNER' },
    });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
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

    const result = await updateTenantLanguagesAction('tenant-1', [NL, FR]);

    expect(result).toEqual({ ok: true });
    expect(setTenantAdditionalLocalesMock).toHaveBeenCalledWith('tenant-1', [
      NL,
      FR,
    ]);
    expect(insertAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: 'tenant-1',
        details: { additionalLocales: [NL, FR] },
      }),
    );
  });

  it('rejects a language outside the supported list without saving', async () => {
    const result = await updateTenantLanguagesAction('tenant-1', ['xx']);

    expect(result).toEqual({ ok: false });
    expect(setTenantAdditionalLocalesMock).not.toHaveBeenCalled();
  });

  it('reports a save over the plan limit without auditing it', async () => {
    setTenantAdditionalLocalesMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED,
    });

    const result = await updateTenantLanguagesAction('tenant-1', [NL, FR]);

    expect(result).toEqual({ ok: false });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'tenants.update_languages_rejected',
      expect.objectContaining({ error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED }),
    );
  });
});
