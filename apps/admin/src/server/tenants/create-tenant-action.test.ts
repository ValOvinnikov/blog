import { redirect } from 'next/navigation';

const {
  requireAdminMock,
  dispatchProvisioningWorkflowMock,
  getUserByEmailMock,
  getTenantBySlugMock,
  getTenantByDomainMock,
  createTenantDraftMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  dispatchProvisioningWorkflowMock: vi.fn(),
  getUserByEmailMock: vi.fn(),
  getTenantBySlugMock: vi.fn(),
  getTenantByDomainMock: vi.fn(),
  createTenantDraftMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@admin/server/provisioning/dispatch-provisioning-workflow', () => ({
  dispatchProvisioningWorkflow: dispatchProvisioningWorkflowMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    users: { getUserByEmail: getUserByEmailMock },
    tenants: {
      getTenantBySlug: getTenantBySlugMock,
      createTenantDraft: createTenantDraftMock,
    },
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
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
    dispatchProvisioningWorkflowMock.mockReset();
    dispatchProvisioningWorkflowMock.mockResolvedValue(undefined);
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

  it('returns a field error when the owner email matches no registered user', async () => {
    getUserByEmailMock.mockResolvedValue(undefined);
    const { createTenantAction } = await import('./create-tenant-action');

    const result = await createTenantAction(validInput);

    expect(result).toEqual({
      ok: false,
      fieldErrors: { ownerEmail: expect.any(String) },
    });
    expect(createTenantDraftMock).not.toHaveBeenCalled();
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

  it('returns a generic error when createTenantDraft throws', async () => {
    createTenantDraftMock.mockRejectedValue(new Error('unique violation'));
    const { createTenantAction } = await import('./create-tenant-action');

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('returns a slug field error when createTenantDraft reports DB_DUPLICATE_SLUG', async () => {
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
  });

  it('returns a generic error when createTenantDraft reports any other typed failure', async () => {
    createTenantDraftMock.mockResolvedValue({
      ok: false,
      error: 'DB_NOT_FOUND',
    });
    const { createTenantAction } = await import('./create-tenant-action');

    const result = await createTenantAction(validInput);

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
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
      ownerUserId: 'user-1',
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
