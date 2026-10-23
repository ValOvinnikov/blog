import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { TENANT_PLAN, TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { OWNS_FREE_TENANT_OUTCOME } from '@blog/db/queries/tenants/update-tenant-details/update-tenant-details';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { OPERATOR_ID, OPERATOR_EMAIL } from '@platform/testing/admins/operator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  makeTenant,
  MOCK_ARCHIVED_AT,
  MOCK_NEW_OWNER_EMAIL,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { updateTenantDetailsAction } from './update-tenant-details-action';

const {
  requireAdminMock,
  getTenantByIdMock,
  updateTenantDetailsMock,
  insertAuditEventMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  updateTenantDetailsMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@blog/db/utils/env/env', () => ({ env: {} }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
      updateTenantDetails: updateTenantDetailsMock,
      OWNS_FREE_TENANT_OUTCOME,
    },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const loggerErrorMock = vi.mocked(logger.error);
const revalidateSiteConfigMock = vi.mocked(revalidateSiteConfig);

const UPDATED = 'updated';
const DOMAIN_TAKEN = 'domain-taken';
const DOMAIN_INVALID = 'domain-invalid';
const DOMAIN_LOCKED = 'domain-locked';
const PROVISIONING_STARTED = 'provisioning-started';
const OWNER_EMAIL_TAKEN = 'owner-email-taken';
const OWNER_ALREADY_JOINED = 'owner-already-joined';

const validInput = {
  name: MOCK_TENANT_NAME,
  primaryDomain: MOCK_TENANT_DOMAIN,
  plan: TENANT_PLAN.FREE,
  locale: LOCALE_ISO_CODES.EN,
};

const inputWithNewOwner = { ...validInput, ownerEmail: MOCK_NEW_OWNER_EMAIL };

const REJECTED_OUTCOME_CASES = [
  {
    dbResult: { outcome: DOMAIN_TAKEN },
    input: validInput,
    expected: {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
      },
    },
  },
  {
    dbResult: { outcome: DOMAIN_INVALID },
    input: validInput,
    expected: {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
      },
    },
  },
  {
    dbResult: {
      outcome: DOMAIN_LOCKED,
      blockingStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    },
    input: validInput,
    expected: {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: {
          reason: TENANT_FIELD_ERROR.DOMAIN_LOCKED,
          values: { step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
        },
      },
    },
  },
  {
    dbResult: { outcome: PROVISIONING_STARTED },
    input: validInput,
    expected: {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.PROVISIONING_STARTED,
    },
  },
  {
    dbResult: { outcome: OWNER_EMAIL_TAKEN },
    input: inputWithNewOwner,
    expected: {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        ownerEmail: { reason: TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN },
      },
    },
  },
  {
    dbResult: { outcome: OWNER_ALREADY_JOINED },
    input: inputWithNewOwner,
    expected: {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
    },
  },
  {
    dbResult: { outcome: OWNS_FREE_TENANT_OUTCOME },
    input: inputWithNewOwner,
    expected: {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
    },
  },
];

const INVALID_INPUT_CASES = [
  {
    title: 'primary domain',
    override: { primaryDomain: 'not a domain' },
    fieldErrors: {
      primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
    },
  },
  {
    title: 'owner email',
    override: { ownerEmail: 'not-an-email' },
    fieldErrors: { ownerEmail: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID } },
  },
  {
    title: 'language outside the supported list',
    override: { locale: 'en-US' },
    fieldErrors: {
      locale: { reason: TENANT_FIELD_ERROR.LOCALE_UNSUPPORTED },
    },
  },
];

const REFUSED_TENANT_CASES = [
  {
    title: 'a missing tenant',
    existing: undefined,
    input: validInput,
    reason: TENANT_REFUSAL.NOT_FOUND,
  },
  {
    title: 'an archived tenant',
    existing: makeTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    input: validInput,
    reason: TENANT_REFUSAL.ARCHIVED,
  },
  {
    title: 'a default language that is already additional',
    existing: makeTenant({
      locale: LOCALE_ISO_CODES.EN,
      additionalLocales: [LOCALE_ISO_CODES.NL],
    }),
    input: { ...validInput, locale: LOCALE_ISO_CODES.NL },
    reason: TENANT_REFUSAL.LOCALE_IS_ADDITIONAL,
  },
];

const auditEventFor = (details: Record<string, unknown>) => ({
  actorId: OPERATOR_ID,
  actorEmail: OPERATOR_EMAIL,
  action: AUDIT_ACTION.SETTINGS_UPDATED,
  targetType: AUDIT_TARGET_TYPE.TENANT,
  targetId: TENANT_ID,
  details,
});

