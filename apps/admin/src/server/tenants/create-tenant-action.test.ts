import { createOwnerInviteToken } from '@admin/server/tenants/owner-invite-token';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { redirect } from 'next/navigation';

const validOwnerInviteToken = createOwnerInviteToken('owner@example.com');

const {
  requireAdminMock,
  authMock,
  signInMock,
  dispatchProvisioningWorkflowMock,
  getUserByEmailMock,
  getTenantBySlugMock,
  getTenantByDomainMock,
  createTenantDraftMock,
  insertAuditEventMock,
  loggerErrorMock,
  loggerWarnMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  authMock: vi.fn(),
  signInMock: vi.fn(),
  dispatchProvisioningWorkflowMock: vi.fn(),
  getUserByEmailMock: vi.fn(),
  getTenantBySlugMock: vi.fn(),
  getTenantByDomainMock: vi.fn(),
  createTenantDraftMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  loggerErrorMock: vi.fn(),
  loggerWarnMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@admin/server/auth/auth', () => ({
  auth: authMock,
  signIn: signInMock,
}));

vi.mock('@admin/server/provisioning/dispatch-provisioning-workflow', () => ({
  dispatchProvisioningWorkflow: dispatchProvisioningWorkflowMock,
}));

vi.mock('@admin/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock, warn: loggerWarnMock },
}));

