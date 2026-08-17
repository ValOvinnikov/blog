import { parseTenantProvisioningRepo } from './tenant-provisioning-repo';

describe(parseTenantProvisioningRepo, () => {
  it('splits an "owner/repo" value into its parts', () => {
    expect(parseTenantProvisioningRepo('acme-org/acme-repo')).toEqual({
      owner: 'acme-org',
      repo: 'acme-repo',
    });
  });

  it('returns undefined when the value is undefined', () => {
    expect(parseTenantProvisioningRepo(undefined)).toBeUndefined();
  });

  it('returns undefined for a value with no slash', () => {
    expect(parseTenantProvisioningRepo('acme-repo')).toBeUndefined();
  });
});