describe(updateTenantDetailsAction, () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue(makeAdmin());
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: OPERATOR_ID, email: OPERATOR_EMAIL },
    });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(makeTenant());
    updateTenantDetailsMock.mockReset();
    insertAuditEventMock.mockReset();
  });

  it('requires an admin session before validating or saving anything', async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(
      updateTenantDetailsAction(TENANT_ID, validInput),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it.each(REFUSED_TENANT_CASES)(
    'refuses $title without a write or audit event',
    async ({ existing, input, reason }) => {
      getTenantByIdMock.mockResolvedValue(existing);

      const result = await updateTenantDetailsAction(TENANT_ID, input);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
      expect(updateTenantDetailsMock).not.toHaveBeenCalled();
      expect(insertAuditEventMock).not.toHaveBeenCalled();
    },
  );

  it.each(INVALID_INPUT_CASES)(
    'returns a field error for an invalid $title without saving',
    async ({ override, fieldErrors }) => {
      const result = await updateTenantDetailsAction(TENANT_ID, {
        ...validInput,
        ...override,
      });

      expect(result).toEqual({ outcome: ACTION_OUTCOME.INVALID, fieldErrors });
      expect(updateTenantDetailsMock).not.toHaveBeenCalled();
    },
  );

  it('normalises and forwards a supplied ownerEmail, returning the tenant', async () => {
    const tenant = makeTenant();
    updateTenantDetailsMock.mockResolvedValue({ outcome: UPDATED, tenant });

    const result = await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_NEW_OWNER_EMAIL.toUpperCase(),
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS, tenant });
    expect(updateTenantDetailsMock).toHaveBeenCalledWith(
      TENANT_ID,
      inputWithNewOwner,
    );
  });

  it('forwards no ownerEmail key when the input omits it', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant: makeTenant(),
    });

    await updateTenantDetailsAction(TENANT_ID, validInput);

    const [, forwardedDetails] = updateTenantDetailsMock.mock.calls[0] ?? [];
    expect(Object.keys(forwardedDetails)).toEqual(Object.keys(validInput));
  });

  it.each(REJECTED_OUTCOME_CASES)(
    'maps a $dbResult.outcome outcome onto its failure result',
    async ({ dbResult, input, expected }) => {
      updateTenantDetailsMock.mockResolvedValue(dbResult);

      const result = await updateTenantDetailsAction(TENANT_ID, input);

      expect(result).toEqual(expected);
    },
  );

  it.each(REJECTED_OUTCOME_CASES)(
    'records no audit event and skips the refresh on $dbResult.outcome',
    async ({ dbResult, input }) => {
      updateTenantDetailsMock.mockResolvedValue(dbResult);

      await updateTenantDetailsAction(TENANT_ID, input);

      expect(insertAuditEventMock).not.toHaveBeenCalled();
      expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    },
  );

  it('returns the updated tenant and the details it saved', async () => {
    const tenant = makeTenant({ name: MOCK_TENANT_NAME });
    updateTenantDetailsMock.mockResolvedValue({ outcome: UPDATED, tenant });

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS, tenant });
    expect(updateTenantDetailsMock).toHaveBeenCalledWith(TENANT_ID, validInput);
  });

  it('refreshes the public site for the tenant after a successful update', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant: makeTenant(),
    });

    await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(revalidateSiteConfigMock).toHaveBeenCalledWith(TENANT_ID);
  });

  it('records a SETTINGS_UPDATED audit event with the operator as actor', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant: makeTenant(),
    });

    await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(insertAuditEventMock).toHaveBeenCalledWith(
      auditEventFor({ ...validInput, ownerEmailUpdated: false }),
    );
  });

  it("records that the owner's email changed without recording the address", async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant: makeTenant(),
    });

    await updateTenantDetailsAction(TENANT_ID, inputWithNewOwner);

    expect(insertAuditEventMock).toHaveBeenCalledWith(
      auditEventFor({ ...validInput, ownerEmailUpdated: true }),
    );
  });

  it('still returns the tenant and logs when the audit write fails', async () => {
    const tenant = makeTenant({ name: MOCK_TENANT_NAME });
    const auditError = new Error('connection reset');
    updateTenantDetailsMock.mockResolvedValue({ outcome: UPDATED, tenant });
    insertAuditEventMock.mockRejectedValue(auditError);

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS, tenant });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.update_details_audit_failed',
      {
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: TENANT_ID,
        error: auditError,
      },
    );
  });

  it('returns a server error when the mutation throws', async () => {
    updateTenantDetailsMock.mockRejectedValue(new Error('connection lost'));

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});
