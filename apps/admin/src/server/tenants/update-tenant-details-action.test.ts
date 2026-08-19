import { makeTenant } from '@admin/testing/tenants/fixtures';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';

const {
  requireAdminMock,
  authMock,
  updateTenantDetailsMock,
  insertAuditEventMock,
  loggerErrorMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  authMock: vi.fn(),
  updateTenantDetailsMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@admin/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock },
}));

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    tenants: { updateTenantDetails: updateTenantDetailsMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
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
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    updateTenantDetailsMock.mockReset();
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
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

  it('maps a provisioning-started outcome onto a form-level error, without a successful update', async () => {
    updateTenantDetailsMock.mockResolvedValue({
      outcome: 'provisioning-started',
    });
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    const result = await updateTenantDetailsAction('tenant-1', validInput);

    expect(result).toEqual({
      ok: false,
      error:
        "This tenant's provisioning has already started; its details can no longer be edited.",
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

  it('records a SETTINGS_UPDATED audit event for the tenant, with the operator as actor', async () => {
    const tenant = makeTenant({ name: 'Acme' });
    updateTenantDetailsMock.mockResolvedValue({ outcome: 'updated', tenant });
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    await updateTenantDetailsAction('tenant-1', validInput);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      details: validInput,
    });
  });

  it('still returns the updated tenant when the audit write fails, and logs the failure', async () => {
    const tenant = makeTenant({ name: 'Acme' });
    updateTenantDetailsMock.mockResolvedValue({ outcome: 'updated', tenant });
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    const result = await updateTenantDetailsAction('tenant-1', validInput);

    expect(result).toEqual({ ok: true, tenant });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.update_details_audit_failed',
      expect.objectContaining({
        targetId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });

  it('does not record an audit event for a non-updated outcome', async () => {
    updateTenantDetailsMock.mockResolvedValue({ outcome: 'slug-taken' });
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    await updateTenantDetailsAction('tenant-1', validInput);

    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns a generic error when the mutation throws', async () => {
    updateTenantDetailsMock.mockRejectedValue(new Error('unique violation'));
    const { updateTenantDetailsAction } =
      await import('./update-tenant-details-action');

    const result = await updateTenantDetailsAction('tenant-1', validInput);

    expect(result).toEqual({ ok: false, error: expect.any(String) });
  });
});
