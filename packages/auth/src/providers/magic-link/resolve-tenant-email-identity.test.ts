import { resolveTenantEmailBrand } from '@blog/config';
import { PRESET_ID } from '@blog/config/constants';

import { resolveTenantEmailIdentity } from './resolve-tenant-email-identity';

const { getTenantByDomainMock, getSiteConfigMock } = vi.hoisted(() => ({
  getTenantByDomainMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

describe(resolveTenantEmailIdentity, () => {
  beforeEach(() => {
    getTenantByDomainMock.mockReset();
    getSiteConfigMock.mockReset();
  });

  it('resolves a matching host to its tenant brand and name', async () => {
    getTenantByDomainMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Blog',
    });
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
      logoHue: undefined,
    });

    const result = await resolveTenantEmailIdentity('acme.example.com');

    expect(result).toEqual({
      brand: resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: 140,
        logoHue: undefined,
      }),
      brandName: 'Acme Blog',
      tenantId: 'tenant-1',
    });
  });

  it('resolves to undefined when the host matches no tenant', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);

    const result = await resolveTenantEmailIdentity('unknown.example.com');

    expect(result).toBeUndefined();
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('resolves to undefined when the matched tenant has no site config yet', async () => {
    getTenantByDomainMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Blog',
    });
    getSiteConfigMock.mockResolvedValue(undefined);

    const result = await resolveTenantEmailIdentity('acme.example.com');

    expect(result).toBeUndefined();
  });

  it('resolves to undefined rather than throwing when the tenant lookup fails', async () => {
    getTenantByDomainMock.mockRejectedValue(new Error('db error'));

    const result = await resolveTenantEmailIdentity('acme.example.com');

    expect(result).toBeUndefined();
  });

  it('resolves to undefined rather than throwing when the site config lookup fails', async () => {
    getTenantByDomainMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Blog',
    });
    getSiteConfigMock.mockRejectedValue(new Error('db error'));

    const result = await resolveTenantEmailIdentity('acme.example.com');

    expect(result).toBeUndefined();
  });
});
