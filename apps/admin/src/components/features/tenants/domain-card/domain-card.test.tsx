import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';

import { DomainCard } from './domain-card';

const render = renderWithIntl;

describe(DomainCard, () => {
  it('shows the public domain and a link to the provisioning page for DNS', () => {
    const tenant = makeTenant({ primaryDomain: 'acme.example.com' });
    render(<DomainCard tenant={tenant} domainVerificationStatus="VERIFIED" />);

    expect(screen.getByText('acme.example.com')).toBeVisible();
    expect(screen.getByRole('link', { name: 'DNS →' })).toHaveAttribute(
      'href',
      `/tenants/${tenant.id}/provisioning`,
    );
  });

  it("nests the card's title one level under the page's own h1", () => {
    const tenant = makeTenant();
    render(
      <DomainCard tenant={tenant} domainVerificationStatus="NOT_CONFIGURED" />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Domain' }),
    ).toBeVisible();
  });
});