vi.mock('@admin/utils/env/env', () => ({
  env: { AUTH_SECRET: 'test-auth-secret' },
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    users: { getUserByEmail: getUserByEmailMock },
    tenants: {
      getTenantBySlug: getTenantBySlugMock,
      createTenantDraft: createTenantDraftMock,
    },
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const validInput = {
  name: 'Acme',
  slug: 'acme',
  domain: 'acme.example.com',
  plan: 'FREE' as const,
  ownerEmail: 'owner@example.com',
};

describe('createTenantAction', () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    dispatchProvisioningWorkflowMock.mockReset();
    dispatchProvisioningWorkflowMock.mockResolvedValue(undefined);
    signInMock.mockReset();
    signInMock.mockResolvedValue({ ok: true });
    getUserByEmailMock.mockReset();
    getUserByEmailMock.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
    });
    getTenantBySlugMock.mockReset();
    getTenantBySlugMock.mockResolvedValue(undefined);
    getTenantByDomainMock.mockReset();
    getTenantByDomainMock.mockResolvedValue(undefined);
    createTenantDraftMock.mockReset();
    createTenantDraftMock.mockResolvedValue({
      ok: true,
      data: { id: 'tenant-1' },
    });
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
    loggerWarnMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('returns field errors for an invalid slug without touching the database', async () => {
    const { createTenantAction } = await import('./create-tenant-action');

    const result = await createTenantAction({
      ...validInput,
      slug: 'Not A Slug!',
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: { slug: expect.any(String) },
    });
    expect(getUserByEmailMock).not.toHaveBeenCalled();
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('returns a soft owner-invite confirmation (not a field error) when the owner email matches no registered user', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    const { createTenantAction } = await import('./create-tenant-action');

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

  it('rejects a confirming submit whose token was issued for a different email, and re-issues a fresh confirmation for the current one', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    const { createTenantAction } = await import('./create-tenant-action');
    const tokenForOtherEmail = createOwnerInviteToken('other@example.com');

    const result = await createTenantAction({
      ...validInput,
      confirmOwnerInvite: true,
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

  it('rejects a confirming submit with an invalid/garbage token, and re-issues a fresh confirmation', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    const { createTenantAction } = await import('./create-tenant-action');

    const result = await createTenantAction({
      ...validInput,
      confirmOwnerInvite: true,
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

  it('proceeds down the invite path once confirmOwnerInvite is set for an unregistered email', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    const { createTenantAction } = await import('./create-tenant-action');

    await expect(
      createTenantAction({
        ...validInput,
        confirmOwnerInvite: true,
        confirmOwnerInviteToken: validOwnerInviteToken,
      }),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(createTenantDraftMock).toHaveBeenCalledWith({
      name: 'Acme',
      slug: 'acme',
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
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1');
  });

  it('logs at error level, but still redirects, when the owner-invite sign-in email fails to send', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue({ ok: false, error: 'EmailSignInError' });
    const { createTenantAction } = await import('./create-tenant-action');

    await expect(
      createTenantAction({
        ...validInput,
        confirmOwnerInvite: true,
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
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1');
  });

  it('logs at error level, but still redirects, when the owner-invite sign-in trigger throws', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    signInMock.mockRejectedValue(new Error('network error'));
    const { createTenantAction } = await import('./create-tenant-action');

    await expect(
      createTenantAction({
        ...validInput,
        confirmOwnerInvite: true,
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
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1');
  });

  it('never triggers the owner-invite sign-in email on the found-owner path', async () => {
    const { createTenantAction } = await import('./create-tenant-action');

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(signInMock).not.toHaveBeenCalled();
  });

  it('returns a field error when the slug is already taken', async () => {
    getTenantBySlugMock.mockResolvedValue({ id: 'existing-tenant' });
    const { createTenantAction } = await import('./create-tenant-action');

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      ok: false,
      fieldErrors: { slug: expect.any(String) },
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('checks slug availability including archived tenants, so a deprovisioned slug stays reserved', async () => {
    const { createTenantAction } = await import('./create-tenant-action');

    // Succeeds and redirects (NEXT_REDIRECT) — only the pre-redirect call
    // args to getTenantBySlug matter here.
    await createTenantAction(validInput).catch(() => undefined);

    expect(getTenantBySlugMock).toHaveBeenCalledWith('acme', {
      includeArchived: true,
    });
  });

  it('returns a field error when the domain is already taken', async () => {
    getTenantByDomainMock.mockResolvedValue({ id: 'existing-tenant' });
    const { createTenantAction } = await import('./create-tenant-action');

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      ok: false,
      fieldErrors: { domain: expect.any(String) },
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
  });

  it('returns a generic error and logs at error level when createTenantDraft throws', async () => {
    createTenantDraftMock.mockRejectedValue(new Error('unique violation'));
    const { createTenantAction } = await import('./create-tenant-action');

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.create_draft_failed',
      expect.objectContaining({ slug: 'acme' }),
    );
  });

  it('returns a slug field error and logs nothing when createTenantDraft reports DB_DUPLICATE_SLUG', async () => {
    createTenantDraftMock.mockResolvedValue({
      ok: false,
      error: 'DB_DUPLICATE_SLUG',
    });
    const { createTenantAction } = await import('./create-tenant-action');

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      ok: false,
      fieldErrors: { slug: expect.any(String) },
    });
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(loggerWarnMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('returns a generic error and logs at error level when createTenantDraft reports any other typed failure', async () => {
    createTenantDraftMock.mockResolvedValue({
      ok: false,
      error: 'DB_NOT_FOUND',
    });
    const { createTenantAction } = await import('./create-tenant-action');

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.create_draft_failed',
      expect.objectContaining({ slug: 'acme', error: 'DB_NOT_FOUND' }),
    );
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });

  it('creates the tenant draft with the resolved owner id and platform default locale', async () => {
    const { createTenantAction } = await import('./create-tenant-action');

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(createTenantDraftMock).toHaveBeenCalledWith({
      name: 'Acme',
      slug: 'acme',
      domain: 'acme.example.com',
      locale: 'EN',
      plan: 'FREE',
      owner: { type: 'user', userId: 'user-1' },
    });
  });

  it('dispatches the provisioning workflow and redirects to the status page on success', async () => {
    const { createTenantAction } = await import('./create-tenant-action');

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1');
  });

  it('records a CREATED audit event for the new tenant, with the operator as actor', async () => {
    const { createTenantAction } = await import('./create-tenant-action');

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
        slug: 'acme',
        domain: 'acme.example.com',
        plan: 'FREE',
        ownerEmail: 'owner@example.com',
      },
    });
  });

  it('still dispatches provisioning and redirects when the audit write fails, and logs the failure', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));
    const { createTenantAction } = await import('./create-tenant-action');

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1');
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
    const { createTenantAction } = await import('./create-tenant-action');

    await expect(createTenantAction(validInput)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(getUserByEmailMock).not.toHaveBeenCalled();
  });
});
