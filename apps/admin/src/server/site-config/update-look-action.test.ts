import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';

import { updateLookAction, type TUpdateLookInput } from './update-look-action';

const {
  requireTenantMembershipMock,
  authMock,
  upsertSiteConfigMock,
  revalidateSiteConfigMock,
  insertAuditEventMock,
  loggerErrorMock,
} = vi.hoisted(() => ({
  requireTenantMembershipMock: vi.fn(),
  authMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  revalidateSiteConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-tenant-membership', () => ({
  requireTenantMembership: requireTenantMembershipMock,
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@admin/server/site-config/revalidate-site-config', () => ({
  revalidateSiteConfig: revalidateSiteConfigMock,
}));

vi.mock('@admin/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock },
}));

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { upsertSiteConfig: upsertSiteConfigMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const VALID_INPUT: TUpdateLookInput = {
  preset: PRESET_ID.EDITORIAL,
  accentHue: 28,
  logoHue: null,
  headingFont: FONT_CHOICE.FRAUNCES,
  bodyFont: FONT_CHOICE.INTER,
  radiusScale: RADIUS_SCALE.SM,
  density: DENSITY.COMPACT,
};

describe(updateLookAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    upsertSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockResolvedValue(undefined);
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
  });

  it('re-resolves the tenant from the session against the routed slug before writing anything', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1', slug: 'acme' },
      membership: { role: 'OWNER' },
    });
    upsertSiteConfigMock.mockResolvedValue({});

    const result = await updateLookAction('acme', VALID_INPUT);

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('acme');
    expect(upsertSiteConfigMock).toHaveBeenCalledWith('tenant-1', VALID_INPUT);
    expect(result).toEqual({ ok: true });
  });

  it('calls the site-config revalidation webhook after a successful save', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1', slug: 'acme' },
      membership: { role: 'OWNER' },
    });
    upsertSiteConfigMock.mockResolvedValue({});

    await updateLookAction('acme', VALID_INPUT);

    expect(revalidateSiteConfigMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a payload with an out-of-range hue without ever calling the tenant gate', async () => {
    const result = await updateLookAction('acme', {
      ...VALID_INPUT,
      accentHue: 999,
    });

    expect(result).toEqual({ ok: false });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it('reports failure instead of throwing when the write itself fails', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1', slug: 'acme' },
      membership: { role: 'OWNER' },
    });
    upsertSiteConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await updateLookAction('acme', VALID_INPUT);

    expect(result).toEqual({ ok: false });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records a SETTINGS_UPDATED audit event against the site config, with the operator as actor', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1', slug: 'acme' },
      membership: { role: 'OWNER' },
    });
    upsertSiteConfigMock.mockResolvedValue({});

    await updateLookAction('acme', VALID_INPUT);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-1',
      details: VALID_INPUT,
    });
  });

  it('still returns ok when the audit write fails, and logs the failure', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1', slug: 'acme' },
      membership: { role: 'OWNER' },
    });
    upsertSiteConfigMock.mockResolvedValue({});
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));

    const result = await updateLookAction('acme', VALID_INPUT);

    expect(result).toEqual({ ok: true });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'site_config.look_audit_failed',
      expect.objectContaining({
        targetId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(updateLookAction('acme', VALID_INPUT)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(updateLookAction('acme', VALID_INPUT)).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });
});
