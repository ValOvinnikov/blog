import { makeTenant } from '@admin/testing/tenants/fixtures';

const { requireAdminMock, updateTenantDetailsMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  updateTenantDetailsMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { updateTenantDetails: updateTenantDetailsMock },
  },
}));

const validInput = {
  name: 'Acme',
  slug: 'acme',
  primaryDomain: 'acme.example.com',
  plan: 'FREE' as const,
  locale: 'EN',
};

describe('updateTenantDetailsAction', () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    updateTenantDetailsMock.mockReset();
  });

  it('requires an admin session before validating or saving anything', async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    await expect(
      updateTenantDetailsAction('tenant-1', validInput),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('returns field errors for an invalid slug without touching the database', async () => {
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    const result = await updateTenantDetailsAction('tenant-1', {
      ...validInput,
      slug: 'Not A Slug!',
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: { slug: expect.any(String) },
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('returns field errors for an invalid domain', async () => {
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    const result = await updateTenantDetailsAction('tenant-1', {
      ...validInput,
      primaryDomain: 'not a domain',
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: { primaryDomain: expect.any(String) },
    });
    expect(updateTenantDetailsMock).not.toHaveBeenCalled();
  });

  it('maps a slug-taken outcome onto a slug field error', async () => {
    updateTenantDetailsMock.mockResolvedValue({ outcome: 'slug-taken' });
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    const result = await updateTenantDetailsAction('tenant-1', validInput);

    expect(result).toEqual({
      ok: false,
      fieldErrors: { slug: expect.any(String) },
    });
  });

  it('returns the updated tenant on success', async () => {
    const tenant = makeTenant({ name: 'Acme' });
    updateTenantDetailsMock.mockResolvedValue({
      outcome: 'updated',
      tenant,
    });
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    const result = await updateTenantDetailsAction('tenant-1', validInput);

    expect(result).toEqual({ ok: true, tenant });
    expect(updateTenantDetailsMock).toHaveBeenCalledWith(
      'tenant-1',
      validInput,
    );
  });

  it('returns a generic error when the mutation throws', async () => {
    updateTenantDetailsMock.mockRejectedValue(new Error('unique violation'));
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    const result = await updateTenantDetailsAction('tenant-1', validInput);

    expect(result).toEqual({ ok: false, error: expect.any(String) });
  });
});
