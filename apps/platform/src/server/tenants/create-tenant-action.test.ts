import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { DOMAIN_AVAILABILITY } from '@platform/constants/domain';
import {
  TENANT_FIELD_ERROR,
  TENANT_REFUSAL,
  TENANT_LOG,
} from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { createOwnerInviteToken } from '@platform/server/tenants/owner-invite-token';
import { sendOwnerInviteEmail } from '@platform/server/tenants/send-owner-invite-email';
import {
  MOCK_OPERATOR_ID,
  MOCK_OPERATOR_EMAIL,
} from '@platform/testing/admins/operator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_DOMAIN,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

const OWNER_USER_ID = 'user-1';
const TENANT_ROOT_DOMAIN = 'example.com';
const PROVISIONING_PATH = `/tenants/${MOCK_TENANT_ID}/provisioning`;
const EXISTING_TENANT_ID = 'existing-tenant';

const validOwnerInviteToken = createOwnerInviteToken(MOCK_OWNER_EMAIL);

const {
  requireAdminMock,
  startProvisioningMock,
  getUserByEmailMock,
  getTenantByDomainMock,
  createTenantDraftMock,
  insertAuditEventMock,
  checkDomainAvailabilityMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  startProvisioningMock: vi.fn(),
  getUserByEmailMock: vi.fn(),
  getTenantByDomainMock: vi.fn(),
  createTenantDraftMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  checkDomainAvailabilityMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/tenants/send-owner-invite-email', () => ({
  sendOwnerInviteEmail: vi.fn(),
}));

vi.mock('@platform/server/provisioning/start-provisioning', () => ({
  startProvisioning: startProvisioningMock,
}));

