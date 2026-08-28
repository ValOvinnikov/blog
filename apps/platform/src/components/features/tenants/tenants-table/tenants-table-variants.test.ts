import { tenantsTableVariants } from './tenants-table-variants';

describe(tenantsTableVariants, () => {
  it('keeps the column header text-size class alongside its text-color class', () => {
    const { head } = tenantsTableVariants();

    expect(head()).toContain('text-label');
    expect(head()).toContain('text-admin-faint');
  });

  it('keeps the domain text-size class alongside its text-color class', () => {
    const { domain } = tenantsTableVariants();

    expect(domain()).toContain('text-meta');
    expect(domain()).toContain('text-admin-faint');
  });
});
