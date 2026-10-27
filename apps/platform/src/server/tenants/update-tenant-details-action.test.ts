import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import {
  TENANT_DETAILS_UPDATE_OUTCOME,
  TENANT_PLAN,
  TENANT_PROVISIONING_STEP,
} from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { OWNER_INVITE_RESEND_PATH } from '@platform/constants/owner-access';
import {
  TENANT_FIELD_ERROR,
  TENANT_REFUSAL,
  TENANT_LOG,
} from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { enqueueOwnerAccessRequest } from '@platform/server/owner-access/request-owner-access';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { sendOwnerInviteEmail } from '@platform/server/tenants/send-owner-invite-email';
import {
  MOCK_OPERATOR_ID,
  MOCK_OPERATOR_EMAIL,
} from '@platform/testing/admins/operator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockReadyTenant,
  mockTenant,
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_NEW_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
  MOCK_RENAMED_TENANT_NAME,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { updateTenantDetailsAction } from './update-tenant-details-action';

faker.seed(8123);

const MOCK_AUDIT_EVENT_ID = faker.string.uuid();
const MOCK_INVALID_DOMAIN = faker.lorem.words(2);
const MOCK_INVALID_EMAIL = faker.lorem.word();
const MOCK_UNSUPPORTED_LOCALE = 'en-US';
const MOCK_AUDIT_WRITE_ERROR = new Error(faker.lorem.sentence());
const MOCK_UPDATE_ERROR = new Error(faker.lorem.sentence());
const MOCK_UPDATED_TENANT = mockTenant({ name: MOCK_TENANT_NAME });

