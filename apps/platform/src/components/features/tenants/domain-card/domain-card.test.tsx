import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  makeTenant,
  MOCK_TENANT_DOMAIN,
} from '@platform/testing/tenants/fixtures';

import { DomainCard } from './domain-card';

const render = renderWithIntl;

describe(`<${DomainCard.name}/>`, () => {
  it('shows the public domain and a link to the given DNS href', () => {
    const tenant = makeTenant();
    render(
      <DomainCard
        tenant={tenant}
        domainVerificationStatus={DOMAIN_VERIFICATION_STATUS.VERIFIED}
        dnsHref={`/tenants/${tenant.id}/domain`}
      />,
    );

    expect(screen.getByText(MOCK_TENANT_DOMAIN)).toBeVisible();
    expect(screen.getByRole('link', { name: 'DNS' })).toHaveAttribute(
      'href',
      `/tenants/${tenant.id}/domain`,
    );
  });

  it("links to the owner tree's domain page when given that href instead", () => {
    const tenant = makeTenant();
    render(
      <DomainCard
        tenant={tenant}
        domainVerificationStatus={DOMAIN_VERIFICATION_STATUS.VERIFIED}
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
        domainVerificationStatus={DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED}
        dnsHref={`/tenants/${tenant.id}/domain`}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Domain' }),
    ).toBeVisible();
  });

  it.each([
    DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
    DOMAIN_VERIFICATION_STATUS.PENDING,
    DOMAIN_VERIFICATION_STATUS.VERIFIED,
  ])('claims a recent check for a %s status Vercel reported', (status) => {
    render(
      <DomainCard
        tenant={makeTenant()}
        domainVerificationStatus={status}
        dnsHref="/dashboard/domain"
      />,
    );

    expect(screen.getByText('Just now')).toBeVisible();
  });

  it.each([
    DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    DOMAIN_VERIFICATION_STATUS.ERROR,
  ])('claims no recent check for a %s status', (status) => {
    render(
      <DomainCard
        tenant={makeTenant()}
        domainVerificationStatus={status}
        dnsHref="/dashboard/domain"
      />,
    );

    expect(screen.queryByText('Last checked')).toBeNull();
    expect(screen.queryByText('Just now')).toBeNull();
  });
});
