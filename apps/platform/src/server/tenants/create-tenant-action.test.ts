import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  DOMAIN_AVAILABILITY,
} from '@blog/config';
import { auth, signIn } from '@platform/server/auth/auth';
import { createOwnerInviteToken } from '@platform/server/tenants/owner-invite-token';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { logger } from '@platform/utils/logger/logger';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

const validOwnerInviteToken = createOwnerInviteToken('owner@example.com');

const {
  requireAdminMock,
  dispatchProvisioningWorkflowMock,
  getUserByEmailMock,
  getTenantByDomainMock,
  createTenantDraftMock,
  beginTenantProvisioningMock,
  setTenantProvisioningStatusMock,
  insertAuditEventMock,
  checkDomainAvailabilityMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  dispatchProvisioningWorkflowMock: vi.fn(),
  getUserByEmailMock: vi.fn(),
  getTenantByDomainMock: vi.fn(),
  createTenantDraftMock: vi.fn(),
  beginTenantProvisioningMock: vi.fn(),
  setTenantProvisioningStatusMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  checkDomainAvailabilityMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/provisioning/dispatch-provisioning-workflow', () => ({
  dispatchProvisioningWorkflow: dispatchProvisioningWorkflowMock,
}));

vi.mock('@platform/server/provisioning/check-domain-availability', () => ({
  checkDomainAvailability: checkDomainAvailabilityMock,
}));

vi.mock('@platform/utils/logger/logger');

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    users: { getUserByEmail: getUserByEmailMock },
    tenants: {
      createTenantDraft: createTenantDraftMock,
      beginTenantProvisioning: beginTenantProvisioningMock,
      setTenantProvisioningStatus: setTenantProvisioningStatusMock,
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
  name: 'Acme',
  domain: 'acme.example.com',
  plan: 'FREE' as const,
  ownerEmail: 'owner@example.com',
};

