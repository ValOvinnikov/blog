import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PLAN } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';
import { TENANT_LOG } from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { updateTenantLanguagesAction } from './update-tenant-languages-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { setTenantAdditionalLocales: vi.fn() },
    auditEvents: { insertAuditEvent: vi.fn() },
  },
}));

faker.seed(5997);

const MOCK_SESSION_EXPIRES = '2099-01-01T00:00:00.000Z';
const MOCK_UNSUPPORTED_LOCALE = faker.string.alpha(2);
const MOCK_SAVE_ERROR = new Error(faker.lorem.sentence());

const setTenantAdditionalLocalesMock = vi.mocked(
  queries.tenants.setTenantAdditionalLocales,
);
const authMock = vi.mocked<() => Promise<Session | null>>(auth);
const insertAuditEventMock = vi.mocked(queries.auditEvents.insertAuditEvent);

const { NL, FR } = LOCALE_ISO_CODES;

describe(updateTenantLanguagesAction, () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('saves the languages and audits the change', async () => {
    authMock.mockResolvedValueOnce({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
      expires: MOCK_SESSION_EXPIRES,
    });
    setTenantAdditionalLocalesMock.mockResolvedValueOnce(okResult([NL, FR]));

    const result = await updateTenantLanguagesAction(MOCK_TENANT_ID, [NL, FR]);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(setTenantAdditionalLocalesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      [NL, FR],
    );
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { additionalLocales: [NL, FR] },
    });
  });

  it('refreshes the public site for the tenant after saving', async () => {
    setTenantAdditionalLocalesMock.mockResolvedValueOnce(okResult([NL]));

    await updateTenantLanguagesAction(MOCK_TENANT_ID, [NL]);

    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('rejects a language outside the supported list without saving', async () => {
    const result = await updateTenantLanguagesAction(MOCK_TENANT_ID, [
      MOCK_UNSUPPORTED_LOCALE,
    ]);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(setTenantAdditionalLocalesMock).not.toHaveBeenCalled();
  });

  it('reports a save over the plan limit without auditing it', async () => {
    setTenantAdditionalLocalesMock.mockResolvedValueOnce(
      errorResult(ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED),
    );

    const result = await updateTenantLanguagesAction(MOCK_TENANT_ID, [NL, FR]);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      TENANT_LOG.UPDATE_LANGUAGES_REJECTED,
      {
        tenantId: MOCK_TENANT_ID,
        plan: TENANT_PLAN.FREE,
        error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED,
      },
    );
  });

  it('reports the default language among the additional ones as invalid input', async () => {
    setTenantAdditionalLocalesMock.mockResolvedValueOnce(
      errorResult(ERROR_CODE.DB_DEFAULT_LOCALE_REPEATED),
    );

    const result = await updateTenantLanguagesAction(MOCK_TENANT_ID, [NL]);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('refuses a save for a tenant that no longer exists, without a warning', async () => {
    setTenantAdditionalLocalesMock.mockResolvedValueOnce(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await updateTenantLanguagesAction(MOCK_TENANT_ID, [NL]);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_FOUND,
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('reports a server error and logs it when the save throws', async () => {
    setTenantAdditionalLocalesMock.mockRejectedValueOnce(MOCK_SAVE_ERROR);

    const result = await updateTenantLanguagesAction(MOCK_TENANT_ID, [NL]);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      TENANT_LOG.UPDATE_LANGUAGES_FAILED,
      { tenantId: MOCK_TENANT_ID, errorName: MOCK_SAVE_ERROR.name },
    );
  });
});
