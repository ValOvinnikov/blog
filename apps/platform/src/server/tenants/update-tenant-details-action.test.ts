import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { TENANT_PLAN, TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { OPERATOR_ID, OPERATOR_EMAIL } from '@platform/testing/admins/operator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant, TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

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

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
      updateTenantDetails: updateTenantDetailsMock,
    },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const loggerErrorMock = vi.mocked(logger.error);
const revalidateSiteConfigMock = vi.mocked(revalidateSiteConfig);

const TENANT_NAME = 'Acme';
const UPDATED = 'updated';
const OWNER_EMAIL = 'owner@example.com';
const NEW_OWNER_EMAIL = 'new-owner@example.com';
const RENAMED_TENANT_NAME = 'Acme Renamed';
const DOMAIN_TAKEN = 'domain-taken';
const DOMAIN_INVALID = 'domain-invalid';
const OWNER_EMAIL_TAKEN = 'owner-email-taken';
const OWNER_ALREADY_JOINED = 'owner-already-joined';

const validInput = {
  name: TENANT_NAME,
  primaryDomain: 'acme.example.com',
  plan: TENANT_PLAN.FREE,
  locale: LOCALE_ISO_CODES.EN,
};

describe('updateTenantDetailsAction', () => {
  let updateTenantDetailsAction: typeof import('./update-tenant-details-action').updateTenantDetailsAction;

  beforeEach(async () => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: OPERATOR_ID, email: OPERATOR_EMAIL },
    });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(makeTenant());
    updateTenantDetailsMock.mockReset();
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
    ({ updateTenantDetailsAction } =
      await import('./update-tenant-details-action'));
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

  it('returns an error and never writes when the tenant no longer exists', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('rejects a write against an archived tenant with no update or audit event', async () => {
    getTenantByIdMock.mockResolvedValue(
      makeTenant({ deprovisionedAt: new Date('2026-08-26T00:00:00.000Z') }),
    );

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns field errors for an invalid domain', async () => {
    const result = await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      primaryDomain: 'not a domain',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
      },
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('returns a field error for an invalid owner email, without touching the database', async () => {
    const result = await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      ownerEmail: 'not-an-email',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { ownerEmail: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID } },
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('passes a supplied ownerEmail to updateTenantDetails and returns the tenant', async () => {
    const tenant = makeTenant({ name: TENANT_NAME });
    updateTenantDetailsMock.mockResolvedValue({ outcome: UPDATED, tenant });

    const result = await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      ownerEmail: 'New-Owner@Example.com',
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS, tenant });
    expect(updateTenantDetailsMock).toHaveBeenCalledWith(TENANT_ID, {
      ...validInput,
      ownerEmail: NEW_OWNER_EMAIL,
    });
  });

  it('does not forward an ownerEmail key when the input omits it', async () => {
    const tenant = makeTenant({ name: TENANT_NAME });
    updateTenantDetailsMock.mockResolvedValue({ outcome: UPDATED, tenant });

    await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(updateTenantDetailsMock).toHaveBeenCalledWith(
      TENANT_ID,
      expect.not.objectContaining({ ownerEmail: expect.anything() }),
    );
  });

  it('maps a domain-taken outcome onto a primaryDomain field error', async () => {
    updateTenantDetailsMock.mockResolvedValue({ outcome: DOMAIN_TAKEN });

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
      },
    });
  });

  it('maps a domain-invalid outcome onto a primaryDomain field error', async () => {
    updateTenantDetailsMock.mockResolvedValue({ outcome: DOMAIN_INVALID });

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
      },
    });
  });

  it('maps a domain-locked outcome to a primaryDomain error naming the blocking step', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: 'domain-locked',
      blockingStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    });

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: {
          reason: TENANT_FIELD_ERROR.DOMAIN_LOCKED,
          values: { step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
        },
      },
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('maps a provisioning-started outcome to a form-level error', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: 'provisioning-started',
    });

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.PROVISIONING_STARTED,
    });
  });

  it('maps an owner-email-taken outcome onto an ownerEmail field error', async () => {
    updateTenantDetailsMock.mockResolvedValue({ outcome: OWNER_EMAIL_TAKEN });

    const result = await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      ownerEmail: NEW_OWNER_EMAIL,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        ownerEmail: { reason: TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN },
      },
    });
  });

  it('succeeds on a rename that resends the current owner email after they joined', async () => {
    const tenant = makeTenant({ name: RENAMED_TENANT_NAME });
    updateTenantDetailsMock.mockResolvedValue({ outcome: UPDATED, tenant });

    const result = await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      name: RENAMED_TENANT_NAME,
      ownerEmail: OWNER_EMAIL,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS, tenant });
    expect(updateTenantDetailsMock).toHaveBeenCalledWith(TENANT_ID, {
      ...validInput,
      name: RENAMED_TENANT_NAME,
      ownerEmail: OWNER_EMAIL,
    });
  });

  it('maps an owner-already-joined outcome to a distinct form-level error', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: OWNER_ALREADY_JOINED,
    });

    const result = await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      ownerEmail: NEW_OWNER_EMAIL,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
    });
  });

  it('does not record an audit event for an owner-email-taken outcome', async () => {
    updateTenantDetailsMock.mockResolvedValue({ outcome: OWNER_EMAIL_TAKEN });

    await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      ownerEmail: NEW_OWNER_EMAIL,
    });

    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('does not record an audit event for an owner-already-joined outcome', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: OWNER_ALREADY_JOINED,
    });

    await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      ownerEmail: NEW_OWNER_EMAIL,
    });

    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns the updated tenant on success', async () => {
    const tenant = makeTenant({ name: TENANT_NAME });
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant,
    });

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

  it('does not refresh the public site when the update is rejected', async () => {
    updateTenantDetailsMock.mockResolvedValue({ outcome: DOMAIN_TAKEN });

    await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
  });

  it('records a SETTINGS_UPDATED audit event for the tenant with the operator as actor', async () => {
    const tenant = makeTenant({ name: TENANT_NAME });
    updateTenantDetailsMock.mockResolvedValue({ outcome: UPDATED, tenant });

    await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: OPERATOR_ID,
      actorEmail: OPERATOR_EMAIL,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: TENANT_ID,
      details: { ...validInput, ownerEmailUpdated: false },
    });
  });

  it("records that the owner's invite email changed without recording the address", async () => {
    const tenant = makeTenant({ name: TENANT_NAME });
    updateTenantDetailsMock.mockResolvedValue({ outcome: UPDATED, tenant });

    await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      ownerEmail: NEW_OWNER_EMAIL,
    });

    expect(insertAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        details: { ...validInput, ownerEmailUpdated: true },
      }),
    );
  });

  it('still returns the updated tenant when the audit write fails, and logs it', async () => {
    const tenant = makeTenant({ name: TENANT_NAME });
    updateTenantDetailsMock.mockResolvedValue({ outcome: UPDATED, tenant });
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS, tenant });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.update_details_audit_failed',
      expect.objectContaining({
        targetId: TENANT_ID,
        error: expect.any(Error),
      }),
    );
  });

  it('does not record an audit event for a domain-taken outcome', async () => {
    updateTenantDetailsMock.mockResolvedValue({ outcome: DOMAIN_TAKEN });

    await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('does not record an audit event for a domain-invalid outcome', async () => {
    updateTenantDetailsMock.mockResolvedValue({ outcome: DOMAIN_INVALID });

    await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns a generic error when the mutation throws', async () => {
    updateTenantDetailsMock.mockRejectedValue(new Error('connection lost'));

    const result = await updateTenantDetailsAction(TENANT_ID, validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });

  it('rejects a language outside the supported list without saving', async () => {
    const result = await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      locale: 'en-US',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        locale: { reason: TENANT_FIELD_ERROR.LOCALE_UNSUPPORTED },
      },
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('rejects a default language that is already an additional one', async () => {
    getTenantByIdMock.mockResolvedValue(
      makeTenant({
        locale: LOCALE_ISO_CODES.EN,
        additionalLocales: [LOCALE_ISO_CODES.NL],
      }),
    );

    const result = await updateTenantDetailsAction(TENANT_ID, {
      ...validInput,
      locale: LOCALE_ISO_CODES.NL,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.LOCALE_IS_ADDITIONAL,
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });
});
