import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { DomainCard } from './domain-card';

const render = renderWithIntl;

describe(DomainCard, () => {
  it('shows the public domain and a link to the given DNS href', () => {
    const tenant = makeTenant({ primaryDomain: 'acme.example.com' });
    render(
      <DomainCard
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
        dnsHref={`/tenants/${tenant.id}/domain`}
      />,
    );

    expect(screen.getByText('acme.example.com')).toBeVisible();
    expect(screen.getByRole('link', { name: 'DNS' })).toHaveAttribute(
      'href',
      `/tenants/${tenant.id}/domain`,
    );
  });

  it("links to the owner tree's domain page when given that href instead", () => {
    const tenant = makeTenant({ primaryDomain: 'acme.example.com' });
    render(
      <DomainCard
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
        dnsHref="/dashboard/domain"
      />,
    );

    expect(screen.getByRole('link', { name: 'DNS' })).toHaveAttribute(
      'href',
      '/dashboard/domain',
    );
  });

  it("nests the card's title one level under the page's own h1", () => {
    const tenant = makeTenant();
    render(
      <DomainCard
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        dnsHref={`/tenants/${tenant.id}/domain`}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Domain' }),
    ).toBeVisible();
  });
});
