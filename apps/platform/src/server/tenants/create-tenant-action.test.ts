import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  RESERVED_SUBDOMAINS,
} from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { DOMAIN_AVAILABILITY } from '@platform/constants/domain';
import {
  TENANT_FIELD_ERROR,
  TENANT_REFUSAL,
  TENANT_LOG,
} from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { startProvisioning } from '@platform/server/provisioning/start-provisioning';
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
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_SLUG,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { createTenantAction } from './create-tenant-action';

faker.seed(5765);

const MOCK_OWNER_USER_ID = faker.string.uuid();
const MOCK_EXISTING_TENANT_ID = faker.string.uuid();
const MOCK_AUDIT_EVENT_ID = faker.string.uuid();
const MOCK_OTHER_OWNER_EMAIL = faker.internet.email();
const MOCK_INVALID_OWNER_INVITE_TOKEN = faker.string.alphanumeric(32);
const MOCK_DRAFT_INSERT_ERROR = new Error(faker.lorem.sentence());
const MOCK_AUDIT_WRITE_ERROR = new Error(faker.lorem.sentence());
const PROVISIONING_PATH = adminRoutes.tenantProvisioning(MOCK_TENANT_ID);

const MOCK_TENANT_DRAFT_FIELDS = {
  name: MOCK_TENANT_NAME,
  domain: MOCK_TENANT_DOMAIN,
  locale: LOCALE_ISO_CODES.EN,
  plan: TENANT_PLAN.FREE,
};

const validOwnerInviteToken = createOwnerInviteToken(MOCK_OWNER_EMAIL);

