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
import { auth, signIn } from '@platform/server/auth/auth';
import { createOwnerInviteToken } from '@platform/server/tenants/owner-invite-token';
import {
  MOCK_OPERATOR_ID,
  MOCK_OPERATOR_EMAIL,
} from '@platform/testing/admins/operator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_SLUG,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

const OWNER_USER_ID = 'user-1';
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
const signInMock = vi.mocked(signIn);
const loggerErrorMock = vi.mocked(logger.error);
const loggerWarnMock = vi.mocked(logger.warn);

const validInput = {
  name: MOCK_TENANT_NAME,
  slug: MOCK_TENANT_SLUG,
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
    signInMock.mockReset();
    signInMock.mockResolvedValue(okResult());
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
    Object.assign(env, { TENANT_ROOT_DOMAIN: MOCK_TENANT_ROOT_DOMAIN });
    ({ createTenantAction } = await import('./create-tenant-action'));
  });

  it('returns field errors for an invalid site address without touching the database', async () => {
    const result = await createTenantAction({
      ...validInput,
      slug: MOCK_TENANT_DOMAIN,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_INVALID } },
    });
    expect(getUserByEmailMock).not.toHaveBeenCalled();
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('logs and returns a server error when no tenant root domain is configured', async () => {
    Object.assign(env, { TENANT_ROOT_DOMAIN: undefined });

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.ROOT_DOMAIN_MISSING,
    );
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('creates the tenant at the site address under the tenant root domain', async () => {
    await expect(
      createTenantAction({ ...validInput, slug: ' Acme ' }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(createTenantDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({ domain: MOCK_TENANT_DOMAIN }),
    );
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
    expect(signInMock).not.toHaveBeenCalled();
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
    expect(signInMock).not.toHaveBeenCalled();
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
    expect(signInMock).not.toHaveBeenCalled();
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
    expect(signInMock).toHaveBeenCalledWith('email', {
      email: MOCK_OWNER_EMAIL,
      redirect: false,
    });
    expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(redirect).toHaveBeenCalledWith(PROVISIONING_PATH);
  });

  it('logs an error but still redirects when the owner-invite email fails to send', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue(errorResult('EmailSignInError'));

    await expect(
      createTenantAction({
        ...validInput,
        confirmOwnerInviteToken: validOwnerInviteToken,
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.OWNER_INVITE_EMAIL_FAILED,
      expect.objectContaining({
        tenantId: MOCK_TENANT_ID,
        ownerEmail: MOCK_OWNER_EMAIL,
      }),
    );
    expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(redirect).toHaveBeenCalledWith(PROVISIONING_PATH);
  });

  it('logs an error but still redirects when the owner-invite sign-in throws', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    signInMock.mockRejectedValue(new Error('network error'));

    await expect(
      createTenantAction({
        ...validInput,
        confirmOwnerInviteToken: validOwnerInviteToken,
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.OWNER_INVITE_EMAIL_FAILED,
      expect.objectContaining({
        tenantId: MOCK_TENANT_ID,
        ownerEmail: MOCK_OWNER_EMAIL,
        error: expect.any(Error),
      }),
    );
    expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(redirect).toHaveBeenCalledWith(PROVISIONING_PATH);
  });

  it('never triggers the owner-invite sign-in email on the found-owner path', async () => {
    await expect(createTenantAction(validInput)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(signInMock).not.toHaveBeenCalled();
  });

  it.each(['admin', 'www'])(
    'rejects the reserved site address %s',
    async (slug) => {
      const result = await createTenantAction({ ...validInput, slug });

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_RESERVED } },
      });
      expect(createTenantDraftMock).not.toHaveBeenCalled();
    },
  );

  it('rejects a site address another tenant holds', async () => {
    getTenantByDomainMock.mockResolvedValue({ id: EXISTING_TENANT_ID });

    const result = await createTenantAction(validInput);

    expect(getTenantByDomainMock).toHaveBeenCalledWith(MOCK_TENANT_DOMAIN);
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('returns a field error and blocks creation when another project uses the domain', async () => {
    checkDomainAvailabilityMock.mockResolvedValue(DOMAIN_AVAILABILITY.IN_USE);

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        slug: { reason: TENANT_FIELD_ERROR.DOMAIN_ATTACHED_ELSEWHERE },
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
