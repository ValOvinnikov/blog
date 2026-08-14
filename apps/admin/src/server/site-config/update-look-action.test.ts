import { DENSITY, FONT_CHOICE, PRESET_ID, RADIUS_SCALE } from '@blog/config';

import { updateLookAction, type TUpdateLookInput } from './update-look-action';

const { requireTenantMembershipMock, upsertSiteConfigMock } = vi.hoisted(
  () => ({
    requireTenantMembershipMock: vi.fn(),
    upsertSiteConfigMock: vi.fn(),
  }),
);

vi.mock('@admin/server/auth/require-tenant-membership', () => ({
  requireTenantMembership: requireTenantMembershipMock,
}));

vi.mock('@blog/db', () => ({
  queries: { siteConfig: { upsertSiteConfig: upsertSiteConfigMock } },
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
    upsertSiteConfigMock.mockReset();
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
  });

  it('propagates the unauthenticated/unauthorized redirect the tenant gate throws', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(updateLookAction('acme', VALID_INPUT)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });
});