describe('createTenantAction', () => {
  let createTenantAction: typeof import('./create-tenant-action').createTenantAction;

  beforeEach(async () => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    dispatchProvisioningWorkflowMock.mockReset();
    dispatchProvisioningWorkflowMock.mockResolvedValue(true);
    beginTenantProvisioningMock.mockReset();
    beginTenantProvisioningMock.mockResolvedValue({
      ok: true,
      data: { tenant: { id: 'tenant-1' }, previousProvisioningStatus: null },
    });
    setTenantProvisioningStatusMock.mockReset();
    setTenantProvisioningStatusMock.mockResolvedValue({
      ok: true,
      data: { id: 'tenant-1' },
    });
    signInMock.mockReset();
    signInMock.mockResolvedValue({ ok: true });
    getUserByEmailMock.mockReset();
    getUserByEmailMock.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
    });
    getTenantByDomainMock.mockReset();
    getTenantByDomainMock.mockResolvedValue(undefined);
    checkDomainAvailabilityMock.mockReset();
    checkDomainAvailabilityMock.mockResolvedValue(
      DOMAIN_AVAILABILITY.AVAILABLE,
    );
    createTenantDraftMock.mockReset();
    createTenantDraftMock.mockResolvedValue({
      ok: true,
      data: { id: 'tenant-1' },
    });
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
    loggerWarnMock.mockReset();
    ({ createTenantAction } = await import('./create-tenant-action'));
  });

  it('returns field errors for an invalid domain without touching the database', async () => {
    const result = await createTenantAction({
      ...validInput,
      domain: 'not a domain',
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: { domain: expect.any(String) },
    });
    expect(getUserByEmailMock).not.toHaveBeenCalled();
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('returns a soft owner-invite confirmation when the owner email matches no user', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      ok: false,
      ownerInviteConfirmation: {
        email: 'owner@example.com',
        token: expect.any(String),
        message: expect.any(String),
      },
    });
    expect(result.fieldErrors).toBeUndefined();
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
      ok: false,
      ownerInviteConfirmation: {
        email: 'owner@example.com',
        token: expect.any(String),
        message: expect.any(String),
      },
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
      ok: false,
      ownerInviteConfirmation: {
        email: 'owner@example.com',
        token: expect.any(String),
        message: expect.any(String),
      },
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
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(createTenantDraftMock).toHaveBeenCalledWith({
      name: 'Acme',
      domain: 'acme.example.com',
      locale: 'EN',
      plan: 'FREE',
      owner: { type: 'invite', email: 'owner@example.com' },
    });
    expect(signInMock).toHaveBeenCalledWith('email', {
      email: 'owner@example.com',
      redirect: false,
    });
    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1/provisioning');
  });

  it('logs an error but still redirects when the owner-invite email fails to send', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue({ ok: false, error: 'EmailSignInError' });

    await expect(
      createTenantAction({
        ...validInput,
        confirmOwnerInviteToken: validOwnerInviteToken,
      }),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.owner_invite_email_failed',
      expect.objectContaining({
        tenantId: 'tenant-1',
        ownerEmail: 'owner@example.com',
      }),
    );
    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1/provisioning');
  });

  it('logs an error but still redirects when the owner-invite sign-in throws', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    signInMock.mockRejectedValue(new Error('network error'));

    await expect(
      createTenantAction({
        ...validInput,
        confirmOwnerInviteToken: validOwnerInviteToken,
      }),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.owner_invite_email_failed',
      expect.objectContaining({
        tenantId: 'tenant-1',
        ownerEmail: 'owner@example.com',
        error: expect.any(Error),
      }),
    );
    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1/provisioning');
  });

  it('never triggers the owner-invite sign-in email on the found-owner path', async () => {
    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(signInMock).not.toHaveBeenCalled();
  });

  it('returns a field error when the domain is already taken', async () => {
    getTenantByDomainMock.mockResolvedValue({ id: 'existing-tenant' });

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      ok: false,
      fieldErrors: { domain: expect.any(String) },
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('returns a field error and blocks creation when another project uses the domain', async () => {
    checkDomainAvailabilityMock.mockResolvedValue(DOMAIN_AVAILABILITY.IN_USE);

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      ok: false,
      fieldErrors: { domain: expect.any(String) },
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('proceeds with creation when the domain is free', async () => {
    checkDomainAvailabilityMock.mockResolvedValue(
      DOMAIN_AVAILABILITY.AVAILABLE,
    );

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(createTenantDraftMock).toHaveBeenCalled();
  });

  it('proceeds with creation unchecked when Vercel credentials are absent', async () => {
    checkDomainAvailabilityMock.mockResolvedValue(
      DOMAIN_AVAILABILITY.NOT_CONFIGURED,
    );

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(createTenantDraftMock).toHaveBeenCalled();
  });

  it('proceeds with creation when the domain-availability check errors or times out', async () => {
    checkDomainAvailabilityMock.mockResolvedValue(DOMAIN_AVAILABILITY.ERROR);

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(createTenantDraftMock).toHaveBeenCalled();
  });

  it('returns a generic error and logs at error level when createTenantDraft throws', async () => {
    createTenantDraftMock.mockRejectedValue(new Error('unique violation'));

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.create_draft_failed',
      expect.objectContaining({ domain: 'acme.example.com' }),
    );
  });

  it('returns a generic error and logs on any other createTenantDraft failure', async () => {
    createTenantDraftMock.mockResolvedValue({
      ok: false,
      error: 'DB_NOT_FOUND',
    });

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.create_draft_failed',
      expect.objectContaining({
        domain: 'acme.example.com',
        error: 'DB_NOT_FOUND',
      }),
    );
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });

  it('creates the draft with the resolved owner id and the platform default locale', async () => {
    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(createTenantDraftMock).toHaveBeenCalledWith({
      name: 'Acme',
      domain: 'acme.example.com',
      locale: 'EN',
      plan: 'FREE',
      owner: { type: 'user', userId: 'user-1' },
    });
  });

  it('begins provisioning before dispatching, then redirects to the status page', async () => {
    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(beginTenantProvisioningMock).toHaveBeenCalledWith('tenant-1');
    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
    expect(setTenantProvisioningStatusMock).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1/provisioning');
  });

  it('reverts the PROVISIONING transition but still redirects when the dispatch fails', async () => {
    beginTenantProvisioningMock.mockResolvedValue({
      ok: true,
      data: { tenant: { id: 'tenant-1' }, previousProvisioningStatus: null },
    });
    dispatchProvisioningWorkflowMock.mockResolvedValue(false);

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(setTenantProvisioningStatusMock).toHaveBeenCalledWith(
      'tenant-1',
      null,
    );
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1/provisioning');
  });

  it('skips the dispatch but still redirects when a concurrent dispatch is reported', async () => {
    beginTenantProvisioningMock.mockResolvedValue({
      ok: false,
      error: 'DB_ALREADY_PROVISIONING',
    });

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(setTenantProvisioningStatusMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).not.toHaveBeenCalledWith(
      'provisioning.begin_failed',
      expect.anything(),
    );
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1/provisioning');
  });

  it('records a CREATED audit event for the new tenant, with the operator as actor', async () => {
    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.CREATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      details: {
        name: 'Acme',
        domain: 'acme.example.com',
        plan: 'FREE',
        ownerEmail: 'owner@example.com',
      },
    });
  });

  it('still dispatches and redirects when the audit write fails, and logs it', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1/provisioning');
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.create_audit_failed',
      expect.objectContaining({
        targetId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });

  it('requires an admin session before doing anything else', async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(getUserByEmailMock).not.toHaveBeenCalled();
  });
});
