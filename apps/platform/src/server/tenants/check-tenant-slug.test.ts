import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { env } from '@platform/utils/env/env';

import { checkTenantDomainSlug, checkTenantSlug } from './check-tenant-slug';

const { getTenantByDomainMock } = vi.hoisted(() => ({
  getTenantByDomainMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env', () => ({ env: {} }));

vi.mock('@blog/db', () => ({
  queries: { tenantDomains: { getTenantByDomain: getTenantByDomainMock } },
}));

const setRootDomain = (rootDomain?: string): void => {
  Object.assign(env, { TENANT_ROOT_DOMAIN: rootDomain });
};

describe(checkTenantSlug, () => {
  beforeEach(() => {
    getTenantByDomainMock.mockReset();
    getTenantByDomainMock.mockResolvedValue(undefined);
  });

  it('accepts a free, valid, unreserved slug', async () => {
    await expect(checkTenantSlug('acme', 'example.com')).resolves.toBe(
      undefined,
    );
    expect(getTenantByDomainMock).toHaveBeenCalledWith('acme.example.com');
  });

  it.each(['-acme', 'acme-', 'Acme', 'acme_blog', 'a'.repeat(64), ''])(
    'rejects %j as an invalid DNS label without querying the database',
    async (slug) => {
      await expect(checkTenantSlug(slug, 'example.com')).resolves.toBe(
        TENANT_FIELD_ERROR.SLUG_INVALID,
      );
      expect(getTenantByDomainMock).not.toHaveBeenCalled();
    },
  );

  it.each(['admin', 'platform', 'studio', 'www', 'web-storybook'])(
    'rejects the reserved subdomain %s',
    async (slug) => {
      await expect(checkTenantSlug(slug, 'example.com')).resolves.toBe(
        TENANT_FIELD_ERROR.SLUG_RESERVED,
      );
      expect(getTenantByDomainMock).not.toHaveBeenCalled();
    },
  );

  it('rejects a slug another tenant already holds', async () => {
    getTenantByDomainMock.mockResolvedValue({ id: 'tenant-2' });

    await expect(checkTenantSlug('acme', 'example.com')).resolves.toBe(
      TENANT_FIELD_ERROR.SLUG_TAKEN,
    );
  });
});

describe(checkTenantDomainSlug, () => {
  beforeEach(() => {
    getTenantByDomainMock.mockReset();
    getTenantByDomainMock.mockResolvedValue(undefined);
    setRootDomain('example.com');
  });

  it('checks a domain one label under the root as a slug', async () => {
    await expect(checkTenantDomainSlug('admin.example.com')).resolves.toBe(
      TENANT_FIELD_ERROR.SLUG_RESERVED,
    );
  });

  it('reports a taken slug for a domain one label under the root', async () => {
    getTenantByDomainMock.mockResolvedValue({ id: 'tenant-2' });

    await expect(checkTenantDomainSlug('acme.example.com')).resolves.toBe(
      TENANT_FIELD_ERROR.SLUG_TAKEN,
    );
  });

  it.each([
    'www.acme.com',
    'example.com',
    'blog.admin.example.com',
    'notexample.com',
  ])('leaves %s alone', async (domain) => {
    await expect(checkTenantDomainSlug(domain)).resolves.toBe(undefined);
    expect(getTenantByDomainMock).not.toHaveBeenCalled();
  });

  it('checks nothing when no root domain is configured', async () => {
    setRootDomain(undefined);

    await expect(checkTenantDomainSlug('admin.example.com')).resolves.toBe(
      undefined,
    );
  });
});