const {
  findUserByEmailMock,
  getTenantByDomainMock,
  createTenantDraftMock,
  insertAuditEventMock,
  checkDomainAvailabilityMock,
} = vi.hoisted(() => ({
  findUserByEmailMock: vi.fn(),
  getTenantByDomainMock: vi.fn(),
  createTenantDraftMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  checkDomainAvailabilityMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-admin');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/tenants/send-owner-invite-email', () => ({
  sendOwnerInviteEmail: vi.fn(),
}));

vi.mock('@platform/server/provisioning/start-provisioning');

vi.mock('@platform/server/provisioning/check-domain-availability', () => ({
  checkDomainAvailability: checkDomainAvailabilityMock,
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    users: { findUserByEmail: findUserByEmailMock },
    tenants: {
      createTenantDraft: createTenantDraftMock,
    },
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const sendOwnerInviteEmailMock = vi.mocked(sendOwnerInviteEmail);
const requireAdminMock = vi.mocked(requireAdmin);
const startProvisioningMock = vi.mocked(startProvisioning);
const loggerErrorMock = vi.mocked(logger.error);
const loggerWarnMock = vi.mocked(logger.warn);

const validInput = {
  name: MOCK_TENANT_NAME,
  slug: MOCK_TENANT_SLUG,
  plan: TENANT_PLAN.FREE,
  ownerEmail: MOCK_OWNER_EMAIL,
};

describe(createTenantAction, () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    startProvisioningMock.mockReset();
    findUserByEmailMock.mockReset();
    findUserByEmailMock.mockResolvedValue({
      id: MOCK_OWNER_USER_ID,
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
    insertAuditEventMock.mockResolvedValue({ id: MOCK_AUDIT_EVENT_ID });
    loggerErrorMock.mockReset();
    loggerWarnMock.mockReset();
    Object.assign(env, { TENANT_ROOT_DOMAIN: MOCK_TENANT_ROOT_DOMAIN });
  });

  it('returns field errors for an invalid site address without a lookup', async () => {
    const result = await createTenantAction({
      ...validInput,
      slug: MOCK_TENANT_DOMAIN,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_INVALID } },
    });
    expect(findUserByEmailMock).not.toHaveBeenCalled();
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it.each(['', '   '])(
    'returns a required error for an empty site address %j',
    async (slug) => {
      const result = await createTenantAction({ ...validInput, slug });

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_REQUIRED } },
      });
      expect(createTenantDraftMock).not.toHaveBeenCalled();
    },
  );

  it('logs and returns a server error when no tenant root domain is configured', async () => {
    Object.assign(env, { TENANT_ROOT_DOMAIN: undefined });

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.ROOT_DOMAIN_MISSING,
    );
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('creates the tenant for the found owner at the site address under the root', async () => {
    await expect(
      createTenantAction({
        ...validInput,
        slug: ` ${MOCK_TENANT_SLUG.toUpperCase()} `,
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(findUserByEmailMock).toHaveBeenCalledWith(MOCK_OWNER_EMAIL);
    expect(createTenantDraftMock).toHaveBeenCalledWith({
      ...MOCK_TENANT_DRAFT_FIELDS,
      owner: { type: 'user', userId: MOCK_OWNER_USER_ID },
    });
  });

  describe('when the owner email matches no user', () => {
    beforeEach(() => {
      findUserByEmailMock.mockResolvedValue(undefined);
    });

    it.each([
      { scenario: 'is missing', token: undefined },
      {
        scenario: 'was issued for a different email',
        token: createOwnerInviteToken(MOCK_OTHER_OWNER_EMAIL),
      },
      { scenario: 'is invalid', token: MOCK_INVALID_OWNER_INVITE_TOKEN },
    ])(
      'asks for owner-invite confirmation when the token $scenario',
      async ({ token }) => {
        const result = await createTenantAction({
          ...validInput,
          confirmOwnerInviteToken: token,
        });

        expect(result).toEqual({
          outcome: ACTION_OUTCOME.REFUSED,
          reason: TENANT_REFUSAL.OWNER_INVITE_UNCONFIRMED,
          email: MOCK_OWNER_EMAIL,
          token: validOwnerInviteToken,
        });
        expect(createTenantDraftMock).not.toHaveBeenCalled();
        expect(sendOwnerInviteEmailMock).not.toHaveBeenCalled();
      },
    );

    it('invites the owner once the token verifies for the email', async () => {
      await expect(
        createTenantAction({
          ...validInput,
          confirmOwnerInviteToken: validOwnerInviteToken,
        }),
      ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

      expect(createTenantDraftMock).toHaveBeenCalledWith({
        ...MOCK_TENANT_DRAFT_FIELDS,
        owner: { type: 'invite', email: MOCK_OWNER_EMAIL },
      });
      expect(sendOwnerInviteEmailMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_OWNER_EMAIL,
      );
      expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(redirect).toHaveBeenCalledWith(PROVISIONING_PATH);
    });

    it('records an invited owner without their email address', async () => {
      await expect(
        createTenantAction({
          ...validInput,
          confirmOwnerInviteToken: validOwnerInviteToken,
        }),
      ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

      expect(insertAuditEventMock).toHaveBeenCalledWith({
        actorId: MOCK_OPERATOR_ID,
        action: AUDIT_ACTION.CREATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        details: {
          name: MOCK_TENANT_NAME,
          domain: MOCK_TENANT_DOMAIN,
          plan: TENANT_PLAN.FREE,
          ownerUserId: null,
        },
      });
    });
  });

  it('never sends the owner-invite email on the found-owner path', async () => {
    await expect(createTenantAction(validInput)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(sendOwnerInviteEmailMock).not.toHaveBeenCalled();
  });

  it('rejects a reserved site address', async () => {
    const result = await createTenantAction({
      ...validInput,
      slug: RESERVED_SUBDOMAINS[0],
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_RESERVED } },
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('rejects a site address another tenant holds', async () => {
    getTenantByDomainMock.mockResolvedValue({ id: MOCK_EXISTING_TENANT_ID });

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

  it('returns a server error and logs it when saving the draft throws', async () => {
    createTenantDraftMock.mockRejectedValue(MOCK_DRAFT_INSERT_ERROR);

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.CREATE_DRAFT_FAILED,
      { domain: MOCK_TENANT_DOMAIN, errorName: MOCK_DRAFT_INSERT_ERROR.name },
    );
  });

  it('returns a server error and logs it when saving the draft fails', async () => {
    createTenantDraftMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.CREATE_DRAFT_FAILED,
      { domain: MOCK_TENANT_DOMAIN, error: ERROR_CODE.DB_NOT_FOUND },
    );
    expect(loggerWarnMock).not.toHaveBeenCalled();
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
        ownerUserId: MOCK_OWNER_USER_ID,
      },
    });
  });

  it('still dispatches and redirects when the audit write fails, and logs it', async () => {
    insertAuditEventMock.mockRejectedValue(MOCK_AUDIT_WRITE_ERROR);

    await expect(createTenantAction(validInput)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(redirect).toHaveBeenCalledWith(PROVISIONING_PATH);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.CREATE_AUDIT_FAILED,
      {
        action: AUDIT_ACTION.CREATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        errorName: MOCK_AUDIT_WRITE_ERROR.name,
      },
    );
  });

  it('requires an admin session before doing anything else', async () => {
    requireAdminMock.mockImplementationOnce(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(createTenantAction(validInput)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(findUserByEmailMock).not.toHaveBeenCalled();
  });
});