vi.mock('@platform/server/provisioning/check-domain-availability', () => ({
  checkDomainAvailability: checkDomainAvailabilityMock,
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    users: { getUserByEmail: getUserByEmailMock },
    tenants: {
      createTenantDraft: createTenantDraftMock,
    },
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const sendOwnerInviteEmailMock = vi.mocked(sendOwnerInviteEmail);
const loggerErrorMock = vi.mocked(logger.error);
const loggerWarnMock = vi.mocked(logger.warn);

const validInput = {
  name: MOCK_TENANT_NAME,
  domain: MOCK_TENANT_DOMAIN,
  plan: TENANT_PLAN.FREE,
  ownerEmail: MOCK_OWNER_EMAIL,
};

describe('createTenantAction', () => {
  let createTenantAction: typeof import('./create-tenant-action').createTenantAction;

  beforeEach(async () => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    startProvisioningMock.mockReset();
    startProvisioningMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    getUserByEmailMock.mockReset();
    getUserByEmailMock.mockResolvedValue({
      id: OWNER_USER_ID,
      email: MOCK_OWNER_EMAIL,
    });
    getTenantByDomainMock.mockReset();
    getTenantByDomainMock.mockResolvedValue(undefined);
    checkDomainAvailabilityMock.mockReset();
    checkDomainAvailabilityMock.mockResolvedValue(
      DOMAIN_AVAILABILITY.AVAILABLE,
    );
    createTenantDraftMock.mockReset();
    createTenantDraftMock.mockResolvedValue(okResult({ id: MOCK_TENANT_ID }));
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
    loggerWarnMock.mockReset();
    Object.assign(env, { TENANT_ROOT_DOMAIN: undefined });
    ({ createTenantAction } = await import('./create-tenant-action'));
  });

  it('returns field errors for an invalid domain without touching the database', async () => {
    const result = await createTenantAction({
      ...validInput,
      domain: 'not a domain',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { domain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID } },
    });
    expect(getUserByEmailMock).not.toHaveBeenCalled();
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('returns a soft owner-invite confirmation when the owner email matches no user', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_INVITE_UNCONFIRMED,
      email: MOCK_OWNER_EMAIL,
      token: expect.any(String),
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
    expect(sendOwnerInviteEmailMock).not.toHaveBeenCalled();
  });

  it('re-issues a confirmation when the confirming token was for a different email', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    const tokenForOtherEmail = createOwnerInviteToken('other@example.com');

    const result = await createTenantAction({
      ...validInput,
      confirmOwnerInviteToken: tokenForOtherEmail,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_INVITE_UNCONFIRMED,
      email: MOCK_OWNER_EMAIL,
      token: expect.any(String),
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
    expect(sendOwnerInviteEmailMock).not.toHaveBeenCalled();
  });

  it('re-issues a confirmation when the confirming token is invalid', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);

    const result = await createTenantAction({
      ...validInput,
      confirmOwnerInviteToken: 'not-a-real-token',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_INVITE_UNCONFIRMED,
      email: MOCK_OWNER_EMAIL,
      token: expect.any(String),
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
    expect(sendOwnerInviteEmailMock).not.toHaveBeenCalled();
  });

  it('proceeds down the invite path once the token verifies for an unregistered email', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);

    await expect(
      createTenantAction({
        ...validInput,
        confirmOwnerInviteToken: validOwnerInviteToken,
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(createTenantDraftMock).toHaveBeenCalledWith({
      name: MOCK_TENANT_NAME,
      domain: MOCK_TENANT_DOMAIN,
      locale: LOCALE_ISO_CODES.EN,
      plan: TENANT_PLAN.FREE,
      owner: { type: 'invite', email: MOCK_OWNER_EMAIL },
    });
    expect(sendOwnerInviteEmailMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_OWNER_EMAIL,
    );
    expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(redirect).toHaveBeenCalledWith(PROVISIONING_PATH);
  });

  it('never sends the owner-invite email on the found-owner path', async () => {
    await expect(createTenantAction(validInput)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(sendOwnerInviteEmailMock).not.toHaveBeenCalled();
  });

  it('returns a field error when the domain is already taken', async () => {
    getTenantByDomainMock.mockResolvedValue({ id: EXISTING_TENANT_ID });

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { domain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN } },
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it.each([
    ['admin.example.com', TENANT_FIELD_ERROR.SLUG_RESERVED],
    ['www.example.com', TENANT_FIELD_ERROR.SLUG_RESERVED],
  ])(
    'rejects %s under the tenant root domain with its slug reason',
    async (domain, reason) => {
      Object.assign(env, { TENANT_ROOT_DOMAIN });

      const result = await createTenantAction({ ...validInput, domain });

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: { domain: { reason } },
      });
      expect(createTenantDraftMock).not.toHaveBeenCalled();
    },
  );

  it('rejects a slug another tenant holds under the tenant root domain', async () => {
    Object.assign(env, { TENANT_ROOT_DOMAIN });
    getTenantByDomainMock.mockResolvedValue({ id: EXISTING_TENANT_ID });

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { domain: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('accepts a reserved-looking label on a custom domain', async () => {
    Object.assign(env, { TENANT_ROOT_DOMAIN });

    await expect(
      createTenantAction({ ...validInput, domain: 'admin.acme.com' }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(createTenantDraftMock).toHaveBeenCalled();
  });

  it('returns a field error and blocks creation when another project uses the domain', async () => {
    checkDomainAvailabilityMock.mockResolvedValue(DOMAIN_AVAILABILITY.IN_USE);

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: TENANT_FIELD_ERROR.DOMAIN_ATTACHED_ELSEWHERE },
      },
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it.each([
    DOMAIN_AVAILABILITY.AVAILABLE,
    DOMAIN_AVAILABILITY.NOT_CONFIGURED,
    DOMAIN_AVAILABILITY.ERROR,
  ])(
    'proceeds with creation when the domain check reports %s',
    async (availability) => {
      checkDomainAvailabilityMock.mockResolvedValue(availability);

      await expect(createTenantAction(validInput)).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(createTenantDraftMock).toHaveBeenCalled();
    },
  );

  it('returns a generic error and logs at error level when createTenantDraft throws', async () => {
    createTenantDraftMock.mockRejectedValue(new Error('unique violation'));

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.CREATE_DRAFT_FAILED,
      expect.objectContaining({ domain: MOCK_TENANT_DOMAIN }),
    );
  });

  it('returns a generic error and logs on any other createTenantDraft failure', async () => {
    createTenantDraftMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.CREATE_DRAFT_FAILED,
      expect.objectContaining({
        domain: MOCK_TENANT_DOMAIN,
        error: ERROR_CODE.DB_NOT_FOUND,
      }),
    );
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });

  it('creates the draft with the resolved owner id and the platform default locale', async () => {
    await expect(createTenantAction(validInput)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(createTenantDraftMock).toHaveBeenCalledWith({
      name: MOCK_TENANT_NAME,
      domain: MOCK_TENANT_DOMAIN,
      locale: LOCALE_ISO_CODES.EN,
      plan: TENANT_PLAN.FREE,
      owner: { type: 'user', userId: OWNER_USER_ID },
    });
  });

  it('starts provisioning, then redirects to the status page', async () => {
    await expect(createTenantAction(validInput)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(redirect).toHaveBeenCalledWith(PROVISIONING_PATH);
  });

  it.each([
    {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    },
    { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.NOT_FOUND },
    { outcome: ACTION_OUTCOME.SERVER_ERROR },
  ])(
    'still redirects to the status page when provisioning returns %o',
    async (started) => {
      startProvisioningMock.mockResolvedValue(started);

      await expect(createTenantAction(validInput)).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(redirect).toHaveBeenCalledWith(PROVISIONING_PATH);
    },
  );

  it('records a CREATED audit event for the new tenant, with the operator as actor', async () => {
    await expect(createTenantAction(validInput)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.CREATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: {
        name: MOCK_TENANT_NAME,
        domain: MOCK_TENANT_DOMAIN,
        plan: TENANT_PLAN.FREE,
        ownerUserId: OWNER_USER_ID,
      },
    });
  });

  it('records an invited owner without their email address', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);

    await expect(
      createTenantAction({
        ...validInput,
        confirmOwnerInviteToken: validOwnerInviteToken,
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(insertAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        details: {
          name: MOCK_TENANT_NAME,
          domain: MOCK_TENANT_DOMAIN,
          plan: TENANT_PLAN.FREE,
          ownerUserId: null,
        },
      }),
    );
  });

  it('still dispatches and redirects when the audit write fails, and logs it', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));

    await expect(createTenantAction(validInput)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(redirect).toHaveBeenCalledWith(PROVISIONING_PATH);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.CREATE_AUDIT_FAILED,
      expect.objectContaining({
        targetId: MOCK_TENANT_ID,
        error: expect.any(Error),
      }),
    );
  });

  it('requires an admin session before doing anything else', async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(createTenantAction(validInput)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(getUserByEmailMock).not.toHaveBeenCalled();
  });
});