const { getTenantByIdMock, updateTenantDetailsMock, insertAuditEventMock } =
  vi.hoisted(() => ({
    getTenantByIdMock: vi.fn(),
    updateTenantDetailsMock: vi.fn(),
    insertAuditEventMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/require-admin');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@platform/server/owner-access/request-owner-access', () => ({
  enqueueOwnerAccessRequest: vi.fn(),
}));

vi.mock('@platform/server/tenants/send-owner-invite-email', () => ({
  sendOwnerInviteEmail: vi.fn(),
}));

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

const requireAdminMock = vi.mocked(requireAdmin);
const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const loggerErrorMock = vi.mocked(logger.error);
const revalidateSiteConfigMock = vi.mocked(revalidateSiteConfig);
const sendOwnerInviteEmailMock = vi.mocked(sendOwnerInviteEmail);
const enqueueOwnerAccessRequestMock = vi.mocked(enqueueOwnerAccessRequest);

const {
  UPDATED,
  DOMAIN_TAKEN,
  DOMAIN_INVALID,
  DOMAIN_LOCKED,
  PROVISIONING_STARTED,
  OWNER_EMAIL_TAKEN,
  OWNER_ALREADY_JOINED,
  OWNS_FREE_TENANT,
} = TENANT_DETAILS_UPDATE_OUTCOME;

const validInput = {
  name: MOCK_TENANT_NAME,
  primaryDomain: MOCK_TENANT_DOMAIN,
  plan: TENANT_PLAN.FREE,
  locale: LOCALE_ISO_CODES.EN,
};

describe(updateTenantDetailsAction, () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(mockTenant());
    updateTenantDetailsMock.mockReset();
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant: MOCK_UPDATED_TENANT,
      ownerEmailChanged: false,
    });
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: MOCK_AUDIT_EVENT_ID });
    loggerErrorMock.mockReset();
    sendOwnerInviteEmailMock.mockReset();
    enqueueOwnerAccessRequestMock.mockReset();
  });

  it('requires an admin session before validating or saving', async () => {
    requireAdminMock.mockImplementationOnce(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(
      updateTenantDetailsAction(MOCK_TENANT_ID, validInput),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('returns an error and never writes when the tenant no longer exists', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const result = await updateTenantDetailsAction(MOCK_TENANT_ID, validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('rejects a write against an archived tenant with no update or audit event', async () => {
    getTenantByIdMock.mockResolvedValue(
      mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    );

    const result = await updateTenantDetailsAction(MOCK_TENANT_ID, validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns field errors for an invalid domain', async () => {
    const result = await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      primaryDomain: MOCK_INVALID_DOMAIN,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
      },
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('returns a field error for an invalid owner email without saving', async () => {
    const result = await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_INVALID_EMAIL,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { ownerEmail: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID } },
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('saves a normalised owner email and returns the updated tenant', async () => {
    const result = await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_NEW_OWNER_EMAIL.toUpperCase(),
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      tenant: MOCK_UPDATED_TENANT,
    });
    expect(updateTenantDetailsMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_NEW_OWNER_EMAIL,
    });
  });

  it('does not forward an ownerEmail key when the input omits it', async () => {
    await updateTenantDetailsAction(MOCK_TENANT_ID, validInput);

    const [tenantId, input] = updateTenantDetailsMock.mock.lastCall ?? [];

    expect(tenantId).toBe(MOCK_TENANT_ID);
    expect(input).toStrictEqual(validInput);
  });

  it.each([
    {
      updateResult: { outcome: DOMAIN_TAKEN },
      expected: {
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
        },
      },
    },
    {
      updateResult: { outcome: DOMAIN_INVALID },
      expected: {
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
        },
      },
    },
    {
      updateResult: {
        outcome: DOMAIN_LOCKED,
        blockingStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      },
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
      updateResult: { outcome: PROVISIONING_STARTED },
      expected: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.PROVISIONING_STARTED,
      },
    },
    {
      updateResult: { outcome: OWNER_EMAIL_TAKEN },
      expected: {
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          ownerEmail: { reason: TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN },
        },
      },
    },
    {
      updateResult: { outcome: OWNER_ALREADY_JOINED },
      expected: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
      },
    },
    {
      updateResult: { outcome: OWNS_FREE_TENANT },
      expected: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
      },
    },
  ])(
    'maps a rejected $updateResult.outcome update without auditing or revalidating',
    async ({ updateResult, expected }) => {
      updateTenantDetailsMock.mockResolvedValue(updateResult);

      const result = await updateTenantDetailsAction(MOCK_TENANT_ID, {
        ...validInput,
        ownerEmail: MOCK_NEW_OWNER_EMAIL,
      });

      expect(result).toEqual(expected);
      expect(insertAuditEventMock).not.toHaveBeenCalled();
      expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    },
  );

  it('succeeds on a rename that resends the current owner email after they joined', async () => {
    const tenant = mockTenant({ name: MOCK_RENAMED_TENANT_NAME });
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant,
      ownerEmailChanged: false,
    });

    const result = await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      name: MOCK_RENAMED_TENANT_NAME,
      ownerEmail: MOCK_OWNER_EMAIL,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS, tenant });
    expect(updateTenantDetailsMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      ...validInput,
      name: MOCK_RENAMED_TENANT_NAME,
      ownerEmail: MOCK_OWNER_EMAIL,
    });
  });

  it('refreshes the public site for the tenant after a successful update', async () => {
    await updateTenantDetailsAction(MOCK_TENANT_ID, validInput);

    expect(revalidateSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('records a SETTINGS_UPDATED audit event with the operator as actor', async () => {
    await updateTenantDetailsAction(MOCK_TENANT_ID, validInput);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { ...validInput, ownerEmailUpdated: false },
    });
  });

  it("records that the owner's invite email changed without recording the address", async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant: MOCK_UPDATED_TENANT,
      ownerEmailChanged: true,
    });

    await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_NEW_OWNER_EMAIL,
    });

    const [event] = insertAuditEventMock.mock.lastCall ?? [];

    expect(event.details).toStrictEqual({
      ...validInput,
      ownerEmailUpdated: true,
    });
  });

  it('sends a fresh owner invite to the new address when the owner email changed', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant: MOCK_UPDATED_TENANT,
      ownerEmailChanged: true,
    });

    await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_NEW_OWNER_EMAIL,
    });

    expect(sendOwnerInviteEmailMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_NEW_OWNER_EMAIL,
    );
  });

  it('re-sends the Sanity project invite once a provisioned owner email changed', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant: mockReadyTenant(),
      ownerEmailChanged: true,
    });

    await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_NEW_OWNER_EMAIL,
    });

    expect(enqueueOwnerAccessRequestMock).toHaveBeenCalledExactlyOnceWith(
      OWNER_INVITE_RESEND_PATH,
      MOCK_TENANT_ID,
    );
    expect(sendOwnerInviteEmailMock.mock.invocationCallOrder[0]).toBeLessThan(
      enqueueOwnerAccessRequestMock.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('re-sends no Sanity invite while the tenant has no Sanity project', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant: MOCK_UPDATED_TENANT,
      ownerEmailChanged: true,
    });

    await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_NEW_OWNER_EMAIL,
    });

    expect(enqueueOwnerAccessRequestMock).not.toHaveBeenCalled();
  });

  it('re-sends no Sanity invite when the owner email is unchanged', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: UPDATED,
      tenant: mockReadyTenant(),
      ownerEmailChanged: false,
    });

    await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_OWNER_EMAIL,
    });

    expect(enqueueOwnerAccessRequestMock).not.toHaveBeenCalled();
  });

  it('sends no owner invite when the owner email is resubmitted unchanged', async () => {
    await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_OWNER_EMAIL,
    });

    expect(sendOwnerInviteEmailMock).not.toHaveBeenCalled();
  });

  it('sends no owner invite when the update is refused', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: OWNER_ALREADY_JOINED,
    });

    await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      ownerEmail: MOCK_NEW_OWNER_EMAIL,
    });

    expect(sendOwnerInviteEmailMock).not.toHaveBeenCalled();
  });

  it('still returns the updated tenant when the audit write fails, and logs it', async () => {
    insertAuditEventMock.mockRejectedValue(MOCK_AUDIT_WRITE_ERROR);

    const result = await updateTenantDetailsAction(MOCK_TENANT_ID, validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      tenant: MOCK_UPDATED_TENANT,
    });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.UPDATE_DETAILS_AUDIT_FAILED,
      {
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        errorName: MOCK_AUDIT_WRITE_ERROR.name,
      },
    );
  });

  it('returns a server error when the mutation throws', async () => {
    updateTenantDetailsMock.mockRejectedValue(MOCK_UPDATE_ERROR);

    const result = await updateTenantDetailsAction(MOCK_TENANT_ID, validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });

  it('rejects a language outside the supported list without saving', async () => {
    const result = await updateTenantDetailsAction(MOCK_TENANT_ID, {
      ...validInput,
      locale: MOCK_UNSUPPORTED_LOCALE,
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
      mockTenant({
        locale: LOCALE_ISO_CODES.EN,
        additionalLocales: [LOCALE_ISO_CODES.NL],
      }),
    );

    const result = await updateTenantDetailsAction(MOCK_TENANT_ID, {
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
